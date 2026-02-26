'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Clock, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { updateTask } from '@/actions/core';

type Task = {
    id: string;
    title: string;
    description?: string;
    status: string;
    estimateMinutes: number | null;
    createdAt: Date;
    committedDate: Date | null;
    completedAt: Date | null;
    scheduledDate: Date | null; // Added
    energyLevel: string; // Added
};

export function EditTaskModal({
    task,
    isOpen,
    onClose,
}: {
    task: Task;
    isOpen: boolean;
    onClose: () => void;
}) {
    const router = useRouter();

    // Helper to format Date to datetime-local string (YYYY-MM-DDTHH:mm)
    const toLocalISO = (date: Date | string | null) => {
        if (!date) return '';
        const d = new Date(date);
        // Adjust for timezone offset to show local time in input
        const timezoneOffset = d.getTimezoneOffset() * 60000;
        const localDate = new Date(d.getTime() - timezoneOffset);
        return localDate.toISOString().slice(0, 16);
    };

    const [form, setForm] = useState({
        title: task.title,
        status: task.status,
        estimateHours: task.estimateMinutes ? Math.floor(task.estimateMinutes / 60) : 0,
        estimateMinutes: task.estimateMinutes ? task.estimateMinutes % 60 : 30, // Default 30 if null
        createdAt: toLocalISO(task.createdAt),
        committedDate: toLocalISO(task.committedDate),
        completedAt: toLocalISO(task.completedAt),
        scheduledDate: task.scheduledDate ? toLocalISO(task.scheduledDate).slice(0, 10) : '', // Date only for scheduled
        energyLevel: task.energyLevel || 'medium',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const totalMinutes = (Number(form.estimateHours) * 60) + Number(form.estimateMinutes);

            await updateTask(task.id, {
                title: form.title,
                status: form.status,
                estimateMinutes: totalMinutes,
                createdAt: form.createdAt ? new Date(form.createdAt) : undefined,
                committedDate: form.committedDate ? new Date(form.committedDate) : null,
                completedAt: form.completedAt ? new Date(form.completedAt) : null,
                scheduledDate: form.scheduledDate ? new Date(form.scheduledDate) : null,
                energyLevel: form.energyLevel,
            });

            toast.success('Task updated');
            router.refresh();
            onClose();
        } catch (error) {
            toast.error('Failed to update task');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="glass-panel rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Edit Task</h3>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Title */}
                    <div>
                        <label className="text-sm font-medium block mb-1">Title</label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                            required
                        />
                    </div>

                    {/* Duration */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium block mb-1">Hours</label>
                            <input
                                type="number"
                                min="0"
                                value={form.estimateHours}
                                onChange={(e) => setForm({ ...form, estimateHours: parseInt(e.target.value) || 0 })}
                                className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium block mb-1">Minutes</label>
                            <input
                                type="number"
                                min="0"
                                max="59"
                                step="5"
                                value={form.estimateMinutes}
                                onChange={(e) => setForm({ ...form, estimateMinutes: parseInt(e.target.value) || 0 })}
                                className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {/* Scheduled Date */}
                        <div>
                            <label className="text-sm font-medium block mb-1">Scheduled Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="date"
                                    value={form.scheduledDate}
                                    onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                                    className="w-full bg-muted/50 border border-border/50 rounded-lg pl-9 pr-3 py-2 text-sm"
                                />
                            </div>
                        </div>

                        {/* Energy Level */}
                        <div>
                            <label className="text-sm font-medium block mb-1">Energy</label>
                            <select
                                value={form.energyLevel}
                                onChange={(e) => setForm({ ...form, energyLevel: e.target.value })}
                                className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                    </div>

                    {/* Timestamps */}
                    <div className="space-y-3 pt-2 border-t border-border/50">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Timestamps</p>

                        <div>
                            <label className="text-xs text-muted-foreground block mb-1">Created At</label>
                            <input
                                type="datetime-local"
                                value={form.createdAt}
                                onChange={(e) => setForm({ ...form, createdAt: e.target.value })}
                                className="w-full bg-muted/30 border border-border/30 rounded px-2 py-1.5 text-xs font-mono"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-muted-foreground block mb-1">Started (Committed)</label>
                            <input
                                type="datetime-local"
                                value={form.committedDate}
                                onChange={(e) => setForm({ ...form, committedDate: e.target.value })}
                                className="w-full bg-muted/30 border border-border/30 rounded px-2 py-1.5 text-xs font-mono"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-muted-foreground block mb-1">Finished (Completed)</label>
                            <input
                                type="datetime-local"
                                value={form.completedAt}
                                onChange={(e) => setForm({ ...form, completedAt: e.target.value })}
                                className="w-full bg-muted/30 border border-border/30 rounded px-2 py-1.5 text-xs font-mono"
                            />
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="text-sm font-medium block mb-1">Status</label>
                        <select
                            value={form.status}
                            onChange={(e) => setForm({ ...form, status: e.target.value })}
                            className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                        >
                            <option value="active">Active</option>
                            <option value="done">Done</option>
                            <option value="archived">Archived</option>
                            <option value="someday">Someday</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors mt-2"
                    >
                        Save Changes
                    </button>
                </form>
            </div>
        </div>
    );
}
