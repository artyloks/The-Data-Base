import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { db } from "@workspace/db";
import { chatSessionsTable, chatMessagesTable } from "@workspace/db/schema";
import { randomUUID } from "crypto";

const router: IRouter = Router();

const FLYWHEEL_HISTORY: Array<{
  id: string;
  projectType: string;
  focusArea: string;
  fileCount: number;
  timestamp: Date;
  summary: string;
}> = [];

router.post("/analyze", async (req, res) => {
  const { files, focusArea = "general", projectType = "fullstack" } = req.body as {
    files: Array<{ path: string; content: string; language?: string }>;
    focusArea?: string;
    projectType?: string;
  };

  if (!files || !Array.isArray(files) || files.length === 0) {
    res.status(400).json({ error: "At least one file is required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const fileContext = files
    .map((f) => `### ${f.path}\n\`\`\`${f.language ?? ""}\n${f.content.slice(0, 3000)}\n\`\`\``)
    .join("\n\n");

  const systemPrompt = `You are The Brain's Flywheel Aider Bot — a hacker-philosophy code improvement engine.
Your job is to analyze code and output real, actionable improvements a developer can immediately apply.
Focus area: ${focusArea}. Project type: ${projectType}.

Output format — stream your analysis as structured sections:
1. Start with "## 🔍 Analysis" — what you observe in the code
2. Then "## ⚡ Quick Wins" — 2-3 small improvements with exact code snippets
3. Then "## 🏗️ Architecture" — structural/design improvements  
4. Then "## 🔒 Security & Performance" — any issues to fix
5. End with "## 🚀 Next Step" — the single most impactful thing to do next

Be direct. Be technical. No fluff. Give real code, not pseudocode.`;

  const userPrompt = `Analyze this code and give me real improvements:\n\n${fileContext}`;

  let fullSummary = "";

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullSummary += content;
        res.write(`data: ${JSON.stringify({ type: "chunk", content })}\n\n`);
      }
    }

    const run = {
      id: randomUUID(),
      projectType,
      focusArea,
      fileCount: files.length,
      timestamp: new Date(),
      summary: fullSummary.slice(0, 200) + "...",
    };
    FLYWHEEL_HISTORY.unshift(run);
    if (FLYWHEEL_HISTORY.length > 20) FLYWHEEL_HISTORY.pop();

    res.write(`data: ${JSON.stringify({ type: "done", runId: run.id })}\n\n`);
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ type: "error", message: "Analysis failed" })}\n\n`);
    res.end();
  }
});

router.get("/history", (_req, res) => {
  res.json({ runs: FLYWHEEL_HISTORY });
});

export default router;
