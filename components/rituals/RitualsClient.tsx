'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createRitual, deleteRitual } from '@/actions/core';
import { Plus, Trash2, X, Repeat, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/ui/EmptyState';

type Ritual = {
    id: string;
    title: string;
    description: string | null;
    coverImage: string | null;
    cadenceType: string;
    targetPerCycle: number;
    currentCycleCount: number;
    status: string;
    pillar: { id: string; name: string; colorHex: string };
    tasks: { id: string }[];
    daysOfWeek?: string | null;
};

type Pillar = {
    id: string;
    name: string;
    colorHex: string;
};

// Default cover images for rituals (habits/recurring)
const defaultCovers = [
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=200&fit=crop',
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=200&fit=crop',
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=200&fit=crop',
    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=200&fit=crop',
];

export function RitualsClient({
    initialRituals,
    pillars,
}: {
    initialRituals: Ritual[];
    pillars: Pillar[];
}) {
    const [rituals, setRituals] = useState(initialRituals);
    const [showCreate, setShowCreate] = useState(false);
    const [newRitual, setNewRitual] = useState({
        title: '',
        pillarId: '',
        description: '',
        cadenceType: 'weekly',
        targetPerCycle: 3,
        coverImage: '',
        daysOfWeek: [] as string[],
    });
    const [isCreating, setIsCreating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

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
                setNewRitual((prev) => ({ ...prev, coverImage: data.url }));
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

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRitual.title.trim() || !newRitual.pillarId) {
            toast.error('Title and Pillar are required');
            return;
        }

        setIsCreating(true);
        try {
            const ritual = await createRitual({
                title: newRitual.title.trim(),
                pillarId: newRitual.pillarId,
                description: newRitual.description.trim() || undefined,
                cadenceType: newRitual.cadenceType,
                targetPerCycle: newRitual.targetPerCycle,
                coverImage: newRitual.coverImage.trim() || undefined,
                daysOfWeek: newRitual.daysOfWeek?.length ? newRitual.daysOfWeek.join(',') : undefined,
            });
            // @ts-ignore - Prisma return type mismatch with local type
            setRituals([{ ...ritual, tasks: [], currentCycleCount: 0, coverImage: null, daysOfWeek: ritual.daysOfWeek }, ...rituals]);
            setNewRitual({ title: '', pillarId: '', description: '', cadenceType: 'weekly', targetPerCycle: 3, coverImage: '', daysOfWeek: [] });
            setShowCreate(false);
            toast.success('Ritual created');
        } catch (error) {
            toast.error('Failed to create ritual');
        } finally {
            setIsCreating(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();

        if (!confirm('Delete this ritual and its history? This cannot be undone.')) return;

        setDeletingId(id);
        try {
            await deleteRitual(id);
            setRituals(rituals.filter(s => s.id !== id));
            toast.success('Ritual deleted');
        } catch {
            toast.error('Failed to delete ritual');
        } finally {
            setDeletingId(null);
        }
    };

    const getDefaultCover = (id: string) => {
        const index = id.charCodeAt(0) % defaultCovers.length;
        return defaultCovers[index];
    };

    const getCycleProgress = (ritual: Ritual) => {
        if (ritual.targetPerCycle <= 0) return 0;
        return Math.min((ritual.currentCycleCount / ritual.targetPerCycle) * 100, 100);
    };

    const activeRituals = rituals.filter((s) => s.status === 'active');
    const pausedRituals = rituals.filter((s) => s.status === 'paused');

    return (
        <div className="space-y-6">
            {/* Create Button */}
            <div className="flex justify-end">
                <button
                    onClick={() => setShowCreate(true)}
                    className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-xl font-semibold flex items-center gap-2 hover:from-cyan-600 hover:to-cyan-700 shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.02]"
                >
                    <Plus className="w-4 h-4" />
                    New Ritual
                </button>
            </div>

            {/* Create Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-2xl p-6 max-w-md w-full shadow-2xl border border-border">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-cyan-500/10">
                                    <Repeat className="w-5 h-5 text-cyan-500" />
                                </div>
                                <h3 className="text-xl font-bold">Create Ritual</h3>
                            </div>
                            <button onClick={() => setShowCreate(false)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                                <X className="w-5 h-5 text-muted-foreground" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-5">
                            <div>
                                <label className="text-sm font-semibold block mb-2">Ritual Title *</label>
                                <input
                                    type="text"
                                    value={newRitual.title}
                                    onChange={(e) => setNewRitual({ ...newRitual, title: e.target.value })}
                                    className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                                    placeholder="e.g., Weekly Exercise"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="text-sm font-semibold block mb-2">Life Pillar *</label>
                                <select
                                    value={newRitual.pillarId}
                                    onChange={(e) => setNewRitual({ ...newRitual, pillarId: e.target.value })}
                                    className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                                >
                                    <option value="">Select pillar...</option>
                                    {pillars.map((pillar) => (
                                        <option key={pillar.id} value={pillar.id}>{pillar.name}</option>
                                    ))}
                                </select>
                            </div>


                            {/* Day Selection (Recurrence) */}
                            <div>
                                <label className="text-sm font-semibold block mb-3">Repeats on</label>
                                <div className="flex justify-between gap-2">
                                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                                        // Standard JS GetDay: 0=Sun, 1=Mon... 6=Sat.
                                        // Map UI Mon(0)..Sun(6) to JS Val: Mon=1, Tue=2, ... Sat=6, Sun=0
                                        const jsDayValue = index === 6 ? 0 : index + 1;
                                        const isSelected = newRitual.daysOfWeek?.includes(String(jsDayValue));

                                        return (
                                            <button
                                                key={day}
                                                type="button"
                                                onClick={() => {
                                                    const current = newRitual.daysOfWeek || [];
                                                    const dayStr = String(jsDayValue);
                                                    let updated;
                                                    if (current.includes(dayStr)) {
                                                        updated = current.filter(d => d !== dayStr);
                                                    } else {
                                                        updated = [...current, dayStr];
                                                    }
                                                    setNewRitual({ ...newRitual, daysOfWeek: updated });
                                                }}
                                                className={`
                                                    w-10 h-10 rounded-full text-xs font-semibold flex items-center justify-center transition-all
                                                    ${isSelected
                                                        ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25 scale-110'
                                                        : 'bg-muted text-muted-foreground hover:bg-muted/80'}
                                                `}
                                            >
                                                {day[0]}
                                            </button>
                                        );
                                    })}
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-2 text-center">
                                    Select days to auto-schedule on calendar
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-semibold block mb-2">Cadence</label>
                                    <select
                                        value={newRitual.cadenceType}
                                        onChange={(e) => setNewRitual({ ...newRitual, cadenceType: e.target.value })}
                                        className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                                    >
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold block mb-2">Target per cycle</label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={newRitual.targetPerCycle}
                                        onChange={(e) => setNewRitual({ ...newRitual, targetPerCycle: parseInt(e.target.value) || 1 })}
                                        className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-semibold block mb-2">Description</label>
                                <textarea
                                    value={newRitual.description}
                                    onChange={(e) => setNewRitual({ ...newRitual, description: e.target.value })}
                                    className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 resize-none"
                                    placeholder="Why does this habit matter?"
                                    rows={2}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-semibold block mb-2">Cover Image</label>
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Image URL or upload..."
                                            value={newRitual.coverImage || ''}
                                            onChange={(e) => setNewRitual({ ...newRitual, coverImage: e.target.value })}
                                            className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                                        />
                                        <label className="cursor-pointer bg-muted hover:bg-muted/80 px-4 py-3 rounded-xl flex items-center justify-center transition-colors">
                                            <Upload className="w-5 h-5 text-muted-foreground" />
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleUpload}
                                                suppressHydrationWarning
                                            />
                                        </label>
                                    </div>
                                    {isUploading && <p className="text-xs text-muted-foreground animate-pulse">Uploading...</p>}
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreate(false)}
                                    className="flex-1 py-3 bg-muted hover:bg-muted/80 rounded-xl font-semibold transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating || !newRitual.title.trim() || !newRitual.pillarId}
                                    className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-xl font-semibold hover:from-cyan-600 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/25"
                                >
                                    {isCreating ? 'Creating...' : 'Create Ritual'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div >
            )
            }

            {/* Rituals Grid */}
            {
                activeRituals.length === 0 && pausedRituals.length === 0 ? (
                    <EmptyState
                        icon={Repeat}
                        title="Build habits that stick"
                        description="Rituals track recurring work you commit to — exercise, reading, journaling. Set a cadence and let the system keep you accountable."
                        actionLabel="Create Your First Ritual"
                        onAction={() => setShowCreate(true)}
                        color="cyan"
                        tip="Start with one daily or weekly habit. Consistency beats intensity."
                    />
                ) : (
                    <div className="space-y-8">
                        {/* Active Rituals */}
                        {activeRituals.length > 0 && (
                            <div>
                                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                                    Active ({activeRituals.length})
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {activeRituals.map((ritual) => {
                                        const progress = getCycleProgress(ritual);
                                        return (
                                            <div
                                                key={ritual.id}
                                                className="group relative rounded-2xl overflow-hidden bg-card border border-border shadow-sm hover:shadow-xl hover:border-cyan-500/30 transition-all duration-300"
                                            >
                                                {/* Cover Image */}
                                                <div className="relative h-32 bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 overflow-hidden">
                                                    <div
                                                        className="absolute inset-0 bg-cover bg-center opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
                                                        style={{ backgroundImage: `url(${ritual.coverImage || getDefaultCover(ritual.id)})` }}
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />

                                                    {/* Delete Button */}
                                                    <button
                                                        onClick={(e) => handleDelete(e, ritual.id)}
                                                        disabled={deletingId === ritual.id}
                                                        className="absolute top-3 right-3 p-2 rounded-lg bg-red-500/90 text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all shadow-lg"
                                                        title="Delete ritual"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                {/* Content */}
                                                <Link href={`/rituals/${ritual.id}`} className="block p-5">
                                                    {/* Pillar Tag */}
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span
                                                            className="w-2 h-2 rounded-full"
                                                            style={{ backgroundColor: ritual.pillar.colorHex }}
                                                        />
                                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                            {ritual.pillar.name}
                                                        </span>
                                                    </div>

                                                    {/* Title */}
                                                    <h3 className="text-lg font-bold text-foreground group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-2">
                                                        {ritual.title}
                                                    </h3>

                                                    {/* Progress Bar */}
                                                    <div className="mt-4 pt-4 border-t border-border/50">
                                                        <div className="flex items-center justify-between text-xs mb-2">
                                                            <span className="text-muted-foreground capitalize">
                                                                {ritual.cadenceType} Goal
                                                            </span>
                                                            <span className="font-semibold text-cyan-600 dark:text-cyan-400">
                                                                {ritual.currentCycleCount} / {ritual.targetPerCycle}
                                                            </span>
                                                        </div>
                                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-500 ${progress >= 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-cyan-500 to-cyan-400'}`}
                                                                style={{ width: `${progress}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </Link>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Paused Rituals */}
                        {pausedRituals.length > 0 && (
                            <div>
                                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                                    Paused ({pausedRituals.length})
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
                                    {pausedRituals.map((ritual) => (
                                        <Link
                                            key={ritual.id}
                                            href={`/rituals/${ritual.id}`}
                                            className="glass-panel rounded-xl p-4 hover:border-cyan-500/30 transition-all group block"
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <span
                                                    className="w-2 h-2 rounded-full"
                                                    style={{ backgroundColor: ritual.pillar.colorHex }}
                                                />
                                                <span className="text-xs text-muted-foreground">{ritual.pillar.name}</span>
                                            </div>
                                            <h3 className="font-semibold">{ritual.title}</h3>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )
            }
        </div >
    );
}
