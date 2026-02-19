import { getBacklogStats } from '@/actions/humanNature';
import { getTasks } from '@/actions/core';
import { BankruptcyClient } from '@/components/bankruptcy/BankruptcyClient';
import { RefreshCw } from 'lucide-react';

export default async function BankruptcyPage() {
    const [stats, tasks] = await Promise.all([
        getBacklogStats(),
        getTasks({ status: ['active', 'scheduled'] }),
    ]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <RefreshCw className="w-8 h-8 text-primary" />
                    Restore Clarity
                </h1>
                <p className="text-muted-foreground mt-1">
                    Reset your backlog. Keep only what matters right now.
                </p>
            </div>

            <BankruptcyClient initialStats={stats} initialTasks={tasks} />
        </div>
    );
}
