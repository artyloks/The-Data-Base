import React, { useState } from "react";
import { motion } from "framer-motion";
import { TerminalBlock } from "../TerminalBlock";
import { useFlywheelSSE } from "@/hooks/use-sse-flywheel";
import { Play, Square, FileCode2, Plus, Code2 } from "lucide-react";
import type { FlywheelRequest } from "@workspace/api-client-react";

export function FlywheelSection() {
  const { content, isStreaming, error, analyze, stop } = useFlywheelSSE();
  
  const [files, setFiles] = useState([
    { path: "src/App.tsx", content: "// Paste your code here...", language: "typescript" }
  ]);
  const [focusArea, setFocusArea] = useState("general");
  const [projectType, setProjectType] = useState("react-vite");

  const handleAnalyze = () => {
    if (isStreaming) {
      stop();
      return;
    }
    analyze({
      files,
      focusArea,
      projectType
    });
  };

  const updateFile = (index: number, field: string, value: string) => {
    const newFiles = [...files];
    newFiles[index] = { ...newFiles[index], [field]: value };
    setFiles(newFiles);
  };

  const addFile = () => {
    setFiles([...files, { path: `src/new-file-${files.length + 1}.ts`, content: "", language: "typescript" }]);
  };

  const removeFile = (index: number) => {
    if (files.length > 1) {
      setFiles(files.filter((_, i) => i !== index));
    }
  };

  return (
    <section id="flywheel-section" className="py-24 relative z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-2 flex items-center gap-3">
            <Zap className="w-8 h-8 text-primary" />
            FLYWHEEL <span className="text-primary text-glow">AIDER BOT</span> // LIVE
          </h2>
          <p className="text-secondary font-mono">Drop your code. Watch it improve in real-time.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel: Input Form */}
          <div className="glass-terminal rounded-xl p-6 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 space-y-2">
                <label className="text-xs font-mono text-primary uppercase">Project Type</label>
                <select 
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value)}
                  className="w-full bg-black/50 border border-border rounded px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="react-vite">React + Vite</option>
                  <option value="express-api">Express API</option>
                  <option value="expo-mobile">Expo Mobile</option>
                  <option value="python-fastapi">Python FastAPI</option>
                  <option value="fullstack-monorepo">Fullstack Monorepo</option>
                </select>
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-xs font-mono text-primary uppercase">Focus Area</label>
                <select 
                  value={focusArea}
                  onChange={(e) => setFocusArea(e.target.value)}
                  className="w-full bg-black/50 border border-border rounded px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="general">General Improvement</option>
                  <option value="performance">Performance</option>
                  <option value="security">Security</option>
                  <option value="architecture">Architecture</option>
                  <option value="testing">Testing</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {files.map((file, idx) => (
                <div key={idx} className="border border-border/50 rounded-lg overflow-hidden bg-black/30">
                  <div className="flex items-center justify-between p-2 bg-black/50 border-b border-border/50">
                    <div className="flex items-center gap-2 flex-1">
                      <FileCode2 className="w-4 h-4 text-secondary" />
                      <input 
                        type="text" 
                        value={file.path}
                        onChange={(e) => updateFile(idx, 'path', e.target.value)}
                        placeholder="src/components/MyComponent.tsx"
                        className="bg-transparent border-none text-sm font-mono text-white focus:outline-none w-full"
                      />
                    </div>
                    {files.length > 1 && (
                      <button onClick={() => removeFile(idx)} className="text-destructive/70 hover:text-destructive text-xs font-mono px-2">
                        [X]
                      </button>
                    )}
                  </div>
                  <textarea
                    value={file.content}
                    onChange={(e) => updateFile(idx, 'content', e.target.value)}
                    className="w-full h-48 bg-transparent p-3 font-mono text-sm text-gray-300 focus:outline-none resize-y terminal-scrollbar"
                    placeholder="Paste code here..."
                    spellCheck={false}
                  ></textarea>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-auto pt-4">
              <button 
                onClick={addFile}
                className="flex items-center gap-2 text-xs font-mono text-secondary hover:text-white transition-colors"
              >
                <Plus className="w-4 h-4" /> ADD FILE
              </button>

              <button
                onClick={handleAnalyze}
                className={`flex items-center gap-2 px-6 py-3 font-mono font-bold tracking-wider rounded transition-all duration-300 ${
                  isStreaming 
                    ? "bg-destructive/20 text-destructive border border-destructive hover:bg-destructive/30" 
                    : "bg-primary text-background border border-primary hover:box-glow"
                }`}
              >
                {isStreaming ? (
                  <>
                    <Square className="w-4 h-4 fill-current" /> STOP
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" /> ANALYZE
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Panel: Streaming Output */}
          <div className="h-[600px] flex flex-col">
            <TerminalBlock 
              title="Aider Bot Output // markdown" 
              content={error || content} 
              language="markdown"
              className="h-full"
              streaming={isStreaming}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// Ensure Zap icon is imported correctly
import { Zap } from "lucide-react";
