import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { chatSessionsTable, chatMessagesTable } from "@workspace/db/schema";
import { eq, asc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { qwenOrchestrator, type ToolCall } from "../lib/orchestrator";
import { FlywheelEngine, VibeCodeFlywheel, type FlywheelEvent } from "../lib/orchestrator/flywheel";
import { mcpRegistry } from "../lib/mcp";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const DEFAULT_SESSION = "default-session";

async function ensureSession(sessionId: string): Promise<void> {
  const existing = await db
    .select()
    .from(chatSessionsTable)
    .where(eq(chatSessionsTable.id, sessionId))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(chatSessionsTable).values({ id: sessionId });
  }
}

/**
 * POST /api/agentic/chat
 * Stream-enabled agentic chat with Qwen 3.5-35B
 */
router.post("/chat", async (req, res) => {
  const { message, sessionId = DEFAULT_SESSION, stream = true } = req.body as {
    message: string;
    sessionId?: string;
    stream?: boolean;
  };

  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  await ensureSession(sessionId);

  // Store user message
  const userMsgId = randomUUID();
  await db.insert(chatMessagesTable).values({
    sessionId,
    messageId: userMsgId,
    role: "user",
    content: message,
    timestamp: new Date(),
  });

  // Get conversation history
  const history = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.sessionId, sessionId))
    .orderBy(asc(chatMessagesTable.timestamp))
    .limit(20);

  const conversationHistory = history
    .filter((m) => m.messageId !== userMsgId)
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  if (stream) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    const toolCalls: ToolCall[] = [];

    try {
      const result = await qwenOrchestrator.orchestrate(
        message,
        conversationHistory,
        (toolCall) => {
          res.write(`data: ${JSON.stringify({ type: "tool_call", toolCall })}\n\n`);
          const existing = toolCalls.find((tc) => tc.id === toolCall.id);
          if (existing) {
            Object.assign(existing, toolCall);
          } else {
            toolCalls.push(toolCall);
          }
        }
      );

      // Store assistant message
      const assistantMsgId = randomUUID();
      await db.insert(chatMessagesTable).values({
        sessionId,
        messageId: assistantMsgId,
        role: "assistant",
        content: result.content,
        toolCalls: toolCalls.length > 0 ? toolCalls : null,
        thinking: result.thinking || null,
        timestamp: new Date(),
      });

      res.write(
        `data: ${JSON.stringify({
          type: "complete",
          id: assistantMsgId,
          content: result.content,
          toolCalls: result.toolCalls,
          thinking: result.thinking,
          iterations: result.iterations,
          totalTokens: result.totalTokens,
        })}\n\n`
      );
      res.end();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      logger.error({ err }, "Agentic chat error");
      res.write(`data: ${JSON.stringify({ type: "error", error: errorMsg })}\n\n`);
      res.end();
    }
  } else {
    // Non-streaming response
    try {
      const result = await qwenOrchestrator.orchestrate(message, conversationHistory);

      const assistantMsgId = randomUUID();
      await db.insert(chatMessagesTable).values({
        sessionId,
        messageId: assistantMsgId,
        role: "assistant",
        content: result.content,
        toolCalls: result.toolCalls.length > 0 ? result.toolCalls : null,
        thinking: result.thinking || null,
        timestamp: new Date(),
      });

      res.json({
        id: assistantMsgId,
        role: "assistant",
        content: result.content,
        toolCalls: result.toolCalls.length > 0 ? result.toolCalls : undefined,
        thinking: result.thinking || undefined,
        iterations: result.iterations,
        totalTokens: result.totalTokens,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      logger.error({ err }, "Agentic chat error");
      res.status(500).json({ error: errorMsg });
    }
  }
});

/**
 * POST /api/agentic/flywheel
 * Run autonomous flywheel loop until success
 */
router.post("/flywheel", async (req, res) => {
  const {
    command,
    workingDir,
    maxIterations = 10,
    autoFix = true,
  } = req.body as {
    command: string;
    workingDir?: string;
    maxIterations?: number;
    autoFix?: boolean;
  };

  if (!command || typeof command !== "string") {
    res.status(400).json({ error: "command is required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const flywheel = new FlywheelEngine({
    targetCommand: command,
    workingDir,
    maxIterations,
    autoFix,
  });

  flywheel.on("phase", (event: FlywheelEvent) => {
    res.write(`data: ${JSON.stringify({ type: "phase", event })}\n\n`);
  });

  try {
    const result = await flywheel.run();
    res.write(`data: ${JSON.stringify({ type: "complete", result })}\n\n`);
    res.end();
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    logger.error({ err }, "Flywheel error");
    res.write(`data: ${JSON.stringify({ type: "error", error: errorMsg })}\n\n`);
    res.end();
  }
});

/**
 * POST /api/agentic/vibe
 * Vibe Code mode - autonomous healing until exit code 0
 * No permission asking, just fixes until done
 */
router.post("/vibe", async (req, res) => {
  const { command, workingDir } = req.body as {
    command: string;
    workingDir?: string;
  };

  if (!command || typeof command !== "string") {
    res.status(400).json({ error: "command is required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  logger.info({ command, workingDir }, "Starting vibe code session");

  const flywheel = new VibeCodeFlywheel(command, workingDir);

  flywheel.on("phase", (event: FlywheelEvent) => {
    res.write(`data: ${JSON.stringify({ type: "phase", event })}\n\n`);
  });

  try {
    const result = await flywheel.vibeUntilClean();
    logger.info({ success: result.success, iterations: result.iterations, filesModified: result.filesModified.length }, "Vibe code complete");
    res.write(`data: ${JSON.stringify({ type: "complete", result })}\n\n`);
    res.end();
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    logger.error({ err }, "Vibe code error");
    res.write(`data: ${JSON.stringify({ type: "error", error: errorMsg })}\n\n`);
    res.end();
  }
});

/**
 * POST /api/agentic/execute
 * Direct tool execution without orchestration
 */
router.post("/execute", async (req, res) => {
  const { server, tool, args } = req.body as {
    server: string;
    tool: string;
    args: Record<string, unknown>;
  };

  if (!server || !tool) {
    res.status(400).json({ error: "server and tool are required" });
    return;
  }

  try {
    const result = await mcpRegistry.callTool(server, tool, args || {});
    res.json({
      success: !result.isError,
      content: result.content,
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    logger.error({ err, server, tool }, "Direct execution error");
    res.status(500).json({ error: errorMsg });
  }
});

/**
 * GET /api/agentic/tools
 * List all available MCP tools
 */
router.get("/tools", (_req, res) => {
  const tools = mcpRegistry.getAllTools();
  const servers = mcpRegistry.getConnectedServers();
  res.json({ tools, servers });
});

/**
 * GET /api/agentic/history
 * Get chat history for a session
 */
router.get("/history", async (req, res) => {
  const sessionId = (req.query["sessionId"] as string) || DEFAULT_SESSION;

  await ensureSession(sessionId);

  const messages = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.sessionId, sessionId))
    .orderBy(asc(chatMessagesTable.timestamp));

  res.json({
    messages: messages.map((m) => ({
      id: m.messageId,
      role: m.role,
      content: m.content,
      toolCalls: m.toolCalls || undefined,
      thinking: m.thinking || undefined,
      timestamp: m.timestamp.toISOString(),
    })),
    sessionId,
  });
});

export default router;
