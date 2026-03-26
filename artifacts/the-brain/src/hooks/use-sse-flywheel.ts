import { useState, useCallback, useRef } from "react";
import type { FlywheelRequest } from "@workspace/api-client-react";

export function useFlywheelSSE() {
  const [content, setContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const analyze = useCallback(async (requestData: FlywheelRequest) => {
    // Abort previous request if still running
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsStreaming(true);
    setContent("");
    setError(null);
    setRunId(null);

    try {
      const response = await fetch("/api/flywheel/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body stream available");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        
        // Process SSE lines
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || ""; // Keep the last incomplete chunk in the buffer

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const dataStr = line.slice(6);
              if (dataStr === "[DONE]") continue;
              
              const parsed = JSON.parse(dataStr);
              
              if (parsed.type === "chunk" && parsed.content) {
                setContent((prev) => prev + parsed.content);
              } else if (parsed.type === "done") {
                setRunId(parsed.runId);
              } else if (parsed.type === "error") {
                setError(parsed.message || "Unknown error occurred");
              }
            } catch (e) {
              console.warn("Failed to parse SSE JSON chunk:", line, e);
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Stream aborted');
      } else {
        console.error("Flywheel SSE Error:", err);
        setError(err.message || "Failed to connect to the Aider Bot");
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    content,
    isStreaming,
    error,
    runId,
    analyze,
    stop
  };
}
