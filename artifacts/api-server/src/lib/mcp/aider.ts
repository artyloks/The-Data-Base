import { MCPClient, type MCPToolResult } from "./client";
import { logger } from "../logger";

/**
 * Aider MCP Executor - Routes all file operations through Aider for Git-aware editing
 * 
 * Aider operates in architect/editor mode:
 * - architect: High-level planning and file selection
 * - editor: Actual file modifications with Git commits
 * 
 * All write_file and patch_file calls are intercepted and routed through Aider
 * to maintain codebase mapping and Git history.
 */
export class AiderExecutor {
  private client: MCPClient | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const gitRoot = process.env.PROJECT_ROOT || process.cwd();
    const model = process.env.AIDER_MODEL || "qwen/qwen3.5-35b";

    this.client = new MCPClient(
      "aider",
      "npx",
      ["-y", "@aider-ai/mcp-server-aider"],
      {
        AIDER_MODEL: model,
        AIDER_ARCHITECT: "true",
        AIDER_AUTO_COMMITS: "true",
        AIDER_GIT_ROOT: gitRoot,
        AIDER_YES: "true",
        AIDER_NO_SUGGEST_SHELL_COMMANDS: "true",
      }
    );

    try {
      await this.client.connect();
      this.initialized = true;
      logger.info({ gitRoot, model }, "Aider executor initialized");
    } catch (err) {
      logger.error({ err }, "Failed to initialize Aider executor");
      this.client = null;
    }
  }

  isAvailable(): boolean {
    return this.initialized && this.client !== null;
  }

  /**
   * Execute an architect-level request
   * Plans changes across multiple files
   */
  async architect(message: string): Promise<MCPToolResult> {
    if (!this.client) {
      return { content: [{ type: "error", error: "Aider not initialized" }], isError: true };
    }

    return this.client.callTool("architect", { message });
  }

  /**
   * Write a file through Aider
   * Creates or overwrites with proper Git commit
   */
  async writeFile(path: string, content: string): Promise<MCPToolResult> {
    if (!this.client) {
      return { content: [{ type: "error", error: "Aider not initialized" }], isError: true };
    }

    return this.client.callTool("write_file", { path, content });
  }

  /**
   * Patch a file through Aider
   * Applies search/replace patterns with Git commit
   */
  async patchFile(
    path: string,
    patches: Array<{ search: string; replace: string }>
  ): Promise<MCPToolResult> {
    if (!this.client) {
      return { content: [{ type: "error", error: "Aider not initialized" }], isError: true };
    }

    return this.client.callTool("patch_file", { path, patches });
  }

  /**
   * Add files to Aider's context for editing
   */
  async addFiles(paths: string[]): Promise<MCPToolResult> {
    if (!this.client) {
      return { content: [{ type: "error", error: "Aider not initialized" }], isError: true };
    }

    return this.client.callTool("add_files", { paths });
  }

  /**
   * Run a command and let Aider fix any issues
   */
  async runAndFix(command: string): Promise<MCPToolResult> {
    if (!this.client) {
      return { content: [{ type: "error", error: "Aider not initialized" }], isError: true };
    }

    return this.client.callTool("run_and_fix", { command });
  }

  /**
   * Get Aider's codebase map
   */
  async getCodebaseMap(): Promise<MCPToolResult> {
    if (!this.client) {
      return { content: [{ type: "error", error: "Aider not initialized" }], isError: true };
    }

    return this.client.callTool("get_codebase_map", {});
  }

  /**
   * Commit current changes with a message
   */
  async commit(message: string): Promise<MCPToolResult> {
    if (!this.client) {
      return { content: [{ type: "error", error: "Aider not initialized" }], isError: true };
    }

    return this.client.callTool("git_commit", { message });
  }

  disconnect(): void {
    this.client?.disconnect();
    this.client = null;
    this.initialized = false;
  }
}

export const aiderExecutor = new AiderExecutor();

/**
 * Intercept file operation tools and route through Aider
 */
export function shouldRouteToAider(toolName: string): boolean {
  const aiderTools = [
    "write_file",
    "patch_file",
    "create_file",
    "edit_file",
    "modify_file",
  ];
  return aiderTools.includes(toolName);
}

/**
 * Route a tool call through Aider executor
 */
export async function executeViaAider(
  toolName: string,
  args: Record<string, unknown>
): Promise<MCPToolResult> {
  if (!aiderExecutor.isAvailable()) {
    return {
      content: [{ type: "error", error: "Aider executor not available" }],
      isError: true,
    };
  }

  switch (toolName) {
    case "write_file":
    case "create_file":
      return aiderExecutor.writeFile(
        args.path as string,
        args.content as string
      );

    case "patch_file":
    case "edit_file":
    case "modify_file":
      return aiderExecutor.patchFile(
        args.path as string,
        args.patches as Array<{ search: string; replace: string }>
      );

    default:
      return {
        content: [{ type: "error", error: `Unknown Aider tool: ${toolName}` }],
        isError: true,
      };
  }
}
