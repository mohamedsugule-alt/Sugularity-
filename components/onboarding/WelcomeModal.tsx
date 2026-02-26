'use client';

import { useRouter } from 'next/navigation';
import { useOnboarding } from '@/components/providers/OnboardingProvider';
import { CheckCircle2, ArrowRight, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function WelcomeModal() {
    const { steps, currentStep, isOnboarding, completeStep, skipOnboarding } = useOnboarding();
    const router = useRouter();

    if (!isOnboarding || steps.length === 0) return null;

    const activeStep = steps.find(s => !s.completed) ?? steps[steps.length - 1];
    const completedCount = steps.filter(s => s.completed).length;
    const progress = (completedCount / steps.length) * 100;

    const handleAction = () => {
        router.push(activeStep.route);
    };

    return (
        <AnimatePresence>
            <motion.div
                key="welcome-modal"
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.96 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-40 w-80 glass-panel rounded-2xl shadow-2xl border border-border/60 overflow-hidden"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-violet-500/20 to-blue-500/20 px-4 py-3 flex items-center justify-between border-b border-border/40">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-violet-400" />
                        <span className="text-sm font-semibold text-foreground">Getting Started</span>
                    </div>
                    <button
                        onClick={skipOnboarding}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        title="Skip onboarding"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Progress bar */}
                <div className="h-1 bg-muted/40">
                    <motion.div
                        className="h-full bg-violet-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>

                {/* Steps list */}
                <div className="p-4 space-y-2">
                    {steps.map((step, i) => {
                        const isActive = step.id === activeStep.id;
                        return (
                            <div
                                key={step.id}
                                className={`flex items-start gap-3 p-2.5 rounded-lg transition-colors ${isActive ? 'bg-violet-500/10 border border-violet-500/20' : ''}`}
                            >
                                <div className="mt-0.5 shrink-0">
                                    {step.completed ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    ) : (
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${isActive ? 'border-violet-500 text-violet-500' : 'border-muted-foreground/30 text-muted-foreground/30'}`}>
                                            {i + 1}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-xs font-semibold leading-tight ${step.completed ? 'text-muted-foreground line-through' : isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                                        {step.title}
                                    </p>
                                    {isActive && (
                                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                                            {step.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* CTA */}
                <div className="px-4 pb-4 flex gap-2">
                    <button
                        onClick={handleAction}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                        {activeStep.action}
                        <ArrowRight className="w-3 h-3" />
                    </button>
                    <button
                        onClick={() => completeStep(activeStep.id)}
                        className="px-3 py-2 bg-muted/50 hover:bg-muted text-muted-foreground rounded-lg text-xs font-medium transition-colors"
                        title="Mark as done"
                    >
                        Done
                    </button>
                </div>

                {/* Step counter */}
                <div className="px-4 pb-3 text-[10px] text-muted-foreground text-center">
                    Step {completedCount + 1} of {steps.length} · <button onClick={skipOnboarding} className="hover:text-foreground underline">skip all</button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
