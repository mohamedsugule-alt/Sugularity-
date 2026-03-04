'use client';

import { useState, useEffect, useCallback } from 'react';
import { createInboxItem, processInboxItem, deleteInboxItem } from '@/actions/inbox';
import { Plus, ArrowRight, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { StaggerContainer, StaggerItem } from '@/components/ui/motion';
import { useOnboarding } from '@/components/providers/OnboardingProvider';
import { EmptyState } from '@/components/ui/EmptyState';

type InboxItem = {
    id: string;
    title: string;
    notes: string | null;
    createdAt: string | Date;
    scheduledDate?: string | Date | null;
    energyLevel?: string | null;
};

type Pillar = {
    id: string;
    name: string;
    colorHex: string;
};

type Project = {
    id: string;
    title: string;
    pillarId: string;
};

type Ritual = {
    id: string;
    title: string;
    pillarId: string;
};

export function InboxClient({
    initialItems,
    pillars,
    projects,
    rituals,
}: {
    initialItems: InboxItem[];
    pillars: Pillar[];
    projects: Project[];
    rituals: Ritual[];
}) {
    const [items, setItems] = useState(initialItems);
    const [isAdding, setIsAdding] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const { completeStep } = useOnboarding();
    const [selectedIndex, setSelectedIndex] = useState(-1);

    // Relative timestamp helper
    const relativeTime = (date: string | Date) => {
        const now = Date.now();
        const then = new Date(date).getTime();
        const diff = now - then;
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        if (days === 1) return 'yesterday';
        if (days < 7) return `${days}d ago`;
        return new Date(date).toLocaleDateString();
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't capture when typing in input/textarea/select
            const tag = (e.target as HTMLElement)?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
            if (items.length === 0) return;

            if (e.key === 'ArrowDown' || e.key === 'j') {
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, items.length - 1));
            } else if (e.key === 'ArrowUp' || e.key === 'k') {
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, 0));
            } else if (e.key === 't' && selectedIndex >= 0 && selectedIndex < items.length) {
                e.preventDefault();
                setProcessingId(items[selectedIndex].id);
            } else if (e.key === 'd' && selectedIndex >= 0 && selectedIndex < items.length) {
                e.preventDefault();
                handleDelete(items[selectedIndex].id);
            } else if (e.key === 'Escape') {
                setProcessingId(null);
                setSelectedIndex(-1);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [items, selectedIndex, processingId]);

    const [quickCaptureForm, setQuickCaptureForm] = useState({
        text: '',
        scheduledDate: '',
        energyLevel: 'medium'
    });

    // Process form state
    const [processForm, setProcessForm] = useState({
        pillarId: '',
        projectId: '',
        ritualId: '',
        status: 'active',
        estimateMinutes: 30,
        energyLevel: 'medium',
        scheduledDate: '',
    });

    // Effect to pre-fill process form when item selected
    useEffect(() => {
        if (processingId) {
            const item = items.find(i => i.id === processingId);
            if (item) {
                setProcessForm(prev => ({
                    ...prev,
                    energyLevel: (item.energyLevel || 'medium') as string,
                    scheduledDate: item.scheduledDate ? new Date(item.scheduledDate).toISOString().slice(0, 10) : ''
                }));
            }
        }
    }, [processingId, items]);

    const handleQuickCapture = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!quickCaptureForm.text.trim()) return;

        setIsAdding(true);
        try {
            const item = await createInboxItem(
                quickCaptureForm.text.trim(),
                undefined,
                quickCaptureForm.scheduledDate ? new Date(quickCaptureForm.scheduledDate) : undefined,
                quickCaptureForm.energyLevel
            );
            setItems([item, ...items]);
            setQuickCaptureForm({ text: '', scheduledDate: '', energyLevel: 'medium' });
            toast.success('Captured to inbox');
            completeStep(2);
        } catch (error) {
            toast.error('Failed to capture');
        } finally {
            setIsAdding(false);
        }
    };

    const handleProcess = async (itemId: string, title: string) => {

        try {
            await processInboxItem(itemId, {
                title,
                pillarId: processForm.pillarId,
                projectId: processForm.projectId || undefined,
                ritualId: processForm.ritualId || undefined,
                status: processForm.status,
                estimateMinutes: processForm.estimateMinutes,
                energyLevel: processForm.energyLevel,
                scheduledDate: processForm.scheduledDate ? new Date(processForm.scheduledDate) : undefined, // Added
            });

            setItems(items.filter((i) => i.id !== itemId));
            setProcessingId(null);
            setProcessForm({
                pillarId: '',
                projectId: '',
                ritualId: '',
                status: 'active',
                estimateMinutes: 30,
                energyLevel: 'medium',
                scheduledDate: '', // Added
            });
            toast.success('Processed to task');
        } catch (error) {
            toast.error('Failed to process');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteInboxItem(id);
            setItems(items.filter((i) => i.id !== id));
            toast.success('Deleted');
        } catch {
            toast.error('Failed to delete');
        }
    };

    const filteredProjects = processForm.pillarId
        ? projects.filter((p) => p.pillarId === processForm.pillarId)
        : projects;
    const filteredRituals = processForm.pillarId
        ? rituals.filter((s) => s.pillarId === processForm.pillarId)
        : rituals;

    return (
        <div className="space-y-6">
            {/* Quick Capture */}
            <form onSubmit={handleQuickCapture} className="glass-panel rounded-xl p-4">
                <div className="flex flex-col gap-3">
                    <input
                        type="text"
                        value={quickCaptureForm.text}
                        onChange={(e) => setQuickCaptureForm({ ...quickCaptureForm, text: e.target.value })}
                        placeholder="Quick capture... What's on your mind?"
                        className="w-full bg-muted/50 border border-border/50 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        disabled={isAdding}
                    />
                    <div className="flex gap-2 items-center">
                        <input
                            type="date"
                            value={quickCaptureForm.scheduledDate}
                            onChange={(e) => setQuickCaptureForm({ ...quickCaptureForm, scheduledDate: e.target.value })}
                            className="bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                            title="Schedule Date (Optional)"
                        />
                        <select
                            value={quickCaptureForm.energyLevel}
                            onChange={(e) => setQuickCaptureForm({ ...quickCaptureForm, energyLevel: e.target.value })}
                            className="bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                            title="Priority (Optional)"
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                        <div className="flex-1" />
                        <button
                            type="submit"
                            disabled={isAdding || !quickCaptureForm.text.trim()}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition-colors text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Capture
                        </button>
                    </div>
                </div>
            </form>

            {/* Inbox List */}
            <StaggerContainer className="space-y-3">
                {items.length === 0 ? (
                    <EmptyState
                        icon={Plus}
                        title="Inbox zero! 🎉"
                        description="Your mind is clear. Capture anything — ideas, tasks, reminders — and process them later."
                        color="violet"
                        tip="Press Ctrl+I from anywhere for quick capture."
                    />
                ) : (
                    items.map((item, i) => (
                        <StaggerItem key={item.id} className={`glass-panel rounded-xl overflow-hidden transition-all ${selectedIndex === i ? 'ring-2 ring-primary/40 border-l-4 border-primary' : ''}`}>
                            {/* Main row */}
                            <div className="p-4 flex items-center gap-4">
                                <div className="flex-1">
                                    <p className="font-medium">{item.title}</p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                        <span>Captured {relativeTime(item.createdAt)}</span>
                                        {item.scheduledDate && (
                                            <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px]">
                                                📅 {new Date(item.scheduledDate).toLocaleDateString()}
                                            </span>
                                        )}
                                        {item.energyLevel && item.energyLevel !== 'medium' && (
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${item.energyLevel === 'high' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'
                                                }`}>
                                                {item.energyLevel}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setProcessingId(processingId === item.id ? null : item.id)}
                                        className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors flex items-center gap-1"
                                    >
                                        Process
                                        <ArrowRight className="w-3 h-3" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Process form */}
                            {processingId === item.id && (
                                <div className="border-t border-border/30 p-4 bg-muted/20 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-medium text-sm">Convert to Task</h4>
                                        <button
                                            onClick={() => setProcessingId(null)}
                                            className="text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Pillar (Required) */}
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground block mb-1">
                                                Pillar
                                            </label>
                                            <select
                                                value={processForm.pillarId}
                                                onChange={(e) => setProcessForm({ ...processForm, pillarId: e.target.value, projectId: '', ritualId: '' })}
                                                className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                                            >
                                                <option value="">Select Pillar...</option>
                                                {pillars.map((pillar) => (
                                                    <option key={pillar.id} value={pillar.id}>{pillar.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Status */}
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground block mb-1">Status</label>
                                            <select
                                                value={processForm.status}
                                                onChange={(e) => setProcessForm({ ...processForm, status: e.target.value })}
                                                className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                                            >
                                                <option value="active">Active</option>
                                                <option value="scheduled">Scheduled</option>
                                                <option value="someday">Someday</option>
                                            </select>
                                        </div>

                                        {/* Project (Optional) */}
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground block mb-1">Project</label>
                                            <select
                                                value={processForm.projectId}
                                                onChange={(e) => setProcessForm({ ...processForm, projectId: e.target.value, ritualId: '' })}
                                                className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm disabled:opacity-50"
                                            >
                                                <option value="">No project</option>
                                                {filteredProjects.map((project) => (
                                                    <option key={project.id} value={project.id}>{project.title}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Ritual (Optional) */}
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground block mb-1">Ritual</label>
                                            <select
                                                value={processForm.ritualId}
                                                onChange={(e) => setProcessForm({ ...processForm, ritualId: e.target.value, projectId: '' })}
                                                className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm disabled:opacity-50"
                                            >
                                                <option value="">No ritual</option>
                                                {filteredRituals.map((ritual) => (
                                                    <option key={ritual.id} value={ritual.id}>{ritual.title}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Estimate */}
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground block mb-1">Estimate (min)</label>
                                            <input
                                                type="number"
                                                value={processForm.estimateMinutes}
                                                onChange={(e) => setProcessForm({ ...processForm, estimateMinutes: parseInt(e.target.value) || 30 })}
                                                className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                                            />
                                        </div>

                                        {/* Scheduled Date */}
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground block mb-1">Schedule</label>
                                            <input
                                                type="date"
                                                value={processForm.scheduledDate}
                                                onChange={(e) => setProcessForm({ ...processForm, scheduledDate: e.target.value })}
                                                className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                                            />
                                        </div>

                                        {/* Energy */}
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground block mb-1">Energy</label>
                                            <select
                                                value={processForm.energyLevel}
                                                onChange={(e) => setProcessForm({ ...processForm, energyLevel: e.target.value })}
                                                className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                                            >
                                                <option value="low">Low</option>
                                                <option value="medium">Medium</option>
                                                <option value="high">High</option>
                                            </select>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleProcess(item.id, item.title)}
                                        className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                                    >
                                        Create Task
                                    </button>
                                </div>
                            )}
                        </StaggerItem>
                    ))
                )}
            </StaggerContainer>
        </div>
    );
}
