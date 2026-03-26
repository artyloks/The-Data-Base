import React, { useState } from "react";
import { TerminalBlock } from "../TerminalBlock";
import { useGenerateMcpConfig } from "@workspace/api-client-react";
import { PlugZap, Loader2 } from "lucide-react";

export function McpSection() {
  const { mutate: generateConfig, isPending, data } = useGenerateMcpConfig();
  
  const [editorType, setEditorType] = useState<any>("vscode");
  const [serverUrl, setServerUrl] = useState("");
  const [tools, setTools] = useState<string[]>(["brave-search", "local-bash", "filesystem"]);

  const toggleTool = (tool: string) => {
    if (tools.includes(tool)) {
      setTools(tools.filter(t => t !== tool));
    } else {
      setTools([...tools, tool]);
    }
  };

  const handleGenerate = () => {
    generateConfig({ data: { editorType, serverUrl, tools } });
  };

  const editors = [
    { id: "vscode", name: "VS Code" },
    { id: "cursor", name: "Cursor" },
    { id: "windsurf", name: "Windsurf" },
    { id: "neovim", name: "Neovim" }
  ];

  const availableTools = [
    { id: "brave-search", name: "Brave Search", desc: "Live web knowledge" },
    { id: "local-bash", name: "Local Bash", desc: "Terminal execution power" },
    { id: "supabase", name: "Supabase", desc: "Keyless database" },
    { id: "filesystem", name: "Filesystem", desc: "Read/write workspace files" },
    { id: "github", name: "GitHub", desc: "Search code, manage PRs" },
    { id: "the-brain", name: "The Brain Agent", desc: "Connect to deployed instance" }
  ];

  return (
    <section className="py-24 relative z-10 border-t border-border/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-2 flex items-center gap-3">
            <PlugZap className="w-8 h-8 text-primary" />
            MCP CONFIG <span className="text-primary text-glow">GENERATOR</span>
          </h2>
          <p className="text-muted-foreground font-mono">One JSON file. Instant agent superpowers in any editor.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glass-terminal rounded-xl p-6 flex flex-col gap-6">
            <div className="space-y-4">
              <div className="space-y-3">
                <label className="text-xs font-mono text-primary uppercase">Target Editor</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {editors.map(ed => (
                    <button
                      key={ed.id}
                      onClick={() => setEditorType(ed.id)}
                      className={`py-2 px-3 rounded font-mono text-sm transition-all border ${
                        editorType === ed.id 
                          ? "bg-primary/20 border-primary text-primary shadow-[0_0_10px_rgba(0,255,65,0.2)]" 
                          : "bg-black/50 border-border text-gray-400 hover:border-primary/50"
                      }`}
                    >
                      {ed.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-xs font-mono text-primary uppercase">Agent Capabilities (MCP Tools)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {availableTools.map(tool => (
                    <div 
                      key={tool.id}
                      onClick={() => toggleTool(tool.id)}
                      className={`p-3 rounded border cursor-pointer transition-colors ${
                        tools.includes(tool.id) ? "bg-primary/10 border-primary" : "bg-black/50 border-border hover:border-primary/30"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-3 h-3 rounded-full ${tools.includes(tool.id) ? "bg-primary" : "bg-gray-600"}`}></div>
                        <span className={`font-mono text-sm font-bold ${tools.includes(tool.id) ? "text-primary" : "text-gray-300"}`}>
                          {tool.name}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-gray-500 pl-5">{tool.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {tools.includes("the-brain") && (
                <div className="space-y-2 animate-in fade-in zoom-in duration-300">
                  <label className="text-xs font-mono text-primary uppercase">Brain Server URL</label>
                  <input 
                    type="url"
                    value={serverUrl}
                    onChange={(e) => setServerUrl(e.target.value)}
                    placeholder="https://your-app.replit.app"
                    className="w-full bg-black/50 border border-primary/50 rounded px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-primary focus:shadow-[0_0_10px_rgba(0,255,65,0.2)] transition-all"
                  />
                </div>
              )}
            </div>

            <button
              onClick={handleGenerate}
              disabled={isPending}
              className="mt-auto w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-background border border-primary hover:box-glow font-mono font-bold tracking-wider rounded transition-all duration-300 disabled:opacity-50"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlugZap className="w-4 h-4 fill-current" />}
              GENERATE CONFIG
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <TerminalBlock 
              title={data?.filename || "mcp.json"} 
              content={data ? JSON.stringify(data.config, null, 2) : "// Select tools and click generate"} 
              language="json"
              className="h-[350px]"
            />
            
            {data?.instructions && (
              <div className="glass-terminal rounded-xl p-4 bg-black/50 border-primary/20 flex-1 overflow-y-auto terminal-scrollbar">
                <h4 className="font-mono text-primary text-sm font-bold mb-2">INSTALLATION</h4>
                <pre className="font-mono text-xs text-gray-300 whitespace-pre-wrap">{data.instructions}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
