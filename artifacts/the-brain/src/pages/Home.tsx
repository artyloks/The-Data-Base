import React from "react";
import { HeroSection } from "@/components/sections/HeroSection";
import { PhilosophySection } from "@/components/sections/PhilosophySection";
import { FlywheelSection } from "@/components/sections/FlywheelSection";
import { CliSection } from "@/components/sections/CliSection";
import { McpSection } from "@/components/sections/McpSection";
import { FooterSection } from "@/components/sections/FooterSection";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative selection:bg-primary/30 selection:text-primary">
      {/* Global Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-primary/20 bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-display font-bold text-white tracking-widest uppercase">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse-fast"></span>
            THE BRAIN
          </div>
          <div className="hidden md:flex gap-6 font-mono text-xs uppercase tracking-wider text-gray-400">
            <a href="#flywheel-section" className="hover:text-primary transition-colors">Flywheel</a>
            <a href="https://github.com/artyloks/The-Data-Base" target="_blank" rel="noreferrer" className="hover:text-secondary transition-colors">GitHub</a>
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full pt-14">
        <HeroSection />
        <PhilosophySection />
        <FlywheelSection />
        <CliSection />
        <McpSection />
      </main>
      
      <FooterSection />
    </div>
  );
}
