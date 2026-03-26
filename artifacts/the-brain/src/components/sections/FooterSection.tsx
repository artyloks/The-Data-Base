import React from "react";
import { Github, Database, Network } from "lucide-react";

export function FooterSection() {
  return (
    <footer className="border-t border-border/50 bg-black py-12 relative z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-primary/10 border border-primary flex items-center justify-center">
              <Network className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-bold text-white tracking-widest uppercase">THE BRAIN</h3>
              <p className="font-mono text-xs text-primary">Node active // Connected</p>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <div className="flex items-center gap-2 bg-background border border-border px-3 py-1.5 rounded text-xs font-mono">
              <span className="text-secondary">REPOS SYNCED:</span>
              <span className="text-white font-bold">1,337</span>
            </div>
            <div className="flex items-center gap-2 bg-background border border-border px-3 py-1.5 rounded text-xs font-mono">
              <span className="text-primary">FLYWEEL RUNS:</span>
              <span className="text-white font-bold">42,069</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a href="https://github.com/artyloks/The-Data-Base" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transition-colors">
              <Github className="w-5 h-5" />
            </a>
            <a href="#" className="text-gray-400 hover:text-primary transition-colors">
              <Database className="w-5 h-5" />
            </a>
          </div>
          
        </div>
        
        <div className="mt-8 pt-8 border-t border-border/50 text-center font-mono text-xs text-gray-600">
          <p>Join the flywheel. Every repo becomes a node in the network.</p>
          <p className="mt-2">© 2026 The Brain AI Agent Architecture. Open Source.</p>
        </div>
      </div>
    </footer>
  );
}
