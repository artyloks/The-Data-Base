import React from "react";
import { motion } from "framer-motion";
import { Cpu, Terminal as TerminalIcon, Repeat, Smartphone } from "lucide-react";

const pillars = [
  {
    icon: <Cpu className="w-8 h-8 text-primary" />,
    title: "The Brain",
    subtitle: "Qwen 3.5 Native Agent",
    content: [
      "Worker: Qwen 3.5-35B-A3B — Lightning fast execution",
      "Architect: Qwen 3-Coder-480B — High-level planning",
      "Predicts tool calls natively, no finetuning overhead"
    ],
    code: "const brain = new NativeAgent({ \n  mode: 'tool-call', \n  model: 'qwen-3.5' \n});"
  },
  {
    icon: <TerminalIcon className="w-8 h-8 text-secondary" />,
    title: "The Hands",
    subtitle: "MCP Servers",
    content: [
      "Brave Search MCP: Live web knowledge",
      "Local-Bash MCP: Terminal superpowers",
      "Supabase MCP: Keyless database integration"
    ],
    code: "npx @modelcontextprotocol/server-bash\nnpx @modelcontextprotocol/server-github"
  },
  {
    icon: <Repeat className="w-8 h-8 text-primary" />,
    title: "Nervous System",
    subtitle: "The Orchestrator",
    content: [
      "Input → Plan → Execute → Verify → Heal",
      "Self-correcting agentic loop",
      "Auto-detects and fixes errors during build"
    ],
    code: "loop {\n  await verify(code);\n  if (err) await heal(err);\n}"
  },
  {
    icon: <Smartphone className="w-8 h-8 text-secondary" />,
    title: "The Canvas",
    subtitle: "React Native + Expo",
    content: [
      "Mobile-first development experience",
      "Vibe Code directly on your phone",
      "Real-time sync with Expo Go"
    ],
    code: "npx create-expo-app@latest\neas build --platform all"
  }
];

export function PhilosophySection() {
  return (
    <section className="py-24 bg-black/50 border-y border-primary/10 relative z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">
            THE HACKER <span className="text-primary text-glow">STACK</span>
          </h2>
          <p className="text-muted-foreground font-mono max-w-2xl mx-auto">
            Built for speed. Built for control. No black boxes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {pillars.map((pillar, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="glass-terminal rounded-xl p-6 group hover:border-primary/60 transition-colors"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-background rounded-lg border border-border group-hover:border-primary/50 transition-colors">
                  {pillar.icon}
                </div>
                <div>
                  <h3 className="text-xl font-heading font-bold text-white tracking-wide">{pillar.title}</h3>
                  <p className="text-secondary font-mono text-sm uppercase">{pillar.subtitle}</p>
                </div>
              </div>
              
              <ul className="space-y-2 mb-6 font-mono text-sm text-gray-400">
                {pillar.content.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">›</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="bg-black/60 p-3 rounded border border-white/5 font-mono text-xs text-gray-300">
                <pre><code>{pillar.code}</code></pre>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
