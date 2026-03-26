import { Router, type IRouter } from "express";

const router: IRouter = Router();

type EditorType = "vscode" | "cursor" | "windsurf" | "neovim";

function generateMcpConfig(
  serverUrl: string,
  tools: string[],
  editorType: EditorType
): { filename: string; config: Record<string, unknown>; instructions: string } {
  const baseUrl = serverUrl || "https://your-brain-instance.replit.app";

  const mcpServers: Record<string, unknown> = {};

  if (tools.includes("brave-search")) {
    mcpServers["brave-search"] = {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-brave-search"],
      env: {
        BRAVE_API_KEY: "${BRAVE_API_KEY}",
      },
    };
  }

  if (tools.includes("local-bash")) {
    mcpServers["local-bash"] = {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-bash"],
      description: "Execute shell commands — gives your agent terminal superpowers",
    };
  }

  if (tools.includes("supabase")) {
    mcpServers["supabase"] = {
      command: "npx",
      args: ["-y", "@supabase/mcp-server-supabase@latest", "--access-token", "${SUPABASE_ACCESS_TOKEN}"],
      description: "Keyless Supabase integration via MCP",
    };
  }

  if (tools.includes("filesystem")) {
    mcpServers["filesystem"] = {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", "${workspaceFolder}"],
      description: "Read and write files in your workspace",
    };
  }

  if (tools.includes("github")) {
    mcpServers["github"] = {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-github"],
      env: {
        GITHUB_PERSONAL_ACCESS_TOKEN: "${GITHUB_TOKEN}",
      },
      description: "GitHub integration — search code, manage issues, PRs",
    };
  }

  if (tools.includes("the-brain")) {
    mcpServers["the-brain"] = {
      url: `${baseUrl}/api/mcp`,
      description: "The Brain agent — full agentic capabilities via MCP",
    };
  }

  let config: Record<string, unknown>;
  let filename: string;

  if (editorType === "vscode" || editorType === "cursor") {
    filename = ".vscode/mcp.json";
    config = {
      servers: mcpServers,
    };
  } else if (editorType === "windsurf") {
    filename = ".windsurf/mcp.json";
    config = {
      mcpServers,
    };
  } else {
    filename = ".config/nvim/mcp.json";
    config = {
      mcp_servers: mcpServers,
    };
  }

  const toolList = Object.keys(mcpServers);
  const instructions = `
## Installing Your MCP Config

### Step 1 — Save the file
\`\`\`bash
mkdir -p $(dirname ${filename})
# Paste the config JSON into ${filename}
\`\`\`

### Step 2 — Install MCP servers
\`\`\`bash
${toolList.includes("brave-search") ? "# Get Brave Search API key: https://api.search.brave.com/\nexport BRAVE_API_KEY=your_key" : ""}
${toolList.includes("supabase") ? "# Get Supabase access token: https://supabase.com/dashboard/account/tokens\nexport SUPABASE_ACCESS_TOKEN=your_token" : ""}
${toolList.includes("github") ? "# GitHub token already saved as Art_to_GH_Account\nexport GITHUB_TOKEN=your_token" : ""}
\`\`\`

### Step 3 — Restart ${editorType.toUpperCase()}
Your agent now has access to: ${toolList.join(", ")}

### Verify it works
In ${editorType === "vscode" ? "VS Code" : editorType}: Open Command Palette → "MCP: List Servers"
  `.trim();

  return { filename, config, instructions };
}

router.post("/generate-config", (req, res) => {
  const { serverUrl, tools, editorType } = req.body as {
    serverUrl?: string;
    tools: string[];
    editorType: EditorType;
  };

  if (!tools?.length || !editorType) {
    res.status(400).json({ error: "tools and editorType are required" });
    return;
  }

  const result = generateMcpConfig(serverUrl ?? "", tools, editorType);
  res.json(result);
});

export default router;
