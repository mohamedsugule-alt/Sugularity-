'use client';

import { useState, useRef, useEffect } from 'react';
import {
    DndContext,
    DragOverlay,
    useSensor,
    useSensors,
    PointerSensor,
    TouchSensor,
    closestCorners,
    DragEndEvent,
    DragStartEvent
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
    arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { updateTask, deleteTask, createTask } from '@/actions/core';
import { reorderTasks } from '@/actions/tasks';
import { toast } from 'sonner';
import { Search, Plus, MoreVertical, Pencil, Archive, Trash2, Clock, MoveRight } from 'lucide-react';
import { EditTaskModal } from './EditTaskModal';

type Task = {
    id: string;
    title: string;
    status: string;
    energyLevel: string;
    estimateMinutes: number | null;
    pillarId: string | null;
    projectId: string | null;
    pillar?: { name: string; colorHex: string } | null;
    project?: { title: string } | null;
    order?: number | null;
};

const COLUMNS = [
    { id: 'active', title: 'Next Actions', color: 'bg-blue-500' },
    { id: 'scheduled', title: 'Scheduled', color: 'bg-purple-500' },
    { id: 'blocked', title: 'Blocked', color: 'bg-red-500' },
    { id: 'someday', title: 'Someday', color: 'bg-amber-500' },
];

export function TasksClient({
    initialTasks,
    pillars,
    projects
}: {
    initialTasks: Task[],
    pillars: any[],
    projects: any[]
}) {
    const [tasks, setTasks] = useState<Task[]>(initialTasks);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPillarId, setSelectedPillarId] = useState<string>('all');
    const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    const handleAddTask = async (status: string, title: string) => {
        if (!title.trim()) return;
        const pillarId = selectedPillarId !== 'all' ? selectedPillarId : (pillars[0]?.id ?? null);
        try {
            await createTask({ title: title.trim(), status, pillarId, energyLevel: 'medium' });
            toast.success('Task created');
            // Optimistic: add placeholder task
            const tempTask: Task = {
                id: `temp-${Date.now()}`,
                title: title.trim(),
                status,
                energyLevel: 'medium',
                estimateMinutes: null,
                pillarId,
                projectId: null,
                pillar: pillars.find((p: any) => p.id === pillarId) ?? null,
                project: null,
            };
            setTasks((prev) => [...prev, tempTask]);
        } catch {
            toast.error('Failed to create task');
        }
    };

    const handleDeleteTask = async (id: string) => {
        setTasks((prev) => prev.filter((t) => t.id !== id));
        try {
            await deleteTask(id);
            toast.success('Task deleted');
        } catch {
            toast.error('Failed to delete task');
        }
    };

    const handleUpdateStatus = async (id: string, status: string) => {
        setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));
        try {
            await updateTask(id, { status });
        } catch {
            toast.error('Failed to update task');
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor)
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeTask = tasks.find(t => t.id === active.id);
        const overId = over.id as string;

        let newStatus = overId; // Default assumption: dropped on column

        // If dropped on a task, find that task's status
        const overTask = tasks.find(t => t.id === overId);
        if (overTask) {
            newStatus = overTask.status;
        } else if (!COLUMNS.find(c => c.id === overId)) {
            // Not a task and not a column? Invalid.
            return;
        }

        if (!activeTask) return;

        // 1. Status Change (Moved to different column)
        if (activeTask.status !== newStatus) {
            const oldStatus = activeTask.status;
            setTasks(prev => prev.map(t => t.id === active.id ? { ...t, status: newStatus } : t));

            try {
                await updateTask(activeTask.id, { status: newStatus });
                toast.success(`Moved to ${newStatus}`);
            } catch {
                toast.error('Failed to update status');
                setTasks(prev => prev.map(t => t.id === active.id ? { ...t, status: oldStatus } : t));
            }
        }

        // 2. Reorder (Moved within same column or to new position in new column)
        else if (active.id !== over.id) {
            setTasks((items) => {
                const oldIndex = items.findIndex((t) => t.id === active.id);
                const newIndex = items.findIndex((t) => t.id === over.id);

                // Only reorder if in same status/column context (which they are, verified above)
                // Actually dnd-kit sortable works on the whole list passed to SortableContext.
                // But here we split tasks by column for rendering.
                // dnd-kit handles the visual sorting if SortableContext wraps valid items.
                // Our SortableContext is inside Column, wrapping ONLY filtered tasks.
                // So reordering only triggers if both items are in the same SortableContext (same column).

                if (oldIndex !== -1 && newIndex !== -1) {
                    const newItems = arrayMove(items, oldIndex, newIndex);
                    // Update order fields for all items in this status
                    // Simplification: Just update order for everything? 
                    // Or precise update?
                    // Let's send the specific reordered subset to server.

                    const affectedTasks = newItems.filter(t => t.status === newStatus);
                    const reorderedUpdates = affectedTasks.map((t, index) => ({ id: t.id, order: index }));

                    // Optimistic update of orders
                    const finalItems = newItems.map(t => {
                        const update = reorderedUpdates.find(u => u.id === t.id);
                        return update ? { ...t, order: update.order } : t;
                    });

                    // Trigger server action
                    reorderTasks(reorderedUpdates);

                    return finalItems;
                }
                return items;
            });
        }
    };

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPillar = selectedPillarId === 'all' || task.pillarId === selectedPillarId;
        const matchesProject = selectedProjectId === 'all' || task.projectId === selectedProjectId;
        return matchesSearch && matchesPillar && matchesProject;
    });

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 bg-muted/30 p-4 rounded-2xl border border-border/50 backdrop-blur-sm">
                <div className="flex-1 min-w-[200px] relative group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search tasks Everywhere..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-background/50 border border-border/50 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all outline-none"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={selectedPillarId}
                        onChange={(e) => setSelectedPillarId(e.target.value)}
                        className="bg-background/50 border border-border/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all outline-none"
                    >
                        <option value="all">Everywhere</option>
                        {pillars.map((p: any) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                    <select
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                        className="bg-background/50 border border-border/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all outline-none"
                    >
                        <option value="all">All Projects</option>
                        {projects.map((p: any) => (
                            <option key={p.id} value={p.id}>{p.title}</option>
                        ))}
                    </select>
                </div>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 h-[calc(100vh-280px)] min-h-[500px]">
                    {COLUMNS.map(col => (
                        <Column
                            key={col.id}
                            col={col}
                            tasks={filteredTasks.filter(t => t.status === col.id)}
                            onAddTask={handleAddTask}
                            onEdit={setEditingTask}
                            onDelete={handleDeleteTask}
                            onSomeday={(id) => handleUpdateStatus(id, 'someday')}
                            onArchive={(id) => handleUpdateStatus(id, 'archived')}
                        />
                    ))}
                </div>

                <DragOverlay>
                    {activeId ? (
                        <TaskCard task={tasks.find(t => t.id === activeId)!} overlay />
                    ) : null}
                </DragOverlay>
            </DndContext>

            {editingTask && (
                <EditTaskModal
                    task={editingTask as any}
                    isOpen={!!editingTask}
                    onClose={() => setEditingTask(null)}
                />
            )}
        </div>
    );
}

type ColumnCallbacks = {
    onAddTask: (status: string, title: string) => void;
    onEdit: (task: Task) => void;
    onDelete: (id: string) => void;
    onSomeday: (id: string) => void;
    onArchive: (id: string) => void;
};

function Column({ col, tasks, onAddTask, onEdit, onDelete, onSomeday, onArchive }: { col: any; tasks: Task[] } & ColumnCallbacks) {
    const [adding, setAdding] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (adding) inputRef.current?.focus();
    }, [adding]);

    const commitAdd = () => {
        if (newTitle.trim()) onAddTask(col.id, newTitle.trim());
        setNewTitle('');
        setAdding(false);
    };

    return (
        <div className="flex flex-col h-full bg-muted/10 border border-border/50 rounded-2xl overflow-hidden glass-panel">
            <div className="p-4 border-b border-border/30 flex items-center justify-between bg-muted/5">
                <div className="flex items-center gap-2.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${col.color} shadow-[0_0_8px] ${col.color.replace('bg-', 'shadow-')}`} />
                    <h3 className="font-bold text-sm tracking-tight text-foreground/80 uppercase">{col.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full border border-border/50">
                        {tasks.length}
                    </span>
                    <button
                        onClick={() => setAdding(true)}
                        className="p-1 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
                        title={`Add task to ${col.title}`}
                    >
                        <Plus className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            <div className="flex-1 p-3 overflow-y-auto custom-scrollbar space-y-3">
                {/* Inline quick-add */}
                {adding && (
                    <div className="p-2 rounded-xl border border-primary/40 bg-primary/5">
                        <input
                            ref={inputRef}
                            type="text"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') commitAdd();
                                if (e.key === 'Escape') { setAdding(false); setNewTitle(''); }
                            }}
                            onBlur={commitAdd}
                            placeholder="Task title..."
                            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/40"
                        />
                        <p className="text-[10px] text-muted-foreground/40 mt-1">Enter to add · Esc to cancel</p>
                    </div>
                )}

                <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {tasks.map(task => (
                        <SortableTaskItem
                            key={task.id}
                            task={task}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onSomeday={onSomeday}
                            onArchive={onArchive}
                        />
                    ))}
                </SortableContext>
                {tasks.length === 0 && !adding && (
                    <div
                        className="h-32 border-2 border-dashed border-border/20 rounded-2xl flex flex-col items-center justify-center gap-2 opacity-50 grayscale cursor-pointer hover:opacity-70 transition-opacity"
                        onClick={() => setAdding(true)}
                    >
                        <Plus className="w-5 h-5 text-muted-foreground" />
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Add task</p>
                    </div>
                )}
            </div>
        </div>
    );
}

type TaskCallbacks = {
    onEdit: (task: Task) => void;
    onDelete: (id: string) => void;
    onSomeday: (id: string) => void;
    onArchive: (id: string) => void;
};

function SortableTaskItem({ task, onEdit, onDelete, onSomeday, onArchive }: { task: Task } & TaskCallbacks) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="group outline-none cursor-grab active:cursor-grabbing"
        >
            <TaskCard task={task} onEdit={onEdit} onDelete={onDelete} onSomeday={onSomeday} onArchive={onArchive} />
        </div>
    );
}

function TaskCard({ task, overlay, onEdit, onDelete, onSomeday, onArchive }: { task: Task; overlay?: boolean } & Partial<TaskCallbacks>) {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!menuOpen) return;
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [menuOpen]);

    return (
        <div className={`
            bg-card/40 backdrop-blur-md border border-border/60 p-4 rounded-xl shadow-sm transition-all duration-200
            ${overlay ? 'shadow-2xl scale-[1.02] rotate-1 ring-2 ring-primary/40 border-primary/50 bg-card/60' : 'hover:border-primary/40 hover:bg-card/60 hover:shadow-lg hover:-translate-y-0.5'}
        `}>
            <div className="space-y-3">
                <div className="flex justify-between items-start gap-2">
                    <p className="font-semibold text-sm leading-tight text-foreground/90 group-hover:text-foreground line-clamp-2">{task.title}</p>

                    {/* MoreVertical menu */}
                    {!overlay && (
                        <div className="relative shrink-0" ref={menuRef}>
                            <button
                                onPointerDown={(e) => e.stopPropagation()} // prevent drag
                                onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
                                className="p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted/60"
                            >
                                <MoreVertical className="w-3.5 h-3.5 text-muted-foreground/70" />
                            </button>

                            {menuOpen && (
                                <div className="absolute right-0 top-6 z-50 w-36 bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-xl py-1 text-sm">
                                    <button
                                        className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-muted/50 text-left text-xs"
                                        onClick={() => { onEdit?.(task); setMenuOpen(false); }}
                                    >
                                        <Pencil className="w-3 h-3" /> Edit
                                    </button>
                                    <button
                                        className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-muted/50 text-left text-xs"
                                        onClick={() => { onSomeday?.(task.id); setMenuOpen(false); }}
                                    >
                                        <Clock className="w-3 h-3" /> Move to Someday
                                    </button>
                                    <button
                                        className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-muted/50 text-left text-xs"
                                        onClick={() => { onArchive?.(task.id); setMenuOpen(false); }}
                                    >
                                        <Archive className="w-3 h-3" /> Archive
                                    </button>
                                    <div className="border-t border-border/50 my-1" />
                                    <button
                                        className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-red-500/10 text-red-400 text-left text-xs"
                                        onClick={() => { onDelete?.(task.id); setMenuOpen(false); }}
                                    >
                                        <Trash2 className="w-3 h-3" /> Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {task.pillar && (
                        <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-0.5 rounded-lg text-[10px] font-bold border border-border/30">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: task.pillar.colorHex }} />
                            {task.pillar.name}
                        </div>
                    )}
                    {task.project && (
                        <div className="text-[10px] text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-lg border border-border/20 truncate max-w-[140px] font-medium">
                            {task.project.title}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between mt-1 pt-3 border-t border-border/20">
                    <div className="flex items-center gap-3">
                        {task.energyLevel && (
                            <span className={`px-1.5 py-0.5 rounded-md text-[9px] uppercase font-black tracking-tighter ${task.energyLevel === 'high' ? 'bg-red-500/10 text-red-500' :
                                task.energyLevel === 'medium' ? 'bg-blue-500/10 text-blue-500' :
                                    'bg-emerald-500/10 text-emerald-500'
                                }`}>
                                {task.energyLevel}
                            </span>
                        )}
                        {task.estimateMinutes && (
                            <span className="text-[10px] font-bold text-muted-foreground/60">{task.estimateMinutes}m</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
