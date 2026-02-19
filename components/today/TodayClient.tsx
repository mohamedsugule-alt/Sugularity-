'use client';

import { useState, useEffect } from 'react';
import {
    updateTask,
    completeTask,
    createTask, // Added
} from '@/actions/core';
import {
    updateDailyPlan,
    closeDailyPlan,
    addDailyOutcome,
    toggleDailyOutcome,
    deleteDailyOutcome
} from '@/actions/daily-plan';
import {
    rolloverTask,
    touchTask,
} from '@/actions/humanNature';
import { startFocusSession, endFocusSession } from '@/actions/focus';
import {
    CheckCircle2,
    Circle,
    Clock,
    ArrowRight,
    ArrowLeft,
    AlertTriangle,
    Zap,
    BatteryMedium,
    BatteryLow,
    X,
    CalendarCheck,
    Snowflake,
    Play,
    Pause,
    RotateCcw,
    Plus,
    Trash2,
    Link as LinkIcon,
    Sparkles,
    Pencil,
    LayoutGrid,
    LayoutList,
    Columns
} from 'lucide-react';
import { TodayBoard } from './TodayBoard';
import { toast } from 'sonner';
import { StaggerContainer, StaggerItem } from '@/components/ui/motion';
import { ForcedTriageModal } from '@/components/triage/ForcedTriageModal';
import { useOnboarding } from '@/components/providers/OnboardingProvider';
import { useFocus } from '@/components/providers/FocusProvider';
import { MorningBriefing } from './MorningBriefing';
import { EditTaskModal } from '@/components/tasks/EditTaskModal';
import { CalendarClient } from '@/components/calendar/CalendarClient';
import { EnergySelector } from '@/components/tasks/EnergySelector';

type Task = {
    id: string;
    title: string;
    status: string;
    estimateMinutes: number | null;
    energyLevel: string;
    dueDate: Date | null;
    scheduledDate: Date | null;
    rolloverCount: number;
    committedDate: Date | null;
    createdAt: Date; // Added
    completedAt: Date | null; // Added
    lastTouchedAt: Date;
    pillar: { id: string; name: string; colorHex: string } | null;
    project: { id: string; title: string } | null;
    ritual: { id: string; title: string } | null;
};

type DailyOutcome = {
    id: string;
    title: string;
    isComplete: boolean;
    project: { id: string; title: string } | null;
    ritual: { id: string; title: string } | null;
    estimateMinutes?: number;
};

type DailyPlan = {
    id: string;
    date: Date;
    outcomes: string | null;
    dailyOutcomes: DailyOutcome[];
    committedTaskIds: string | null;
    status: string;
};

export function TodayClient({
    initialPlan,
    initialTasks = [],
    agenda,
    triageRequiredTasks = [],
    coldTasks = [],
    projects = [],
    rituals = [],
    pillars = [],
    settings,
    referenceDate,
}: {
    initialPlan: DailyPlan;
    initialTasks: Task[];
    agenda: any; // Type 'Agenda' from actions/calendar but simpler to use any here to avoid dupes or import cycles
    triageRequiredTasks: Task[];
    coldTasks: Task[];
    projects: { id: string; title: string }[];
    rituals: { id: string; title: string }[];
    pillars: { id: string; name: string; colorHex: string }[];
    settings: { dailyCapacityHours: number; defaultEstimateMin: number; showColdInToday: boolean };
    referenceDate: string;
}) {
    const [plan, setPlan] = useState(initialPlan);
    const [tasks, setTasks] = useState(initialTasks);
    // Sync local state with server state for outcomes
    const [dailyOutcomes, setDailyOutcomes] = useState<DailyOutcome[]>(plan.dailyOutcomes || []);

    // Legacy support: if no new outcomes but legacy string exists, maybe prompt? 
    // For now we just use the new system.

    const [committedIds, setCommittedIds] = useState<string[]>(
        plan.committedTaskIds ? JSON.parse(plan.committedTaskIds) : []
    );
    const [showCloseDay, setShowCloseDay] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);
    const [dayStats, setDayStats] = useState({ completed: 0, total: 0, outcomesHit: 0, outcomesTotal: 0, focusMinutes: 0 });
    const [triageTask, setTriageTask] = useState<Task | null>(null);
    const { focusTask, focusTime, focusRunning, startFocus, stopFocusSession, togglePause, formatTime, sessionCount, showBreak, dismissBreak, startNextSession } = useFocus();
    const [showCold, setShowCold] = useState(settings.showColdInToday);
    const [pendingRollovers, setPendingRollovers] = useState<Task[]>([]);

    // Conflict State
    const [conflicts, setConflicts] = useState<{ taskId?: string, message: string, severity: 'warning' | 'critical' }[]>([]);

    const [editingTask, setEditingTask] = useState<Task | null>(null);

    useEffect(() => {
        const checkConflicts = async () => {
            try {
                const { detectConflicts } = await import('@/actions/conflicts');
                const results = await detectConflicts(new Date());
                setConflicts(results);
            } catch (e) {
                console.error("Conflict detection failed", e);
            }
        };
        checkConflicts();
    }, [tasks, committedIds]); // Re-run if tasks change

    // New outcome state
    const [newOutcomeTitle, setNewOutcomeTitle] = useState('');
    const [newOutcomeLink, setNewOutcomeLink] = useState<{ type: 'project' | 'ritual', id: string } | null>(null);
    const [newOutcomeDuration, setNewOutcomeDuration] = useState<string>('30'); // Default 30m
    const [isLinkMenuOpen, setIsLinkMenuOpen] = useState(false);
    const [isAddingOutcome, setIsAddingOutcome] = useState(false);
    const [showBriefing, setShowBriefing] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'schedule' | 'board'>('list');

    // Quick Add State
    const [quickAddText, setQuickAddText] = useState('');
    const [quickAddDate, setQuickAddDate] = useState(referenceDate ? new Date(referenceDate).toISOString().slice(0, 10) : '');
    const [quickAddEnergy, setQuickAddEnergy] = useState('medium');
    const [quickAddPillar, setQuickAddPillar] = useState(pillars[0]?.id || '');
    const [isCreating, setIsCreating] = useState(false);

    const { completeStep } = useOnboarding();

    const today = new Date(referenceDate);
    // today.setHours(0, 0, 0, 0);

    // ... (rest of code)

    const handleAddOutcome = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newOutcomeTitle.trim()) return;

        setIsAddingOutcome(true);
        try {
            await addDailyOutcome(
                today,
                newOutcomeTitle.trim(),
                newOutcomeLink?.type === 'project' ? newOutcomeLink.id : undefined,
                newOutcomeLink?.type === 'ritual' ? newOutcomeLink.id : undefined,
                parseInt(newOutcomeDuration) || 30
            );

            // Optimistically update or just reload page?
            // Since we don't return the created object in the server action easily without full page reload semantic,
            // we'll rely on router refresh or just partial reload.
            // For now, let's just create a temp one to show responsiveness or wait for revalidate.
            // RevalidatePath in action will refresh server components, but client state needs update.
            // Simplest: window.location.reload() or router.refresh() if we had router.

            // Actually, best practice with server actions + client state is to return the new list or item.
            // We'll just hard Reload for now to match other patterns, or better:
            window.location.reload();
        } catch {
            toast.error('Failed to add outcome');
        } finally {
            setNewOutcomeTitle('');
            setNewOutcomeLink(null);
            setIsAddingOutcome(false);
        }
    };

    const handleDeleteOutcome = async (outcomeId: string) => {
        // Optimistic update
        setDailyOutcomes(prev => prev.filter(o => o.id !== outcomeId));
        toast.success('Outcome removed');

        try {
            await deleteDailyOutcome(outcomeId);
        } catch {
            toast.error('Failed to remove outcome');
            // Revert by re-fetching plan or simple reload for now
            // router.refresh();
        }
    };

    // --- DERIVED STATE ---
    const committedTasks = tasks.filter(t => committedIds.includes(t.id));
    const committedMinutes = committedTasks.reduce((acc, t) => acc + (t.estimateMinutes || settings.defaultEstimateMin), 0);
    const capacityPercent = Math.min(100, (committedMinutes / (settings.dailyCapacityHours * 60)) * 100);
    const isOverCapacity = committedMinutes > (settings.dailyCapacityHours * 60);

    const candidates = tasks.filter(t => {
        if (committedIds.includes(t.id) || t.status === 'done') return false;
        // Filter out future scheduled tasks (allow null/undefined)
        if (t.scheduledDate && new Date(t.scheduledDate) > today) return false;
        return true;
    });
    const coldThreshold = new Date(referenceDate);
    coldThreshold.setDate(coldThreshold.getDate() - 3); // 3 days old = cold

    const warmCandidates = candidates.filter(t => {
        if (!showCold) return true;
        const createdDate = new Date(t.createdAt);
        const touchDate = new Date(t.lastTouchedAt);
        const isCold = createdDate < coldThreshold && touchDate < coldThreshold;
        return !isCold;
    });

    // coldCandidates filter if needed? Assuming warm candidates are what's displayed mainly or logic handles it.

    // --- HANDLERS ---
    const handleComplete = async (taskId: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        // Optimistic
        setTasks(tasks.map(t => t.id === taskId ? { ...t, status: 'done', completedAt: new Date() } : t));
        setCommittedIds(committedIds.filter(id => id !== taskId));
        toast.success('Task completed');

        try {
            await completeTask(taskId);
        } catch {
            toast.error('Failed to complete task');
            // Revert on failure? For now just keep optimistic
        }
    };

    const commitTask = async (taskId: string) => {
        if (committedIds.includes(taskId)) return;

        const newIds = [...committedIds, taskId];
        setCommittedIds(newIds);

        try {
            await updateDailyPlan(today, { committedTaskIds: JSON.stringify(newIds) });
            await touchTask(taskId);
        } catch {
            toast.error('Failed to commit task');
            setCommittedIds(committedIds); // Revert
        }
    };

    const uncommitTask = async (taskId: string) => {
        const newIds = committedIds.filter(id => id !== taskId);
        setCommittedIds(newIds);

        try {
            await updateDailyPlan(today, { committedTaskIds: JSON.stringify(newIds) });
        } catch {
            toast.error('Failed to uncommit task');
            setCommittedIds(committedIds); // Revert
        }
    };



    const handleCloseDay = async () => {
        // Capture stats before closing
        const completed = committedTasks.filter(t => t.status === 'done').length;
        const total = committedTasks.length;
        const outcomesHit = dailyOutcomes.filter(o => o.isComplete).length;
        const outcomesTotal = dailyOutcomes.length;
        const focusMinutes = Math.round(focusTime / 60);

        try {
            await closeDailyPlan(new Date((plan as any).date));
            setShowCloseDay(false);
            setDayStats({ completed, total, outcomesHit, outcomesTotal, focusMinutes });
            setShowCelebration(true);
        } catch {
            toast.error("Failed to close day");
        }
    };

    const handleTriageComplete = () => {
        setTriageTask(null);
        setPendingRollovers([]);
    };



    return (
        <div className="space-y-6">
            <div className="glass-panel p-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Today's Outcomes</h2>
                </div>

                <div className="space-y-2 mb-4">
                    {dailyOutcomes.map((outcome, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg group">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                            <span className="text-sm font-medium">{outcome.title}</span>
                            <span className="ml-auto text-xs text-muted-foreground mr-2">{outcome.estimateMinutes || 30}m</span>
                            <button
                                onClick={() => handleDeleteOutcome(outcome.id)}
                                suppressHydrationWarning
                                className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    {dailyOutcomes.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">What are your top wins for today?</p>}
                </div>

                {/* Add New Outcome */}
                {
                    dailyOutcomes.length < 5 && (
                        <form onSubmit={handleAddOutcome} className="flex gap-2 items-center mt-2">
                            <div className="flex-1 flex gap-2">
                                <input
                                    type="text"
                                    suppressHydrationWarning
                                    value={newOutcomeTitle}
                                    onChange={(e) => setNewOutcomeTitle(e.target.value)}
                                    placeholder="Add a daily outcome..."
                                    className="flex-1 bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />

                                <div className="flex items-center gap-1 bg-muted/50 border border-border/50 rounded-lg px-2">
                                    <Clock className="w-3 h-3 text-muted-foreground" />
                                    <input
                                        type="number"
                                        suppressHydrationWarning
                                        value={newOutcomeDuration}
                                        onChange={(e) => setNewOutcomeDuration(e.target.value)}
                                        className="w-8 bg-transparent text-xs focus:outline-none text-center"
                                        placeholder="30"
                                        title="Duration (minutes)"
                                    />
                                    <span className="text-xs text-muted-foreground">m</span>
                                </div>

                                {/* Link Toggle */}
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        suppressHydrationWarning
                                        onClick={() => setIsLinkMenuOpen(!isLinkMenuOpen)}
                                        className={`relative w-10 h-5 rounded-full transition-colors ${isLinkMenuOpen ? 'bg-primary' : 'bg-muted/70'}`}
                                    >
                                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isLinkMenuOpen ? 'translate-x-5' : ''}`} />
                                    </button>
                                    <span className="text-xs text-muted-foreground">Link</span>
                                </div>

                                {/* Link Selection Panel (appears when toggle is ON) */}
                                {isLinkMenuOpen && (
                                    <div className="flex items-center gap-1">
                                        {newOutcomeLink && (
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${newOutcomeLink.type === 'project' ? 'bg-orange-500/10 text-orange-500' : 'bg-cyan-500/10 text-cyan-500'}`}>
                                                {newOutcomeLink.type === 'project'
                                                    ? projects.find(p => p.id === newOutcomeLink.id)?.title
                                                    : rituals.find(s => s.id === newOutcomeLink.id)?.title}
                                            </span>
                                        )}
                                        <div className="relative">
                                            <select
                                                value={newOutcomeLink ? `${newOutcomeLink.type}:${newOutcomeLink.id}` : ''}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (!val) {
                                                        setNewOutcomeLink(null);
                                                    } else {
                                                        const [type, id] = val.split(':');
                                                        setNewOutcomeLink({ type: type as 'project' | 'ritual', id });
                                                    }
                                                }}
                                                className="bg-muted/50 border border-border/50 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
                                            >
                                                <option value="">Select...</option>
                                                <optgroup label="Projects">
                                                    {projects.map(p => (
                                                        <option key={p.id} value={`project:${p.id}`}>{p.title}</option>
                                                    ))}
                                                </optgroup>
                                                <optgroup label="Rituals">
                                                    {rituals.map(s => (
                                                        <option key={s.id} value={`ritual:${s.id}`}>{s.title}</option>
                                                    ))}
                                                </optgroup>
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <button
                                type="submit"
                                suppressHydrationWarning
                                disabled={!newOutcomeTitle.trim() || isAddingOutcome}
                                className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </form>
                    )
                }
            </div>

            {/* Capacity Meter */}
            <div className="glass-panel rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Today's Capacity</span>
                    <span className={`text-sm font-medium ${isOverCapacity ? 'text-red-500' : 'text-muted-foreground'}`}>
                        {Math.round(committedMinutes / 60 * 10) / 10}h / {settings.dailyCapacityHours}h
                    </span>
                </div>
                <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all ${isOverCapacity ? 'bg-red-500' : 'bg-primary'}`}
                        style={{ width: `${capacityPercent}%` }}
                    />
                </div>
                {
                    isOverCapacity && (
                        <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Over capacity. Consider removing tasks.
                        </p>
                    )
                }
            </div>

            {/* Start Engine Button / Placeholder if no outcomes */}
            {
                dailyOutcomes.length === 0 && (
                    <div className="flex justify-center -mt-4 mb-2">
                        <button
                            onClick={() => setShowBriefing(true)}
                            className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-2 rounded-full font-bold shadow-lg shadow-orange-500/20 hover:scale-105 transition-transform flex items-center gap-2 animate-pulse"
                        >
                            <Zap className="w-5 h-5 fill-current" />
                            Start the Engine
                        </button>
                    </div>
                )
            }

            {/* View Toggle */}
            <div className="flex justify-end mb-4">
                <div className="bg-muted p-1 rounded-lg flex items-center">
                    <button
                        onClick={() => setViewMode('list')}
                        suppressHydrationWarning
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        List View
                    </button>
                    <button
                        onClick={() => setViewMode('schedule')}
                        suppressHydrationWarning
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'schedule' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Time Blocking
                    </button>
                </div>
            </div>

            {/* Schedule Mode */}
            {viewMode === 'schedule' ? (
                <div className="glass-panel p-4 rounded-xl">
                    <CalendarClient
                        initialDate={today.toISOString()}
                        agenda={agenda}
                        weeklyAgenda={undefined}
                        calendarMode="default"
                        currentView="day"
                        pillars={pillars}
                    />
                </div>
            ) : (
                /* Two Column Layout (Task Lists) */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Conflict Banner */}
                    {conflicts.length > 0 && (
                        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-4 animate-in slide-in-from-top-2">
                            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-bold text-red-500 mb-1">Schedule Conflicts Detected</h3>
                                <ul className="text-sm text-red-400/90 space-y-1 list-disc list-inside">
                                    {conflicts.slice(0, 3).map((c, i) => (
                                        <li key={i}>
                                            {c.taskId
                                                ? tasks.find(t => t.id === c.taskId)?.title || 'Unknown Task'
                                                : 'General Issue'}
                                            : <span className="text-foreground/80"> {c.message}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Committed */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-semibold">Committed</h2>
                                <div className="flex items-center bg-muted/50 p-0.5 rounded-lg border border-border/50 ml-2">
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-1 rounded-md transition-colors ${viewMode === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                        title="List View"
                                    >
                                        <LayoutList className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('board')}
                                        className={`p-1 rounded-md transition-colors ${viewMode === 'board' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                        title="Energy Board"
                                    >
                                        <Columns className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                            <span className="text-sm text-muted-foreground">{committedTasks.length} tasks</span>
                        </div>
                        {viewMode === 'board' ? (
                            <TodayBoard
                                tasks={committedTasks}
                                onUpdateTask={(id, updates) => setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))}
                            />
                        ) : (
                            <StaggerContainer className="space-y-2">
                                {committedTasks.length === 0 ? (
                                    <div className="glass-panel rounded-xl p-8 text-center text-muted-foreground">
                                        <p>No tasks committed yet.</p>
                                        <p className="text-sm mt-1">Move tasks from Candidates →</p>
                                    </div>
                                ) : (
                                    committedTasks.map((task) => {
                                        const conflict = conflicts.find(c => c.taskId === task.id);
                                        return (
                                            <StaggerItem
                                                key={task.id}
                                                className={`glass-panel rounded-lg p-3 flex items-start gap-3 group transition-all duration-300 ${conflict ? 'border-red-500/50 bg-red-500/5 shadow-[0_0_15px_-3px_rgba(239,68,68,0.2)]' : ''}`}
                                            >
                                                <button
                                                    onClick={() => handleComplete(task.id)}
                                                    className="mt-0.5 text-muted-foreground hover:text-primary transition-colors"
                                                >
                                                    <Circle className="w-5 h-5" />
                                                </button>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <p className="font-medium text-sm">{task.title}</p>
                                                        {conflict && (
                                                            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider animate-pulse">
                                                                Conflict
                                                            </span>
                                                        )}
                                                    </div>

                                                    {conflict && (
                                                        <p className="text-xs text-red-400 mt-1 font-medium flex items-center gap-1">
                                                            <AlertTriangle className="w-3 h-3" />
                                                            {conflict.message}
                                                        </p>
                                                    )}

                                                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                        {task.pillar && (
                                                            <span className="flex items-center gap-1">
                                                                <span
                                                                    className="w-2 h-2 rounded-full"
                                                                    style={{ backgroundColor: task.pillar.colorHex }}
                                                                />
                                                                {task.pillar.name}
                                                            </span>
                                                        )}
                                                        {task.estimateMinutes && (
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {task.estimateMinutes}m
                                                            </span>
                                                        )}
                                                        <EnergySelector
                                                            taskId={task.id}
                                                            currentLevel={task.energyLevel}
                                                            onUpdate={(l) => setTasks(tasks.map(t => t.id === task.id ? { ...t, energyLevel: l } : t))}
                                                        />
                                                        {task.rolloverCount > 0 && (
                                                            <span className="text-yellow-500">
                                                                ↻{task.rolloverCount}
                                                            </span>
                                                        )}
                                                        {task.scheduledDate && (
                                                            <span className="text-blue-400">
                                                                @{new Date(task.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => setEditingTask(task)}
                                                        className="p-1 text-muted-foreground hover:text-primary"
                                                        title="Edit"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => startFocus(task)}
                                                        className="p-1 text-muted-foreground hover:text-primary"
                                                        title="Focus"
                                                    >
                                                        <Play className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => uncommitTask(task.id)}
                                                        className="p-1 text-muted-foreground hover:text-foreground"
                                                        title="Uncommit"
                                                    >
                                                        <ArrowRight className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </StaggerItem>
                                        )
                                    })
                                )}
                            </StaggerContainer>
                        )}
                    </div >

                    {/* Candidates */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">Candidates</h2>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={async () => {
                                        const toastId = toast.loading('Taliye is thinking...');
                                        try {
                                            const { generateDailyPlan } = await import('@/actions/scheduler');
                                            const result = await generateDailyPlan(new Date());
                                            // Store result in state to show modal (need to add state hook first)
                                            // For now, simpler implementation:
                                            if (confirm(`Taliye suggests ${result.tasks.suggested.length + result.tasks.mustDo.length} tasks (${Math.round(result.totalMinutes / 60 * 10) / 10}h). \n\nMust Do: ${result.tasks.mustDo.length}\nSuggested: ${result.tasks.suggested.length}\n\nAccept Plan?`)) {
                                                const { commitAutoPlan } = await import('@/actions/scheduler');
                                                await commitAutoPlan(new Date(), result.selectedTaskIds);
                                                toast.success('Plan applied!', { id: toastId });
                                                window.location.reload();
                                            } else {
                                                toast.dismiss(toastId);
                                            }
                                        } catch (e) {
                                            toast.error('Auto-Plan failed', { id: toastId });
                                        }
                                    }}
                                    className="px-3 py-1 bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 rounded-lg text-xs font-medium border border-purple-500/20 flex items-center gap-1.5 transition-colors"
                                >
                                    <Sparkles className="w-3 h-3" />
                                    Auto-Plan
                                </button>
                                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <input
                                        type="checkbox"
                                        checked={showCold}
                                        onChange={(e) => setShowCold(e.target.checked)}
                                        className="w-3 h-3"
                                    />
                                    <Snowflake className="w-3 h-3" />
                                    <ColdLabel />
                                </label>
                                <span className="text-sm text-muted-foreground">{warmCandidates.length} tasks</span>
                            </div>
                        </div>


                        {/* Quick Add Task */}
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                if (!quickAddText.trim() || !quickAddPillar) return;
                                setIsCreating(true);
                                try {
                                    const newTask = await createTask({
                                        title: quickAddText.trim(),
                                        pillarId: quickAddPillar,
                                        scheduledDate: quickAddDate ? new Date(quickAddDate) : null,
                                        energyLevel: quickAddEnergy,
                                        status: 'active'
                                    });
                                    setTasks([newTask as any, ...tasks]); // Type cast helper
                                    setQuickAddText('');
                                    toast.success('Task created');
                                } catch (error) {
                                    toast.error('Failed to create task');
                                } finally {
                                    setIsCreating(false);
                                }
                            }}
                            className="glass-panel p-3 rounded-xl mb-4"
                        >
                            <div className="flex flex-col gap-2">
                                <input
                                    type="text"
                                    value={quickAddText}
                                    onChange={(e) => setQuickAddText(e.target.value)}
                                    placeholder="Add new task..."
                                    className="w-full bg-transparent border-none text-sm focus:outline-none placeholder:text-muted-foreground"
                                    disabled={isCreating}
                                />
                                <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                                    <input
                                        type="date"
                                        value={quickAddDate}
                                        onChange={(e) => setQuickAddDate(e.target.value)}
                                        className="bg-muted/50 border border-border/50 rounded px-2 py-1 text-xs"
                                    />
                                    <select
                                        value={quickAddEnergy}
                                        onChange={(e) => setQuickAddEnergy(e.target.value)}
                                        className="bg-muted/50 border border-border/50 rounded px-2 py-1 text-xs"
                                    >
                                        <option value="low">Low Energy</option>
                                        <option value="medium">Medium Energy</option>
                                        <option value="high">High Energy</option>
                                    </select>
                                    <select
                                        value={quickAddPillar}
                                        onChange={(e) => setQuickAddPillar(e.target.value)}
                                        className="bg-muted/50 border border-border/50 rounded px-2 py-1 text-xs max-w-[100px]"
                                    >
                                        {pillars.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                    <div className="flex-1" />
                                    <button
                                        type="submit"
                                        disabled={!quickAddText.trim() || isCreating}
                                        className="bg-primary text-primary-foreground px-3 py-1 rounded text-xs font-medium hover:bg-primary/90 disabled:opacity-50"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                        </form>

                        <StaggerContainer className="space-y-2 max-h-[500px] overflow-y-auto">
                            {warmCandidates.length === 0 ? (
                                <div className="glass-panel rounded-xl p-8 text-center text-muted-foreground">
                                    <p>No candidate tasks.</p>
                                    <p className="text-sm mt-1">Create tasks from Inbox or Projects.</p>
                                </div>
                            ) : (
                                warmCandidates.map((task) => {
                                    const isCold = new Date(task.lastTouchedAt) < coldThreshold;
                                    return (
                                        <StaggerItem
                                            key={task.id}
                                            className={`glass-panel rounded-lg p-3 flex items-start gap-3 group ${isCold ? 'border-cyan-500/30' : ''}`}
                                        >
                                            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => commitTask(task.id)}
                                                    className="text-muted-foreground hover:text-primary transition-all"
                                                    title="Commit to Today"
                                                >
                                                    <ArrowLeft className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setEditingTask(task)}
                                                    className="text-muted-foreground hover:text-primary transition-all"
                                                    title="Edit"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm">{task.title}</p>
                                                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                    {task.pillar && (
                                                        <span className="flex items-center gap-1">
                                                            <span
                                                                className="w-2 h-2 rounded-full"
                                                                style={{ backgroundColor: task.pillar.colorHex }}
                                                            />
                                                            {task.pillar.name}
                                                        </span>
                                                    )}
                                                    {task.project && (
                                                        <span className="truncate">{task.project.title}</span>
                                                    )}
                                                    <EnergySelector
                                                        taskId={task.id}
                                                        currentLevel={task.energyLevel}
                                                        onUpdate={(l) => setTasks(tasks.map(t => t.id === task.id ? { ...t, energyLevel: l } : t))}
                                                    />
                                                    {isCold && (
                                                        <span className="text-cyan-400 flex items-center gap-1">
                                                            <Snowflake className="w-3 h-3" />
                                                            Cold
                                                        </span>
                                                    )}
                                                    {task.dueDate && new Date(task.dueDate) < today && (
                                                        <span className="text-red-500">Overdue</span>
                                                    )}
                                                </div>
                                            </div>
                                        </StaggerItem>
                                    );
                                })
                            )}
                        </StaggerContainer>
                    </div >
                </div >
            )
            }

            {/* Close Day Button */}
            <div className="flex justify-end">
                <button
                    onClick={() => setShowCloseDay(true)}
                    className="px-4 py-2 bg-muted/50 hover:bg-muted text-foreground rounded-lg font-medium flex items-center gap-2 transition-colors"
                >
                    <CalendarCheck className="w-4 h-4" />
                    Close Day
                </button>
            </div >

            {/* Close Day Modal */}
            {
                showCloseDay && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="glass-panel rounded-xl p-6 max-w-md w-full">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Close Day</h3>
                                <button onClick={() => setShowCloseDay(false)} className="text-muted-foreground hover:text-foreground">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {committedTasks.filter((t) => t.status !== 'done').length > 0 ? (
                                <>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        You have {committedTasks.filter((t) => t.status !== 'done').length} uncommitted tasks.
                                    </p>
                                    {committedTasks.some((t) => t.rolloverCount >= 1) && (
                                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg mb-4">
                                            <p className="text-sm text-yellow-400">
                                                {committedTasks.filter((t) => t.rolloverCount >= 1).length} task(s) require triage before closing.
                                            </p>
                                        </div>
                                    )}
                                    <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                                        {committedTasks.filter((t) => t.status !== 'done').map((task) => (
                                            <div key={task.id} className="p-2 bg-muted/30 rounded text-sm flex items-center gap-2">
                                                {task.rolloverCount >= 1 ? (
                                                    <AlertTriangle className="w-3 h-3 text-yellow-500" />
                                                ) : (
                                                    <RotateCcw className="w-3 h-3 text-muted-foreground" />
                                                )}
                                                {task.title}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <p className="text-sm text-muted-foreground mb-4">
                                    All committed tasks completed! Great work.
                                </p>
                            )}


                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowCloseDay(false)}
                                    className="flex-1 py-2 bg-muted/50 hover:bg-muted rounded-lg font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCloseDay}
                                    className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                                >
                                    Close Day
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* 🎉 Day Celebration Modal */}
            {
                showCelebration && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        {/* Floating particles */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            {Array.from({ length: 20 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute w-2 h-2 rounded-full animate-bounce"
                                    style={{
                                        left: `${Math.random() * 100}%`,
                                        top: `${Math.random() * 100}%`,
                                        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'][i % 6],
                                        animationDelay: `${Math.random() * 2}s`,
                                        animationDuration: `${1.5 + Math.random() * 2}s`,
                                        opacity: 0.6,
                                    }}
                                />
                            ))}
                        </div>

                        <div className="relative glass-panel rounded-3xl p-8 max-w-md w-full text-center animate-in zoom-in-95 duration-300">
                            <div className="text-6xl mb-4">{dayStats.completed === dayStats.total && dayStats.total > 0 ? '🏆' : '🌙'}</div>
                            <h2 className="text-2xl font-bold mb-1">
                                {dayStats.completed === dayStats.total && dayStats.total > 0 ? 'Perfect Day!' : 'Day Complete!'}
                            </h2>
                            <p className="text-muted-foreground mb-6">
                                {dayStats.completed === dayStats.total && dayStats.total > 0
                                    ? 'You crushed every task today. Legend.'
                                    : 'Another day of progress. Every step counts.'}
                            </p>

                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="p-4 rounded-2xl bg-emerald-500/10">
                                    <p className="text-2xl font-bold text-emerald-500">{dayStats.completed}/{dayStats.total}</p>
                                    <p className="text-xs text-muted-foreground mt-1">Tasks Done</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-violet-500/10">
                                    <p className="text-2xl font-bold text-violet-500">{dayStats.outcomesHit}/{dayStats.outcomesTotal}</p>
                                    <p className="text-xs text-muted-foreground mt-1">Outcomes</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-blue-500/10">
                                    <p className="text-2xl font-bold text-blue-500">{dayStats.focusMinutes}m</p>
                                    <p className="text-xs text-muted-foreground mt-1">Focused</p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <a
                                    href="/archive"
                                    className="flex-1 py-3 bg-muted/50 hover:bg-muted rounded-xl font-medium transition-colors text-center"
                                >
                                    View Archive
                                </a>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors"
                                >
                                    Plan Tomorrow →
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Focus Mode Overlay */}
            {
                focusTask && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                        <div className="glass-panel rounded-xl p-8 max-w-lg w-full text-center">
                            <button
                                onClick={async () => {
                                    if (focusRunning) await stopFocusSession();
                                    else await stopFocusSession(); // ensure it closes
                                }}
                                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            <h2 className="text-2xl font-bold mb-2">{focusTask.title}</h2>
                            {focusTask.pillar && (
                                <p className="text-muted-foreground mb-6">
                                    {focusTask.pillar.name}
                                    {focusTask.project && ` → ${focusTask.project.title}`}
                                </p>
                            )}

                            <div className="text-6xl font-mono font-bold text-primary mb-8">
                                {formatTime(focusTime)}
                            </div>

                            {/* Session Counter Badge */}
                            {sessionCount > 0 && (
                                <div className="flex items-center justify-center gap-2 mb-4">
                                    <div className="bg-violet-500/20 text-violet-400 px-3 py-1 rounded-full text-sm font-medium">
                                        🔥 Session {sessionCount} complete
                                    </div>
                                </div>
                            )}

                            {/* Break Reminder */}
                            {showBreak && (
                                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-4 animate-in fade-in">
                                    <p className="text-emerald-400 font-semibold mb-1">☕ Time for a break!</p>
                                    <p className="text-sm text-muted-foreground mb-3">You&apos;ve been focused for {sessionCount} session{sessionCount !== 1 ? 's' : ''}. Step away for 5 minutes.</p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={startNextSession}
                                            className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                                        >
                                            Start Next Session
                                        </button>
                                        <button
                                            onClick={dismissBreak}
                                            className="flex-1 py-2 bg-muted/50 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
                                        >
                                            Dismiss
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-center gap-4">
                                <button
                                    onClick={togglePause}
                                    className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2 hover:bg-primary/90"
                                >
                                    {focusRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                                    {focusRunning ? 'Pause' : 'Resume'}
                                </button>
                                <button
                                    onClick={async () => {
                                        await handleComplete(focusTask.id);
                                        await stopFocusSession();
                                    }}
                                    className="px-6 py-3 bg-emerald-500 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-emerald-600"
                                >
                                    <CheckCircle2 className="w-5 h-5" />
                                    Complete
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Triage Modal */}
            {
                triageTask && (
                    <ForcedTriageModal
                        task={triageTask}
                        onClose={() => {
                            setTriageTask(null);
                            setPendingRollovers([]);
                        }}
                        onComplete={pendingRollovers.length > 0 ? handleTriageComplete : () => {
                            setTasks(tasks.filter((t) => t.id !== triageTask.id));
                            setCommittedIds(committedIds.filter((id) => id !== triageTask.id));
                            setTriageTask(null);
                        }}
                    />
                )
            }

            {/* Morning Briefing Modal */}
            {
                showBriefing && (
                    <MorningBriefing onClose={() => setShowBriefing(false)} />
                )
            }

            {/* Edit Task Modal */}
            {
                editingTask && (
                    <EditTaskModal
                        task={{
                            ...editingTask,
                            completedAt: editingTask.completedAt || null
                        }}
                        isOpen={!!editingTask}
                        onClose={() => setEditingTask(null)}
                    />
                )
            }
        </div >
    );
}

function ColdLabel() {
    return <span>Cold</span>;
}

function EnergyIcon({ level }: { level: string }) {
    if (!level) return null;
    const colors: Record<string, string> = {
        high: 'text-green-500',
        medium: 'text-yellow-500',
        low: 'text-red-500'
    };
    return <Zap className={`w-3 h-3 ${colors[level] || 'text-muted-foreground'}`} />;
}
