import { getGoalsWithHealth } from '@/actions/goals';
import { getPillars } from '@/actions/core';
import { GoalsClient } from '@/components/goals/GoalsClient';
import { Target, Compass } from 'lucide-react';

export default async function GoalsPage() {
    const [goals, pillars] = await Promise.all([
        getGoalsWithHealth(),
        getPillars(),
    ]);

    return (
        <div className="space-y-6">
            {/* Distinctive header for Goals */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 p-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-emerald-500/20">
                        <Target className="w-8 h-8 text-emerald-500" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                            Goals
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            <strong>Long-term direction</strong> — What you want to achieve this year. Each goal can have multiple projects and streams contributing to it.
                        </p>
                    </div>
                </div>
                <Compass className="absolute right-4 bottom-4 w-24 h-24 text-emerald-500/10" />
            </div>

            <GoalsClient initialGoals={goals} pillars={pillars} />
        </div>
    );
}
