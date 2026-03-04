'use client';

import { useState, useEffect } from 'react';
import { createTimeBlock, checkTimeBlockConflicts, removeTimeBlock, checkCalendarLinks, updateTaskTime } from '@/actions/calendar';
import { createTask } from '@/actions/core';
import {
    DndContext, // restore
    DragEndEvent,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
    useDraggable,
    useDroppable,
} from '@dnd-kit/core';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Clock,
    AlertTriangle,
    X,
    Plus,
    RefreshCw,
    ExternalLink,
    LayoutGrid,
    LayoutList,
    Target,
    Palette // Added for theme button
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import { applyPastelTheme } from '@/actions/theme'; // Added

// type BusyBlock = { ... } (Removed)

type TaskBlock = {
    id: string;
    title: string;
    startTime?: string;
    endTime?: string;
    pillarColor?: string;
    projectTitle?: string;
    calendarLinkBroken: boolean;
    energyLevel?: string; // Added
};

type UnscheduledTask = {
    id: string;
    title: string;
    estimateMinutes?: number | null;
    pillarColor?: string;
    scheduledDate?: string;
    energyLevel?: string; // Added
};

type Milestone = {
    id: string;
    title: string;
    targetDate: string;
    projectTitle?: string;
};

type Agenda = {
    // busyBlocks: BusyBlock[]; (Removed)
    taskBlocks: TaskBlock[];
    unscheduledTasks: UnscheduledTask[]; // Scheduled for today, but no time block
    backlogTasks: UnscheduledTask[];     // No date at all
    milestones: Milestone[];
    rituals: {
        id: string;
        title: string;
        pillarColor?: string;
        isCompleted: boolean;
        entryId?: string;
    }[];
};

function DraggableTaskBlock({ task, style, onClick }: { task: TaskBlock, style: React.CSSProperties, onClick: () => void }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: task.id,
        data: { task, originalStartTime: task.startTime }
    });

    const dragStyle = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
        opacity: 0.8,
    } : undefined;

    const priorityColor = task.energyLevel === 'high' ? 'border-l-4 border-l-red-500' :
        task.energyLevel === 'medium' ? 'border-l-4 border-l-blue-400' :
            ''; // Low doesn't need special border, simpler look

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={`absolute left-8 right-8 rounded-lg px-3 py-2 text-sm border shadow-sm cursor-grab active:cursor-grabbing ${task.calendarLinkBroken
                ? 'bg-red-500/10 border-red-500/30'
                : 'bg-primary/10 border-primary/30'
                } ${isDragging ? 'ring-2 ring-primary ring-offset-2' : ''} ${priorityColor}`}
            style={{ ...style, ...dragStyle }}
        >
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 pointer-events-none overflow-hidden">
                    {task.pillarColor && <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: task.pillarColor }} />}
                    <span className="font-medium truncate">{task.title}</span>
                    {task.calendarLinkBroken && <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />}
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); onClick(); }}
                    className="text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
                    onPointerDown={(e) => e.stopPropagation()} // Prevent drag start on close button
                >
                    <X className="w-3 h-3" />
                </button>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5 pointer-events-none" suppressHydrationWarning>
                {new Date(task.startTime!).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </div>
        </div>
    );
}

function DraggableSidebarItem({ task, onClick }: { task: UnscheduledTask, onClick: () => void }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: task.id,
        data: { task, type: 'sidebar' }
    });

    const dragStyle = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
        opacity: 0.9,
    } : undefined;

    return (
        <button
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            onClick={onClick}
            style={dragStyle}
            className={`w-full text-left p-3 bg-muted/30 hover:bg-muted/50 rounded-lg text-sm group transition-colors border border-transparent hover:border-primary/20 ${isDragging ? 'ring-2 ring-primary bg-background shadow-lg' : ''} touch-none ${task.energyLevel === 'high' ? 'border-l-2 border-l-red-500' :
                task.energyLevel === 'medium' ? 'border-l-2 border-l-blue-400' : ''
                }`}
        >
            <div className="flex items-center gap-2 mb-1 pointer-events-none">
                {task.pillarColor && (
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: task.pillarColor }} />
                )}
                <span className="font-medium line-clamp-2">{task.title}</span>
            </div>
            {task.estimateMinutes && (
                <span className="text-xs text-muted-foreground flex items-center gap-1 pointer-events-none">
                    <Clock className="w-3 h-3" /> {task.estimateMinutes}m
                </span>
            )}
        </button>
    );
}

// Droppable Timeline Wrapper
function DroppableTimeline({ children, height }: { children: React.ReactNode, height: string }) {
    const { setNodeRef, isOver } = useDroppable({
        id: 'timeline',
    });

    return (
        <div
            ref={setNodeRef}
            className={`min-w-[800px] relative transition-colors ${isOver ? 'bg-primary/5' : ''}`}
            style={{ height }}
        >
            {children}
        </div>
    );
}

export function CalendarClient({
    initialDate,
    agenda,
    weeklyAgenda,
    calendarMode,
    currentView,
    pillars,
}: {
    initialDate: string;
    agenda: Agenda; // Day data
    weeklyAgenda?: Agenda; // Week data (optional)
    calendarMode: string;
    currentView: 'day' | 'week';
    pillars: { id: string; name: string; colorHex: string }[];
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [selectedDate, setSelectedDate] = useState(new Date(initialDate));

    // Sync local state with props if they change (e.g. navigation)
    useEffect(() => {
        setSelectedDate(new Date(initialDate));
    }, [initialDate]);

    const [showTimeBlock, setShowTimeBlock] = useState(false);
    const [selectedTask, setSelectedTask] = useState<UnscheduledTask | null>(null);
    const [blockConfig, setBlockConfig] = useState({
        startTime: '09:00',
        duration: 30,
    });
    const [conflicts, setConflicts] = useState<any[]>([]);
    const [isBlocking, setIsBlocking] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [sidebarTab, setSidebarTab] = useState<'today' | 'backlog'>('today');

    // New Task State
    const [showCreateTask, setShowCreateTask] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskPillarId, setNewTaskPillarId] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Initialize default pillar to empty string (optional)
    useEffect(() => {
        // Removed forced default pillar ID to allow optional pillar
    }, [pillars, newTaskPillarId]);

    const hours = Array.from({ length: 14 }, (_, i) => i + 6); // 6am to 8pm

    // Generate week days
    const getWeekDays = (date: Date) => {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        // Adjust to Monday? Or Sunday? Let's assume Monday start for Sugularity
        // Or better: use current selection as pivot? 
        // Standard: Start of week containing date.
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        const monday = new Date(start.setDate(diff));

        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            return d;
        });
    };

    const weekDays = getWeekDays(selectedDate);

    const getBlockPosition = (startTime: string, endTime: string) => {
        const start = new Date(startTime);
        const end = new Date(endTime);
        const startHour = start.getHours() + start.getMinutes() / 60;
        const endHour = end.getHours() + end.getMinutes() / 60;
        const top = (startHour - 6) * 60; // 60px per hour, starting at 6am
        const height = (endHour - startHour) * 60;
        return { top: `${top}px`, height: `${Math.max(height, 20)}px` };
    };

    const handleNavigate = (direction: 'prev' | 'next') => {
        const newDate = new Date(selectedDate);
        if (currentView === 'week') {
            newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        } else {
            newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        }

        // Update URL
        const params = new URLSearchParams(searchParams);
        params.set('date', newDate.toISOString());
        router.push(`?${params.toString()}`);
    };

    const toggleView = (view: 'day' | 'week') => {
        const params = new URLSearchParams(searchParams);
        params.set('view', view);
        // Reset date to start of week if switching to week? Or keep selected.
        router.push(`?${params.toString()}`);
    };

    // Time Blocking Logic (Same as before, mainly for Day View)
    const handleStartTimeBlock = async (task: UnscheduledTask) => {
        setSelectedTask(task);
        setBlockConfig({
            startTime: '09:00',
            duration: task.estimateMinutes || 30,
        });
        const result = await checkTimeBlockConflicts(selectedDate, '09:00', task.estimateMinutes || 30);
        setConflicts(result.conflictingBlocks);
        setShowTimeBlock(true);
    };

    const handleCheckConflicts = async () => {
        if (!selectedTask) return;
        const result = await checkTimeBlockConflicts(selectedDate, blockConfig.startTime, blockConfig.duration);
        setConflicts(result.conflictingBlocks);
    };

    const handleConfirmBlock = async () => {
        if (!selectedTask) return;
        setIsBlocking(true);
        try {
            await createTimeBlock({
                taskId: selectedTask.id,
                date: selectedDate,
                startTime: blockConfig.startTime,
                duration: blockConfig.duration,
            });
            toast.success('Task time-blocked!');
            setShowTimeBlock(false);
            router.refresh();
        } catch {
            toast.error('Failed to create time block');
        } finally {
            setIsBlocking(false);
        }
    };

    const handleRemoveBlock = async (taskId: string) => {
        try {
            await removeTimeBlock(taskId);
            toast.success('Time block removed');
            router.refresh();
        } catch {
            toast.error('Failed to remove block');
        }
    };

    const handleCheckLinks = async () => {
        setIsChecking(true);
        try {
            const results = await checkCalendarLinks();
            const broken = results.filter(r => r.broken).length;
            if (broken > 0) toast.warning(`${broken} broken links found`);
            else toast.success('All calendar links valid');
        } catch {
            toast.error('Failed to check links');
        } finally {
            setIsChecking(false);
        }
    };

    const formatTime = (isoString: string) => {
        return new Date(isoString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;
        setIsCreating(true);
        try {
            await createTask({
                title: newTaskTitle.trim(),
                pillarId: newTaskPillarId || undefined,
                scheduledDate: selectedDate,
                estimateMinutes: 30,
            });
            toast.success('Task created for ' + selectedDate.toLocaleDateString());
            setNewTaskTitle('');
            setShowCreateTask(false);
            router.refresh();
        } catch {
            toast.error('Failed to create task. (Missing Pillar?)');
        } finally {
            setIsCreating(false);
        }
    };

    // Dnd Sensors
    // Switching to PointerSensor for better compatibility with hybrid touch/mouse devices (like Yoga 7i)
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8 // Requires 8px movement to start drag, allowing clicks to pass through
            }
        })
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over, delta } = event;
        const taskData = active.data.current as { task: TaskBlock | UnscheduledTask, originalStartTime?: string, type?: string };

        if (!taskData) return;

        // CASE 1: Re-scheduling existing block (Relative Move)
        if (taskData.originalStartTime) {
            const minutesDelta = Math.round(delta.y / 15) * 15; // Snap to 15m
            if (minutesDelta === 0) return;

            const originalStart = new Date(taskData.originalStartTime);
            const newStart = new Date(originalStart.getTime() + minutesDelta * 60 * 1000);

            try {
                // Determine duration
                let duration = 30;
                if ('startTime' in taskData.task && taskData.task.startTime && taskData.task.endTime) {
                    const s = new Date(taskData.task.startTime);
                    const e = new Date(taskData.task.endTime);
                    duration = (e.getTime() - s.getTime()) / 60000;
                }

                await updateTaskTime(
                    taskData.task.id,
                    newStart,
                    newStart.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
                    duration
                );
                toast.success('Rescheduled');
            } catch (err) {
                toast.error('Failed to move task');
            }
        }
        // CASE 2: Dragging from Sidebar (Absolute Drop)
        else if (taskData.type === 'sidebar' && over && over.id === 'timeline') {
            const activeRect = active.rect.current.translated;
            const overRect = over.rect;

            if (activeRect && overRect) {
                const relativeY = activeRect.top - overRect.top;
                const offset = currentView === 'week' ? 40 : 0;
                const pixelsFromSixAm = relativeY - offset;
                const hoursFromSixAm = pixelsFromSixAm / 60;
                let hour = 6 + hoursFromSixAm;

                // Snap to 15 mins
                hour = Math.round(hour * 4) / 4;

                // Construct Time
                const newDate = new Date(selectedDate);
                newDate.setHours(Math.floor(hour), (hour % 1) * 60, 0, 0);

                try {
                    const duration = (taskData.task as UnscheduledTask).estimateMinutes || 30;

                    await createTimeBlock({
                        taskId: taskData.task.id,
                        date: selectedDate,
                        startTime: newDate.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
                        duration: duration
                    });
                    toast.success('Task Scheduled');
                } catch (e) {
                    toast.error('Failed to schedule task');
                }
            }
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-muted/50 rounded-lg p-1">
                        <button
                            onClick={() => toggleView('day')}
                            suppressHydrationWarning
                            className={`p-2 rounded-md transition-colors ${currentView === 'day' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            title="Day View"
                        >
                            <LayoutList className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => toggleView('week')}
                            suppressHydrationWarning
                            className={`p-2 rounded-md transition-colors ${currentView === 'week' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            title="Week View"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button onClick={() => handleNavigate('prev')} className="p-2 hover:bg-muted rounded-lg" suppressHydrationWarning>
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h2 className="text-xl font-semibold min-w-[200px] text-center" suppressHydrationWarning>
                            {currentView === 'day'
                                ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
                                : `Week of ${weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                            }
                        </h2>
                        <button onClick={() => handleNavigate('next')} className="p-2 hover:bg-muted rounded-lg" suppressHydrationWarning>
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setShowCreateTask(true)}
                        className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm flex items-center gap-2 hover:bg-primary/90 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Task
                    </button>
                    <button
                        onClick={handleCheckLinks}
                        disabled={isChecking}
                        className="px-3 py-1.5 bg-muted/50 hover:bg-muted rounded-lg text-sm flex items-center gap-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
                        Sync Check
                    </button>
                    <button
                        onClick={async () => {
                            toast.promise(applyPastelTheme(), {
                                loading: 'Applying Aesthetic Theme...',
                                success: 'Theme Applied! 🎨',
                                error: 'Failed to apply theme'
                            });
                        }}
                        className="px-3 py-1.5 bg-pink-100 text-pink-700 hover:bg-pink-200 rounded-lg text-sm flex items-center gap-2 transition-colors border border-pink-200"
                        title="Apply Pastel Theme"
                    >
                        <Palette className="w-4 h-4" />
                        Theme
                    </button>
                </div>
            </div>

            {/* Main View */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Timeline Panel */}
                <div className={`glass-panel rounded-xl overflow-hidden ${currentView === 'week' ? 'col-span-4' : 'lg:col-span-3'}`}>
                    <div className="p-4 border-b border-border/50 flex justify-between items-center">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            {currentView === 'day' ? 'Timeline' : 'Weekly Overview'}
                        </h3>
                    </div>

                    <div className="relative overflow-x-auto">
                        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                            <DroppableTimeline height={`${14 * 60 + 40 + 40}px`}>

                                {/* Header Row for Week View */}
                                {currentView === 'week' && (
                                    <div className="absolute top-0 left-12 right-0 flex border-b border-border/50 h-10 bg-muted/20 z-10">
                                        {weekDays.map(day => (
                                            <div
                                                key={day.toISOString()}
                                                suppressHydrationWarning
                                                className={`flex-1 flex items-center justify-center text-sm font-medium border-r border-border/30 last:border-r-0 ${day.toDateString() === new Date().toDateString() ? 'bg-primary/5 text-primary' : ''
                                                    }`}
                                            >
                                                {day.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* All Day / Milestones Section */}
                                <div className="absolute left-12 right-0 top-10 h-10 border-b border-border/50 bg-muted/10 z-20 flex">
                                    {currentView === 'day' ? (
                                        <div className="w-full h-full flex items-center px-2 gap-2 overflow-x-auto">
                                            <span className="text-[10px] uppercase font-bold text-muted-foreground mr-2 tracking-wider">All Day</span>
                                            {/* Day Milestones */}
                                            {agenda.milestones.map(m => (
                                                <div key={m.id} className="flex items-center gap-1 bg-indigo-500/10 text-indigo-500 px-2 py-1 rounded text-xs border border-indigo-500/20 whitespace-nowrap" title={`Milestone: ${m.title} (${m.projectTitle})`}>
                                                    <Target className="w-3 h-3" />
                                                    <span className="font-medium">{m.title}</span>
                                                </div>
                                            ))}
                                            {/* Day Unscheduled Tasks (Just counters or list if space permits?) - In Day View they are in sidebar, so maybe minimal here? */}
                                            {/* Actually, let's keep them in sidebar for Day View to avoid duplication, or show 'Unscheduled' only? */}
                                            {/* Let's stick to milestones for Day View All Day row for now to keep it clean, as tasks are in sidebar */}
                                        </div>
                                    ) : (
                                        // WEEK VIEW COLLUMNS FOR ALL DAY
                                        weekDays.map(day => {
                                            const dayStr = day.toDateString();
                                            const dayMilestones = (weeklyAgenda?.milestones || []).filter(m => new Date(m.targetDate).toDateString() === dayStr) || [];
                                            const dayUnscheduled = (weeklyAgenda?.unscheduledTasks || []).filter(t => true) // The filtering logic is tricky because unscheduledTasks in week view response usually ALREADY filtered by range? 
                                                // Wait, getWeeklyAgenda returns 'unscheduledTasks' which are tasks with scheduledDate in range but no time block.
                                                // So we just need to match dates.
                                                .filter(t => true) || []; // We need date in UnscheduledTask type... Wait, looking at page.tsx, serialized 'unscheduledTasks' DOES NOT have date! 
                                            // Correct. 'unscheduledTasks' in 'weeklyAgenda' in page.tsx maps 't.title' etc but NOT scheduledDate. 
                                            // I need to add 'scheduledDate' to UnscheduledTask in CalendarClient and page.tsx to map this correctly.
                                            // For now, I will optimistically add logic assuming date is there, but I must fix page.tsx first or this will be empty/buggy.
                                            // Actually, let's look at page.tsx again. No date mapped. 
                                            // Blocked: I need to add 'scheduledDate' to serialization in page.tsx first.

                                            return (
                                                <div key={dayStr} className="flex-1 border-r border-border/30 last:border-r-0 h-full p-1 overflow-y-auto space-y-1">
                                                    {dayMilestones.map(m => (
                                                        <div key={m.id} className="flex items-center gap-1 bg-indigo-500/10 text-indigo-500 px-1 py-0.5 rounded-[4px] text-[10px] border border-indigo-500/20 truncate" title={m.title}>
                                                            <Target className="w-3 h-3 shrink-0" />
                                                            <span className="truncate">{m.title}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                {/* Time Labels */}
                                {hours.map(hour => (
                                    <div
                                        key={hour}
                                        className="absolute left-0 w-12 text-right pr-2 text-xs text-muted-foreground"
                                        style={{ top: `${(hour - 6) * 60 + (currentView === 'week' ? 40 : 0)}px` }}
                                    >
                                        {hour === 12 ? '12pm' : hour > 12 ? `${hour - 12}pm` : `${hour}am`}
                                    </div>
                                ))}

                                {/* Horizontal Lines */}
                                {hours.map(hour => (
                                    <div
                                        key={`line-${hour}`}
                                        className="absolute left-12 right-0 border-t border-border/30"
                                        style={{ top: `${(hour - 6) * 60 + (currentView === 'week' ? 40 : 0)}px` }}
                                    />
                                ))}

                                {/* Day View Content */}
                                {currentView === 'day' && (
                                    <div className="absolute left-12 right-0 top-0 bottom-0">
                                        {/* Busy Blocks (Removed) */}
                                        {/*
                                        {agenda.busyBlocks.map(block => (
                                            <div
                                                key={block.id}
                                                className="absolute left-2 right-4 bg-muted/60 border border-border/50 rounded px-2 py-1 text-xs overflow-hidden"
                                                style={getBlockPosition(block.startTime, block.endTime)}
                                            >
                                                <span className="opacity-70">{block.eventTitle || 'Busy'}</span>
                                            </div>
                                        ))}
                                        */}

                                        {/* Task Blocks */}
                                        {agenda.taskBlocks.map(task => task.startTime && task.endTime && (
                                            <DraggableTaskBlock
                                                key={task.id}
                                                task={task}
                                                style={getBlockPosition(task.startTime, task.endTime)}
                                                onClick={() => handleRemoveBlock(task.id)}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Week View Content */}
                                {currentView === 'week' && weeklyAgenda && (
                                    <div className="absolute left-12 right-0 top-10 bottom-0 flex">
                                        {weekDays.map((day, i) => {
                                            const dayStr = day.toDateString();
                                            // Filter blocks for this day
                                            // const dayBusy = weeklyAgenda.busyBlocks.filter(b => new Date(b.startTime).toDateString() === dayStr);
                                            const dayTasks = weeklyAgenda.taskBlocks.filter(t => t.startTime && new Date(t.startTime).toDateString() === dayStr);

                                            return (
                                                <div key={dayStr} className="flex-1 relative border-r border-border/30 last:border-r-0 h-full">
                                                    {/* Busy Blocks (Removed) */}
                                                    {/*
                                                    {dayBusy.map(block => (
                                                        <div
                                                            key={block.id}
                                                            className="absolute left-0.5 right-0.5 bg-muted/40 border border-border/30 rounded-sm text-[10px] px-1 overflow-hidden"
                                                            style={getBlockPosition(block.startTime, block.endTime)}
                                                        >
                                                            {block.eventTitle}
                                                        </div>
                                                    ))}
                                                    */}

                                                    {dayTasks.map(task => task.startTime && task.endTime && (
                                                        <div
                                                            key={task.id}
                                                            suppressHydrationWarning
                                                            className="absolute left-1 right-1 rounded px-1.5 py-1 text-xs border bg-primary/20 border-primary/30 overflow-hidden hover:z-10 hover:shadow-lg transition-all"
                                                            style={getBlockPosition(task.startTime, task.endTime)}
                                                            title={`${task.title} (${formatTime(task.startTime)} - ${formatTime(task.endTime)})`}
                                                        >
                                                            <div className="font-medium truncate leading-tight">{task.title}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </DroppableTimeline>
                        </DndContext>
                    </div>
                </div>

                {/* Sidebar (Day View Only) */}
                {currentView === 'day' && (
                    <div className="glass-panel rounded-xl p-4 lg:col-span-1 h-fit flex flex-col max-h-[calc(100vh-200px)]">
                        <div className="flex bg-muted/50 p-1 rounded-lg mb-4 flex-shrink-0">
                            <button
                                onClick={() => setSidebarTab('today')}
                                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${sidebarTab === 'today' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Today ({agenda.unscheduledTasks.length})
                            </button>
                            <button
                                onClick={() => setSidebarTab('backlog')}
                                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${sidebarTab === 'backlog' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Backlog ({agenda.backlogTasks?.length || 0})
                            </button>
                        </div>

                        <div className="space-y-2 overflow-y-auto pr-1 flex-1">
                            {(sidebarTab === 'today' ? agenda.unscheduledTasks : (agenda.backlogTasks || [])).map(task => (
                                <DraggableSidebarItem
                                    key={task.id}
                                    task={task}
                                    onClick={() => handleStartTimeBlock(task)}
                                />
                            ))}
                            {(sidebarTab === 'today' ? agenda.unscheduledTasks : (agenda.backlogTasks || [])).length === 0 && (
                                <p className="text-xs text-muted-foreground text-center py-8">
                                    {sidebarTab === 'today' ? 'All scheduled tasks blocked!' : 'No backlog tasks found.'}
                                </p>
                            )}

                            {/* Rituals / Habits Section */}
                            {sidebarTab === 'today' && agenda.rituals && agenda.rituals.length > 0 && (
                                <div className="mt-6 border-t border-border/50 pt-4">
                                    <h4 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                                        <div className="w-1 h-1 rounded-full bg-primary" />
                                        DAILY RITUALS
                                    </h4>
                                    <div className="space-y-2">
                                        {agenda.rituals.map(ritual => (
                                            <div
                                                key={ritual.id}
                                                className={`flex items-center gap-3 p-2 rounded-lg text-sm transition-all ${ritual.isCompleted
                                                    ? 'bg-primary/5 text-muted-foreground opacity-70'
                                                    : 'hover:bg-muted/50'
                                                    }`}
                                            >
                                                <button
                                                    onClick={async () => {
                                                        // Toggle
                                                        const { toggleRitualEntry } = await import('@/actions/rituals'); // Import dynamically to avoid top-level issues if any
                                                        await toggleRitualEntry(ritual.id, selectedDate, ritual.isCompleted ? 'missed' : 'completed');
                                                    }}
                                                    className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${ritual.isCompleted
                                                        ? 'bg-primary border-primary text-primary-foreground'
                                                        : 'border-muted-foreground/30 hover:border-primary'
                                                        }`}
                                                >
                                                    {ritual.isCompleted && <div className="w-2.5 h-2.5 bg-current rounded-[1px]" />}
                                                </button>
                                                <span className={`${ritual.isCompleted ? 'line-through' : ''}`}>
                                                    {ritual.title}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            {
                showCreateTask && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="glass-panel rounded-xl p-6 max-w-sm w-full">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold">Plan Task</h3>
                                <button onClick={() => setShowCreateTask(false)}><X className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={handleCreateTask} className="space-y-4">
                                <div>
                                    <label className="text-xs font-medium block mb-1">Title</label>
                                    <input
                                        type="text"
                                        value={newTaskTitle}
                                        onChange={(e) => setNewTaskTitle(e.target.value)}
                                        placeholder="What do you need to do?"
                                        className="w-full bg-muted/50 border border-border/50 rounded p-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium block mb-1">Date</label>
                                    <div className="p-2 bg-muted/30 rounded text-sm text-muted-foreground">
                                        {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-medium block mb-1">Pillar</label>
                                    <select
                                        value={newTaskPillarId}
                                        onChange={(e) => setNewTaskPillarId(e.target.value)}
                                        className="w-full bg-muted/50 border border-border/50 rounded p-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                                    >
                                        <option value="">No Pillar</option>
                                        {pillars.map(pillar => (
                                            <option key={pillar.id} value={pillar.id}>{pillar.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    type="submit"
                                    disabled={!newTaskTitle.trim() || isCreating}
                                    className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 disabled:opacity-50"
                                >
                                    {isCreating ? 'Creating...' : 'Create Task'}
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }

            {
                showTimeBlock && selectedTask && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="glass-panel rounded-xl p-6 max-w-sm w-full">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold">Block Time</h3>
                                <button onClick={() => setShowTimeBlock(false)}><X className="w-5 h-5" /></button>
                            </div>
                            <div className="space-y-4">
                                <p className="font-medium text-sm bg-muted/30 p-2 rounded">{selectedTask?.title}</p>

                                {conflicts.length > 0 && (
                                    <div className="text-xs text-yellow-500 bg-yellow-500/10 p-2 rounded border border-yellow-500/20">
                                        Conflict: {conflicts[0].title}
                                    </div>
                                )}

                                <div>
                                    <label className="text-xs font-medium block mb-1">Start</label>
                                    <input
                                        type="time"
                                        value={blockConfig.startTime}
                                        onChange={e => setBlockConfig({ ...blockConfig, startTime: e.target.value })}
                                        onBlur={handleCheckConflicts}
                                        className="w-full bg-muted/50 border border-border/50 rounded p-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium block mb-1">Duration (min)</label>
                                    <input
                                        type="number"
                                        value={blockConfig.duration}
                                        onChange={e => setBlockConfig({ ...blockConfig, duration: parseInt(e.target.value) || 15 })}
                                        onBlur={handleCheckConflicts}
                                        className="w-full bg-muted/50 border border-border/50 rounded p-2 text-sm"
                                    />
                                </div>
                                <button
                                    onClick={handleConfirmBlock}
                                    disabled={isBlocking}
                                    className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm"
                                >
                                    {conflicts.length > 0 ? 'Force Block' : 'Confirm'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
