import { MCPClient, type MCPTool, type MCPToolResult } from "./client";
import { logger } from "../logger";

export interface MCPServerConfig {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  description: string;
}

const DEFAULT_SERVERS: MCPServerConfig[] = [
  {
    name: "local-bash",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-bash"],
    description: "Execute shell commands for terminal operations",
  },
  {
    name: "brave-search",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-brave-search"],
    env: { BRAVE_API_KEY: process.env.BRAVE_API_KEY || "" },
    description: "Web search via Brave Search API",
  },
  {
    name: "supabase",
    command: "npx",
    args: ["-y", "@supabase/mcp-server-supabase@latest", "--access-token", process.env.SUPABASE_ACCESS_TOKEN || ""],
    description: "Keyless Supabase database integration",
  },
  {
    name: "aider",
    command: "npx",
    args: ["-y", "@aider-ai/mcp-server-aider"],
    env: {
      AIDER_MODEL: "qwen/qwen3.5-35b",
      AIDER_ARCHITECT: "true",
      AIDER_AUTO_COMMITS: "true",
      AIDER_GIT_ROOT: process.env.PROJECT_ROOT || process.cwd(),
    },
    description: "Aider AI pair programmer with Git integration",
  },
];

class MCPRegistry {
  private clients = new Map<string, MCPClient>();
  private initialized = false;

  async initialize(configs: MCPServerConfig[] = DEFAULT_SERVERS): Promise<void> {
    if (this.initialized) return;

    const validConfigs = configs.filter((c) => {
      if (c.name === "brave-search" && !process.env.BRAVE_API_KEY) {
        logger.warn({ server: c.name }, "Skipping - BRAVE_API_KEY not set");
        return false;
      }
      if (c.name === "supabase" && !process.env.SUPABASE_ACCESS_TOKEN) {
        logger.warn({ server: c.name }, "Skipping - SUPABASE_ACCESS_TOKEN not set");
        return false;
      }
      return true;
    });

    await Promise.allSettled(
      validConfigs.map(async (config) => {
        try {
          const client = new MCPClient(config.name, config.command, config.args, config.env);
          await client.connect();
          this.clients.set(config.name, client);
          logger.info({ server: config.name }, "MCP server connected");
        } catch (err) {
          logger.error({ server: config.name, err }, "Failed to connect MCP server");
        }
      })
    );

    this.initialized = true;
    logger.info({ connectedServers: this.clients.size }, "MCP registry initialized");
  }

  getClient(name: string): MCPClient | undefined {
    return this.clients.get(name);
  }

  getAllTools(): Array<MCPTool & { server: string }> {
    const tools: Array<MCPTool & { server: string }> = [];
    for (const [server, client] of this.clients) {
      for (const tool of client.getTools()) {
        tools.push({ ...tool, server });
      }
    }
    return tools;
  }

  async callTool(server: string, toolName: string, args: Record<string, unknown>): Promise<MCPToolResult> {
    const client = this.clients.get(server);
    if (!client) {
      return { content: [{ type: "error", error: `MCP server '${server}' not found` }], isError: true };
    }
    return client.callTool(toolName, args);
  }

  getConnectedServers(): string[] {
    return Array.from(this.clients.keys());
  }

  shutdown(): void {
    for (const client of this.clients.values()) {
      client.disconnect();
    }
    this.clients.clear();
    this.initialized = false;
  }
}

export const mcpRegistry = new MCPRegistry();
