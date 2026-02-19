'use client';

import { useState } from 'react';
import { Clock, Target, Calendar, ArrowLeft, Repeat, Pencil, X, Upload, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { updateRitual } from '@/actions/core';

type Ritual = {
    id: string;
    title: string;
    description: string | null;
    cadenceType: string;
    targetPerCycle: number;
    currentCycleCount: number;
    currentCycleStart: string | null;
    status: string;
    coverImage: string | null;
    daysOfWeek: string | null;
    pillar: {
        id: string;
        name: string;
        colorHex: string;
    };
};

type Task = {
    id: string;
    title: string;
    status: string;
    estimateMinutes: number | null;
    scheduledDate: string | null;
    completedAt: string | null;
};

type Pillar = {
    id: string;
    name: string;
    colorHex: string;
};

export function RitualDetailClient({
    ritual: initialRitual,
    tasks,
    pillars,
}: {
    ritual: Ritual;
    tasks: Task[];
    pillars: Pillar[];
}) {
    const [ritual, setRitual] = useState(initialRitual);
    const [activeTab, setActiveTab] = useState<'overview' | 'tasks'>('overview');
    const [showEdit, setShowEdit] = useState(false);
    const router = useRouter();

    // Use the database source of truth for cycle count
    const completedThisCycle = ritual.currentCycleCount;
    const progress = ritual.targetPerCycle > 0
        ? Math.min(100, (completedThisCycle / ritual.targetPerCycle) * 100)
        : 0;

    const isOnTrack = completedThisCycle >= ritual.targetPerCycle;

    // Edit Form State
    const [editForm, setEditForm] = useState({
        title: ritual.title,
        description: ritual.description || '',
        status: ritual.status,
        cadenceType: ritual.cadenceType,
        targetPerCycle: ritual.targetPerCycle,
        pillarId: ritual.pillar.id,
        coverImage: ritual.coverImage || '',
        daysOfWeek: ritual.daysOfWeek ? ritual.daysOfWeek.split(',') : [] as string[],
    });
    const [isUploading, setIsUploading] = useState(false);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (data.success) {
                setEditForm({ ...editForm, coverImage: data.url });
                toast.success('Image uploaded');
            } else {
                toast.error('Upload failed');
            }
        } catch {
            toast.error('Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const updated = await updateRitual(ritual.id, {
                title: editForm.title,
                description: editForm.description || null,
                status: editForm.status,
                cadenceType: editForm.cadenceType,
                targetPerCycle: editForm.targetPerCycle,
                pillarId: editForm.pillarId,
                coverImage: editForm.coverImage || null,
                daysOfWeek: editForm.daysOfWeek.length ? editForm.daysOfWeek.join(',') : null,
            });

            // Optimistic / Local Update
            setRitual({
                ...ritual,
                title: updated.title,
                description: updated.description,
                status: updated.status,
                cadenceType: updated.cadenceType,
                targetPerCycle: updated.targetPerCycle,
                coverImage: updated.coverImage,
                daysOfWeek: updated.daysOfWeek,
                pillar: pillars.find(a => a.id === updated.pillarId) || ritual.pillar,
            });

            setShowEdit(false);
            toast.success('Ritual updated');
            router.refresh();
        } catch (error) {
            toast.error('Failed to update ritual');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/rituals"
                        className="p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Repeat className="w-4 h-4" />
                            <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: ritual.pillar.colorHex }}
                            />
                            {ritual.pillar.name}
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">{ritual.title}</h1>
                    </div>
                </div>
                <button
                    onClick={() => setShowEdit(true)}
                    className="p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    title="Edit Ritual"
                >
                    <Pencil className="w-4 h-4" />
                </button>
            </div>

            {/* Status Bar */}
            <div className="glass-panel rounded-xl p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-foreground">
                            {completedThisCycle}/{ritual.targetPerCycle}
                        </div>
                        <div className="text-sm text-muted-foreground">This Cycle</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-foreground capitalize">
                            {ritual.cadenceType}
                        </div>
                        <div className="text-sm text-muted-foreground">Cadence</div>
                    </div>
                    <div className="text-center">
                        <div className={`text-3xl font-bold ${isOnTrack ? 'text-green-500' : 'text-amber-500'}`}>
                            {isOnTrack ? '✓' : '○'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {isOnTrack ? 'On Track' : 'Behind'}
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-foreground capitalize">
                            {ritual.status}
                        </div>
                        <div className="text-sm text-muted-foreground">Status</div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Cycle Progress</span>
                        <span className="font-medium">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all ${isOnTrack ? 'bg-green-500' : 'bg-amber-500'
                                }`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Description */}
            {ritual.description && (
                <div className="glass-panel rounded-xl p-6">
                    <h3 className="font-medium mb-2">Description</h3>
                    <p className="text-muted-foreground">{ritual.description}</p>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 border-b border-border">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                >
                    Overview
                </button>
                <button
                    onClick={() => setActiveTab('tasks')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'tasks'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                >
                    Tasks ({tasks.length})
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <div className="glass-panel rounded-xl p-6">
                    <div className="grid gap-4">
                        <div className="flex items-center gap-3">
                            <Target className="w-5 h-5 text-muted-foreground" />
                            <div>
                                <div className="font-medium">Target</div>
                                <div className="text-sm text-muted-foreground">
                                    {ritual.targetPerCycle}x per {ritual.cadenceType}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-muted-foreground" />
                            <div>
                                <div className="font-medium">Cycle Started</div>
                                <div className="text-sm text-muted-foreground">
                                    {ritual.currentCycleStart
                                        ? new Date(ritual.currentCycleStart).toLocaleDateString()
                                        : 'Not started'}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-muted-foreground" />
                            <div>
                                <div className="font-medium">Recurrence</div>
                                <div className="text-sm text-muted-foreground">
                                    {ritual.daysOfWeek ? ritual.daysOfWeek.split(',').map(d =>
                                        ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][parseInt(d) === 0 ? 6 : parseInt(d) - 1]
                                    ).join(', ') : 'No specific days'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'tasks' && (
                <div className="space-y-2">
                    {tasks.length === 0 ? (
                        <div className="glass-panel rounded-xl p-8 text-center">
                            <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                            <p className="text-muted-foreground">No tasks yet</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Create tasks from the Today page and link them to this ritual
                            </p>
                        </div>
                    ) : (
                        tasks.map(task => (
                            <div
                                key={task.id}
                                className="glass-panel rounded-lg p-4 flex items-center gap-3"
                            >
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${task.status === 'done'
                                    ? 'bg-green-500/20 text-green-500'
                                    : 'bg-muted text-muted-foreground'
                                    }`}>
                                    {task.status === 'done' ? (
                                        <CheckCircle2 className="w-4 h-4" />
                                    ) : (
                                        <div className="w-2 h-2 rounded-full bg-current" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className={task.status === 'done' ? 'line-through text-muted-foreground' : ''}>
                                        {task.title}
                                    </div>
                                    {task.estimateMinutes && (
                                        <div className="text-xs text-muted-foreground">
                                            {task.estimateMinutes} min
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Edit Modal */}
            {showEdit && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="glass-panel rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Edit Ritual</h3>
                            <button onClick={() => setShowEdit(false)} className="text-muted-foreground hover:text-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium block mb-1">Title</label>
                                <input
                                    type="text"
                                    value={editForm.title}
                                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                    className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium block mb-1">Description</label>
                                <textarea
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm h-20 resize-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm font-medium block mb-1">Status</label>
                                    <select
                                        value={editForm.status}
                                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                        className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                                    >
                                        <option value="active">Active</option>
                                        <option value="paused">Paused</option>
                                        <option value="archived">Archived</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium block mb-1">Pillar</label>
                                    <select
                                        value={editForm.pillarId}
                                        onChange={(e) => setEditForm({ ...editForm, pillarId: e.target.value })}
                                        className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                                    >
                                        {pillars.map(a => (
                                            <option key={a.id} value={a.id}>{a.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm font-medium block mb-1">Cadence</label>
                                    <select
                                        value={editForm.cadenceType}
                                        onChange={(e) => setEditForm({ ...editForm, cadenceType: e.target.value })}
                                        className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                                    >
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium block mb-1">Target / Cycle</label>
                                    <input
                                        type="number"
                                        value={editForm.targetPerCycle}
                                        onChange={(e) => setEditForm({ ...editForm, targetPerCycle: parseInt(e.target.value) || 1 })}
                                        className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                                    />
                                </div>
                            </div>

                            {/* Day Selection (Recurrence) */}
                            <div>
                                <label className="text-sm font-medium block mb-2">Recurrence Days (Optional)</label>
                                <div className="flex justify-between gap-1">
                                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                                        const jsDayValue = index === 6 ? 0 : index + 1;
                                        const isSelected = editForm.daysOfWeek.includes(String(jsDayValue));

                                        return (
                                            <button
                                                key={day}
                                                type="button"
                                                onClick={() => {
                                                    const current = editForm.daysOfWeek;
                                                    const dayStr = String(jsDayValue);
                                                    let updated;
                                                    if (current.includes(dayStr)) {
                                                        updated = current.filter(d => d !== dayStr);
                                                    } else {
                                                        updated = [...current, dayStr];
                                                    }
                                                    setEditForm({ ...editForm, daysOfWeek: updated });
                                                }}
                                                className={`
                                                    w-9 h-9 rounded-full text-xs font-semibold flex items-center justify-center transition-all
                                                    ${isSelected
                                                        ? 'bg-primary text-primary-foreground shadow-md'
                                                        : 'bg-muted text-muted-foreground hover:bg-muted/80'}
                                                `}
                                            >
                                                {day[0]}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium block mb-1">Cover Image</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={editForm.coverImage}
                                        onChange={(e) => setEditForm({ ...editForm, coverImage: e.target.value })}
                                        placeholder="Image URL..."
                                        className="flex-1 bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                                    />
                                    <label className="cursor-pointer bg-muted hover:bg-muted/80 px-3 py-2 rounded-lg flex items-center justify-center transition-colors">
                                        <Upload className="w-4 h-4 text-muted-foreground" />
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleUpload}
                                        />
                                    </label>
                                </div>
                                {isUploading && <p className="text-xs text-muted-foreground mt-1">Uploading...</p>}
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowEdit(false)}
                                    className="flex-1 py-2 bg-muted/50 hover:bg-muted rounded-lg font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
