import { getRituals, getPillars } from '@/actions/core';
import { RitualsClient } from '@/components/rituals/RitualsClient';
import { Repeat, Activity } from 'lucide-react';

export default async function RitualsPage() {
    const [rituals, pillars] = await Promise.all([
        getRituals(),
        getPillars(),
    ]);

    return (
        <div className="space-y-6">
            {/* Distinctive header for Rituals */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500/10 via-cyan-500/5 to-transparent border border-cyan-500/20 p-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-cyan-500/20">
                        <Repeat className="w-8 h-8 text-cyan-500" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-cyan-600 dark:text-cyan-400">
                            Rituals
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            <strong>Recurring habits</strong> — Things you do regularly (workout 4x/week, read daily). Cycles reset, progress compounds over time.
                        </p>
                    </div>
                </div>
                <Activity className="absolute right-4 bottom-4 w-24 h-24 text-cyan-500/10" />
            </div>

            <RitualsClient initialRituals={rituals as any} pillars={pillars} />
        </div>
    );
}
