const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";

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

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCall[];
  thinking?: string;
  timestamp: string;
}

export interface FlywheelEvent {
  phase: "observe" | "orient" | "decide" | "act" | "heal" | "complete" | "failed";
  iteration: number;
  command?: string;
  output?: string;
  exitCode?: number;
  error?: string;
  fix?: string;
  filesModified?: string[];
  timestamp: string;
}

export interface FlywheelResult {
  success: boolean;
  iterations: number;
  events: FlywheelEvent[];
  finalOutput: string;
  totalDuration: number;
  filesModified: string[];
}

export interface MCPTool {
  name: string;
  description: string;
  server: string;
  inputSchema: Record<string, unknown>;
}

type StreamCallback<T> = (event: T) => void;

export async function sendMessage(
  message: string,
  sessionId: string,
  onToolCall?: StreamCallback<ToolCall>,
  onComplete?: StreamCallback<ChatMessage & { iterations: number; totalTokens: number }>
): Promise<void> {
  const response = await fetch(`${API_URL}/api/agentic/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, sessionId, stream: true }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const data = JSON.parse(line.slice(6));
        if (data.type === "tool_call" && onToolCall) {
          onToolCall(data.toolCall);
        } else if (data.type === "complete" && onComplete) {
          onComplete({
            id: data.id,
            role: "assistant",
            content: data.content,
            toolCalls: data.toolCalls,
            thinking: data.thinking,
            timestamp: new Date().toISOString(),
            iterations: data.iterations,
            totalTokens: data.totalTokens,
          });
        }
      } catch {
        // Ignore parse errors
      }
    }
  }
}

export async function runFlywheel(
  command: string,
  workingDir?: string,
  onPhase?: StreamCallback<FlywheelEvent>,
  onComplete?: StreamCallback<FlywheelResult>
): Promise<void> {
  const response = await fetch(`${API_URL}/api/agentic/flywheel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ command, workingDir, maxIterations: 10, autoFix: true }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const data = JSON.parse(line.slice(6));
        if (data.type === "phase" && onPhase) {
          onPhase(data.event);
        } else if (data.type === "complete" && onComplete) {
          onComplete(data.result);
        }
      } catch {
        // Ignore parse errors
      }
    }
  }
}

export async function getChatHistory(sessionId: string): Promise<ChatMessage[]> {
  const response = await fetch(`${API_URL}/api/agentic/history?sessionId=${sessionId}`);
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  const data = await response.json();
  return data.messages;
}

export async function getAvailableTools(): Promise<{ tools: MCPTool[]; servers: string[] }> {
  const response = await fetch(`${API_URL}/api/agentic/tools`);
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json();
}

export async function executeTool(
  server: string,
  tool: string,
  args: Record<string, unknown>
): Promise<{ success: boolean; content: unknown[] }> {
  const response = await fetch(`${API_URL}/api/agentic/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ server, tool, args }),
  });
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json();
}

/**
 * Vibe Code - Autonomous healing flywheel
 * Runs until exit code 0 without asking permission
 */
export async function vibeCode(
  command: string,
  workingDir?: string,
  onPhase?: StreamCallback<FlywheelEvent>,
  onComplete?: StreamCallback<FlywheelResult>
): Promise<void> {
  const response = await fetch(`${API_URL}/api/agentic/vibe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ command, workingDir }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const data = JSON.parse(line.slice(6));
        if (data.type === "phase" && onPhase) {
          onPhase(data.event);
        } else if (data.type === "complete" && onComplete) {
          onComplete(data.result);
        }
      } catch {
        // Ignore parse errors
      }
    }
  }
}
