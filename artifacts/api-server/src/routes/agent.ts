import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { chatSessionsTable, chatMessagesTable } from "@workspace/db/schema";
import { eq, asc } from "drizzle-orm";
import { randomUUID } from "crypto";

const router: IRouter = Router();

const DEFAULT_SESSION = "default-session";

async function ensureSession(sessionId: string) {
  const existing = await db
    .select()
    .from(chatSessionsTable)
    .where(eq(chatSessionsTable.id, sessionId))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(chatSessionsTable).values({ id: sessionId });
  }
}

function simulateAgentResponse(userMessage: string): {
  content: string;
  toolCalls: Array<{ name: string; input: Record<string, unknown>; output: string; status: string }>;
  thinking: string;
} {
  const msg = userMessage.toLowerCase();

  if (msg.includes("login") || msg.includes("auth") || msg.includes("sign in")) {
    return {
      thinking:
        "The user wants a login page. I should first understand the filesystem structure, then create the component, and finally validate it with lint.",
      toolCalls: [
        {
          name: "get_filesystem_structure",
          input: { path: "./src/pages" },
          output: '{"files": ["Home.tsx", "Dashboard.tsx"], "dirs": ["auth"]}',
          status: "success",
        },
        {
          name: "write_file",
          input: {
            path: "./src/pages/Login.tsx",
            content: "import React from 'react';\n// Login component...",
          },
          output: "File written successfully at ./src/pages/Login.tsx",
          status: "success",
        },
        {
          name: "run_shell_command",
          input: { command: "npm run lint src/pages/Login.tsx" },
          output: "✓ No lint errors found",
          status: "success",
        },
      ],
      content:
        "I've created a fully-featured login page at `src/pages/Login.tsx`. It includes:\n\n- **Email/password form** with Zod validation\n- **JWT authentication** flow connected to your Express backend\n- **Loading states** and error handling\n- **Responsive design** with Tailwind CSS\n\nThe component passed linting and is ready to integrate. Would you like me to also add the backend route at `POST /api/auth/login`?",
    };
  }

  if (msg.includes("search") || msg.includes("web") || msg.includes("brave")) {
    return {
      thinking:
        "The user wants web search capabilities. I'll use the Brave Search MCP to look up relevant information.",
      toolCalls: [
        {
          name: "brave_search",
          input: { query: userMessage, count: 5 },
          output: JSON.stringify({
            results: [
              { title: "Latest AI Research - 2026", url: "https://arxiv.org/...", snippet: "Recent advances in agentic AI..." },
              { title: "Qwen 3.5 Technical Report", url: "https://qwen.ai/...", snippet: "Qwen 3.5 introduces native tool-call prediction..." },
            ],
          }),
          status: "success",
        },
      ],
      content:
        "I searched the web using the **Brave Search MCP** and found the latest information. Here's what I discovered:\n\nQwen 3.5 represents a fundamental shift — instead of fine-tuning models to *describe* tool use, it natively predicts tool call tokens as part of its base training. This means zero overhead for agentic tasks.\n\nThe Brave Search MCP gives me live web access, so I can always pull fresh data rather than relying on training knowledge cutoffs.",
    };
  }

  if (msg.includes("database") || msg.includes("supabase") || msg.includes("sql") || msg.includes("query")) {
    return {
      thinking:
        "The user wants database operations. I'll use the Supabase MCP for keyless database integration.",
      toolCalls: [
        {
          name: "supabase_query",
          input: { sql: "SELECT * FROM users WHERE created_at > NOW() - INTERVAL '7 days' LIMIT 10" },
          output: JSON.stringify({
            rows: [
              { id: 1, email: "alice@example.com", created_at: "2026-03-20" },
              { id: 2, email: "bob@example.com", created_at: "2026-03-21" },
            ],
            count: 2,
          }),
          status: "success",
        },
      ],
      content:
        "I queried the database using the **Supabase MCP** — no API keys needed, just native integration. Here are the results:\n\n- **alice@example.com** — joined 2 days ago\n- **bob@example.com** — joined yesterday\n\nThe Supabase MCP enables 'keyless' database access — I can read and write data, run migrations, and manage schema all through the MCP protocol.",
    };
  }

  if (msg.includes("build") || msg.includes("component") || msg.includes("dashboard") || msg.includes("page")) {
    return {
      thinking:
        "The user wants to build a UI component. Let me check the existing structure, write the file, and verify it compiles correctly.",
      toolCalls: [
        {
          name: "get_filesystem_structure",
          input: { path: "./src" },
          output: '{"files": ["App.tsx", "index.css"], "dirs": ["pages", "components", "hooks"]}',
          status: "success",
        },
        {
          name: "write_file",
          input: { path: "./src/pages/Dashboard.tsx", content: "// Dashboard component..." },
          output: "File written successfully",
          status: "success",
        },
        {
          name: "run_shell_command",
          input: { command: "npm run build --dry-run" },
          output: "✓ Build successful. 0 errors, 2 warnings (unused imports).",
          status: "success",
        },
        {
          name: "write_file",
          input: { path: "./src/pages/Dashboard.tsx", content: "// Fixed: removed unused imports..." },
          output: "File updated. Lint clean.",
          status: "success",
        },
      ],
      content:
        "I've built and verified the component. The **agentic loop** caught 2 unused import warnings during the lint step, automatically fixed them, and re-verified. Final result:\n\n- **Dashboard.tsx** — fully built, zero warnings\n- Connected to your API via React Query hooks\n- Responsive layout with Tailwind\n- Self-healing: detected and fixed lint issues automatically",
    };
  }

  if (msg.includes("mcp") || msg.includes("protocol") || msg.includes("tool")) {
    return {
      thinking:
        "The user is asking about MCP — Model Context Protocol. Let me explain this clearly.",
      toolCalls: [],
      content:
        "**Model Context Protocol (MCP)** is the universal language for agents in 2026. Instead of writing custom API integration code for every service, MCP provides a standardized way to expose tools to any AI model.\n\nHere's how The Brain uses MCP:\n\n| MCP Server | Purpose | What it enables |\n|---|---|---|\n| **Brave Search** | Live web access | Real-time knowledge, no training cutoffs |\n| **Local-Bash** | Terminal control | File operations, git, npm, anything |\n| **Supabase** | Database access | Keyless persistence, schema management |\n\nAll three connect through the same protocol — the agent learns one interface and gets superpowers across all of them.",
    };
  }

  return {
    thinking:
      "The user sent a general message. I'll respond as the The Brain AI agent, demonstrating my agentic capabilities.",
    toolCalls: [],
    content: `I'm **The Brain** — powered by Qwen 3.5, the first truly native multimodal agent. Unlike traditional LLMs that just predict text, I natively predict **tool calls** as part of my base capability.\n\nHere's what I can do:\n\n- 🔍 **Search the web** in real-time via Brave Search MCP\n- 💻 **Execute code** and terminal commands via Local-Bash MCP  \n- 🗄️ **Query databases** keylessly via Supabase MCP\n- 🔄 **Self-heal**: if something fails, I detect it and fix it automatically\n\nTry asking me to "build a login page", "search the web for X", or "query the database" — and watch the agentic loop in action!`,
  };
}

router.post("/chat", async (req, res) => {
  const { message, sessionId = DEFAULT_SESSION } = req.body as {
    message: string;
    sessionId?: string;
  };

  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  await ensureSession(sessionId);

  const userMsgId = randomUUID();
  await db.insert(chatMessagesTable).values({
    sessionId,
    messageId: userMsgId,
    role: "user",
    content: message,
    timestamp: new Date(),
  });

  await new Promise((r) => setTimeout(r, 800 + Math.random() * 1200));

  const { content, toolCalls, thinking } = simulateAgentResponse(message);

  const assistantMsgId = randomUUID();
  await db.insert(chatMessagesTable).values({
    sessionId,
    messageId: assistantMsgId,
    role: "assistant",
    content,
    toolCalls: toolCalls.length > 0 ? toolCalls : null,
    thinking,
    timestamp: new Date(),
  });

  res.json({
    id: assistantMsgId,
    role: "assistant",
    content,
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    thinking,
    timestamp: new Date().toISOString(),
  });
});

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

router.post("/reset", async (req, res) => {
  const { sessionId = DEFAULT_SESSION } = req.body as { sessionId?: string };

  const existing = await db
    .select()
    .from(chatSessionsTable)
    .where(eq(chatSessionsTable.id, sessionId))
    .limit(1);

  if (existing.length > 0) {
    await db
      .delete(chatMessagesTable)
      .where(eq(chatMessagesTable.sessionId, sessionId));
  }

  res.json({ success: true, message: "Chat session reset successfully" });
});

export default router;
