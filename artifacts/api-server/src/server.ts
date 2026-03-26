/**
 * The Brain - Production Server Entry Point
 * 
 * Qwen 3.5-35B Agentic Stack with:
 * - MCP Server Integration (Local-Bash, Brave Search, Supabase, Aider)
 * - Flywheel Architecture for autonomous self-healing
 * - Aider as the PRIMARY EXECUTOR for all file operations
 * - Vibe Coding mode - autonomous error healing until exit code 0
 * 
 * Environment Variables Required:
 * - PORT: Server port
 * - QWEN_BASE_URL or AI_INTEGRATIONS_OPENAI_BASE_URL: Qwen API endpoint
 * - QWEN_API_KEY or AI_INTEGRATIONS_OPENAI_API_KEY: API key
 * - BRAVE_API_KEY: (optional) For Brave Search MCP
 * - SUPABASE_ACCESS_TOKEN: (optional) For Supabase MCP
 * - PROJECT_ROOT: (optional) Git root for Aider
 */

import app from "./app";
import { logger } from "./lib/logger";
import { mcpRegistry, type MCPServerConfig } from "./lib/mcp";
import { aiderExecutor } from "./lib/mcp/aider";
import { getQwenOrchestrator } from "./lib/orchestrator";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

/**
 * MCP Server Configuration
 * These are the production MCP servers integrated into The Brain
 */
const MCP_SERVERS: MCPServerConfig[] = [
  {
    name: "local-bash",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-bash"],
    description: "Execute shell commands - terminal superpowers for the agent",
  },
  {
    name: "brave-search",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-brave-search"],
    env: { BRAVE_API_KEY: process.env.BRAVE_API_KEY || "" },
    description: "Web search via Brave Search API - live knowledge access",
  },
  {
    name: "supabase",
    command: "npx",
    args: [
      "-y",
      "@supabase/mcp-server-supabase@latest",
      "--access-token",
      process.env.SUPABASE_ACCESS_TOKEN || "",
    ],
    description: "Keyless Supabase database integration via MCP",
  },
  {
    name: "aider",
    command: "npx",
    args: ["-y", "@aider-ai/mcp-server-aider"],
    env: {
      AIDER_MODEL: process.env.AIDER_MODEL || "qwen/qwen3.5-35b",
      AIDER_ARCHITECT: "true",
      AIDER_AUTO_COMMITS: "true",
      AIDER_YES: "true",
      AIDER_NO_SUGGEST_SHELL_COMMANDS: "true",
      AIDER_GIT_ROOT: process.env.PROJECT_ROOT || process.cwd(),
    },
    description: "Aider AI - PRIMARY EXECUTOR for all file operations with Git history",
  },
];

async function bootstrap(): Promise<void> {
  logger.info("=".repeat(60));
  logger.info("The Brain - Qwen 3.5 Agentic Stack Initializing...");
  logger.info("=".repeat(60));

  // Step 1: Initialize MCP Registry with all servers
  logger.info("Step 1/3: Initializing MCP Registry...");
  try {
    await mcpRegistry.initialize(MCP_SERVERS);
    const servers = mcpRegistry.getConnectedServers();
    logger.info({ servers }, "MCP servers connected");

    // Log available tools
    const tools = mcpRegistry.getAllTools();
    logger.info({ toolCount: tools.length }, "MCP tools available");
  } catch (err) {
    logger.error({ err }, "Failed to initialize MCP Registry");
  }

  // Step 2: Initialize Aider Executor (THE EXECUTOR)
  logger.info("Step 2/3: Initializing Aider Executor (Primary File Editor)...");
  try {
    await aiderExecutor.initialize();
    if (aiderExecutor.isAvailable()) {
      logger.info("Aider Executor ONLINE - All file operations routed through Aider");
    } else {
      logger.warn("Aider Executor OFFLINE - File edits will use fallback MCP");
    }
  } catch (err) {
    logger.warn({ err }, "Aider Executor not available");
  }

  // Step 3: Validate Qwen connection
  logger.info("Step 3/3: Validating Qwen 3.5-35B connection...");
  try {
    const orchestrator = getQwenOrchestrator();
    logger.info("Qwen Orchestrator ready for tool-calling");
  } catch (err) {
    logger.error({ err }, "Qwen Orchestrator initialization failed");
    logger.error("Check QWEN_BASE_URL and QWEN_API_KEY environment variables");
  }

  // Start HTTP server
  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info("=".repeat(60));
    logger.info({ port }, "The Brain server is LIVE");
    logger.info("=".repeat(60));
    
    logger.info({
      endpoints: {
        // Agentic endpoints
        chat: `POST /api/agentic/chat`,
        flywheel: `POST /api/agentic/flywheel`,
        execute: `POST /api/agentic/execute`,
        tools: `GET /api/agentic/tools`,
        history: `GET /api/agentic/history`,
        // Legacy endpoints
        agent: `POST /api/agent/chat`,
        mcp: `POST /api/mcp/generate-config`,
      },
    }, "Available endpoints");

    logger.info({
      architecture: {
        llm: "Qwen 3.5-35B (native tool-calling)",
        executor: "Aider MCP (Git-aware file editing)",
        mcp: mcpRegistry.getConnectedServers(),
        flywheel: "OODA loop with auto-healing",
      },
    }, "System architecture");
  });
}

// Graceful shutdown
function shutdown(signal: string): void {
  logger.info({ signal }, "Shutdown signal received");
  
  // Disconnect MCP servers
  mcpRegistry.shutdown();
  logger.info("MCP Registry shut down");
  
  // Disconnect Aider
  aiderExecutor.disconnect();
  logger.info("Aider Executor disconnected");
  
  logger.info("The Brain shutdown complete");
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Unhandled rejection handler
process.on("unhandledRejection", (reason, promise) => {
  logger.error({ reason, promise }, "Unhandled Promise rejection");
});

// Bootstrap the server
bootstrap().catch((err) => {
  logger.error({ err }, "Bootstrap failed catastrophically");
  process.exit(1);
});
