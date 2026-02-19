'use client';

import { useState } from 'react';
import {
    processInboxItem,
    deleteInboxItem,
} from '@/actions/inbox';
import {
    executeTriageDecision,
    saveWeeklyReview,
    logRitualAction,
} from '@/actions/humanNature';
import {
    CheckCircle2,
    Circle,
    Inbox,
    Trophy,
    BarChart3,
    Snowflake,
    FolderKanban,
    Repeat,
    Calendar,
    ArrowRight,
    ArrowLeft,
    CheckCircle,
    Archive,
    X,
} from 'lucide-react';
import { toast } from 'sonner';
import { ForcedTriageModal } from '@/components/triage/ForcedTriageModal';

type ReviewData = {
    inbox: any[];
    completedThisWeek: any[];
    coldTasks: any[];
    triageTasks: any[];
    projectsAtRisk: { atRisk: any[]; watch: any[] };
    upcomingMilestones: any[];
    ritualsBehind: any[];
    backlogStats: any;
};

type Step =
    | 'inbox'
    | 'wins'
    | 'capacity'
    | 'cleanup'
    | 'projects'
    | 'rituals'
    | 'plan';

const STEPS: { id: Step; label: string; icon: any }[] = [
    { id: 'inbox', label: 'Inbox Zero', icon: Inbox },
    { id: 'wins', label: 'Wins Summary', icon: Trophy },
    { id: 'capacity', label: 'Reality Check', icon: BarChart3 },
    { id: 'cleanup', label: 'Backlog Cleanup', icon: Snowflake },
    { id: 'projects', label: 'Projects Focus', icon: FolderKanban },
    { id: 'rituals', label: 'Rituals Check', icon: Repeat },
    { id: 'plan', label: 'Plan Next Week', icon: Calendar },
];

export function WeeklyReviewClient({
    initialData,
    lastReview,
}: {
    initialData: ReviewData;
    lastReview: any;
}) {
    const [currentStep, setCurrentStep] = useState<Step>('inbox');
    const [data, setData] = useState(initialData);
    const [weeklyNotes, setWeeklyNotes] = useState('');
    const [weeklyOutcomes, setWeeklyOutcomes] = useState(['', '', '']);
    const [selectedShortlist, setSelectedShortlist] = useState<string[]>([]);
    const [triageTask, setTriageTask] = useState<any>(null);
    const [isCompleting, setIsCompleting] = useState(false);

    const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

    const canProceed = () => {
        switch (currentStep) {
            case 'inbox':
                return data.inbox.length === 0;
            case 'cleanup':
                return data.coldTasks.length === 0 && data.triageTasks.length === 0;
            default:
                return true;
        }
    };

    const nextStep = () => {
        const next = STEPS[currentStepIndex + 1];
        if (next) setCurrentStep(next.id);
    };

    const prevStep = () => {
        const prev = STEPS[currentStepIndex - 1];
        if (prev) setCurrentStep(prev.id);
    };

    const handleDeleteInbox = async (id: string) => {
        await deleteInboxItem(id);
        setData({ ...data, inbox: data.inbox.filter((i) => i.id !== id) });
        toast.success('Inbox item deleted');
    };

    const handleArchiveCold = async (taskId: string) => {
        await executeTriageDecision(taskId, { type: 'archive' });
        setData({ ...data, coldTasks: data.coldTasks.filter((t) => t.id !== taskId) });
        toast.success('Task archived');
    };

    const handleSomedayCold = async (taskId: string) => {
        await executeTriageDecision(taskId, { type: 'someday' });
        setData({ ...data, coldTasks: data.coldTasks.filter((t) => t.id !== taskId) });
        toast.success('Moved to Someday');
    };

    const handleLogRitual = async (ritualId: string) => {
        await logRitualAction(ritualId);
        const updated = data.ritualsBehind.map((r) =>
            r.id === ritualId ? { ...r, currentCycleCount: r.currentCycleCount + 1 } : r
        ).filter((r) => r.currentCycleCount < r.targetPerCycle);
        setData({ ...data, ritualsBehind: updated });
        toast.success('Ritual action logged');
    };

    const toggleShortlist = (taskId: string) => {
        if (selectedShortlist.includes(taskId)) {
            setSelectedShortlist(selectedShortlist.filter((id) => id !== taskId));
        } else if (selectedShortlist.length < 15) {
            setSelectedShortlist([...selectedShortlist, taskId]);
        } else {
            toast.error('Maximum 15 tasks for next week');
        }
    };

    const handleCompleteReview = async () => {
        setIsCompleting(true);
        try {
            await saveWeeklyReview({
                notes: weeklyNotes || undefined,
                weeklyOutcomes: weeklyOutcomes.filter((o) => o.trim()),
                shortlistTaskIds: selectedShortlist,
                statsSnapshot: {
                    active: data.backlogStats.counts.active,
                    cold: data.backlogStats.counts.cold,
                    overdue: data.backlogStats.counts.overdue,
                    blocked: data.backlogStats.counts.blocked,
                    inbox: data.backlogStats.counts.inbox,
                    completed: data.completedThisWeek.length,
                },
            });
            toast.success('Weekly review saved!');
            window.location.href = '/dashboard';
        } catch (error) {
            toast.error('Failed to save review');
        } finally {
            setIsCompleting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Progress Steps */}
            <div className="glass-panel rounded-xl p-4">
                <div className="flex items-center justify-between overflow-x-auto gap-2">
                    {STEPS.map((step, idx) => {
                        const isActive = step.id === currentStep;
                        const isPast = idx < currentStepIndex;
                        return (
                            <button
                                key={step.id}
                                onClick={() => setCurrentStep(step.id)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${isActive
                                    ? 'bg-primary text-primary-foreground'
                                    : isPast
                                        ? 'text-emerald-500'
                                        : 'text-muted-foreground'
                                    }`}
                            >
                                {isPast ? (
                                    <CheckCircle2 className="w-4 h-4" />
                                ) : (
                                    <step.icon className="w-4 h-4" />
                                )}
                                {step.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Step Content */}
            <div className="glass-panel rounded-xl p-6 min-h-[400px]">
                {/* Step 1: Inbox Zero */}
                {currentStep === 'inbox' && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Process Your Inbox</h2>
                        <p className="text-muted-foreground">
                            Clear it out or consciously snooze. Don't let items pile up.
                        </p>
                        {data.inbox.length === 0 ? (
                            <div className="text-center py-12">
                                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                                <p className="text-lg font-medium">Inbox Zero!</p>
                                <p className="text-muted-foreground">All items processed.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {data.inbox.map((item) => (
                                    <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                                        <Inbox className="w-4 h-4 text-muted-foreground" />
                                        <span className="flex-1">{item.title}</span>
                                        <button
                                            onClick={() => handleDeleteInbox(item.id)}
                                            className="text-muted-foreground hover:text-red-500 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                <p className="text-sm text-muted-foreground mt-4">
                                    Process remaining items in the <a href="/inbox" className="text-primary hover:underline">Inbox page</a>.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 2: Wins Summary */}
                {currentStep === 'wins' && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">This Week's Wins</h2>
                        <p className="text-muted-foreground">
                            You completed {data.completedThisWeek.length} tasks. Take a moment to acknowledge the progress.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto">
                            {data.completedThisWeek.slice(0, 20).map((item) => (
                                <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                                    <div>
                                        <p className="text-sm line-through text-muted-foreground">{item.title}</p>
                                        <p className="text-xs text-muted-foreground">{item.pillarName}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div>
                            <label className="text-sm font-medium block mb-2">Weekly Notes (optional)</label>
                            <textarea
                                value={weeklyNotes}
                                onChange={(e) => setWeeklyNotes(e.target.value)}
                                placeholder="Any reflections on this week?"
                                className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                                rows={3}
                            />
                        </div>
                    </div>
                )}

                {/* Step 3: Reality Check */}
                {currentStep === 'capacity' && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Reality Check</h2>
                        <p className="text-muted-foreground">
                            Review your backlog health before planning.
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 bg-muted/30 rounded-lg text-center">
                                <p className="text-2xl font-bold">{data.backlogStats.counts.active}</p>
                                <p className="text-sm text-muted-foreground">Active</p>
                            </div>
                            <div className="p-4 bg-muted/30 rounded-lg text-center">
                                <p className="text-2xl font-bold text-cyan-400">{data.backlogStats.counts.cold}</p>
                                <p className="text-sm text-muted-foreground">Cold</p>
                            </div>
                            <div className="p-4 bg-muted/30 rounded-lg text-center">
                                <p className="text-2xl font-bold text-red-500">{data.backlogStats.counts.overdue}</p>
                                <p className="text-sm text-muted-foreground">Overdue</p>
                            </div>
                            <div className="p-4 bg-muted/30 rounded-lg text-center">
                                <p className="text-2xl font-bold text-orange-500">{data.backlogStats.counts.blocked}</p>
                                <p className="text-sm text-muted-foreground">Blocked</p>
                            </div>
                        </div>
                        {data.backlogStats.needsBankruptcy && (
                            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                <p className="text-sm text-yellow-400">
                                    ⚠ Your backlog is overloaded. Consider a <a href="/bankruptcy" className="underline">Restore Clarity</a> session.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 4: Backlog Cleanup */}
                {currentStep === 'cleanup' && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Backlog Cleanup</h2>
                        <p className="text-muted-foreground">
                            Address cold tasks and rollover pressure. Make a decision for each.
                        </p>

                        {data.triageTasks.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="font-medium text-yellow-500">Needs Triage ({data.triageTasks.length})</h3>
                                {data.triageTasks.slice(0, 5).map((task) => (
                                    <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg bg-yellow-500/10">
                                        <span className="flex-1 text-sm">{task.title}</span>
                                        <button
                                            onClick={() => setTriageTask(task)}
                                            className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs font-medium hover:bg-yellow-500/30"
                                        >
                                            Triage
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {data.coldTasks.length > 0 && (
                            <div className="space-y-2 mt-4">
                                <h3 className="font-medium text-cyan-400">Cold Tasks ({data.coldTasks.length})</h3>
                                {data.coldTasks.slice(0, 5).map((task) => (
                                    <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg bg-cyan-500/10">
                                        <span className="flex-1 text-sm">{task.title}</span>
                                        <button
                                            onClick={() => handleSomedayCold(task.id)}
                                            className="px-2 py-1 text-muted-foreground hover:text-foreground text-xs"
                                        >
                                            Someday
                                        </button>
                                        <button
                                            onClick={() => handleArchiveCold(task.id)}
                                            className="px-2 py-1 text-muted-foreground hover:text-foreground text-xs"
                                        >
                                            <Archive className="w-3 h-3" />
                                        </button>
                                        <button
                                            onClick={() => setTriageTask(task)}
                                            className="px-3 py-1 bg-primary/20 text-primary rounded text-xs font-medium hover:bg-primary/30"
                                        >
                                            Decide
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {data.triageTasks.length === 0 && data.coldTasks.length === 0 && (
                            <div className="text-center py-12">
                                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                                <p className="text-lg font-medium">Backlog is Clean!</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 5: Projects Focus */}
                {currentStep === 'projects' && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Projects & Milestones</h2>
                        <p className="text-muted-foreground">
                            Review projects at risk and upcoming milestones.
                        </p>

                        {(data.projectsAtRisk.atRisk.length > 0 || data.projectsAtRisk.watch.length > 0) && (
                            <div className="space-y-2">
                                <h3 className="font-medium text-red-400">Projects Needing Attention</h3>
                                {[...data.projectsAtRisk.atRisk, ...data.projectsAtRisk.watch].map((p) => (
                                    <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                                        <span className="w-2 h-2 rounded-full bg-red-500" />
                                        <span className="flex-1 text-sm">{p.title}</span>
                                        <a href={`/projects/${p.id}`} className="text-xs text-primary hover:underline">
                                            View
                                        </a>
                                    </div>
                                ))}
                            </div>
                        )}

                        {data.upcomingMilestones.length > 0 && (
                            <div className="space-y-2 mt-4">
                                <h3 className="font-medium">Milestones Due (Next 14 Days)</h3>
                                {data.upcomingMilestones.map((m) => (
                                    <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                                        <Circle className="w-4 h-4 text-muted-foreground" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{m.title}</p>
                                            <p className="text-xs text-muted-foreground">{m.project.title}</p>
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {m.targetDate ? new Date(m.targetDate).toLocaleDateString() : ''}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mt-6">
                            <label className="text-sm font-medium block mb-2">Top 1-3 Outcomes for Next Week</label>
                            {weeklyOutcomes.map((outcome, idx) => (
                                <input
                                    key={idx}
                                    type="text"
                                    value={outcome}
                                    onChange={(e) => {
                                        const newOutcomes = [...weeklyOutcomes];
                                        newOutcomes[idx] = e.target.value;
                                        setWeeklyOutcomes(newOutcomes);
                                    }}
                                    placeholder={`Outcome ${idx + 1}...`}
                                    className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm mb-2"
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 6: Rituals Check */}
                {currentStep === 'rituals' && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Rituals Cycle Check</h2>
                        <p className="text-muted-foreground">
                            Review your recurring practices. Log any missed actions.
                        </p>

                        {data.ritualsBehind.length === 0 ? (
                            <div className="text-center py-12">
                                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                                <p className="text-lg font-medium">All Rituals On Track!</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {data.ritualsBehind.map((ritual) => {
                                    const progress = Math.min((ritual.currentCycleCount / ritual.targetPerCycle) * 100, 100);
                                    return (
                                        <div key={ritual.id} className="p-4 rounded-lg bg-muted/30">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium">{ritual.title}</span>
                                                <span className={`text-xs ${ritual.health === 'at_risk' ? 'text-red-400' : 'text-yellow-400'}`}>
                                                    {ritual.health === 'at_risk' ? 'At Risk' : 'Behind'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="flex-1 h-2 bg-muted/50 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${ritual.health === 'at_risk' ? 'bg-red-500' : 'bg-yellow-500'}`}
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm text-muted-foreground">
                                                    {ritual.currentCycleCount}/{ritual.targetPerCycle}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleLogRitual(ritual.id)}
                                                className="px-3 py-1.5 bg-primary/20 text-primary rounded text-sm font-medium hover:bg-primary/30"
                                            >
                                                Log Action (+1)
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Step 7: Plan Next Week */}
                {currentStep === 'plan' && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Plan Next Week</h2>
                        <p className="text-muted-foreground">
                            Select 10-15 tasks for your next 7-day shortlist. ({selectedShortlist.length}/15 selected)
                        </p>

                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                            {/* Show active tasks for selection */}
                            <p className="text-sm text-muted-foreground">
                                Go to the <a href="/today" className="text-primary hover:underline">Today page</a> to schedule specific tasks.
                            </p>
                        </div>

                        <div className="mt-6 pt-4 border-t border-border/30">
                            <button
                                onClick={handleCompleteReview}
                                disabled={isCompleting}
                                className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <CheckCircle className="w-5 h-5" />
                                Complete Weekly Review
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
                <button
                    onClick={prevStep}
                    disabled={currentStepIndex === 0}
                    className="px-4 py-2 bg-muted/50 hover:bg-muted rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Previous
                </button>
                {currentStepIndex < STEPS.length - 1 && (
                    <button
                        onClick={nextStep}
                        disabled={!canProceed()}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 hover:bg-primary/90 transition-colors"
                    >
                        Next
                        <ArrowRight className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Triage Modal */}
            {triageTask && (
                <ForcedTriageModal
                    task={triageTask}
                    onClose={() => setTriageTask(null)}
                    onComplete={() => {
                        setData({
                            ...data,
                            triageTasks: data.triageTasks.filter((t) => t.id !== triageTask.id),
                            coldTasks: data.coldTasks.filter((t) => t.id !== triageTask.id),
                        });
                        setTriageTask(null);
                    }}
                />
            )}
        </div>
    );
}
