'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { type LucideIcon } from 'lucide-react';

type EmptyStateProps = {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    actionHref?: string;
    onAction?: () => void;
    color?: string; // tailwind color like 'emerald', 'violet', 'blue', 'amber'
    tip?: string;   // optional tip shown below description
};

const colorMap: Record<string, { bg: string; text: string; border: string; glow: string; gradient: string }> = {
    emerald: {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-500',
        border: 'border-emerald-500/20',
        glow: 'shadow-emerald-500/20',
        gradient: 'from-emerald-500 to-emerald-600',
    },
    violet: {
        bg: 'bg-violet-500/10',
        text: 'text-violet-500',
        border: 'border-violet-500/20',
        glow: 'shadow-violet-500/20',
        gradient: 'from-violet-500 to-violet-600',
    },
    blue: {
        bg: 'bg-blue-500/10',
        text: 'text-blue-500',
        border: 'border-blue-500/20',
        glow: 'shadow-blue-500/20',
        gradient: 'from-blue-500 to-blue-600',
    },
    amber: {
        bg: 'bg-amber-500/10',
        text: 'text-amber-500',
        border: 'border-amber-500/20',
        glow: 'shadow-amber-500/20',
        gradient: 'from-amber-500 to-amber-600',
    },
    rose: {
        bg: 'bg-rose-500/10',
        text: 'text-rose-500',
        border: 'border-rose-500/20',
        glow: 'shadow-rose-500/20',
        gradient: 'from-rose-500 to-rose-600',
    },
    cyan: {
        bg: 'bg-cyan-500/10',
        text: 'text-cyan-500',
        border: 'border-cyan-500/20',
        glow: 'shadow-cyan-500/20',
        gradient: 'from-cyan-500 to-cyan-600',
    },
    orange: {
        bg: 'bg-orange-500/10',
        text: 'text-orange-500',
        border: 'border-orange-500/20',
        glow: 'shadow-orange-500/20',
        gradient: 'from-orange-500 to-orange-600',
    },
};

export function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    actionHref,
    onAction,
    color = 'violet',
    tip,
}: EmptyStateProps) {
    const c = colorMap[color] || colorMap.violet;

    const ActionButton = () => {
        if (!actionLabel) return null;

        const buttonClasses = `inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r ${c.gradient} text-white rounded-xl font-semibold hover:scale-[1.02] active:scale-[0.98] shadow-lg ${c.glow} transition-all duration-200`;

        if (actionHref) {
            return (
                <Link href={actionHref} className={buttonClasses}>
                    {actionLabel}
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                </Link>
            );
        }

        if (onAction) {
            return (
                <button onClick={onAction} className={buttonClasses}>
                    {actionLabel}
                </button>
            );
        }

        return null;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`relative rounded-2xl border-2 border-dashed ${c.border} p-12 md:p-16 text-center overflow-hidden`}
        >
            {/* Subtle gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-muted/30 pointer-events-none" />

            {/* Floating decorative dots */}
            <div className="absolute top-6 left-8 w-2 h-2 rounded-full bg-muted/40 animate-pulse" />
            <div className="absolute top-12 right-12 w-1.5 h-1.5 rounded-full bg-muted/30 animate-pulse" style={{ animationDelay: '0.5s' }} />
            <div className="absolute bottom-10 left-16 w-1 h-1 rounded-full bg-muted/50 animate-pulse" style={{ animationDelay: '1s' }} />

            <div className="relative z-10">
                {/* Icon with ring animation */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="mx-auto mb-5"
                >
                    <div className={`relative w-20 h-20 rounded-2xl ${c.bg} flex items-center justify-center mx-auto`}>
                        <Icon className={`w-10 h-10 ${c.text}`} strokeWidth={1.5} />
                        {/* Animated ring */}
                        <div className={`absolute inset-0 rounded-2xl border ${c.border} animate-ping opacity-20`} />
                    </div>
                </motion.div>

                {/* Title */}
                <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="text-xl font-bold text-foreground"
                >
                    {title}
                </motion.h3>

                {/* Description */}
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                    className="text-muted-foreground mt-3 max-w-md mx-auto leading-relaxed"
                >
                    {description}
                </motion.p>

                {/* Tip */}
                {tip && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4, delay: 0.5 }}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 text-sm text-muted-foreground"
                    >
                        <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                        </svg>
                        {tip}
                    </motion.div>
                )}

                {/* Action button */}
                {actionLabel && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.6 }}
                        className="mt-6"
                    >
                        <ActionButton />
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}
