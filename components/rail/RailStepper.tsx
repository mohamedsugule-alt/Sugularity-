"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle, PlayCircle } from 'lucide-react';

const steps = [
    { id: 1, name: 'Start', path: '/rail/wake' },
    { id: 2, name: 'Briefing', path: '/rail/briefing' },
    { id: 3, name: 'Vortex', path: '/rail/vortex' },
    { id: 4, name: 'Plan', path: '/rail/plan' },
    { id: 5, name: 'Execute', path: '/rail/execute' },
    { id: 6, name: 'Wrap-Up', path: '/rail/wrap' },
    { id: 7, name: 'Log', path: '/rail/log' },
    { id: 8, name: 'Finish', path: '/rail/shutdown' },
];

export function RailStepper() {
    const pathname = usePathname();

    // Find current step index
    const currentStepIndex = steps.findIndex(s => pathname.startsWith(s.path));

    return (
        <div className="w-64 h-full border-r bg-card flex flex-col">
            <div className="p-6">
                <h1 className="text-xl font-bold tracking-tight text-primary">DAILY SEQUENCE</h1>
            </div>

            <div className="flex-1 px-4 py-2 space-y-4">
                {steps.map((step, index) => {
                    const isActive = index === currentStepIndex;
                    const isCompleted = index < currentStepIndex;

                    return (
                        <div key={step.id} className="relative flex items-center gap-3">
                            {/* Connector Line */}
                            {index !== steps.length - 1 && (
                                <div className={cn(
                                    "absolute left-[11px] top-7 w-[2px] h-6 bg-muted",
                                    isCompleted && "bg-primary/50"
                                )} />
                            )}

                            <div className={cn(
                                "z-10 bg-card rounded-full transition-colors duration-300",
                                isActive && "text-primary scale-110",
                                isCompleted && "text-muted-foreground",
                                !isActive && !isCompleted && "text-muted-foreground/30"
                            )}>
                                {isCompleted ? <CheckCircle2 className="w-6 h-6" /> :
                                    isActive ? <PlayCircle className="w-6 h-6 fill-primary/10" /> :
                                        <Circle className="w-6 h-6" />}
                            </div>

                            <div className={cn(
                                "text-sm font-medium transition-colors duration-300",
                                isActive ? "text-primary font-bold" : "text-muted-foreground"
                            )}>
                                {step.name}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="p-4 bg-muted/20 border-t">
                <Link href="/today" className="text-xs text-muted-foreground hover:underline">
                    Exit to Dashboard
                </Link>
            </div>
        </div>
    );
}
