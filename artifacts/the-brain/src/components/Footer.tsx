import React from 'react';
import { BrainCircuit } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background relative z-10 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <BrainCircuit className="w-6 h-6 text-primary" />
            <span className="font-display font-bold text-lg tracking-wider">
              THE<span className="text-primary">BRAIN</span>
            </span>
          </div>
          
          <p className="text-sm text-muted-foreground font-mono">
            &copy; 2026 Native Multimodal Architecture. System operational.
          </p>
          
          <div className="flex gap-4">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors font-mono text-sm">/docs</a>
            <a href="#" className="text-muted-foreground hover:text-secondary transition-colors font-mono text-sm">/github</a>
            <a href="#" className="text-muted-foreground hover:text-accent transition-colors font-mono text-sm">/status</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
