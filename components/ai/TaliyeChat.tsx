'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, Send, X, Bot, User, BrainCircuit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

type Source = {
    id: string;
    score: number;
    preview: string;
    entityType?: string;
};

type Message = {
    role: 'user' | 'assistant';
    content: string;
    sources?: Source[];
};

const SESSION_KEY = 'taliye-chat-history';

const SUGGESTED_PROMPTS = [
    "What are my most overdue tasks?",
    "Which projects are at risk?",
    "What habits am I falling behind on?",
    "How's my week going?",
];

const ENTITY_LABELS: Record<string, string> = {
    task: 'Task',
    project: 'Project',
    goal: 'Goal',
    ritual: 'Habit',
    resource: 'Note',
};

const WELCOME_MESSAGE: Message = {
    role: 'assistant',
    content: "I'm Taliye, your Second Brain. I can search your tasks, projects, goals, and notes. What's on your mind?",
};

export function TaliyeChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const abortRef = useRef<AbortController | null>(null);

    // Restore messages from sessionStorage on mount
    useEffect(() => {
        try {
            const saved = sessionStorage.getItem(SESSION_KEY);
            if (saved) {
                const parsed = JSON.parse(saved) as Message[];
                if (parsed.length > 0) setMessages(parsed);
            }
        } catch {
            // ignore parse errors
        }
    }, []);

    // Persist messages to sessionStorage whenever they change
    useEffect(() => {
        try {
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(messages));
        } catch {
            // ignore quota errors
        }
    }, [messages]);

    // Auto-scroll on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const clearChat = useCallback(() => {
        setMessages([WELCOME_MESSAGE]);
        sessionStorage.removeItem(SESSION_KEY);
    }, []);

    const handleSubmit = useCallback(async (messageText?: string) => {
        const userMsg = (messageText ?? input).trim();
        if (!userMsg || isStreaming) return;

        setInput('');

        const userMessage: Message = { role: 'user', content: userMsg };
        // Add user message and placeholder assistant message
        setMessages((prev) => [
            ...prev,
            userMessage,
            { role: 'assistant', content: '' },
        ]);
        setIsStreaming(true);

        const historyForApi = messages.filter((m) => m.content !== '');

        abortRef.current = new AbortController();

        try {
            const res = await fetch('/api/ai/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg, history: historyForApi }),
                signal: abortRef.current.signal,
            });

            if (!res.ok || !res.body) {
                throw new Error(`Server error: ${res.status}`);
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let sources: Source[] = [];
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() ?? ''; // keep incomplete line

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    const data = line.slice(6).trim();
                    if (data === '[DONE]') break;

                    try {
                        const event = JSON.parse(data) as {
                            type: 'token' | 'sources' | 'error';
                            token?: string;
                            sources?: Source[];
                            message?: string;
                        };

                        if (event.type === 'sources') {
                            sources = event.sources ?? [];
                        } else if (event.type === 'token' && event.token) {
                            setMessages((prev) => {
                                const updated = [...prev];
                                const last = updated[updated.length - 1];
                                if (last.role === 'assistant') {
                                    updated[updated.length - 1] = {
                                        ...last,
                                        content: last.content + event.token,
                                    };
                                }
                                return updated;
                            });
                        } else if (event.type === 'error') {
                            toast.error(event.message ?? 'Taliye encountered an error');
                            setMessages((prev) => {
                                const updated = [...prev];
                                updated[updated.length - 1] = {
                                    role: 'assistant',
                                    content: 'I encountered an error. Please check your AI settings.',
                                };
                                return updated;
                            });
                        }
                    } catch {
                        // ignore malformed SSE lines
                    }
                }
            }

            // Attach sources to the final assistant message
            if (sources.length > 0) {
                setMessages((prev) => {
                    const updated = [...prev];
                    const last = updated[updated.length - 1];
                    if (last.role === 'assistant') {
                        updated[updated.length - 1] = { ...last, sources };
                    }
                    return updated;
                });
            }
        } catch (err: unknown) {
            if (err instanceof Error && err.name === 'AbortError') return;
            toast.error('Failed to reach Taliye');
            setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                    role: 'assistant',
                    content: 'Connection failed. Make sure your AI provider is configured in Settings.',
                };
                return updated;
            });
        } finally {
            setIsStreaming(false);
            abortRef.current = null;
        }
    }, [input, isStreaming, messages]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const showSuggestions = messages.length === 1 && !isStreaming;

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 p-4 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-2xl transition-all hover:scale-105 z-50 group"
                aria-label="Open Taliye AI Assistant"
            >
                <Sparkles className="w-6 h-6" />
                <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity pointer-events-none">
                    Ask Taliye
                </span>
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 w-[26rem] h-[640px] bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-200">
            {/* Header */}
            <div className="p-4 border-b border-border/50 flex items-center justify-between bg-purple-500/10 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-purple-500 rounded-lg">
                        <BrainCircuit className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm">active_intelligence</h3>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                            Taliye · {isStreaming ? 'Thinking...' : 'Online'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={clearChat}
                        className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors text-muted-foreground hover:text-foreground"
                        title="Clear chat"
                        aria-label="Clear chat history"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
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
                            {/* Streaming cursor on empty last assistant message */}
                            {m.role === 'assistant' && m.content === '' && isStreaming ? (
                                <span className="inline-flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce" />
                                </span>
                            ) : (
                                <p className="whitespace-pre-wrap">{m.content}</p>
                            )}

                            {/* Sources */}
                            {m.sources && m.sources.length > 0 && (
                                <div className="mt-3 pt-2 border-t border-border/10">
                                    <p className="text-[10px] uppercase tracking-wider opacity-40 mb-1.5">Knowledge used</p>
                                    <div className="flex flex-wrap gap-1">
                                        {m.sources.map((s, idx) => (
                                            <div
                                                key={idx}
                                                className="text-[10px] bg-background/50 px-2 py-0.5 rounded-full border border-border/20 flex items-center gap-1"
                                                title={s.preview}
                                            >
                                                <span className="text-purple-400">
                                                    {ENTITY_LABELS[s.entityType ?? ''] ?? 'Item'}
                                                </span>
                                                <span className="opacity-50">·</span>
                                                <span className="opacity-60">
                                                    Relevance {Math.round(s.score * 100)}%
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* Suggested prompts — only shown on fresh chat */}
                {showSuggestions && (
                    <div className="space-y-1.5 pt-2">
                        <p className="text-[11px] text-muted-foreground/60 uppercase tracking-wider px-1">Try asking</p>
                        {SUGGESTED_PROMPTS.map((prompt) => (
                            <button
                                key={prompt}
                                onClick={() => handleSubmit(prompt)}
                                className="w-full text-left text-xs px-3 py-2 rounded-xl bg-muted/40 hover:bg-muted/70 border border-border/30 hover:border-purple-500/30 transition-colors text-muted-foreground hover:text-foreground"
                            >
                                {prompt}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border/50 bg-background/50 backdrop-blur-sm shrink-0">
                <div className="relative">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask about your tasks, goals, notes..."
                        disabled={isStreaming}
                        className="w-full bg-muted/60 border border-border/30 rounded-xl pr-10 py-3 pl-4 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 placeholder:text-muted-foreground/40 disabled:opacity-50"
                    />
                    <button
                        onClick={() => handleSubmit()}
                        disabled={!input.trim() || isStreaming}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        aria-label="Send message"
                    >
                        <Send className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
