'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useOnboarding } from '@/components/providers/OnboardingProvider';
import { CheckCircle2, Circle, ChevronRight, X } from 'lucide-react';

export function OnboardingBanner() {
    const { steps, currentStep, isOnboarding, skipOnboarding } = useOnboarding();
    const pathname = usePathname();

    if (!isOnboarding || steps.length === 0) return null;

    const current = steps.find(s => !s.completed);
    if (!current) return null;

    const isOnCorrectPage = pathname === current.route;

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4">
            <div className="bg-card border border-border rounded-xl shadow-lg p-4">
                {/* Progress dots */}
                <div className="flex items-center justify-center gap-2 mb-3">
                    {steps.map((step, idx) => (
                        <div
                            key={step.id}
                            className={`w-2 h-2 rounded-full transition-colors ${step.completed
                                    ? 'bg-primary'
                                    : step.id === current.id
                                        ? 'bg-primary/50'
                                        : 'bg-muted'
                                }`}
                        />
                    ))}
                </div>

                {/* Content */}
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {currentStep}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm">{current.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {current.description}
                        </p>
                    </div>
                    <button
                        onClick={skipOnboarding}
                        className="p-1 text-muted-foreground hover:text-foreground"
                        title="Skip onboarding"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Action */}
                <div className="mt-3 flex items-center justify-between">
                    {isOnCorrectPage ? (
                        <p className="text-xs text-primary flex items-center gap-1">
                            <Circle className="w-3 h-3" />
                            {current.action}
                        </p>
                    ) : (
                        <Link
                            href={current.route}
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                            Go to {current.route}
                            <ChevronRight className="w-3 h-3" />
                        </Link>
                    )}
                    <span className="text-xs text-muted-foreground">
                        Step {currentStep} of {steps.length}
                    </span>
                </div>
            </div>
        </div>
    );
}
