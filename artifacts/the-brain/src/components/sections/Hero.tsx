import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Terminal, BrainCircuit, Sparkles } from 'lucide-react';

export function Hero() {
  const scrollToDemo = () => {
    document.getElementById('demo-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center pt-20 pb-12 overflow-hidden">
      {/* Background Image Overlay */}
      <div className="absolute inset-0 z-0 opacity-20 mix-blend-screen">
        <img 
          src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
          alt="Neural Network" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background" />
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 backdrop-blur-sm mb-8 animate-float"
        >
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-heading font-semibold text-primary tracking-widest uppercase">System Online // 2026 Build</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="text-5xl md:text-7xl lg:text-8xl font-display font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/40 mb-6 drop-shadow-2xl"
        >
          THE <span className="text-primary text-glow">BRAIN</span>
        </motion.h1>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="text-2xl md:text-4xl font-heading font-light text-foreground/80 mb-8 tracking-wide"
        >
          QWEN 3.5 — THE <span className="text-secondary font-bold text-glow-purple">NATIVE AGENT</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-12 font-sans leading-relaxed"
        >
          The first true native multimodal agent architecture. It doesn't just predict text; 
          it predicts <span className="text-primary font-semibold">tool calls</span> natively.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6"
        >
          <Button size="lg" onClick={scrollToDemo} className="w-full sm:w-auto">
            <Terminal className="w-5 h-5 mr-2" />
            Initialize Terminal
          </Button>
          <Button variant="outline" size="lg" onClick={() => document.getElementById('architecture-section')?.scrollIntoView({ behavior: 'smooth' })} className="w-full sm:w-auto">
            <BrainCircuit className="w-5 h-5 mr-2" />
            View Architecture
          </Button>
        </motion.div>
      </div>

      {/* Decorative bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />
    </section>
  );
}
