import React, { useState } from "react";
import { Check, Copy, Terminal } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TerminalBlockProps {
  title?: string;
  content: string;
  language?: string;
  className?: string;
  streaming?: boolean;
}

export function TerminalBlock({ title, content, language = "bash", className, streaming = false }: TerminalBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("glass-terminal rounded-xl flex flex-col shadow-2xl", className)}>
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-primary/20 bg-background/50">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-secondary" />
          <span className="font-mono text-xs text-primary/70">{title || `Terminal // ${language}`}</span>
        </div>
        <div className="flex items-center gap-3">
          {streaming && (
            <span className="flex items-center gap-2 text-xs font-mono text-secondary animate-pulse">
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              STREAMING
            </span>
          )}
          <button
            onClick={handleCopy}
            className="p-1.5 text-primary/50 hover:text-primary hover:bg-primary/10 rounded transition-colors"
            title="Copy to clipboard"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      <div className="p-4 overflow-x-auto terminal-scrollbar bg-black/40 grow relative">
        {/* Subtle scanline effect overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-20"></div>
        
        <pre className="font-mono text-sm leading-relaxed whitespace-pre-wrap break-words m-0 relative z-10">
          <code className={cn(
            "text-gray-300", 
            language === 'json' && "text-secondary",
            language === 'yaml' && "text-primary",
            language === 'bash' && "text-gray-100"
          )}>
            {content || (streaming ? "" : "No output generated yet.")}
            {streaming && <span className="inline-block w-2 h-4 bg-primary ml-1 align-middle animate-blink"></span>}
          </code>
        </pre>
      </div>
    </div>
  );
}
