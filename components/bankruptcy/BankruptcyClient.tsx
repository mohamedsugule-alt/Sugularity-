'use client';

import { useState } from 'react';
import { executeBankruptcy } from '@/actions/humanNature';
import {
    CheckCircle2,
    ArrowRight,
    AlertTriangle,
    Archive,
    Pause,
    CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';

type Task = {
    id: string;
    title: string;
    status: string;
    estimateMinutes: number | null;
    lastTouchedAt: Date;
    rolloverCount: number;
    area?: { name: string; colorHex: string } | null;
    project?: { title: string } | null;
};

type Stats = {
    counts: {
        active: number;
        cold: number;
        overdue: number;
        blocked: number;
        someday: number;
        inbox: number;
        projects: number;
    };
    limits: {
        activeLimit: number;
        coldLimit: number;
        projectLimit: number;
    };
    needsBankruptcy: boolean;
};

type Step = 'snapshot' | 'select' | 'confirm' | 'done';

export function BankruptcyClient({
    initialStats,
    initialTasks,
}: {
    initialStats: Stats;
    initialTasks: Task[];
}) {
    const [step, setStep] = useState<Step>('snapshot');
    const [tasks] = useState(initialTasks);
    const [decisions, setDecisions] = useState<Record<string, 'keep' | 'someday' | 'archive'>>({});
    const [isExecuting, setIsExecuting] = useState(false);
    const [result, setResult] = useState<any>(null);

    // Sort tasks by priority (rollovers first, then by last touched)
    const sortedTasks = [...tasks].sort((a, b) => {
        if (b.rolloverCount !== a.rolloverCount) return b.rolloverCount - a.rolloverCount;
        return new Date(a.lastTouchedAt).getTime() - new Date(b.lastTouchedAt).getTime();
    });

    const setDecision = (taskId: string, decision: 'keep' | 'someday' | 'archive') => {
        setDecisions({ ...decisions, [taskId]: decision });
    };

    const keepCount = Object.values(decisions).filter((d) => d === 'keep').length;
    const somedayCount = Object.values(decisions).filter((d) => d === 'someday').length;
    const archiveCount = Object.values(decisions).filter((d) => d === 'archive').length;

    const handleExecute = async () => {
        const keepIds = Object.entries(decisions).filter(([, d]) => d === 'keep').map(([id]) => id);
        const somedayIds = Object.entries(decisions).filter(([, d]) => d === 'someday').map(([id]) => id);
        const archiveIds = Object.entries(decisions).filter(([, d]) => d === 'archive').map(([id]) => id);

        setIsExecuting(true);
        try {
            const res = await executeBankruptcy(keepIds, somedayIds, archiveIds);
            setResult(res.afterStats);
            setStep('done');
            toast.success('Clarity restored!');
        } catch (error) {
            toast.error('Failed to process');
        } finally {
            setIsExecuting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Progress */}
            <div className="glass-panel rounded-xl p-4">
                <div className="flex items-center justify-between">
                    {['Before', 'Select', 'Confirm', 'Done'].map((label, idx) => {
                        const stepMap = ['snapshot', 'select', 'confirm', 'done'];
                        const currentIdx = stepMap.indexOf(step);
                        const isActive = idx === currentIdx;
                        const isPast = idx < currentIdx;
                        return (
                            <div
                                key={label}
                                className={`flex items-center gap-2 ${isActive ? 'text-primary' : isPast ? 'text-emerald-500' : 'text-muted-foreground'
                                    }`}
                            >
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${isActive ? 'bg-primary text-primary-foreground' : isPast ? 'bg-emerald-500 text-white' : 'bg-muted'
                                    }`}>
                                    {isPast ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                                </span>
                                <span className="text-sm font-medium hidden sm:block">{label}</span>
                                {idx < 3 && <ArrowRight className="w-4 h-4 text-muted-foreground mx-2 hidden sm:block" />}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Step 1: Snapshot */}
            {step === 'snapshot' && (
                <div className="glass-panel rounded-xl p-6 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold mb-2">Current State</h2>
                        <p className="text-muted-foreground">
                            Your backlog has grown beyond sustainable limits. Let's restore clarity.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-muted/30 rounded-lg text-center">
                            <p className={`text-2xl font-bold ${initialStats.counts.active > initialStats.limits.activeLimit ? 'text-red-500' : ''
                                }`}>
                                {initialStats.counts.active}
                            </p>
                            <p className="text-xs text-muted-foreground">Active Tasks</p>
                            <p className="text-xs text-muted-foreground">Limit: {initialStats.limits.activeLimit}</p>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-lg text-center">
                            <p className={`text-2xl font-bold ${initialStats.counts.cold > initialStats.limits.coldLimit ? 'text-cyan-400' : ''
                                }`}>
                                {initialStats.counts.cold}
                            </p>
                            <p className="text-xs text-muted-foreground">Cold</p>
                            <p className="text-xs text-muted-foreground">Limit: {initialStats.limits.coldLimit}</p>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-lg text-center">
                            <p className="text-2xl font-bold text-red-500">{initialStats.counts.overdue}</p>
                            <p className="text-xs text-muted-foreground">Overdue</p>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-lg text-center">
                            <p className="text-2xl font-bold text-orange-500">{initialStats.counts.blocked}</p>
                            <p className="text-xs text-muted-foreground">Blocked</p>
                        </div>
                    </div>

                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                            <div>
                                <p className="font-medium text-yellow-400">Recommended Action</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Keep 15-20 tasks active. Move the rest to Someday or Archive.
                                    Nothing will be deleted—history is preserved.
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => setStep('select')}
                        className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 flex items-center justify-center gap-2"
                    >
                        Begin Selection
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Step 2: Select */}
            {step === 'select' && (
                <div className="glass-panel rounded-xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold">Select Tasks</h2>
                            <p className="text-sm text-muted-foreground">
                                Choose what stays active. Default: Archive (safe).
                            </p>
                        </div>
                        <div className="text-sm text-right">
                            <p className="text-emerald-500">{keepCount} Keep</p>
                            <p className="text-yellow-500">{somedayCount} Someday</p>
                            <p className="text-muted-foreground">{archiveCount} Archive</p>
                        </div>
                    </div>

                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {sortedTasks.map((task) => {
                            const decision = decisions[task.id] || 'archive';
                            return (
                                <div
                                    key={task.id}
                                    className={`p-3 rounded-lg border transition-colors ${decision === 'keep'
                                            ? 'bg-emerald-500/10 border-emerald-500/30'
                                            : decision === 'someday'
                                                ? 'bg-yellow-500/10 border-yellow-500/30'
                                                : 'bg-muted/30 border-border/30'
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">{task.title}</p>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                {task.area && (
                                                    <span className="flex items-center gap-1">
                                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: task.area.colorHex }} />
                                                        {task.area.name}
                                                    </span>
                                                )}
                                                {task.rolloverCount > 0 && (
                                                    <span className="text-yellow-500">↻{task.rolloverCount}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => setDecision(task.id, 'keep')}
                                                className={`p-1.5 rounded ${decision === 'keep' ? 'bg-emerald-500 text-white' : 'text-muted-foreground hover:bg-muted'}`}
                                                title="Keep Active"
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setDecision(task.id, 'someday')}
                                                className={`p-1.5 rounded ${decision === 'someday' ? 'bg-yellow-500 text-white' : 'text-muted-foreground hover:bg-muted'}`}
                                                title="Move to Someday"
                                            >
                                                <Pause className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setDecision(task.id, 'archive')}
                                                className={`p-1.5 rounded ${decision === 'archive' ? 'bg-muted-foreground text-white' : 'text-muted-foreground hover:bg-muted'}`}
                                                title="Archive"
                                            >
                                                <Archive className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={() => setStep('snapshot')}
                            className="flex-1 py-2 bg-muted/50 hover:bg-muted rounded-lg font-medium transition-colors"
                        >
                            Back
                        </button>
                        <button
                            onClick={() => setStep('confirm')}
                            disabled={keepCount === 0}
                            className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        >
                            Review Changes
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Confirm */}
            {step === 'confirm' && (
                <div className="glass-panel rounded-xl p-6 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold">Confirm Changes</h2>
                        <p className="text-muted-foreground">
                            Review your selections before applying.
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-emerald-500/10 rounded-lg text-center">
                            <p className="text-2xl font-bold text-emerald-500">{keepCount}</p>
                            <p className="text-sm text-muted-foreground">Keep Active</p>
                        </div>
                        <div className="p-4 bg-yellow-500/10 rounded-lg text-center">
                            <p className="text-2xl font-bold text-yellow-500">{somedayCount}</p>
                            <p className="text-sm text-muted-foreground">Move to Someday</p>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-lg text-center">
                            <p className="text-2xl font-bold">{archiveCount}</p>
                            <p className="text-sm text-muted-foreground">Archive</p>
                        </div>
                    </div>

                    <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
                        <p className="text-sm">
                            <strong>This action will:</strong>
                            <br />• Keep {keepCount} tasks active
                            <br />• Move {somedayCount} tasks to Someday
                            <br />• Archive {archiveCount} tasks (history preserved)
                            <br />• Create a bankruptcy record for reference
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setStep('select')}
                            className="flex-1 py-2 bg-muted/50 hover:bg-muted rounded-lg font-medium transition-colors"
                        >
                            Back
                        </button>
                        <button
                            onClick={handleExecute}
                            disabled={isExecuting}
                            className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                        >
                            <CheckCircle className="w-4 h-4" />
                            {isExecuting ? 'Processing...' : 'Restore Clarity'}
                        </button>
                    </div>
                </div>
            )}

            {/* Step 4: Done */}
            {step === 'done' && (
                <div className="glass-panel rounded-xl p-6 text-center space-y-6">
                    <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
                    <div>
                        <h2 className="text-2xl font-semibold">Clarity Restored!</h2>
                        <p className="text-muted-foreground mt-2">
                            Your backlog is now manageable. Focus on what matters.
                        </p>
                    </div>

                    {result && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 bg-muted/30 rounded-lg text-center">
                                <p className="text-2xl font-bold text-emerald-500">{result.counts.active}</p>
                                <p className="text-xs text-muted-foreground">Active Now</p>
                            </div>
                            <div className="p-4 bg-muted/30 rounded-lg text-center">
                                <p className="text-2xl font-bold">{result.counts.someday}</p>
                                <p className="text-xs text-muted-foreground">Someday</p>
                            </div>
                            <div className="p-4 bg-muted/30 rounded-lg text-center">
                                <p className="text-2xl font-bold">{result.counts.cold}</p>
                                <p className="text-xs text-muted-foreground">Cold</p>
                            </div>
                            <div className="p-4 bg-muted/30 rounded-lg text-center">
                                <p className="text-2xl font-bold">{result.counts.inbox}</p>
                                <p className="text-xs text-muted-foreground">Inbox</p>
                            </div>
                        </div>
                    )}

                    <a
                        href="/dashboard"
                        className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                    >
                        Back to Dashboard
                    </a>
                </div>
            )}
        </div>
    );
}
