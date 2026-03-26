import React from 'react';
import { motion } from 'framer-motion';

export function TechBackground() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-[#020205]">
      {/* Grid pattern */}
      <div className="absolute inset-0 tech-grid opacity-30" />
      
      {/* Scanline overlay */}
      <div className="absolute top-0 left-0 w-full h-2 bg-primary/20 blur-[2px] animate-scanline" />
      
      {/* Abstract glowing orbs */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1] 
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-[20%] -right-[10%] w-[50vw] h-[50vw] rounded-full bg-primary/5 blur-[120px]"
      />
      
      <motion.div 
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.05, 0.15, 0.05] 
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute top-[40%] -left-[20%] w-[60vw] h-[60vw] rounded-full bg-secondary/5 blur-[150px]"
      />

      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.05, 0.1, 0.05] 
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        className="absolute -bottom-[20%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-accent/5 blur-[100px]"
      />
    </div>
  );
}
