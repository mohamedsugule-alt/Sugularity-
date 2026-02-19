'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { startFocusSession, endFocusSession } from '@/actions/focus';
import { Play, Pause, X, CheckCircle2 } from 'lucide-react';
import { usePathname } from 'next/navigation';

type Task = {
    id: string;
    title: string;
    estimateMinutes: number | null;
    [key: string]: any;
};

type FocusContextType = {
    focusTask: Task | null;
    focusTime: number; // Seconds remaining
    focusRunning: boolean;
    sessionCount: number;
    showBreak: boolean;
    startFocus: (task: Task) => Promise<void>;
    stopFocusSession: () => Promise<void>;
    togglePause: () => Promise<void>;
    completeFocusTask: () => Promise<void>;
    formatTime: (seconds: number) => string;
    dismissBreak: () => void;
    startNextSession: () => void;
};

const FocusContext = createContext<FocusContextType | null>(null);

export function useFocus() {
    const context = useContext(FocusContext);
    if (!context) throw new Error('useFocus must be used within a FocusProvider');
    return context;
}

export function FocusProvider({ children }: { children: ReactNode }) {
    const [focusTask, setFocusTask] = useState<Task | null>(null);
    const [focusTime, setFocusTime] = useState(0);
    const [focusRunning, setFocusRunning] = useState(false);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [focusEndTime, setFocusEndTime] = useState<number | null>(null);
    const [sessionCount, setSessionCount] = useState(0);
    const [showBreak, setShowBreak] = useState(false);
    const pathname = usePathname();

    // Timer Logic (Timestamp based)
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (focusRunning && focusEndTime) {
            interval = setInterval(() => {
                const now = Date.now();
                const diff = focusEndTime - now;
                const secondsRemaining = Math.max(0, Math.ceil(diff / 1000));

                setFocusTime(secondsRemaining);

                if (secondsRemaining <= 0) {
                    const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
                    audio.volume = 0.5;
                    audio.play().catch(e => console.error("Audio play failed", e));
                    setFocusRunning(false);
                    setFocusEndTime(null);
                    setSessionCount(prev => prev + 1);
                    setShowBreak(true);
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [focusRunning, focusEndTime]);

    const startFocus = async (task: Task) => {
        // If switching tasks, end previous session
        if (activeSessionId) await stopFocusSession();

        setFocusTask(task);
        const durationMinutes = task.estimateMinutes || 25;
        const durationSeconds = durationMinutes * 60;

        setFocusTime(durationSeconds);
        setFocusEndTime(Date.now() + durationSeconds * 1000);
        setFocusRunning(true);
        setShowBreak(false);

        try {
            const session = await startFocusSession(task.id);
            setActiveSessionId(session.id);
        } catch {
            toast.error('Failed to start focus session');
        }
    };

    const stopFocusSession = async () => {
        if (activeSessionId) {
            await endFocusSession(activeSessionId);
            setActiveSessionId(null);
        }
        setFocusRunning(false);
        setFocusEndTime(null);
        setFocusTask(null);
        setSessionCount(0);
        setShowBreak(false);
    };

    const togglePause = async () => {
        if (focusRunning) {
            // Pause
            setFocusRunning(false);
            setFocusEndTime(null);
        } else {
            // Resume
            setFocusRunning(true);
            setFocusEndTime(Date.now() + focusTime * 1000);

            // Optionally restart session tracking on resume if needed
            if (focusTask && !activeSessionId) {
                const session = await startFocusSession(focusTask.id);
                setActiveSessionId(session.id);
            }
        }
    };

    const completeFocusTask = async () => {
        if (!focusTask) return;
        // Logic handled by consumer (TodayClient) usually, but we can emit event or just stop timer
        // ideally we call the server action here if we want global completion
        await stopFocusSession();
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const dismissBreak = () => setShowBreak(false);

    const startNextSession = () => {
        if (!focusTask) return;
        const durationSeconds = (focusTask.estimateMinutes || 25) * 60;
        setFocusTime(durationSeconds);
        setFocusEndTime(Date.now() + durationSeconds * 1000);
        setFocusRunning(true);
        setShowBreak(false);
    };

    return (
        <FocusContext.Provider value={{
            focusTask,
            focusTime,
            focusRunning,
            sessionCount,
            showBreak,
            startFocus,
            stopFocusSession,
            togglePause,
            completeFocusTask,
            formatTime,
            dismissBreak,
            startNextSession,
        }}>
            {children}

            {/* Global Mini-Timer (Visible on all pages except Today which has its own overlay) */}
            {focusTask && pathname !== '/today' && (
                <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in">
                    <div className="bg-background/80 backdrop-blur-md border border-border shadow-2xl rounded-2xl p-4 w-72 flex flex-col gap-3">
                        <div className="flex items-start justify-between">
                            <div>
                                <h4 className="font-semibold text-sm truncate w-48">{focusTask.title}</h4>
                                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                                    {formatTime(focusTime)}
                                </p>
                            </div>
                            <button
                                onClick={stopFocusSession}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={togglePause}
                                className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                            >
                                {focusRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                                {focusRunning ? 'Pause' : 'Resume'}
                            </button>
                            <button disabled className="bg-emerald-500/10 text-emerald-500 py-1.5 rounded-lg text-xs font-medium px-3 opacity-50 cursor-not-allowed">
                                <CheckCircle2 className="w-3 h-3" />
                            </button>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-1 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all duration-1000"
                                style={{ width: `${Math.min(100, (focusTime / ((focusTask.estimateMinutes || 25) * 60)) * 100)}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </FocusContext.Provider>
    );
}
