'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Info, AlertCircle, X, BellOff, Check, ArrowRight } from 'lucide-react';
import { checkAutomations } from '@/actions/automations';
import type { AutomationPrompt } from '@/lib/types';

const SNOOZE_KEY = 'taliye-automation-snoozes';
const CHECK_INTERVAL_MS = 5 * 60 * 1000; // re-check every 5 minutes

function getSnoozes(): Record<string, number> {
    try {
        return JSON.parse(localStorage.getItem(SNOOZE_KEY) ?? '{}');
    } catch {
        return {};
    }
}

function setSnooze(name: string, hours: number) {
    const snoozes = getSnoozes();
    snoozes[name] = Date.now() + hours * 3_600_000;
    localStorage.setItem(SNOOZE_KEY, JSON.stringify(snoozes));
}

function isSnoozed(name: string): boolean {
    const snoozes = getSnoozes();
    const until = snoozes[name];
    return !!until && until > Date.now();
}

const SEVERITY_CONFIG = {
    critical: {
        icon: AlertCircle,
        bg: 'bg-red-500/10 border-red-500/30',
        icon_color: 'text-red-400',
        badge: 'bg-red-500/20 text-red-300',
    },
    warning: {
        icon: AlertTriangle,
        bg: 'bg-amber-500/10 border-amber-500/30',
        icon_color: 'text-amber-400',
        badge: 'bg-amber-500/20 text-amber-300',
    },
    info: {
        icon: Info,
        bg: 'bg-blue-500/10 border-blue-500/30',
        icon_color: 'text-blue-400',
        badge: 'bg-blue-500/20 text-blue-300',
    },
};

export function AutomationsPanel() {
    const [prompt, setPrompt] = useState<AutomationPrompt | null>(null);
    const [dismissed, setDismissed] = useState(false);
    const router = useRouter();

    const loadAutomations = useCallback(async () => {
        try {
            const prompts = await checkAutomations();
            // Find first non-snoozed prompt
            const active = prompts.find((p) => !isSnoozed(p.name));
            setPrompt(active ?? null);
            setDismissed(false);
        } catch {
            // Silent — never crash UI for automations
        }
    }, []);

    useEffect(() => {
        loadAutomations();
        const interval = setInterval(loadAutomations, CHECK_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [loadAutomations]);

    const handleAction = useCallback(
        (actionType: string, href?: string) => {
            if (!prompt) return;

            if (actionType === 'snooze') {
                setSnooze(prompt.name, 24);
                setDismissed(true);
                setTimeout(loadAutomations, 300);
            } else if (actionType === 'accept' && href) {
                setDismissed(true);
                router.push(href);
            } else {
                // decline or resolve — just dismiss for this session
                setDismissed(true);
            }
        },
        [prompt, router, loadAutomations]
    );

    if (!prompt || dismissed) return null;

    const config = SEVERITY_CONFIG[prompt.severity];
    const Icon = config.icon;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className={`mb-4 rounded-xl border p-3 flex items-start gap-3 ${config.bg}`}
            >
                <div className={`mt-0.5 shrink-0 ${config.icon_color}`}>
                    <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold leading-none">{prompt.title}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium uppercase tracking-wide ${config.badge}`}>
                            {prompt.severity}
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{prompt.message}</p>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {prompt.actions.map((action, i) => {
                            if (action.action === 'snooze') {
                                return (
                                    <button
                                        key={i}
                                        onClick={() => handleAction('snooze')}
                                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <BellOff className="w-3 h-3" />
                                        {action.label}
                                    </button>
                                );
                            }
                            if (action.action === 'decline') {
                                return (
                                    <button
                                        key={i}
                                        onClick={() => handleAction('decline')}
                                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {action.label}
                                    </button>
                                );
                            }
                            if (action.action === 'resolve') {
                                return (
                                    <button
                                        key={i}
                                        onClick={() => handleAction('resolve', action.href)}
                                        className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:opacity-80 transition-opacity"
                                    >
                                        <Check className="w-3 h-3" />
                                        {action.label}
                                    </button>
                                );
                            }
                            // accept — primary CTA
                            return (
                                <button
                                    key={i}
                                    onClick={() => handleAction('accept', action.href)}
                                    className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 bg-foreground/10 hover:bg-foreground/15 rounded-lg transition-colors"
                                >
                                    {action.label}
                                    <ArrowRight className="w-3 h-3" />
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Close */}
                <button
                    onClick={() => setDismissed(true)}
                    className="shrink-0 mt-0.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                    aria-label="Dismiss"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </motion.div>
        </AnimatePresence>
    );
}
