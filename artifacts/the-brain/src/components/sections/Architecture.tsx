import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Globe, GitMerge, Smartphone, Database, TerminalSquare } from 'lucide-react';

export function Architecture() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <section id="architecture-section" className="py-24 relative z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">
            SYSTEM <span className="text-primary text-glow">ARCHITECTURE</span>
          </h2>
          <div className="h-1 w-24 bg-primary/50 mx-auto rounded-full box-glow" />
        </div>

        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative"
        >
          {/* Connector Lines (visible on lg) */}
          <div className="hidden lg:block absolute top-1/2 left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-primary/0 via-primary/50 to-secondary/0 -translate-y-1/2 z-0 animate-pulse-slow" />

          {/* Node 1: The Brain */}
          <motion.div variants={item} className="relative z-10 group">
            <div className="glass-panel p-8 rounded-2xl h-full transition-all duration-500 hover:-translate-y-2 hover:box-glow hover:border-primary/50">
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform duration-500">
                <Cpu className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-heading font-bold mb-3 text-foreground">The Brain</h3>
              <p className="text-sm text-muted-foreground font-sans leading-relaxed">
                Qwen 3.5. Dual-core setup with Worker Brain (35B-A3B) for speed and Architect Brain (480B) for high-level planning.
              </p>
            </div>
          </motion.div>

          {/* Node 2: The Hands */}
          <motion.div variants={item} className="relative z-10 group">
            <div className="glass-panel p-8 rounded-2xl h-full transition-all duration-500 hover:-translate-y-2 hover:box-glow-purple hover:border-secondary/50">
              <div className="w-16 h-16 rounded-full bg-secondary/10 border border-secondary/30 flex items-center justify-center mb-6 text-secondary group-hover:scale-110 transition-transform duration-500">
                <div className="flex gap-1">
                  <Globe className="w-5 h-5" />
                  <Database className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-xl font-heading font-bold mb-3 text-foreground">The Hands</h3>
              <p className="text-sm text-muted-foreground font-sans leading-relaxed">
                MCP Servers providing tangible power: Brave Search for web, Local-Bash for execution, and Supabase for persistence.
              </p>
            </div>
          </motion.div>

          {/* Node 3: The Nervous System */}
          <motion.div variants={item} className="relative z-10 group">
            <div className="glass-panel p-8 rounded-2xl h-full transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_0_20px_-5px_hsl(var(--accent)/0.4)] hover:border-accent/50">
              <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center mb-6 text-accent group-hover:scale-110 transition-transform duration-500">
                <GitMerge className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-heading font-bold mb-3 text-foreground">The Nervous System</h3>
              <p className="text-sm text-muted-foreground font-sans leading-relaxed">
                The Orchestrator loop. Managing the continuous cycle: Input → Plan → Execute → Verify → Heal.
              </p>
            </div>
          </motion.div>

          {/* Node 4: The Canvas */}
          <motion.div variants={item} className="relative z-10 group">
            <div className="glass-panel p-8 rounded-2xl h-full transition-all duration-500 hover:-translate-y-2 hover:box-glow hover:border-primary/50">
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform duration-500">
                <Smartphone className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-heading font-bold mb-3 text-foreground">The Canvas</h3>
              <p className="text-sm text-muted-foreground font-sans leading-relaxed">
                React Native + Expo. Real-time "Vibe Coding" where canvas tweaks update instantly on your mobile device.
              </p>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
}
