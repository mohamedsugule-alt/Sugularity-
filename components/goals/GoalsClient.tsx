'use client';

import { useState } from 'react';
import { createGoal, deleteGoal } from '@/actions/goals';
import { Plus, X, Target, AlertTriangle, Eye, CheckCircle2, Trash2, ImagePlus, Upload } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import Image from 'next/image';
import { useOnboarding } from '@/components/providers/OnboardingProvider';
import { EmptyState } from '@/components/ui/EmptyState';

type Goal = {
    id: string;
    title: string;
    description: string | null;
    coverImage: string | null;
    status: string;
    targetDate: Date | null;
    pillar: { id: string; name: string; colorHex: string };
    health: 'on_track' | 'watch' | 'at_risk';
    reasons: string[];
    contributorCount: number;
    progressEstimate: number;
};

type Pillar = {
    id: string;
    name: string;
    colorHex: string;
};

// Default cover images for goals without custom images
const defaultCovers = [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop',
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=200&fit=crop',
    'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=400&h=200&fit=crop',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=200&fit=crop',
];

export function GoalsClient({
    initialGoals,
    pillars,
}: {
    initialGoals: Goal[];
    pillars: Pillar[];
}) {
    const [goals, setGoals] = useState(initialGoals);
    const [showCreate, setShowCreate] = useState(false);
    const [filterPillar, setFilterPillar] = useState<string>('');
    const [newGoal, setNewGoal] = useState({ title: '', pillarId: '', description: '', coverImage: '' });
    const [isCreating, setIsCreating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const { completeStep } = useOnboarding();

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
                setNewGoal((prev) => ({ ...prev, coverImage: data.url }));
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

    const filteredGoals = filterPillar
        ? goals.filter((g) => g.pillar.id === filterPillar)
        : goals;

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGoal.title.trim() || !newGoal.pillarId) return;

        setIsCreating(true);
        try {
            await createGoal({
                title: newGoal.title.trim(),
                pillarId: newGoal.pillarId,
                description: newGoal.description.trim() || undefined,
                coverImage: newGoal.coverImage.trim() || undefined,
            });
            completeStep(3);
            window.location.reload();
        } catch {
            toast.error('Failed to create goal');
        } finally {
            setIsCreating(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, goalId: string) => {
        e.preventDefault();
        e.stopPropagation();

        if (!confirm('Delete this goal? This cannot be undone.')) return;

        setDeletingId(goalId);
        try {
            await deleteGoal(goalId);
            setGoals(goals.filter(g => g.id !== goalId));
            toast.success('Goal deleted');
        } catch {
            toast.error('Failed to delete goal');
        } finally {
            setDeletingId(null);
        }
    };

    const HealthBadge = ({ health }: { health: string }) => {
        const config = {
            on_track: { bg: 'bg-emerald-500', text: 'On Track' },
            watch: { bg: 'bg-yellow-500', text: 'Watch' },
            at_risk: { bg: 'bg-red-500', text: 'At Risk' },
        };
        const { bg, text } = config[health as keyof typeof config] || config.on_track;

        return (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white ${bg}`}>
                {text}
            </span>
        );
    };

    const getDefaultCover = (id: string) => {
        const index = id.charCodeAt(0) % defaultCovers.length;
        return defaultCovers[index];
    };

    return (
        <div className="space-y-6">
            {/* Filters & Actions */}
            <div className="flex items-center justify-between gap-4">
                <select
                    value={filterPillar}
                    onChange={(e) => setFilterPillar(e.target.value)}
                    className="bg-card border border-border rounded-xl px-4 py-2.5 text-sm font-medium shadow-sm hover:border-primary/50 transition-colors"
                >
                    <option value="">All Pillars</option>
                    {pillars.map((pillar) => (
                        <option key={pillar.id} value={pillar.id}>{pillar.name}</option>
                    ))}
                </select>
                <button
                    onClick={() => setShowCreate(true)}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold flex items-center gap-2 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02]"
                >
                    <Plus className="w-4 h-4" />
                    New Goal
                </button>
            </div>

            {/* Goals Grid - Modern Card Layout */}
            {filteredGoals.length === 0 ? (
                <EmptyState
                    icon={Target}
                    title="Your vision starts here"
                    description="Goals connect your daily work to what truly matters. Start with one thing you want to achieve this quarter."
                    actionLabel="Create Your First Goal"
                    onAction={() => setShowCreate(true)}
                    color="emerald"
                    tip="Try starting with just one goal — you can always add more later."
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredGoals.map((goal) => (
                        <div
                            key={goal.id}
                            className="group relative rounded-2xl overflow-hidden bg-card border border-border shadow-sm hover:shadow-xl hover:border-emerald-500/30 transition-all duration-300"
                        >
                            {/* Cover Image */}
                            <div className="relative h-36 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 overflow-hidden">
                                <div
                                    className="absolute inset-0 bg-cover bg-center opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
                                    style={{ backgroundImage: `url(${goal.coverImage || getDefaultCover(goal.id)})` }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />

                                {/* Delete Button */}
                                <button
                                    onClick={(e) => handleDelete(e, goal.id)}
                                    disabled={deletingId === goal.id}
                                    className="absolute top-3 right-3 p-2 rounded-lg bg-red-500/90 text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all shadow-lg"
                                    title="Delete goal"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>

                                {/* Health Badge */}
                                <div className="absolute top-3 left-3">
                                    <HealthBadge health={goal.health} />
                                </div>
                            </div>

                            {/* Content */}
                            <Link href={`/goals/${goal.id}`} className="block p-5">
                                {/* Pillar Tag */}
                                <div className="flex items-center gap-2 mb-2">
                                    <span
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: goal.pillar.colorHex }}
                                    />
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        {goal.pillar.name}
                                    </span>
                                </div>

                                {/* Title */}
                                <h3 className="text-lg font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
                                    {goal.title}
                                </h3>

                                {/* Description */}
                                {goal.description && (
                                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                        {goal.description}
                                    </p>
                                )}

                                {/* Progress Bar */}
                                <div className="mt-4 pt-4 border-t border-border/50">
                                    <div className="flex items-center justify-between text-xs mb-2">
                                        <span className="text-muted-foreground">
                                            {goal.contributorCount} project{goal.contributorCount !== 1 ? 's' : ''} contributing
                                        </span>
                                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                            {goal.progressEstimate}%
                                        </span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                                            style={{ width: `${goal.progressEstimate}%` }}
                                        />
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-2xl p-6 max-w-md w-full shadow-2xl border border-border">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-emerald-500/10">
                                    <Target className="w-5 h-5 text-emerald-500" />
                                </div>
                                <h3 className="text-xl font-bold">Create Goal</h3>
                            </div>
                            <button onClick={() => setShowCreate(false)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                                <X className="w-5 h-5 text-muted-foreground" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-5">
                            <div>
                                <label className="text-sm font-semibold block mb-2">Goal Title *</label>
                                <input
                                    type="text"
                                    value={newGoal.title}
                                    onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                                    placeholder="e.g., Get Fit This Year"
                                    className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="text-sm font-semibold block mb-2">Life Pillar *</label>
                                <select
                                    value={newGoal.pillarId}
                                    onChange={(e) => setNewGoal({ ...newGoal, pillarId: e.target.value })}
                                    className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                                >
                                    <option value="">Select pillar...</option>
                                    {pillars.map((pillar) => (
                                        <option key={pillar.id} value={pillar.id}>{pillar.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-semibold block mb-2">Description</label>
                                <textarea
                                    value={newGoal.description}
                                    onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                                    placeholder="What does achieving this goal look like?"
                                    className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 resize-none"
                                    rows={3}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-semibold block mb-2">Cover Image</label>
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Image URL or upload..."
                                            value={newGoal.coverImage || ''}
                                            onChange={(e) => setNewGoal({ ...newGoal, coverImage: e.target.value })}
                                            className="flex-1 bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
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
                                    disabled={!newGoal.title.trim() || !newGoal.pillarId || isCreating}
                                    className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/25"
                                >
                                    {isCreating ? 'Creating...' : 'Create Goal'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
