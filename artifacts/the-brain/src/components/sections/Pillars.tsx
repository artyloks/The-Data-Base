import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ChevronRight, Code2, Network, ShieldAlert, Zap } from 'lucide-react';

export function Pillars() {
  const pillars = [
    {
      title: "PILLAR 1: THE BRAIN",
      subtitle: "QWEN 3.5 CORE",
      description: "A native multimodal agent that doesn't just process text—it speaks the language of tools.",
      features: [
        "Worker Brain: Qwen 3.5-35B-A3B via SiliconFlow/OpenRouter (Lightning fast execution)",
        "Architect Brain: Qwen 3-Coder-480B (Agentic Coding Champion for planning)",
        "Native multimodal tool call prediction"
      ],
      icon: <Network className="w-12 h-12 text-primary" />,
      color: "primary"
    },
    {
      title: "PILLAR 2: THE HANDS",
      subtitle: "MCP SERVERS",
      description: "Model Context Protocol serves as the universal adapter, granting the brain tangible capabilities.",
      features: [
        "Brave Search MCP: Real-time web knowledge extraction",
        "Local-Bash MCP: Absolute terminal execution power",
        "Supabase MCP: Keyless-feeling persistent state"
      ],
      icon: <Zap className="w-12 h-12 text-secondary" />,
      color: "secondary"
    }
  ];

  const loopSteps = [
    { step: "01", name: "Input", desc: "User says 'Build me a login page'" },
    { step: "02", name: "Plan", desc: "Call get_filesystem_structure tool" },
    { step: "03", name: "Execute", desc: "Call write_file to create Login.tsx" },
    { step: "04", name: "Verify", desc: "Run run_shell_command('npm run lint')" },
    { step: "05", name: "Heal", desc: "If fails, feed error back and repeat" },
  ];

  return (
    <section className="py-24 relative z-10 bg-black/40 border-y border-border/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="order-2 lg:order-1"
          >
            <div className="relative aspect-square max-w-md mx-auto">
              <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-[spin_20s_linear_infinite]" />
              <div className="absolute inset-4 rounded-full border border-secondary/30 animate-[spin_15s_linear_infinite_reverse]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <img 
                  src={`${import.meta.env.BASE_URL}images/core-brain.png`}
                  alt="AI Core"
                  className="w-3/4 h-3/4 object-contain animate-float drop-shadow-[0_0_30px_rgba(0,229,255,0.3)]"
                />
              </div>
            </div>
          </motion.div>

          <div className="order-1 lg:order-2 space-y-12">
            {pillars.map((pillar, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.2 }}
                className="glass-panel p-8 rounded-2xl relative overflow-hidden group"
              >
                <div className={`absolute top-0 left-0 w-2 h-full bg-${pillar.color}`} />
                <div className="flex items-start gap-6">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10 shrink-0">
                    {pillar.icon}
                  </div>
                  <div>
                    <h4 className={`text-sm font-bold tracking-widest text-${pillar.color} mb-1`}>{pillar.title}</h4>
                    <h3 className="text-2xl font-display font-semibold text-foreground mb-3">{pillar.subtitle}</h3>
                    <p className="text-muted-foreground font-sans mb-6">{pillar.description}</p>
                    <ul className="space-y-3">
                      {pillar.features.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-3 text-sm font-mono text-foreground/80">
                          <CheckCircle2 className={`w-5 h-5 text-${pillar.color} shrink-0`} />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* The Nervous System Detail */}
        <div className="mt-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              PILLAR 3: <span className="text-accent text-glow">THE NERVOUS SYSTEM</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto font-sans">
              The orchestrator script manages the autonomous loop. Using the Claude Agent SDK or mcp-agent, it runs continuously until the objective is secured.
            </p>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 relative">
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-border -translate-y-1/2 z-0" />
            
            {loopSteps.map((step, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="relative z-10 w-full md:w-auto"
              >
                <div className="bg-card border border-border p-6 rounded-xl text-center hover:border-accent hover:box-shadow-[0_0_15px_-5px_hsl(var(--accent)/0.5)] transition-all duration-300">
                  <div className="w-10 h-10 mx-auto bg-accent/10 border border-accent text-accent rounded-full flex items-center justify-center font-mono font-bold mb-4">
                    {step.step}
                  </div>
                  <h4 className="font-heading font-bold text-lg mb-2">{step.name}</h4>
                  <p className="text-xs text-muted-foreground font-mono">{step.desc}</p>
                </div>
                {idx < loopSteps.length - 1 && (
                  <div className="md:hidden flex justify-center my-4">
                    <ChevronRight className="w-6 h-6 text-muted-foreground rotate-90" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
