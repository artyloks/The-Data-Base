import React, { useState } from "react";
import { TerminalBlock } from "../TerminalBlock";
import { useGenerateGithubActions } from "@workspace/api-client-react";
import { GitBranch, Settings, Loader2 } from "lucide-react";

export function CliSection() {
  const { mutate: generateActions, isPending, data } = useGenerateGithubActions();
  
  const [projectType, setProjectType] = useState<any>("react-vite");
  const [deployTarget, setDeployTarget] = useState<any>("github-pages");
  const [repoName, setRepoName] = useState("");
  const [features, setFeatures] = useState<string[]>([]);

  const toggleFeature = (feature: string) => {
    if (features.includes(feature)) {
      setFeatures(features.filter(f => f !== feature));
    } else {
      setFeatures([...features, feature]);
    }
  };

  const handleGenerate = () => {
    generateActions({ data: { projectType, deployTarget, repoName, features } });
  };

  return (
    <section className="py-24 bg-black/30 relative z-10 border-t border-border/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-2 flex items-center gap-3">
            <GitBranch className="w-8 h-8 text-secondary" />
            GITHUB ACTIONS <span className="text-secondary text-glow-cyan">GENERATOR</span>
          </h2>
          <p className="text-muted-foreground font-mono">Generate pure CI/CD YAML. No platform lock-in.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 glass-terminal rounded-xl p-6 flex flex-col gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-mono text-secondary uppercase">Project Type</label>
                <select 
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value)}
                  className="w-full bg-black/50 border border-border rounded px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-secondary transition-colors"
                >
                  <option value="react-vite">React + Vite</option>
                  <option value="express-api">Express API</option>
                  <option value="expo-mobile">Expo Mobile</option>
                  <option value="python-fastapi">Python FastAPI</option>
                  <option value="fullstack-monorepo">Fullstack Monorepo</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono text-secondary uppercase">Deploy Target</label>
                <select 
                  value={deployTarget}
                  onChange={(e) => setDeployTarget(e.target.value)}
                  className="w-full bg-black/50 border border-border rounded px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-secondary transition-colors"
                >
                  <option value="none">None (Build Only)</option>
                  <option value="github-pages">GitHub Pages</option>
                  <option value="vercel">Vercel</option>
                  <option value="railway">Railway</option>
                  <option value="fly-io">Fly.io</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono text-secondary uppercase">Repository Name (optional)</label>
                <input 
                  type="text"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  placeholder="artyloks/the-data-base"
                  className="w-full bg-black/50 border border-border rounded px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-secondary transition-colors"
                />
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-xs font-mono text-secondary uppercase">Additional Pipelines</label>
                <div className="flex flex-col gap-2">
                  {[
                    { id: "lint", label: "Run Linter" },
                    { id: "test", label: "Run Tests" },
                    { id: "docker", label: "Build & Push Docker" },
                    { id: "security-scan", label: "CodeQL Security Scan" }
                  ].map(opt => (
                    <label key={opt.id} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${features.includes(opt.id) ? 'bg-secondary border-secondary' : 'bg-black border-border group-hover:border-secondary/50'}`}>
                        {features.includes(opt.id) && <div className="w-2 h-2 bg-black rounded-sm" />}
                      </div>
                      <span className="text-sm font-mono text-gray-300 group-hover:text-white">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isPending}
              className="mt-auto w-full flex items-center justify-center gap-2 px-6 py-3 bg-secondary/10 text-secondary border border-secondary hover:bg-secondary/20 hover:box-glow-cyan font-mono font-bold tracking-wider rounded transition-all duration-300 disabled:opacity-50"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4" />}
              GENERATE WORKFLOW
            </button>
          </div>

          <div className="lg:col-span-8 flex flex-col gap-4">
            <TerminalBlock 
              title={data?.filename || ".github/workflows/ci.yml"} 
              content={data?.yaml || "# Click Generate Workflow to create CI/CD configuration"} 
              language="yaml"
              className="h-[400px]"
            />
            
            {data?.setupInstructions && (
              <div className="glass-terminal rounded-xl p-4 bg-black/50 border-secondary/20">
                <h4 className="font-mono text-secondary text-sm font-bold mb-2">SETUP INSTRUCTIONS</h4>
                <pre className="font-mono text-xs text-gray-300 whitespace-pre-wrap">{data.setupInstructions}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
