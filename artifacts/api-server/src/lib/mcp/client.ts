import { spawn, type ChildProcess } from "child_process";
import { EventEmitter } from "events";
import { logger } from "../logger";

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface MCPToolResult {
  content: Array<{ type: "text"; text: string } | { type: "error"; error: string }>;
  isError?: boolean;
}

interface MCPMessage {
  jsonrpc: "2.0";
  id?: number;
  method?: string;
  params?: Record<string, unknown>;
  result?: unknown;
  error?: { code: number; message: string };
}

export class MCPClient extends EventEmitter {
  private process: ChildProcess | null = null;
  private buffer = "";
  private requestId = 0;
  private pendingRequests = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();
  private tools: MCPTool[] = [];
  
  constructor(
    public readonly name: string,
    private readonly command: string,
    private readonly args: string[] = [],
    private readonly env: Record<string, string> = {}
  ) {
    super();
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.process = spawn(this.command, this.args, {
        stdio: ["pipe", "pipe", "pipe"],
        env: { ...process.env, ...this.env },
      });

      this.process.stdout?.on("data", (data: Buffer) => {
        this.buffer += data.toString();
        this.processBuffer();
      });

      this.process.stderr?.on("data", (data: Buffer) => {
        logger.warn({ server: this.name, stderr: data.toString() }, "MCP stderr");
      });

      this.process.on("error", (err) => {
        logger.error({ server: this.name, err }, "MCP process error");
        reject(err);
      });

      this.process.on("close", (code) => {
        logger.info({ server: this.name, code }, "MCP process closed");
        this.emit("close", code);
      });

      // Initialize connection
      setTimeout(async () => {
        try {
          await this.initialize();
          await this.listTools();
          resolve();
        } catch (err) {
          reject(err);
        }
      }, 100);
    });
  }

  private processBuffer(): void {
    const lines = this.buffer.split("\n");
    this.buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const message: MCPMessage = JSON.parse(line);
        this.handleMessage(message);
      } catch {
        // Ignore non-JSON lines
      }
    }
  }

  private handleMessage(message: MCPMessage): void {
    if (message.id !== undefined && this.pendingRequests.has(message.id)) {
      const pending = this.pendingRequests.get(message.id)!;
      this.pendingRequests.delete(message.id);

      if (message.error) {
        pending.reject(new Error(message.error.message));
      } else {
        pending.resolve(message.result);
      }
    }
  }

  private async sendRequest(method: string, params?: Record<string, unknown>): Promise<unknown> {
    const id = ++this.requestId;
    const message: MCPMessage = {
      jsonrpc: "2.0",
      id,
      method,
      params,
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      this.process?.stdin?.write(JSON.stringify(message) + "\n");

      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`MCP request timeout: ${method}`));
        }
      }, 30000);
    });
  }

  private async initialize(): Promise<void> {
    await this.sendRequest("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "the-brain", version: "1.0.0" },
    });
    await this.sendRequest("notifications/initialized", {});
  }

  private async listTools(): Promise<void> {
    const result = await this.sendRequest("tools/list", {}) as { tools: MCPTool[] };
    this.tools = result.tools || [];
    logger.info({ server: this.name, toolCount: this.tools.length }, "MCP tools loaded");
  }

  getTools(): MCPTool[] {
    return this.tools;
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<MCPToolResult> {
    const result = await this.sendRequest("tools/call", { name, arguments: args });
    return result as MCPToolResult;
  }

  disconnect(): void {
    this.process?.kill();
    this.process = null;
  }
}
