'use client';

import { useState, useEffect } from 'react';
import {
    updateGoal,
    createQuarterlyObjective,
    linkContributor,
    getAvailableResources,
    linkProjectToGoal,
    linkRitualToGoal,
    unlinkProjectFromGoal,
    unlinkRitualFromGoal
} from '@/actions/goals';
import {
    Target,
    Calendar,
    FolderKanban,
    Repeat,
    AlertTriangle,
    Eye,
    CheckCircle2,
    Plus,
    X,
    TrendingUp,
    Layers,
    FileText,
    ArrowUpRight,
    Megaphone,
    Search,
    Upload,
    Trash2,
    Unlink
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

// Real Link Resource Modal
const LinkResourceModal = ({
    isOpen,
    onClose,
    type,
    goalId
}: {
    isOpen: boolean;
    onClose: () => void;
    type: 'project' | 'ritual';
    goalId: string;
}) => {
    const [resources, setResources] = useState<{ id: string; title: string; pillar?: { name: string } }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadResources();
        }
    }, [isOpen, type]);

    const loadResources = async () => {
        setIsLoading(true);
        try {
            const data = await getAvailableResources(goalId);
            setResources(type === 'project' ? data.projects : data.rituals);
        } catch (error) {
            toast.error('Failed to load resources');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLink = async (resourceId: string) => {
        setIsSaving(true);
        try {
            if (type === 'project') {
                await linkProjectToGoal(resourceId, goalId);
                toast.success('Project linked successfully');
            } else {
                await linkRitualToGoal(resourceId, goalId);
                toast.success('Ritual linked successfully');
            }
            onClose();
            window.location.reload(); // Refresh to show new link
        } catch (error) {
            toast.error('Failed to link resource');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="glass-panel rounded-xl p-6 max-w-md w-full shadow-2xl border border-border/50">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Link Existing {type === 'project' ? 'Project' : 'Ritual'}</h3>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {isLoading ? (
                        <div className="text-center py-8 text-muted-foreground">Loading available {type}s...</div>
                    ) : resources.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg">
                            No unlinked {type}s found.
                        </div>
                    ) : (
                        resources.map((resource) => (
                            <button
                                key={resource.id}
                                onClick={() => handleLink(resource.id)}
                                disabled={isSaving}
                                className="w-full text-left p-3 hover:bg-muted/50 rounded-lg transition-colors border border-transparent hover:border-border flex items-center justify-between group"
                            >
                                <div>
                                    <div className="font-medium">{resource.title}</div>
                                    {resource.pillar && (
                                        <div className="text-xs text-muted-foreground">{resource.pillar.name}</div>
                                    )}
                                </div>
                                <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

type Goal = {
    id: string;
    title: string;
    description: string | null;
    status: string;
    targetDate: string | null;
    notes: string | null;
    pillar: { id: string; name: string; colorHex: string };
    quarterlyObjectives: {
        id: string;
        quarter: string;
        title: string;
        status: string;
        topOutcomes: string[];
        projects: ExtendedProject[];
        rituals: { id: string; title: string; cadenceType: string; targetPerCycle: number; currentCycleCount: number }[];
    }[];
    projects: ExtendedProject[];
    rituals: { id: string; title: string; cadenceType: string; targetPerCycle: number; currentCycleCount: number }[];
};

type ExtendedProject = {
    id: string;
    title: string;
    status: string;
    milestonesTotal: number;
    milestonesComplete: number;
    tasksCount: number;
    milestones?: any[]; // Allow any for now to avoid deep type hacking, but ideally strictly typed
    tasks: {
        id: string;
        title: string;
        status: string;
        estimateMinutes: number | null;
        energyLevel: string;
        scheduledDate: string | null;
    }[];
};

type Tab = 'overview' | 'quarterly' | 'contributors' | 'progress' | 'actions' | 'notes';

const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: Target },
    { id: 'quarterly', label: 'Quarterly', icon: Calendar },
    { id: 'contributors', label: 'Contributors', icon: Layers },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
    { id: 'actions', label: 'Related Actions', icon: CheckCircle2 },
    { id: 'notes', label: 'Notes', icon: FileText },
];

export function GoalDetailClient({ goal, health, jobHuntingRitualId }: {
    goal: any;
    health: any;
    jobHuntingRitualId?: string | null;
}) {
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [showAddQuarter, setShowAddQuarter] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showLinkModal, setShowLinkModal] = useState<{ isOpen: boolean; type: 'project' | 'ritual' }>({ isOpen: false, type: 'project' });
    const [notes, setNotes] = useState(goal.notes || '');
    const [newQuarter, setNewQuarter] = useState({
        quarter: getCurrentQuarter(),
        title: '',
        topOutcomes: ['', '', ''],
    });

    function getCurrentQuarter() {
        const now = new Date();
        return `${now.getFullYear()}-Q${Math.ceil((now.getMonth() + 1) / 3)}`;
    }

    // Helper to get next milestone
    const getNextMilestone = (milestones: any[]) => {
        if (!milestones || milestones.length === 0) return null;
        const now = new Date();
        // Pending milestones with a target date, sorted by date
        const pending = milestones
            .filter((m: any) => m.status !== 'complete' && m.targetDate)
            .sort((a: any, b: any) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime());
        // Return first pending one
        return pending[0] || null;
    };

    const handleCreateQuarter = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newQuarter.title.trim()) return;

        try {
            await createQuarterlyObjective({
                goalId: goal.id,
                quarter: newQuarter.quarter,
                title: newQuarter.title.trim(),
                topOutcomes: newQuarter.topOutcomes.filter((o) => o.trim()),
            });
            toast.success('Quarterly objective created');
            window.location.reload();
        } catch {
            toast.error('Failed to create');
        }
    };

    const handleSaveNotes = async () => {
        try {
            await updateGoal(goal.id, { notes });
            toast.success('Notes saved');
        } catch {
            toast.error('Failed to save notes');
        }
    };

    const HealthBadge = ({ health, reasons }: { health: string; reasons: string[] }) => {
        const colors = {
            on_track: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
            watch: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
            at_risk: 'bg-red-500/10 text-red-400 border-red-500/30',
        };
        const icons = {
            on_track: CheckCircle2,
            watch: Eye,
            at_risk: AlertTriangle,
        };
        const Icon = icons[health as keyof typeof icons] || CheckCircle2;

        return (
            <div className="flex items-center gap-2">
                <span className={`px-3 py-1.5 rounded-lg text-sm font-medium border flex items-center gap-2 ${colors[health as keyof typeof colors] || colors.on_track}`}>
                    <Icon className="w-4 h-4" />
                    {health.replace('_', ' ').charAt(0).toUpperCase() + health.replace('_', ' ').slice(1)}
                </span>
                {reasons.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                        {reasons.slice(0, 2).map((r, i) => (
                            <span key={i} className="block">{r}</span>
                        ))}
                    </div>
                )}
            </div>
        );
    };
    const EditGoalModal = ({
        isOpen,
        onClose,
        goal,
    }: {
        isOpen: boolean;
        onClose: () => void;
        goal: Goal;
    }) => {
        const [formData, setFormData] = useState({
            title: goal.title,
            description: goal.description || '',
            status: goal.status,
            targetDate: goal.targetDate ? new Date(goal.targetDate).toISOString().split('T')[0] : '',
            coverImage: goal.coverImage || '',
        });
        const [isSaving, setIsSaving] = useState(false);
        const [isUploading, setIsUploading] = useState(false);

        const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;

            setIsUploading(true);
            const data = new FormData();
            data.append('file', file);

            try {
                const res = await fetch('/api/upload', {
                    method: 'POST',
                    body: data,
                });
                const json = await res.json();
                if (json.success) {
                    setFormData((prev) => ({ ...prev, coverImage: json.url }));
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

        const handleSave = async (e: React.FormEvent) => {
            e.preventDefault();
            setIsSaving(true);
            try {
                await updateGoal(goal.id, {
                    ...formData,
                    targetDate: formData.targetDate ? new Date(formData.targetDate) : null,
                });
                toast.success('Goal updated');
                onClose();
                window.location.reload();
            } catch {
                toast.error('Failed to update goal');
            } finally {
                setIsSaving(false);
            }
        };

        if (!isOpen) return null;

        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                <div className="bg-card rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-border">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold">Edit Goal</h3>
                        <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
                            <X className="w-5 h-5 text-muted-foreground" />
                        </button>
                    </div>

                    <form onSubmit={handleSave} className="space-y-4">
                        <div>
                            <label className="text-sm font-semibold block mb-2">Title</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-sm font-semibold block mb-2">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-semibold block mb-2">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                >
                                    <option value="active">Active</option>
                                    <option value="completed">Completed</option>
                                    <option value="paused">Paused</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-semibold block mb-2">Target Date</label>
                                <input
                                    type="date"
                                    value={formData.targetDate}
                                    onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                                    className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-semibold block mb-2">Cover Image</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={formData.coverImage}
                                    onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                                    placeholder="Image URL..."
                                    className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                                <label className="cursor-pointer bg-muted hover:bg-muted/80 px-4 py-3 rounded-xl flex items-center justify-center transition-colors">
                                    <Upload className="w-5 h-5 text-muted-foreground" />
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

                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 bg-muted hover:bg-muted/80 rounded-xl font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="glass-panel rounded-xl p-6 relative overflow-hidden">
                {/* Background Cover */}
                {goal.coverImage && (
                    <div className="absolute inset-0 z-0">
                        <div
                            className="absolute inset-0 bg-cover bg-center opacity-10"
                            style={{ backgroundImage: `url(${goal.coverImage})` }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/50" />
                    </div>
                )}

                <div className="relative z-10 flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{goal.title}</h1>
                        {goal.description && (
                            <p className="text-muted-foreground mt-1">{goal.description}</p>
                        )}
                        {goal.targetDate && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                                <Calendar className="w-4 h-4" />
                                <span>Target: {new Date(goal.targetDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowEditModal(true)}
                            className="px-4 py-2 bg-muted/50 hover:bg-muted text-sm font-medium rounded-lg transition-colors border border-border/50"
                        >
                            Edit Details
                        </button>
                        <HealthBadge health={health.health} reasons={health.reasons} />
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-6 pt-4 border-t border-border/30 relative z-10">

                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Estimated Progress</span>
                        <span className="text-sm text-muted-foreground">{health.progressEstimate}%</span>
                    </div>
                    <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${health.progressEstimate}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === tab.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="glass-panel rounded-xl p-6">
                {/* Overview */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 bg-muted/30 rounded-lg text-center">
                                <p className="text-2xl font-bold">{health.contributorCount}</p>
                                <p className="text-sm text-muted-foreground">Contributors</p>
                            </div>
                            <div className="p-4 bg-muted/30 rounded-lg text-center">
                                <p className="text-2xl font-bold">{goal.quarterlyObjectives.length}</p>
                                <p className="text-sm text-muted-foreground">Quarters</p>
                            </div>
                            <div className="p-4 bg-muted/30 rounded-lg text-center">
                                <p className="text-2xl font-bold">{goal.projects.length + goal.quarterlyObjectives.reduce((acc: number, q: any) => acc + q.projects.length, 0)}</p>
                                <p className="text-sm text-muted-foreground">Projects</p>
                            </div>
                            <div className="p-4 bg-muted/30 rounded-lg text-center">
                                <p className="text-2xl font-bold">{goal.rituals.length + goal.quarterlyObjectives.reduce((acc: number, q: any) => acc + q.rituals.length, 0)}</p>
                                <p className="text-sm text-muted-foreground">Rituals</p>
                            </div>
                        </div>

                        {goal.quarterlyObjectives.length > 0 && (
                            <div>
                                <h3 className="font-semibold mb-3">Active Quarterly Objectives</h3>
                                <div className="space-y-2">
                                    {goal.quarterlyObjectives.filter((q: any) => q.status === 'active').map((q: any) => (
                                        <div key={q.id} className="p-3 bg-muted/30 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-mono text-muted-foreground">{q.quarter}</span>
                                                <span className="font-medium">{q.title}</span>
                                            </div>
                                            {q.topOutcomes.length > 0 && (
                                                <div className="mt-2 text-sm text-muted-foreground">
                                                    {q.topOutcomes.slice(0, 2).map((o: string, i: number) => (
                                                        <p key={i}>• {o}</p>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Quarterly */}
                {activeTab === 'quarterly' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold">Quarterly Objectives</h3>
                            <button
                                onClick={() => setShowAddQuarter(true)}
                                className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 flex items-center gap-1"
                            >
                                <Plus className="w-4 h-4" />
                                Add Quarter
                            </button>
                        </div>

                        {goal.quarterlyObjectives.length === 0 ? (
                            <p className="text-muted-foreground text-center py-8">
                                No quarterly objectives yet. Create one to break down this goal.
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {goal.quarterlyObjectives.map((q: any) => (
                                    <div key={q.id} className="p-4 bg-muted/30 rounded-lg">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">{q.quarter}</span>
                                                <span className="font-semibold">{q.title}</span>
                                            </div>
                                            <span className={`text-xs px-2 py-0.5 rounded ${q.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'
                                                }`}>
                                                {q.status}
                                            </span>
                                        </div>

                                        {q.topOutcomes.length > 0 && (
                                            <div className="text-sm text-muted-foreground mb-3">
                                                {q.topOutcomes.map((o: string, i: number) => (
                                                    <p key={i}>• {o}</p>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex gap-4 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <FolderKanban className="w-4 h-4" />
                                                {q.projects.length} projects
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Repeat className="w-4 h-4" />
                                                {q.rituals.length} rituals
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Contributors */}
                {activeTab === 'contributors' && (
                    <div className="space-y-6">
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <FolderKanban className="w-5 h-5" />
                                    Projects
                                </h3>
                                <button
                                    onClick={() => setShowLinkModal({ isOpen: true, type: 'project' })}
                                    className="text-xs text-primary hover:underline flex items-center gap-1"
                                >
                                    <Plus className="w-3 h-3" /> Link Project
                                </button>
                            </div>
                            {[...goal.projects, ...goal.quarterlyObjectives.flatMap((q: any) => q.projects)].length === 0 ? (
                                <p className="text-muted-foreground text-sm">No projects linked yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {[...goal.projects, ...goal.quarterlyObjectives.flatMap((q: any) => q.projects)].map((p: any) => {
                                        const progress = p.milestonesTotal > 0 ? Math.round((p.milestonesComplete / p.milestonesTotal) * 100) : 0;
                                        return (
                                            <div key={p.id} className="relative group">
                                                <Link
                                                    href={`/projects/${p.id}`}
                                                    className="block p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-primary/10"
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="font-medium">{p.title}</span>
                                                        <span className={`text-xs px-2 py-0.5 rounded ${p.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'}`}>{p.status}</span>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                            <span>{progress}% Complete</span>
                                                            <span>{p.milestonesComplete}/{p.milestonesTotal} Milestones</span>
                                                        </div>
                                                        <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-primary transition-all"
                                                                style={{ width: `${progress}%` }}
                                                            />
                                                        </div>

                                                        {(() => {
                                                            const nextMilestone = getNextMilestone(p.milestones || []);
                                                            return nextMilestone ? (
                                                                <div className="mt-2 flex items-center gap-2 bg-primary/5 p-2 rounded text-xs text-primary/80">
                                                                    <Calendar className="w-3 h-3" />
                                                                    <span className="font-medium">Next:</span>
                                                                    <span>{nextMilestone.title}</span>
                                                                    <span className="text-muted-foreground ml-auto">
                                                                        {new Date(nextMilestone.targetDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                                    </span>
                                                                </div>
                                                            ) : null;
                                                        })()}

                                                        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                                                            <span>{p.tasksCount} Tasks</span>
                                                        </div>
                                                    </div>
                                                </Link>
                                                <button
                                                    onClick={async (e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        if (confirm('Unlink this project from the goal?')) {
                                                            await unlinkProjectFromGoal(p.id, goal.id);
                                                            window.location.reload();
                                                        }
                                                    }}
                                                    className="absolute top-2 right-2 p-1.5 bg-background/80 hover:bg-red-500 hover:text-white text-muted-foreground rounded-md opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                                                    title="Unlink Project"
                                                >
                                                    <Unlink className="w-4 h-4" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>



                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <Repeat className="w-5 h-5" />
                                    Rituals
                                </h3>
                                <button
                                    onClick={() => setShowLinkModal({ isOpen: true, type: 'ritual' })}
                                    className="text-xs text-primary hover:underline flex items-center gap-1"
                                >
                                    <Plus className="w-3 h-3" /> Link Ritual
                                </button>
                            </div>
                            {[...goal.rituals, ...goal.quarterlyObjectives.flatMap((q: any) => q.rituals)].length === 0 ? (
                                <p className="text-muted-foreground text-sm">No rituals linked yet.</p>
                            ) : (
                                <div className="space-y-2">
                                    {[...goal.rituals, ...goal.quarterlyObjectives.flatMap((q: any) => q.rituals)].map((s: any) => (
                                        <div key={s.id} className="relative group">
                                            <Link
                                                href={`/rituals/${s.id}`}
                                                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50"
                                            >
                                                <div>
                                                    <span className="font-medium">{s.title}</span>
                                                    {/* Job Tracker Badge */}
                                                    {jobHuntingRitualId === s.id && (
                                                        <div className="flex items-center gap-1 text-[10px] text-primary font-medium mt-1">
                                                            <Target className="w-3 h-3" />
                                                            Job Tracker Linked
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <span className={s.currentCycleCount >= s.targetPerCycle ? 'text-emerald-500' : 'text-muted-foreground'}>
                                                        {s.currentCycleCount}/{s.targetPerCycle}
                                                    </span>
                                                    <span className="text-muted-foreground">{s.cadenceType}</span>
                                                </div>
                                            </Link>

                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {/* Linkage shortcut */}
                                                {jobHuntingRitualId === s.id && (
                                                    <Link
                                                        href="/career/job-tracker"
                                                        className="p-2 text-muted-foreground hover:text-primary transition-colors"
                                                        title="Go to Job Tracker"
                                                    >
                                                        <ArrowUpRight className="w-4 h-4" />
                                                    </Link>
                                                )}

                                                <button
                                                    onClick={async (e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        if (confirm('Unlink this ritual from the goal?')) {
                                                            await unlinkRitualFromGoal(s.id, goal.id);
                                                            window.location.reload();
                                                        }
                                                    }}
                                                    className="p-2 bg-background/80 hover:bg-red-500 hover:text-white text-muted-foreground rounded-md shadow-sm transition-colors"
                                                    title="Unlink Ritual"
                                                >
                                                    <Unlink className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Progress */}
                {activeTab === 'progress' && (
                    <div className="space-y-4">
                        <p className="text-muted-foreground">
                            Progress is calculated from milestone completion and ritual adherence.
                        </p>
                        <div className="p-4 bg-muted/30 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">Overall Progress</span>
                                <span className="text-lg font-bold">{health.progressEstimate}%</span>
                            </div>
                            <div className="h-3 bg-muted/50 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-primary to-emerald-500"
                                    style={{ width: `${health.progressEstimate}%` }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Related Actions (Split View) */}
                {activeTab === 'actions' && (
                    <div className="space-y-8">
                        {/* Logic to split tasks */}
                        {(() => {
                            const allTasks = [...goal.projects, ...goal.quarterlyObjectives.flatMap((q: any) => q.projects)]
                                .flatMap((p: any) => p.tasks.map((t: any) => ({ ...t, projectName: p.title, projectId: p.id })));

                            const now = new Date();
                            now.setHours(0, 0, 0, 0);

                            const activeTasks = allTasks.filter(t => {
                                if (t.status === 'done') return false;
                                if (!t.scheduledDate) return true; // Unscheduled is active backlog
                                return new Date(t.scheduledDate) <= now;
                            }).sort((a, b) => {
                                if (a.scheduledDate && b.scheduledDate) return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
                                return 0;
                            });

                            const upcomingTasks = allTasks.filter(t => {
                                if (t.status === 'done') return false;
                                return t.scheduledDate && new Date(t.scheduledDate) > now;
                            }).sort((a, b) => new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime());

                            if (allTasks.length === 0) return <p className="text-muted-foreground">No tasks found in linked projects.</p>;

                            return (
                                <>
                                    {/* Active Tasks */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <h3 className="font-semibold">Active Now</h3>
                                            <span className="text-xs text-muted-foreground ml-2">{activeTasks.length} tasks</span>
                                        </div>
                                        <div className="space-y-2">
                                            {activeTasks.length === 0 ? (
                                                <p className="text-sm text-muted-foreground italic">No active tasks. Good job!</p>
                                            ) : (
                                                activeTasks.map(task => (
                                                    <div key={task.id} className="p-3 bg-muted/30 rounded-lg flex items-center justify-between border-l-2 border-emerald-500/50">
                                                        <div>
                                                            <p className="font-medium text-sm">{task.title}</p>
                                                            <p className="text-xs text-muted-foreground">{task.projectName}</p>
                                                        </div>
                                                        {task.scheduledDate && (
                                                            <span className="text-xs text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded">
                                                                Today
                                                            </span>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* Upcoming Tasks */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Calendar className="w-4 h-4 text-primary" />
                                            <h3 className="font-semibold">Upcoming</h3>
                                            <span className="text-xs text-muted-foreground ml-2">{upcomingTasks.length} scheduled</span>
                                        </div>
                                        <div className="space-y-2 opacity-80">
                                            {upcomingTasks.length === 0 ? (
                                                <p className="text-sm text-muted-foreground italic">Nothing scheduled for the future.</p>
                                            ) : (
                                                upcomingTasks.map(task => (
                                                    <div key={task.id} className="p-3 bg-muted/10 rounded-lg flex items-center justify-between">
                                                        <div>
                                                            <p className="font-medium text-sm">{task.title}</p>
                                                            <p className="text-xs text-muted-foreground">{task.projectName}</p>
                                                        </div>
                                                        <div className="text-xs flex items-center gap-1 text-muted-foreground">
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(task.scheduledDate!).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                )}

                {/* Notes */}
                {activeTab === 'notes' && (
                    <div className="space-y-4">
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add notes, reflections, or ideas for this goal..."
                            className="w-full bg-muted/50 border border-border/50 rounded-lg px-4 py-3 text-sm min-h-[200px]"
                        />
                        <button
                            onClick={handleSaveNotes}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90"
                        >
                            Save Notes
                        </button>
                    </div>
                )}
            </div>


            {/* Add Quarter Modal */}
            {
                showAddQuarter && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="glass-panel rounded-xl p-6 max-w-md w-full">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Add Quarterly Objective</h3>
                                <button onClick={() => setShowAddQuarter(false)} className="text-muted-foreground hover:text-foreground">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleCreateQuarter} className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium block mb-1">Quarter</label>
                                    <input
                                        type="text"
                                        value={newQuarter.quarter}
                                        onChange={(e) => setNewQuarter({ ...newQuarter, quarter: e.target.value })}
                                        placeholder="e.g., 2026-Q1"
                                        className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium block mb-1">Title *</label>
                                    <input
                                        type="text"
                                        value={newQuarter.title}
                                        onChange={(e) => setNewQuarter({ ...newQuarter, title: e.target.value })}
                                        placeholder="What's the focus for this quarter?"
                                        className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium block mb-1">Top Outcomes (1-3)</label>
                                    {newQuarter.topOutcomes.map((o, i) => (
                                        <input
                                            key={i}
                                            type="text"
                                            value={o}
                                            onChange={(e) => {
                                                const newOutcomes = [...newQuarter.topOutcomes];
                                                newOutcomes[i] = e.target.value;
                                                setNewQuarter({ ...newQuarter, topOutcomes: newOutcomes });
                                            }}
                                            placeholder={`Outcome ${i + 1}...`}
                                            className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm mb-2"
                                        />
                                    ))}
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddQuarter(false)}
                                        className="flex-1 py-2 bg-muted/50 hover:bg-muted rounded-lg font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!newQuarter.title.trim()}
                                        className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                                    >
                                        Create
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Link Modal */}
            <LinkResourceModal
                isOpen={showLinkModal.isOpen}
                onClose={() => setShowLinkModal({ ...showLinkModal, isOpen: false })}
                type={showLinkModal.type}
                goalId={goal.id}
            />

            {/* Edit Goal Modal */}
            <EditGoalModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                goal={goal}
            />
        </div >
    );
}
