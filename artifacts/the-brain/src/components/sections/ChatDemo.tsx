import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Send, Cpu, RotateCcw, AlertTriangle, Code, ChevronDown, ChevronUp } from 'lucide-react';
import { useSendMessage, useGetChatHistory, useResetChat } from '@workspace/api-client-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/Button';

// Mock types locally if strict types from Orval aren't perfect in IDE, 
// but we cast to ANY in extreme cases if structure is unknown.
// Assuming structure based on openapi.yaml provided.

export function ChatDemo() {
  const [input, setInput] = useState('');
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Queries & Mutations
  const { data: history, refetch: refetchHistory, isLoading: isLoadingHistory } = useGetChatHistory();
  
  const sendMessage = useSendMessage({
    mutation: {
      onSuccess: (data) => {
        // Replace optimistic message with actual
        setLocalMessages(prev => {
          const filtered = prev.filter(m => !m.isOptimistic);
          return [...filtered, data];
        });
        refetchHistory();
      },
      onError: () => {
        // Remove optimistic message on error
        setLocalMessages(prev => prev.filter(m => !m.isOptimistic));
      }
    }
  });

  const resetChat = useResetChat({
    mutation: {
      onSuccess: () => {
        setLocalMessages([]);
        refetchHistory();
      }
    }
  });

  // Sync local messages with server history when it loads
  useEffect(() => {
    if (history?.messages && !sendMessage.isPending) {
      setLocalMessages(history.messages);
    }
  }, [history, sendMessage.isPending]);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [localMessages, sendMessage.isPending]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sendMessage.isPending) return;

    const userMsg = input.trim();
    setInput('');
    
    // Add optimistic user message
    const optimisticMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: userMsg,
      timestamp: new Date().toISOString(),
      isOptimistic: true
    };
    
    setLocalMessages(prev => [...prev, optimisticMsg]);
    
    sendMessage.mutate({ data: { message: userMsg } });
  };

  const handleReset = () => {
    resetChat.mutate();
  };

  return (
    <section id="demo-section" className="py-24 relative z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4 flex items-center justify-center gap-4">
            <Terminal className="w-10 h-10 text-primary" />
            LIVE <span className="text-primary text-glow">TERMINAL</span>
          </h2>
          <p className="text-muted-foreground font-mono text-sm max-w-2xl mx-auto">
            Interact with the Agentic Orchestrator. Watch it think, plan, and execute tool calls in real-time.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Terminal Window */}
          <div className="glass-panel rounded-xl overflow-hidden shadow-2xl shadow-primary/10 border-border flex flex-col h-[600px]">
            {/* Terminal Header */}
            <div className="bg-card-border/80 px-4 py-3 flex items-center justify-between border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive/80" />
                <div className="w-3 h-3 rounded-full bg-accent/80" />
                <div className="w-3 h-3 rounded-full bg-primary/80" />
                <span className="ml-4 text-xs font-mono text-muted-foreground">root@qwen-3.5:~# orchestrator</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleReset}
                disabled={resetChat.isPending || sendMessage.isPending}
                className="h-8 px-3 text-xs font-mono text-muted-foreground hover:text-destructive"
              >
                <RotateCcw className="w-3 h-3 mr-2" />
                SYS.REBOOT
              </Button>
            </div>

            {/* Chat Messages Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-black/60 custom-scrollbar"
            >
              {isLoadingHistory && localMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-primary font-mono animate-pulse">
                  Initializing system logs...
                </div>
              ) : localMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground font-mono space-y-4 opacity-50">
                  <Cpu className="w-12 h-12" />
                  <p>Awaiting input parameters...</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {localMessages.map((msg, idx) => (
                    <MessageBubble key={msg.id || idx} message={msg} />
                  ))}
                  
                  {sendMessage.isPending && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-4"
                    >
                      <div className="w-8 h-8 rounded-md bg-primary/20 border border-primary/50 flex items-center justify-center shrink-0">
                        <Cpu className="w-4 h-4 text-primary animate-pulse" />
                      </div>
                      <div className="flex flex-col gap-2 w-full">
                        <div className="font-mono text-xs text-primary/70 flex items-center gap-2">
                          AGENT <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                        </div>
                        <div className="bg-card border border-primary/30 rounded-lg rounded-tl-none p-4 w-fit">
                          <span className="text-sm font-mono text-primary animate-pulse">Processing objective...</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-card-border/50 border-t border-border">
              <form onSubmit={handleSubmit} className="relative flex items-center">
                <span className="absolute left-4 text-primary font-mono font-bold">{">"}</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={sendMessage.isPending}
                  placeholder="Enter command or objective..."
                  className="w-full bg-background border border-border rounded-lg py-4 pl-10 pr-16 text-foreground font-mono text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sendMessage.isPending}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              {sendMessage.isError && (
                <div className="mt-2 text-xs text-destructive flex items-center gap-1 font-mono">
                  <AlertTriangle className="w-3 h-3" /> Communication sub-system failure.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Sub-component for individual messages
function MessageBubble({ message }: { message: any }) {
  const isUser = message.role === 'user';
  const [showThinking, setShowThinking] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-4 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 border ${
        isUser 
          ? 'bg-secondary/20 border-secondary/50 text-secondary' 
          : 'bg-primary/20 border-primary/50 text-primary'
      }`}>
        {isUser ? <Terminal className="w-4 h-4" /> : <Cpu className="w-4 h-4" />}
      </div>

      {/* Content Wrapper */}
      <div className={`flex flex-col gap-2 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className="font-mono text-xs text-muted-foreground flex items-center gap-2">
          {isUser ? 'USER' : 'AGENT'} 
          <span className="opacity-50">
            {message.timestamp ? format(new Date(message.timestamp), 'HH:mm:ss') : ''}
          </span>
        </div>

        {/* Agent specific sub-components (Thinking & Tools) */}
        {!isUser && message.thinking && (
          <div className="w-full">
            <button 
              onClick={() => setShowThinking(!showThinking)}
              className="flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-primary transition-colors mb-1"
            >
              {showThinking ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              [Reasoning Matrix]
            </button>
            <AnimatePresence>
              {showThinking && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-3 bg-black/40 border-l-2 border-primary/30 text-xs font-mono text-muted-foreground mb-2 rounded-r-md">
                    {message.thinking}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
          <div className="w-full space-y-2 mb-2">
            {message.toolCalls.map((tool: any, idx: number) => (
              <div key={idx} className="border border-border/50 bg-black/50 rounded-md overflow-hidden">
                <div className="bg-card-border/50 px-3 py-1.5 flex items-center gap-2 border-b border-border/50">
                  <Code className="w-3 h-3 text-secondary" />
                  <span className="text-xs font-mono text-secondary">Execute: {tool.name}</span>
                  <span className={`ml-auto text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                    tool.status === 'success' ? 'bg-green-500/20 text-green-400' :
                    tool.status === 'error' ? 'bg-red-500/20 text-red-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {tool.status}
                  </span>
                </div>
                {tool.input && (
                  <div className="p-2 text-[10px] font-mono text-muted-foreground overflow-x-auto whitespace-pre">
                    {JSON.stringify(tool.input, null, 2)}
                  </div>
                )}
                {tool.output && tool.status === 'success' && (
                  <div className="p-2 border-t border-border/50 text-[10px] font-mono text-primary/70 bg-primary/5 overflow-x-auto whitespace-pre">
                    {tool.output}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Main Message Bubble */}
        <div className={`p-4 text-sm font-sans leading-relaxed shadow-lg ${
          isUser 
            ? 'bg-secondary/10 border border-secondary/20 rounded-2xl rounded-tr-none text-foreground' 
            : 'bg-card border border-border rounded-2xl rounded-tl-none text-foreground/90'
        } ${message.isOptimistic ? 'opacity-70' : ''}`}>
          {message.content}
        </div>
      </div>
    </motion.div>
  );
}
