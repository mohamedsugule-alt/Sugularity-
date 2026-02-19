'use client';

import {
    DndContext,
    DragOverlay,
    useSensor,
    useSensors,
    PointerSensor,
    TouchSensor,
    closestCorners,
    DragEndEvent,
    DragStartEvent,
    DragOverEvent
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import { updateTaskEnergy } from '@/actions/tasks';
import { toast } from 'sonner';

type Task = {
    id: string;
    title: string;
    energyLevel: string;
    project?: { id: string; title: string } | null;
    ritual?: { id: string; title: string } | null;
    pillar?: { id: string; name: string; colorHex: string } | null;
    // Add other fields from TodayClient's Task type if needed
    status?: string;
    estimateMinutes?: number | null;
    dueDate?: Date | null;
    scheduledDate?: Date | null;
};

const COLUMNS = [
    { id: 'high', title: 'High Energy', color: 'bg-red-500', text: 'text-red-500', border: 'border-red-500/20', bg: 'bg-red-500/5' },
    { id: 'medium', title: 'Normal Energy', color: 'bg-blue-500', text: 'text-blue-500', border: 'border-blue-500/20', bg: 'bg-blue-500/5' },
    { id: 'low', title: 'Low Energy', color: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-500/20', bg: 'bg-emerald-500/5' },
];

interface TodayBoardProps {
    tasks: Task[];
    onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
}

export function TodayBoard({ tasks, onUpdateTask }: TodayBoardProps) {
    const [activeId, setActiveId] = useState<string | null>(null);

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
        let newEnergyLevel = overId;

        // If dropped on a task, find that task's column
        if (!['high', 'medium', 'low'].includes(overId)) {
            const overTask = tasks.find(t => t.id === overId);
            if (overTask) newEnergyLevel = overTask.energyLevel;
            else return;
        }

        if (activeTask && activeTask.energyLevel !== newEnergyLevel) {
            // Optimistic update via parent
            onUpdateTask(activeTask.id, { energyLevel: newEnergyLevel });

            try {
                // Server update
                await updateTaskEnergy(activeTask.id, newEnergyLevel);
                toast.success(`Moved to ${newEnergyLevel} energy`);
            } catch {
                toast.error('Failed to update energy');
                // Revert
                onUpdateTask(activeTask.id, { energyLevel: activeTask.energyLevel });
            }
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex flex-col md:flex-row gap-4 h-full overflow-x-auto pb-4">
                {COLUMNS.map(col => (
                    <Column
                        key={col.id}
                        col={col}
                        tasks={tasks.filter(t => (t.energyLevel || 'medium') === col.id)}
                    />
                ))}
            </div>

            <DragOverlay>
                {activeId ? (
                    <TaskCard task={tasks.find(t => t.id === activeId)!} overlay />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}

function Column({ col, tasks }: { col: any, tasks: Task[] }) {
    return (
        <div className={`flex-1 min-w-[250px] flex flex-col rounded-xl border ${col.border} ${col.bg}`}>
            <div className={`p-3 border-b ${col.border} flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${col.color}`} />
                    <h3 className={`font-medium text-sm ${col.text}`}>{col.title}</h3>
                </div>
                <span className="text-xs text-muted-foreground">{tasks.length}</span>
            </div>
            <div className="flex-1 p-2 space-y-2">
                <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {tasks.map(task => <SortableTaskItem key={task.id} task={task} />)}
                </SortableContext>
            </div>
        </div>
    );
}

function SortableTaskItem({ task }: { task: Task }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: task.id,
        data: { type: 'Task', task }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none">
            <TaskCard task={task} />
        </div>
    );
}

function TaskCard({ task, overlay }: { task: Task, overlay?: boolean }) {
    return (
        <div className={`bg-card border border-border/50 p-3 rounded-lg shadow-sm ${overlay ? 'shadow-xl scale-105 rotate-1 ring-2 ring-primary' : 'hover:border-primary/30'}`}>
            <p className="font-medium text-sm line-clamp-2">{task.title}</p>
            <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                {task.pillar && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: task.pillar.colorHex }} />}
                {task.project && <span className="truncate max-w-[80px]">{task.project.title}</span>}
                {task.estimateMinutes && <span>{task.estimateMinutes}m</span>}
            </div>
        </div>
    );
}
