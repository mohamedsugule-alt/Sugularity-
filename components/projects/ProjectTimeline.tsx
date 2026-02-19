'use client';

import { useState, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Diamond, CheckCircle2 } from 'lucide-react';

type Task = {
    id: string;
    title: string;
    status: string;
    scheduledDate: Date | null;
    dueDate: Date | null;
    estimateMinutes: number | null;
};

type Milestone = {
    id: string;
    title: string;
    targetDate: Date | null;
    status: string;
};

type ProjectTimelineProps = {
    tasks: Task[];
    milestones: Milestone[];
    projectDeadline?: Date | null;
};

export function ProjectTimeline({ tasks, milestones, projectDeadline }: ProjectTimelineProps) {
    const [viewOffset, setViewOffset] = useState(0); // weeks offset from today

    // Calculate date range (4 weeks view)
    const dateRange = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() + (viewOffset * 7));

        // Start from Monday
        const dayOfWeek = startDate.getDay();
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        startDate.setDate(startDate.getDate() + diff);

        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 27); // 4 weeks

        const days: Date[] = [];
        const current = new Date(startDate);
        while (current <= endDate) {
            days.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }

        return { startDate, endDate, days };
    }, [viewOffset]);

    // Filter tasks with dates
    const scheduledTasks = useMemo(() => {
        return tasks.filter(t => t.scheduledDate || t.dueDate);
    }, [tasks]);

    // Get task position and width
    const getTaskBar = (task: Task) => {
        const start = task.scheduledDate ? new Date(task.scheduledDate) : null;
        const end = task.dueDate ? new Date(task.dueDate) : null;

        if (!start && !end) return null;

        const barStart = start || end!;
        const barEnd = end || new Date(barStart.getTime() + 24 * 60 * 60 * 1000); // 1 day if no end

        // Check if in range
        if (barEnd < dateRange.startDate || barStart > dateRange.endDate) return null;

        const startDiff = Math.max(0, Math.floor((barStart.getTime() - dateRange.startDate.getTime()) / (24 * 60 * 60 * 1000)));
        const endDiff = Math.min(27, Math.floor((barEnd.getTime() - dateRange.startDate.getTime()) / (24 * 60 * 60 * 1000)));

        const left = (startDiff / 28) * 100;
        const width = Math.max(3.5, ((endDiff - startDiff + 1) / 28) * 100);

        return { left, width };
    };

    // Get milestone position
    const getMilestonePosition = (milestone: Milestone) => {
        if (!milestone.targetDate) return null;

        const target = new Date(milestone.targetDate);
        if (target < dateRange.startDate || target > dateRange.endDate) return null;

        const diff = Math.floor((target.getTime() - dateRange.startDate.getTime()) / (24 * 60 * 60 * 1000));
        return (diff / 28) * 100;
    };

    // Get deadline position
    const getDeadlinePosition = () => {
        if (!projectDeadline) return null;

        const deadline = new Date(projectDeadline);
        if (deadline < dateRange.startDate || deadline > dateRange.endDate) return null;

        const diff = Math.floor((deadline.getTime() - dateRange.startDate.getTime()) / (24 * 60 * 60 * 1000));
        return (diff / 28) * 100;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'done': return 'bg-emerald-500';
            case 'active': case 'scheduled': return 'bg-blue-500';
            case 'blocked': return 'bg-red-500';
            default: return 'bg-gray-400';
        }
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayPosition = useMemo(() => {
        if (today < dateRange.startDate || today > dateRange.endDate) return null;
        const diff = Math.floor((today.getTime() - dateRange.startDate.getTime()) / (24 * 60 * 60 * 1000));
        return (diff / 28) * 100;
    }, [dateRange, today]);

    const deadlinePos = getDeadlinePosition();

    // Group days by week for header
    const weeks = useMemo(() => {
        const result: { weekNum: number; days: Date[] }[] = [];
        for (let i = 0; i < 4; i++) {
            const weekDays = dateRange.days.slice(i * 7, (i + 1) * 7);
            const weekNum = getWeekNumber(weekDays[0]);
            result.push({ weekNum, days: weekDays });
        }
        return result;
    }, [dateRange.days]);

    return (
        <div className="glass-panel rounded-xl p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Project Timeline</h3>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setViewOffset(v => v - 4)}
                        className="p-1.5 rounded hover:bg-muted transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setViewOffset(0)}
                        className="px-3 py-1 text-xs rounded hover:bg-muted transition-colors"
                    >
                        Today
                    </button>
                    <button
                        onClick={() => setViewOffset(v => v + 4)}
                        className="p-1.5 rounded hover:bg-muted transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Timeline Header - Week numbers and days */}
            <div className="relative mb-2">
                <div className="grid grid-cols-4 gap-0 text-xs">
                    {weeks.map((week, i) => (
                        <div key={i} className="text-center border-l border-border/30 first:border-l-0">
                            <div className="font-medium text-muted-foreground py-1 border-b border-border/30">
                                Week {week.weekNum}
                            </div>
                            <div className="grid grid-cols-7 gap-0">
                                {week.days.map((day, j) => {
                                    const isToday = day.toDateString() === today.toDateString();
                                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                                    return (
                                        <div
                                            key={j}
                                            className={`py-1 text-center text-[10px] ${isToday ? 'bg-primary/10 text-primary font-bold' : isWeekend ? 'text-muted-foreground/50' : 'text-muted-foreground'}`}
                                        >
                                            {day.getDate()}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Timeline Body */}
            <div className="relative min-h-[200px] border-t border-border/30">
                {/* Today line */}
                {todayPosition !== null && (
                    <div
                        className="absolute top-0 bottom-0 w-0.5 bg-primary/50 z-10"
                        style={{ left: `${todayPosition}%` }}
                    />
                )}

                {/* Deadline line */}
                {deadlinePos !== null && (
                    <div
                        className="absolute top-0 bottom-0 w-0.5 bg-red-500/70 z-10"
                        style={{ left: `${deadlinePos}%` }}
                    >
                        <div className="absolute -top-1 -left-2 px-1 py-0.5 bg-red-500 text-white text-[8px] rounded">
                            DUE
                        </div>
                    </div>
                )}

                {/* Task rows */}
                {scheduledTasks.length === 0 && milestones.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                        No scheduled tasks or milestones. Add dates to see them here.
                    </div>
                ) : (
                    <div className="space-y-2 py-2">
                        {/* Milestones */}
                        {milestones.map(milestone => {
                            const pos = getMilestonePosition(milestone);
                            if (pos === null) return null;
                            const isComplete = milestone.status === 'complete';

                            return (
                                <div key={milestone.id} className="relative h-8 flex items-center">
                                    <div
                                        className="absolute flex items-center gap-1 transform -translate-x-1/2"
                                        style={{ left: `${pos}%` }}
                                    >
                                        <Diamond className={`w-4 h-4 ${isComplete ? 'text-emerald-500 fill-emerald-500' : 'text-amber-500 fill-amber-500'}`} />
                                        <span className="text-xs font-medium whitespace-nowrap bg-background/80 px-1 rounded">
                                            {milestone.title}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Tasks */}
                        {scheduledTasks.map(task => {
                            const bar = getTaskBar(task);
                            if (!bar) return null;

                            return (
                                <div key={task.id} className="relative h-7 flex items-center">
                                    <div
                                        className={`absolute h-5 ${getStatusColor(task.status)} rounded-full flex items-center px-2 text-white text-xs font-medium shadow-sm cursor-pointer hover:opacity-80 transition-opacity overflow-hidden`}
                                        style={{ left: `${bar.left}%`, width: `${bar.width}%`, minWidth: '60px' }}
                                        title={task.title}
                                    >
                                        {task.status === 'done' && <CheckCircle2 className="w-3 h-3 mr-1 flex-shrink-0" />}
                                        <span className="truncate">{task.title}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/30 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span>Active</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span>Done</span>
                </div>
                <div className="flex items-center gap-1">
                    <Diamond className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span>Milestone</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-0.5 bg-primary" />
                    <span>Today</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-0.5 bg-red-500" />
                    <span>Deadline</span>
                </div>
            </div>
        </div>
    );
}

function getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
