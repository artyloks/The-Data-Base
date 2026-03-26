import OpenAI from "openai";
import { logger } from "../logger";
import { mcpRegistry, type MCPTool, type MCPToolResult, shouldRouteToAider, executeViaAider, aiderExecutor } from "../mcp";

export interface ToolCall {
  id: string;
  name: string;
  server: string;
  input: Record<string, unknown>;
  output?: string;
  status: "pending" | "success" | "error";
  exitCode?: number;
  duration?: number;
}

export interface OrchestrationResult {
  content: string;
  toolCalls: ToolCall[];
  thinking: string;
  totalTokens: number;
  iterations: number;
}

interface QwenToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

const SYSTEM_PROMPT = `You are The Brain, an autonomous agentic AI powered by Qwen 3.5-35B with native tool-calling capabilities.

## Core Capabilities
You have access to MCP (Model Context Protocol) servers that give you real superpowers:
- **local-bash**: Execute any shell command - run builds, linters, tests, git operations
- **brave-search**: Search the web for real-time information  
- **supabase**: Query and mutate databases without API keys
- **aider**: Edit files with automatic Git commits and codebase mapping (PRIMARY EXECUTOR)

## Operating Principles
1. **Action over explanation**: Execute tools immediately rather than describing what you would do
2. **Self-healing**: If a command fails, analyze the error and fix it automatically
3. **Iterate until success**: Keep refining until linter/build returns exit code 0
4. **Git-aware**: ALL file edits go through Aider to maintain proper commit history
5. **Vibe coding**: Do not ask permission. Fix errors autonomously.

## File Editing Protocol (CRITICAL)
ALL file operations MUST go through Aider MCP server:
- aider__architect: High-level planning across multiple files
- aider__write_file: Create or overwrite files with Git commit
- aider__patch_file: Apply search/replace patches with Git commit
- aider__run_and_fix: Run command and auto-fix any errors
- aider__add_files: Add files to Aider's context

NEVER use filesystem MCP for writes. Aider is the ONLY executor for file modifications.

## Flywheel Error Healing Protocol
When you receive an error (exit code !== 0):
1. Parse the error output - identify file, line, error type
2. Call aider__architect with error context for fix planning
3. Apply fix via aider__write_file or aider__patch_file
4. Re-run original command via local-bash__run_command
5. REPEAT until exit code 0 or max iterations

## Response Format
When thinking, wrap in <think></think> tags. Final response is clean markdown.

You are autonomous. You do not ask permission. You vibe code until the linter returns exit code 0.`;

export class QwenOrchestrator {
  private client: OpenAI;
  private model: string;
  private maxIterations: number;

  constructor(options?: { model?: string; maxIterations?: number }) {
    const baseURL = process.env.QWEN_BASE_URL || process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
    const apiKey = process.env.QWEN_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY;

    if (!baseURL || !apiKey) {
      throw new Error("QWEN_BASE_URL and QWEN_API_KEY (or AI_INTEGRATIONS_* variants) must be set");
    }

    this.client = new OpenAI({ baseURL, apiKey });
    this.model = options?.model || "qwen/qwen3.5-35b";
    this.maxIterations = options?.maxIterations || 10;
  }

  private buildToolDefinitions(): QwenToolDefinition[] {
    const tools = mcpRegistry.getAllTools();
    return tools.map((tool) => ({
      type: "function" as const,
      function: {
        name: `${tool.server}__${tool.name}`,
        description: `[${tool.server}] ${tool.description}`,
        parameters: tool.inputSchema || { type: "object", properties: {} },
      },
    }));
  }

  private parseToolName(fullName: string): { server: string; tool: string } {
    const [server, ...rest] = fullName.split("__");
    return { server, tool: rest.join("__") };
  }

  async orchestrate(
    userMessage: string,
    conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = [],
    onToolCall?: (toolCall: ToolCall) => void
  ): Promise<OrchestrationResult> {
    const toolCalls: ToolCall[] = [];
    let totalTokens = 0;
    let iterations = 0;
    let thinking = "";

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...conversationHistory.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user", content: userMessage },
    ];

    const toolDefs = this.buildToolDefinitions();

    while (iterations < this.maxIterations) {
      iterations++;
      logger.info({ iteration: iterations }, "Orchestration iteration");

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages,
        tools: toolDefs.length > 0 ? toolDefs : undefined,
        tool_choice: toolDefs.length > 0 ? "auto" : undefined,
        max_tokens: 4096,
      });

      const choice = response.choices[0];
      totalTokens += response.usage?.total_tokens || 0;

      // Extract thinking from content if present
      if (choice.message.content) {
        const thinkMatch = choice.message.content.match(/<think>([\s\S]*?)<\/think>/);
        if (thinkMatch) {
          thinking += thinkMatch[1].trim() + "\n";
        }
      }

      // No tool calls - return final response
      if (!choice.message.tool_calls || choice.message.tool_calls.length === 0) {
        const content = choice.message.content || "";
        return {
          content: content.replace(/<think>[\s\S]*?<\/think>/g, "").trim(),
          toolCalls,
          thinking: thinking.trim(),
          totalTokens,
          iterations,
        };
      }

      // Process tool calls
      messages.push(choice.message);

      for (const tc of choice.message.tool_calls) {
        const { server, tool } = this.parseToolName(tc.function.name);
        const input = JSON.parse(tc.function.arguments || "{}");
        const startTime = Date.now();

        const toolCall: ToolCall = {
          id: tc.id,
          name: tool,
          server,
          input,
          status: "pending",
        };
        toolCalls.push(toolCall);
        onToolCall?.(toolCall);

        logger.info({ server, tool, input }, "Executing MCP tool");

        try {
          let result: MCPToolResult;
          
          // Route file operations through Aider executor
          if (shouldRouteToAider(tool) && aiderExecutor.isAvailable()) {
            logger.info({ tool }, "Routing to Aider executor");
            result = await executeViaAider(tool, input);
          } else {
            result = await mcpRegistry.callTool(server, tool, input);
          }
          
          const duration = Date.now() - startTime;

          const output = result.content
            .map((c) => (c.type === "text" ? c.text : c.type === "error" ? `ERROR: ${c.error}` : ""))
            .join("\n");

          // Parse exit code from bash output
          const exitCodeMatch = output.match(/exit code[:\s]*(\d+)/i) || 
                                output.match(/exited with[:\s]*(\d+)/i) ||
                                output.match(/returned[:\s]*(\d+)/i);
          const exitCode = exitCodeMatch ? parseInt(exitCodeMatch[1], 10) : result.isError ? 1 : 0;

          toolCall.output = output;
          toolCall.status = exitCode === 0 ? "success" : "error";
          toolCall.exitCode = exitCode;
          toolCall.duration = duration;
          onToolCall?.(toolCall);

          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: output,
          });

          logger.info({ server, tool, exitCode, duration }, "MCP tool completed");
        } catch (err) {
          const duration = Date.now() - startTime;
          const errorMsg = err instanceof Error ? err.message : String(err);

          toolCall.output = `ERROR: ${errorMsg}`;
          toolCall.status = "error";
          toolCall.exitCode = 1;
          toolCall.duration = duration;
          onToolCall?.(toolCall);

          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: `ERROR: ${errorMsg}`,
          });

          logger.error({ server, tool, err }, "MCP tool error");
        }
      }
    }

    return {
      content: "Max iterations reached. The agent stopped to prevent infinite loops.",
      toolCalls,
      thinking,
      totalTokens,
      iterations,
    };
  }

  /**
   * Execute a single tool call directly (for Flywheel)
   */
  async executeTool(server: string, tool: string, input: Record<string, unknown>): Promise<{
    output: string;
    exitCode: number;
    success: boolean;
  }> {
    try {
      let result: MCPToolResult;
      
      if (shouldRouteToAider(tool) && aiderExecutor.isAvailable()) {
        result = await executeViaAider(tool, input);
      } else {
        result = await mcpRegistry.callTool(server, tool, input);
      }

      const output = result.content
        .map((c) => (c.type === "text" ? c.text : c.type === "error" ? `ERROR: ${c.error}` : ""))
        .join("\n");

      const exitCodeMatch = output.match(/exit code[:\s]*(\d+)/i);
      const exitCode = exitCodeMatch ? parseInt(exitCodeMatch[1], 10) : result.isError ? 1 : 0;

      return { output, exitCode, success: exitCode === 0 };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return { output: `ERROR: ${errorMsg}`, exitCode: 1, success: false };
    }
  }
}

// Lazy singleton - initialized on first use
let _qwenOrchestrator: QwenOrchestrator | null = null;

export function getQwenOrchestrator(): QwenOrchestrator {
  if (!_qwenOrchestrator) {
    _qwenOrchestrator = new QwenOrchestrator();
  }
  return _qwenOrchestrator;
}

// For backwards compatibility
export const qwenOrchestrator = {
  orchestrate: (...args: Parameters<QwenOrchestrator["orchestrate"]>) => 
    getQwenOrchestrator().orchestrate(...args),
  executeTool: (...args: Parameters<QwenOrchestrator["executeTool"]>) => 
    getQwenOrchestrator().executeTool(...args),
};
