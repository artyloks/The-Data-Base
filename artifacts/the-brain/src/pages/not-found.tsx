import React from 'react';
import { AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground font-mono">
      <div className="glass-panel p-8 md:p-12 rounded-2xl w-full max-w-md mx-4 text-center border-destructive/20 relative overflow-hidden">
        {/* Glitch effect background line */}
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-destructive/50 -translate-y-1/2 z-0 animate-pulse" />
        
        <div className="relative z-10">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center border border-destructive/30 text-destructive">
              <AlertCircle className="h-8 w-8" />
            </div>
          </div>
          
          <h1 className="text-4xl font-display font-bold text-foreground mb-2 tracking-widest">
            ERR_<span className="text-destructive text-glow">404</span>
          </h1>
          
          <p className="text-sm text-muted-foreground mb-8 uppercase tracking-widest">
            Sector not found in neural pathways.
          </p>
          
          <Button variant="danger" className="w-full" onClick={() => setLocation("/")}>
            Return to Root Directory
          </Button>
        </div>
      </div>
    </div>
  );
}
