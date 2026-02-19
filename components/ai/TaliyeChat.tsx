'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, Bot, User, BrainCircuit } from 'lucide-react';
import { chatWithBrain } from '@/actions/ai';
import { toast } from 'sonner';

type Message = {
    role: 'user' | 'assistant';
    content: string;
    sources?: any[];
};

export function TaliyeChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: "Hello, I am Taliye. I can search your notes and projects. What's on your mind?" }
    ]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isThinking) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsThinking(true);

        try {
            // Pass history mostly for client UI state; backend currently does one-shot RAG
            const response = await chatWithBrain(userMsg, messages);

            if (response.error) {
                toast.error(response.error);
                setMessages(prev => [...prev, { role: 'assistant', content: "I encountered an error connecting to my brain." }]);
            } else {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: response.content || "...",
                    sources: response.sources
                }]);
            }
        } catch (err) {
            toast.error("Failed to communicate with Taliye");
        } finally {
            setIsThinking(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                suppressHydrationWarning
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 p-4 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-2xl transition-all hover:scale-105 z-50 group"
            >
                <Sparkles className="w-6 h-6" />
                <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity pointer-events-none">
                    Ask Taliye
                </span>
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-200">
            {/* Header */}
            <div className="p-4 border-b border-border/50 flex items-center justify-between bg-purple-500/10">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-purple-500 rounded-lg">
                        <BrainCircuit className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm">active_intelligence</h3>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Taliye Online</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Chat Body */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((m, i) => (
                    <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === 'assistant' ? 'bg-purple-500/20 text-purple-500' : 'bg-muted text-muted-foreground'}`}>
                            {m.role === 'assistant' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        </div>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${m.role === 'user'
                            ? 'bg-primary text-primary-foreground rounded-tr-none'
                            : 'bg-muted/50 rounded-tl-none border border-border/50'
                            }`}>
                            <p className="whitespace-pre-wrap">{m.content}</p>

                            {/* Sources Footer */}
                            {m.sources && m.sources.length > 0 && (
                                <div className="mt-3 pt-2 border-t border-border/10">
                                    <p className="text-[10px] uppercase tracking-wider opacity-50 mb-1">Knowledge Used:</p>
                                    <div className="flex flex-wrap gap-1">
                                        {m.sources.map((s: any, idx) => (
                                            <div key={idx} className="text-[10px] bg-background/50 px-1.5 py-0.5 rounded border border-border/20 truncate max-w-full" title={s.preview}>
                                                R{(s.score * 100).toFixed(0)}%: {s.preview}...
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {isThinking && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-500 flex items-center justify-center flex-shrink-0">
                            <Bot className="w-4 h-4" />
                        </div>
                        <div className="bg-muted/50 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce"></span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-3 border-t border-border/50 bg-background/50 backdrop-blur-sm">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Search your brain..."
                        className="w-full bg-muted/60 border-none rounded-xl pr-10 py-3 pl-4 text-sm focus:ring-1 focus:ring-purple-500 placeholder:text-muted-foreground/50"
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isThinking}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:hover:bg-purple-500 transition-colors"
                    >
                        <Send className="w-3.5 h-3.5" />
                    </button>
                </div>
            </form>
        </div>
    );
}
