import React from "react";
import { motion } from "framer-motion";
import { Terminal, Github, ChevronRight, Zap } from "lucide-react";

export function HeroSection() {
  const scrollToFlywheel = () => {
    document.getElementById("flywheel-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center pt-20 pb-16 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
        <div className="tech-grid absolute inset-0 w-full h-full opacity-30"></div>
        <div className="w-[800px] h-[400px] bg-primary/10 blur-[120px] rounded-[100%] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3 py-1 mb-8 border rounded-full border-primary/40 bg-primary/5 backdrop-blur-sm"
        >
          <span className="relative flex w-2 h-2">
            <span className="absolute inline-flex w-full h-full rounded-full opacity-75 animate-ping bg-primary"></span>
            <span className="relative inline-flex w-2 h-2 rounded-full bg-primary"></span>
          </span>
          <span className="font-mono text-xs font-semibold tracking-wider uppercase text-primary">
            SYSTEM ONLINE // 2026 BUILD
          </span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 tracking-tighter"
        >
          <span className="text-white">THE </span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary text-glow">
            BRAIN
          </span>
        </motion.h1>

        <motion.h2 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-xl md:text-2xl font-mono text-secondary/90 mb-12 max-w-3xl mx-auto uppercase tracking-widest text-glow-cyan"
        >
          Hacker-First AI Agent Architecture
        </motion.h2>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="max-w-2xl mx-auto glass-terminal p-6 rounded-xl text-left mb-12"
        >
          <div className="flex items-center gap-2 mb-4 border-b border-primary/20 pb-2">
            <div className="w-3 h-3 rounded-full bg-destructive/80"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-primary/80"></div>
          </div>
          <div className="font-mono text-sm md:text-base space-y-3">
            <div className="flex gap-2">
              <span className="text-secondary">❯</span>
              <span className="text-gray-300">generate <span className="text-primary">--production-ready</span> <span className="text-primary">--github-first</span></span>
            </div>
            <div className="flex gap-2">
              <span className="text-secondary">❯</span>
              <span className="text-gray-300">deploy <span className="text-primary">--anywhere</span> <span className="text-primary">--not-locked-in</span></span>
            </div>
            <div className="flex gap-2">
              <span className="text-secondary">❯</span>
              <span className="text-gray-300">extract <span className="text-primary">--speed-not-ownership</span></span>
            </div>
            <div className="flex gap-2 mt-4 text-primary/70 animate-pulse-fast">
              <span className="text-secondary">❯</span>
              <span>_</span>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button 
            onClick={scrollToFlywheel}
            className="group relative px-8 py-4 bg-primary text-background font-mono font-bold uppercase tracking-wider rounded border border-primary overflow-hidden hover:box-glow transition-all duration-300 w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <div className="absolute inset-0 w-full h-full bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
            <Zap className="w-5 h-5 relative z-10" />
            <span className="relative z-10">Initialize Flywheel</span>
          </button>
          
          <a 
            href="https://github.com/artyloks/The-Data-Base" 
            target="_blank" 
            rel="noreferrer"
            className="group px-8 py-4 bg-transparent text-secondary font-mono font-bold uppercase tracking-wider rounded border border-secondary hover:bg-secondary/10 hover:box-glow-cyan transition-all duration-300 w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <Github className="w-5 h-5" />
            <span>Clone to GitHub</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
