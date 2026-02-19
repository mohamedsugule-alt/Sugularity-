'use client';

import { useState, useEffect } from 'react';
import {
    createJobApplication,
    updateJobApplication,
    deleteJobApplication,
    moveJobToStage,
    getLinkedRitual,
    linkJobHuntingRitual
} from '@/actions/jobs';
import { getRituals } from '@/actions/core';
import {
    Plus,
    X,
    ExternalLink,
    MapPin,
    DollarSign,
    User,
    Mail,
    Calendar,
    MoreHorizontal,
    Trash2,
    Edit,
    GripVertical,
    Target,
    AlertTriangle,
    Sparkles,
    TrendingUp,
    Building2
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { startOfWeek, format, subWeeks } from 'date-fns';

// Define types and constants locally
export type JobStage = 'wishlist' | 'applied' | 'screening' | 'interview' | 'offer' | 'rejected';

export const JOB_STAGES: { id: JobStage; label: string; color: string; icon: string }[] = [
    { id: 'wishlist', label: 'Wishlist', color: '#8B5CF6', icon: '🎯' },
    { id: 'applied', label: 'Applied', color: '#3B82F6', icon: '📨' },
    { id: 'screening', label: 'Screening', color: '#F59E0B', icon: '📞' },
    { id: 'interview', label: 'Interview', color: '#10B981', icon: '🎤' },
    { id: 'offer', label: 'Offer', color: '#22C55E', icon: '🎉' },
    { id: 'rejected', label: 'Rejected', color: '#EF4444', icon: '❌' },
];

type JobApplication = {
    id: string;
    company: string;
    role: string;
    stage: string;
    salary: string | null;
    location: string | null;
    jobLink: string | null;
    notes: string | null;
    contactName: string | null;
    contactEmail: string | null;
    appliedDate: Date | null;
    logoUrl: string | null;
    history: string | null; // JSON
    lastActivityAt: Date;
    createdAt: Date;
};

type JobsByStage = Record<JobStage, JobApplication[]>;

export function JobTrackerClient({ initialJobs }: { initialJobs: JobsByStage }) {
    const [jobs, setJobs] = useState<JobsByStage>(initialJobs);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedJob, setSelectedJob] = useState<JobApplication | null>(null);
    const [editingJob, setEditingJob] = useState<JobApplication | null>(null);
    const [draggedJob, setDraggedJob] = useState<JobApplication | null>(null);
    const [dropTarget, setDropTarget] = useState<JobStage | null>(null);

    // Form state for new job
    const [formData, setFormData] = useState({
        company: '',
        role: '',
        stage: 'wishlist' as JobStage,
        salary: '',
        location: '',
        jobLink: '',
        notes: '',
        contactName: '',
        contactEmail: '',
    });

    const resetForm = () => {
        setFormData({
            company: '',
            role: '',
            stage: 'wishlist',
            salary: '',
            location: '',
            jobLink: '',
            notes: '',
            contactName: '',
            contactEmail: '',
        });
    };

    const handleAddJob = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.company.trim() || !formData.role.trim()) return;

        try {
            const newJob = await createJobApplication({
                company: formData.company,
                role: formData.role,
                stage: formData.stage,
                salary: formData.salary || undefined,
                location: formData.location || undefined,
                jobLink: formData.jobLink || undefined,
                notes: formData.notes || undefined,
                contactName: formData.contactName || undefined,
                contactEmail: formData.contactEmail || undefined,
            });

            // The server action returns the DB object, which should match JobApplication if Prisma was generated.
            // Since Prisma isn't generated yet, we cast to unknown then JobApplication to silence the error temporarily,
            // or better, manually ensure the shape matches what we expect the server to return even without TS knowing it.
            const optimisticJob: JobApplication = {
                ...newJob,
                logoUrl: (newJob as any).logoUrl ?? null,
                history: (newJob as any).history ?? null,
            } as JobApplication;

            setJobs(prev => ({
                ...prev,
                [formData.stage]: [optimisticJob, ...prev[formData.stage]],
            }));

            resetForm();
            setShowAddModal(false);
            toast.success('Job added!');
        } catch {
            toast.error('Failed to add job');
        }
    };

    const handleUpdateJob = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingJob) return;

        try {
            await updateJobApplication(editingJob.id, {
                company: formData.company,
                role: formData.role,
                stage: formData.stage,
                salary: formData.salary || null,
                location: formData.location || null,
                jobLink: formData.jobLink || null,
                notes: formData.notes || null,
                contactName: formData.contactName || null,
                contactEmail: formData.contactEmail || null,
            });

            // Update local state
            const oldStage = editingJob.stage as JobStage;
            const newStage = formData.stage;

            if (oldStage !== newStage) {
                setJobs(prev => ({
                    ...prev,
                    [oldStage]: prev[oldStage].filter(j => j.id !== editingJob.id),
                    [newStage]: [{ ...editingJob, ...formData, stage: newStage }, ...prev[newStage]],
                }));
            } else {
                setJobs(prev => ({
                    ...prev,
                    [oldStage]: prev[oldStage].map(j =>
                        j.id === editingJob.id ? { ...j, ...formData } : j
                    ),
                }));
            }

            setEditingJob(null);
            setSelectedJob(null);
            resetForm();
            toast.success('Job updated!');
        } catch {
            toast.error('Failed to update job');
        }
    };

    const handleDeleteJob = async (job: JobApplication) => {
        if (!confirm(`Delete ${job.company} - ${job.role}?`)) return;

        try {
            await deleteJobApplication(job.id);
            setJobs(prev => ({
                ...prev,
                [job.stage as JobStage]: prev[job.stage as JobStage].filter(j => j.id !== job.id),
            }));
            setSelectedJob(null);
            toast.success('Job deleted');
        } catch {
            toast.error('Failed to delete job');
        }
    };

    // Drag and drop handlers
    const handleDragStart = (job: JobApplication) => {
        setDraggedJob(job);
    };

    const handleDragOver = (e: React.DragEvent, stage: JobStage) => {
        e.preventDefault();
        setDropTarget(stage);
    };

    const handleDragLeave = () => {
        setDropTarget(null);
    };

    const handleDrop = async (e: React.DragEvent, targetStage: JobStage) => {
        e.preventDefault();
        setDropTarget(null);

        if (!draggedJob || draggedJob.stage === targetStage) {
            setDraggedJob(null);
            return;
        }

        const oldStage = draggedJob.stage as JobStage;

        // Optimistic update
        setJobs(prev => ({
            ...prev,
            [oldStage]: prev[oldStage].filter(j => j.id !== draggedJob.id),
            [targetStage]: [{ ...draggedJob, stage: targetStage }, ...prev[targetStage]],
        }));

        try {
            await moveJobToStage(draggedJob.id, targetStage);
            toast.success(`Moved to ${JOB_STAGES.find(s => s.id === targetStage)?.label}`);
        } catch {
            // Rollback
            setJobs(prev => ({
                ...prev,
                [targetStage]: prev[targetStage].filter(j => j.id !== draggedJob.id),
                [oldStage]: [draggedJob, ...prev[oldStage]],
            }));
            toast.error('Failed to move job');
        }

        setDraggedJob(null);
    };

    const openEditModal = (job: JobApplication) => {
        setEditingJob(job);
        setFormData({
            company: job.company,
            role: job.role,
            stage: job.stage as JobStage,
            salary: job.salary || '',
            location: job.location || '',
            jobLink: job.jobLink || '',
            notes: job.notes || '',
            contactName: job.contactName || '',
            contactEmail: job.contactEmail || '',
        });
        setSelectedJob(null);
    };

    const getStageColor = (stage: JobStage) => {
        return JOB_STAGES.find(s => s.id === stage)?.color || '#666';
    };

    // Analytics State
    const [activeTab, setActiveTab] = useState<'board' | 'analytics'>('board');
    const [linkedRitualId, setLinkedRitualId] = useState<string | null>(null);
    const [rituals, setRituals] = useState<{ id: string; title: string }[]>([]);

    useEffect(() => {
        // Fetch linked ritual and available rituals
        const loadRituals = async () => {
            try {
                const [linked, allRituals] = await Promise.all([
                    getLinkedRitual(),
                    getRituals()
                ]);

                if (linked) setLinkedRitualId(linked.id);
                setRituals(allRituals.map(r => ({ id: r.id, title: r.title })));
            } catch (error) {
                console.error('Failed to load rituals', error);
            }
        };
        loadRituals();
    }, []);

    const handleLinkRitual = async (ritualId: string) => {
        try {
            // We need to import this dynamically or pass as prop to avoid server/client issues if not careful,
            // but actions are safe to import.
            const { linkJobHuntingRitual } = await import('@/actions/jobs');
            await linkJobHuntingRitual(ritualId);
            setLinkedRitualId(ritualId);
            toast.success('Ritual linked! Jobs will now sync.');
        } catch {
            toast.error('Failed to link ritual');
        }
    };

    // Calculate Analytics
    const getFunnelData = () => {
        const wishlist = jobs.wishlist.length;
        const applied = jobs.applied.length;
        const screening = jobs.screening.length;
        const interview = jobs.interview.length;
        const offer = jobs.offer.length;
        const rejected = jobs.rejected.length;

        // Funnel is usually a subset, but here our stages are mutually exclusive buckets.
        // So a "Funnel" view might be: Total Applications -> Screenings -> Interviews -> Offers
        // We can approximate "Total Applications" as Applied + Screening + Interview + Offer + Rejected
        const totalApplied = applied + screening + interview + offer + rejected;

        return [
            { label: 'Applied', value: totalApplied, color: '#3B82F6' },
            { label: 'Screening', value: screening + interview + offer, color: '#F59E0B' },
            { label: 'Interview', value: interview + offer, color: '#10B981' },
            { label: 'Offer', value: offer, color: '#22C55E' },
        ];
    };

    const getVelocityData = () => {
        const weeks: Record<string, number> = {};
        const now = new Date();

        // Initialize last 8 weeks with readable labels (e.g., "Jan 22")
        for (let i = 0; i < 8; i++) {
            const d = subWeeks(now, i);
            const weekStart = startOfWeek(d, { weekStartsOn: 1 }); // Monday start
            const label = format(weekStart, 'MMM d');
            weeks[label] = 0;
        }

        Object.values(jobs).flat().forEach(job => {
            if (job.appliedDate) {
                const d = new Date(job.appliedDate);
                const weekStart = startOfWeek(d, { weekStartsOn: 1 });
                const label = format(weekStart, 'MMM d');

                // Only count if within our tracked range
                if (weeks[label] !== undefined) {
                    weeks[label]++;
                }
            }
        });

        return Object.entries(weeks).reverse().map(([name, value]) => ({ name, value }));
    };



    const funnelData = getFunnelData();
    const velocityData = getVelocityData();

    return (
        <div className="space-y-4">
            {/* Stats Bar & Tab Switcher */}
            <div className="flex items-center justify-between">
                <div className="flex bg-muted/50 p-1 rounded-lg">
                    <button
                        suppressHydrationWarning
                        onClick={() => setActiveTab('board')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'board' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Kanban Board
                    </button>
                    <button
                        suppressHydrationWarning
                        onClick={() => setActiveTab('analytics')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'analytics' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Analytics & Goals
                    </button>
                </div>

                {activeTab === 'board' && (
                    <button
                        suppressHydrationWarning
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Job
                    </button>
                )}
            </div>

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    {/* Metrics Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between">
                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Applications</span>
                            <div className="flex items-end gap-2 mt-2">
                                <span className="text-3xl font-bold">{Object.values(jobs).flat().length}</span>
                                <span className="text-xs text-emerald-500 mb-1 flex items-center">
                                    <TrendingUp className="w-3 h-3 mr-1" /> All Time
                                </span>
                            </div>
                        </div>
                        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between">
                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Interview Rate</span>
                            <div className="flex items-end gap-2 mt-2">
                                <span className="text-3xl font-bold">
                                    {funnelData[0].value > 0
                                        ? Math.round((funnelData[2].value / funnelData[0].value) * 100)
                                        : 0}%
                                </span>
                                <span className="text-xs text-muted-foreground mb-1">App to Interview</span>
                            </div>
                        </div>
                        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between">
                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Offer Rate</span>
                            <div className="flex items-end gap-2 mt-2">
                                <span className="text-3xl font-bold">
                                    {funnelData[0].value > 0
                                        ? Math.round((funnelData[3].value / funnelData[2].value) * 100) || 0
                                        : 0}%
                                </span>
                                <span className="text-xs text-muted-foreground mb-1">Interview to Offer</span>
                            </div>
                        </div>
                        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between border-l-4 border-l-primary">
                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Job Hunt Goal</span>
                            <div className="flex items-center gap-2 mt-2">
                                <select
                                    className="text-xs bg-muted/50 border border-border/50 rounded-lg px-2 py-1 flex-1"
                                    value={linkedRitualId || ''}
                                    onChange={(e) => handleLinkRitual(e.target.value)}
                                >
                                    <option value="">Link Ritual...</option>
                                    {rituals.map(r => (
                                        <option key={r.id} value={r.id}>{r.title}</option>
                                    ))}
                                </select>
                            </div>
                            {linkedRitualId && <span className="text-[10px] text-emerald-500 mt-1">● Active Tracking</span>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Funnel Chart */}
                        <div className="glass-panel p-6 rounded-xl min-h-[300px]">
                            <h3 className="font-semibold mb-6 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-violet-500" />
                                Conversion Funnel
                            </h3>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart layout="vertical" data={funnelData} barSize={20}>
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="label"
                                        type="category"
                                        width={80}
                                        tick={{ fontSize: 12 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        contentStyle={{ backgroundColor: '#1e1e2e', borderRadius: '12px', border: '1px solid #333' }}
                                    />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                        {funnelData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Velocity Chart */}
                        <div className="glass-panel p-6 rounded-xl min-h-[300px]">
                            <h3 className="font-semibold mb-6 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-blue-500" />
                                Application Velocity
                            </h3>
                            <ResponsiveContainer width="100%" height={200}>
                                <AreaChart data={velocityData}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 10 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis hide />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e1e2e', borderRadius: '12px', border: '1px solid #333' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#8B5CF6"
                                        fillOpacity={1}
                                        fill="url(#colorValue)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* Kanban Board */}
            {activeTab === 'board' && (
                <div className="grid grid-cols-6 gap-3 min-h-[600px]">
                    {JOB_STAGES.map(stage => (
                        <div
                            key={stage.id}
                            onDragOver={(e) => handleDragOver(e, stage.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, stage.id)}
                            className={`flex flex-col rounded-xl border transition-colors ${dropTarget === stage.id
                                ? 'border-primary bg-primary/5'
                                : 'border-border/50 bg-card/50'
                                }`}
                        >
                            {/* Column Header */}
                            <div
                                className="p-3 border-b border-border/30 flex items-center justify-between"
                                style={{ borderTopColor: stage.color, borderTopWidth: 3 }}
                            >
                                <div className="flex items-center gap-2">
                                    <span>{stage.icon}</span>
                                    <span className="font-medium text-sm">{stage.label}</span>
                                </div>
                                <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                                    {jobs[stage.id].length}
                                </span>
                            </div>

                            {/* Cards */}
                            <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[500px]">
                                {jobs[stage.id].length === 0 ? (
                                    <div className="text-center py-8 text-xs text-muted-foreground">
                                        Drag jobs here
                                    </div>
                                ) : (
                                    jobs[stage.id].map(job => (
                                        <motion.div
                                            key={job.id}
                                            draggable
                                            onDragStart={() => handleDragStart(job)}
                                            onClick={() => setSelectedJob(job)}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`group p-3 bg-card border border-border/50 rounded-xl cursor-pointer hover:border-primary/30 hover:shadow-lg transition-all ${draggedJob?.id === job.id ? 'opacity-50' : ''
                                                } relative overflow-hidden`}
                                        >
                                            {/* Stale Indicator */}
                                            {['applied', 'screening'].includes(job.stage) && (new Date().getTime() - new Date(job.lastActivityAt).getTime() > 14 * 24 * 60 * 60 * 1000) && (
                                                <div className="absolute top-0 right-0 p-1 bg-amber-500/10 rounded-bl-lg" title="Stale: No activity for 2 weeks">
                                                    <AlertTriangle className="w-3 h-3 text-amber-500" />
                                                </div>
                                            )}

                                            <div className="flex items-start gap-3">
                                                {/* Logo */}
                                                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0 border border-border/50">
                                                    {job.logoUrl ? (
                                                        <img src={job.logoUrl} alt={job.company} className="w-full h-full object-contain" />
                                                    ) : (
                                                        <Building2 className="w-5 h-5 text-muted-foreground" />
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-sm truncate pr-4">{job.company}</h4>
                                                    <p className="text-xs text-muted-foreground truncate mb-2">{job.role}</p>

                                                    <div className="flex flex-wrap gap-2">
                                                        {job.salary && (
                                                            <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                                <DollarSign className="w-2.5 h-2.5" />
                                                                {job.salary.replace(/k/gi, 'K')}
                                                            </span>
                                                        )}
                                                        {job.location && (
                                                            <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded flex items-center gap-1">
                                                                <MapPin className="w-2.5 h-2.5" />
                                                                {job.location}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Hover Actions */}
                                            <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <GripVertical className="w-4 h-4 text-muted-foreground/50 cursor-grab" />
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Job Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="glass-panel rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Add Job Application</h3>
                            <button onClick={() => { setShowAddModal(false); resetForm(); }} className="text-muted-foreground hover:text-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddJob} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground block mb-1">Company *</label>
                                    <input
                                        type="text"
                                        value={formData.company}
                                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                        className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground block mb-1">Role *</label>
                                    <input
                                        type="text"
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground block mb-1">Stage</label>
                                    <select
                                        value={formData.stage}
                                        onChange={(e) => setFormData({ ...formData, stage: e.target.value as JobStage })}
                                        className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                                    >
                                        {JOB_STAGES.map(s => (
                                            <option key={s.id} value={s.id}>{s.icon} {s.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground block mb-1">Salary</label>
                                    <input
                                        type="text"
                                        value={formData.salary}
                                        onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                                        placeholder="$100k - $120k"
                                        className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-muted-foreground block mb-1">Location</label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="Remote, San Francisco, etc."
                                    className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium text-muted-foreground block mb-1">Job Link</label>
                                <input
                                    type="url"
                                    value={formData.jobLink}
                                    onChange={(e) => setFormData({ ...formData, jobLink: e.target.value })}
                                    placeholder="https://..."
                                    className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground block mb-1">Contact Name</label>
                                    <input
                                        type="text"
                                        value={formData.contactName}
                                        onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                                        className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground block mb-1">Contact Email</label>
                                    <input
                                        type="email"
                                        value={formData.contactEmail}
                                        onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                                        className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-muted-foreground block mb-1">Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows={3}
                                    className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm resize-none"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setShowAddModal(false); resetForm(); }}
                                    className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
                                >
                                    Add Job
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Job Detail Modal */}
            {selectedJob && !editingJob && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="glass-panel rounded-xl p-6 max-w-md w-full">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold">{selectedJob.company}</h3>
                                <p className="text-muted-foreground">{selectedJob.role}</p>
                            </div>
                            <button onClick={() => setSelectedJob(null)} className="text-muted-foreground hover:text-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3 text-sm">
                            <div className="flex items-center gap-2">
                                <span
                                    className="px-2 py-1 rounded text-xs font-medium"
                                    style={{
                                        backgroundColor: `${getStageColor(selectedJob.stage as JobStage)}20`,
                                        color: getStageColor(selectedJob.stage as JobStage)
                                    }}
                                >
                                    {JOB_STAGES.find(s => s.id === selectedJob.stage)?.icon} {JOB_STAGES.find(s => s.id === selectedJob.stage)?.label}
                                </span>
                            </div>

                            {selectedJob.salary && (
                                <div className="flex items-center gap-2 text-emerald-500">
                                    <DollarSign className="w-4 h-4" />
                                    {selectedJob.salary}
                                </div>
                            )}

                            {selectedJob.location && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <MapPin className="w-4 h-4" />
                                    {selectedJob.location}
                                </div>
                            )}

                            {selectedJob.jobLink && (
                                <a
                                    href={selectedJob.jobLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-primary hover:underline"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    View Job Posting
                                </a>
                            )}

                            {selectedJob.contactName && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <User className="w-4 h-4" />
                                    {selectedJob.contactName}
                                    {selectedJob.contactEmail && (
                                        <a href={`mailto:${selectedJob.contactEmail}`} className="text-primary hover:underline">
                                            <Mail className="w-4 h-4" />
                                        </a>
                                    )}
                                </div>
                            )}

                            {selectedJob.appliedDate && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="w-4 h-4" />
                                    Applied: {new Date(selectedJob.appliedDate).toLocaleDateString()}
                                </div>
                            )}

                            {selectedJob.notes && (
                                <div className="pt-2 border-t border-border/30">
                                    <p className="text-xs text-muted-foreground mb-1">Notes</p>
                                    <p className="whitespace-pre-wrap">{selectedJob.notes}</p>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between pt-4 mt-4 border-t border-border/30">
                            <button
                                onClick={() => handleDeleteJob(selectedJob)}
                                className="px-3 py-2 text-red-500 hover:bg-red-500/10 rounded-lg text-sm flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete
                            </button>
                            <button
                                onClick={() => openEditModal(selectedJob)}
                                className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm flex items-center gap-2"
                            >
                                <Edit className="w-4 h-4" />
                                Edit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Job Modal */}
            {editingJob && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="glass-panel rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Edit Job Application</h3>
                            <button onClick={() => { setEditingJob(null); resetForm(); }} className="text-muted-foreground hover:text-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateJob} className="space-y-4">
                            {/* Same form fields as Add modal */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground block mb-1">Company *</label>
                                    <input
                                        type="text"
                                        value={formData.company}
                                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                        className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground block mb-1">Role *</label>
                                    <input
                                        type="text"
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground block mb-1">Stage</label>
                                    <select
                                        value={formData.stage}
                                        onChange={(e) => setFormData({ ...formData, stage: e.target.value as JobStage })}
                                        className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                                    >
                                        {JOB_STAGES.map(s => (
                                            <option key={s.id} value={s.id}>{s.icon} {s.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground block mb-1">Salary</label>
                                    <input
                                        type="text"
                                        value={formData.salary}
                                        onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                                        className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-muted-foreground block mb-1">Location</label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium text-muted-foreground block mb-1">Job Link</label>
                                <input
                                    type="url"
                                    value={formData.jobLink}
                                    onChange={(e) => setFormData({ ...formData, jobLink: e.target.value })}
                                    className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground block mb-1">Contact Name</label>
                                    <input
                                        type="text"
                                        value={formData.contactName}
                                        onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                                        className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground block mb-1">Contact Email</label>
                                    <input
                                        type="email"
                                        value={formData.contactEmail}
                                        onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                                        className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-muted-foreground block mb-1">Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows={3}
                                    className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm resize-none"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setEditingJob(null); resetForm(); }}
                                    className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
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
