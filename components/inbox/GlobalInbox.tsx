'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { Plus, ArrowRight, Trash2, X, Archive, Inbox } from 'lucide-react';
import { toast } from 'sonner';
import { getInboxItems, createInboxItem, processInboxItem, deleteInboxItem } from '@/actions/inbox';
import { getPillars, getProjects, getRituals } from '@/actions/core';
import { EmptyState } from '@/components/ui/EmptyState';
import { StaggerContainer, StaggerItem } from '@/components/ui/motion';

// Types
type InboxItem = { id: string; title: string; notes: string | null; createdAt: Date };
type Pillar = { id: string; name: string; colorHex: string };
type Project = { id: string; title: string; pillarId: string };
type Ritual = { id: string; title: string; pillarId: string };

export function GlobalInbox() {
    const [isOpen, setIsOpen] = useState(false);
    const [items, setItems] = useState<InboxItem[]>([]);
    const [pillars, setPillars] = useState<Pillar[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [rituals, setRituals] = useState<Ritual[]>([]);
    const [loading, setLoading] = useState(false);

    // Capture State
    const [newItemText, setNewItemText] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    // Process State
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [processForm, setProcessForm] = useState({
        pillarId: '',
        projectId: '',
        ritualId: '',
        status: 'active',
        estimateMinutes: 30,
        energyLevel: 'medium',
    });

    // Load Data
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [fetchedItems, fetchedPillars, fetchedProjects, fetchedRituals] = await Promise.all([
                getInboxItems(),
                getPillars(),
                getProjects(),
                getRituals()
            ]);
            setItems(fetchedItems as any);
            setPillars(fetchedPillars);
            setProjects(fetchedProjects as any);
            setRituals(fetchedRituals as any);
        } catch (error) {
            console.error('Failed to load inbox data', error);
            toast.error('Failed to load inbox');
        } finally {
            setLoading(false);
        }
    }, []);

    // Effect: Listen for open-inbox event and Ctrl+I
    useEffect(() => {
        const handleOpen = () => { setIsOpen(true); loadData(); };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'i' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                setIsOpen(prev => {
                    if (!prev) loadData();
                    return !prev;
                });
            }
        };

        window.addEventListener('open-inbox', handleOpen);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('open-inbox', handleOpen);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [loadData]);

    // Actions
    const handleQuickCapture = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemText.trim()) return;

        setIsAdding(true);
        try {
            const item = await createInboxItem(newItemText.trim());
            setItems([item as any, ...items]);
            setNewItemText('');
            toast.success('Captured to inbox');
        } catch (error) {
            toast.error('Failed to capture');
        } finally {
            setIsAdding(false);
        }
    };

    const handleDelete = async (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        try {
            setItems(items.filter(i => i.id !== id));
            await deleteInboxItem(id);
            toast.success('Deleted');
        } catch {
            toast.error('Failed to delete');
            loadData(); // Revert on failure
        }
    };

    const handleProcess = async (itemId: string, title: string) => {
        if (!processForm.pillarId) {
            toast.error('Golden Thread: Please select a Pillar');
            return;
        }

        try {
            await processInboxItem(itemId, {
                title,
                pillarId: processForm.pillarId,
                projectId: processForm.projectId || undefined,
                ritualId: processForm.ritualId || undefined,
                status: processForm.status,
                estimateMinutes: processForm.estimateMinutes,
                energyLevel: processForm.energyLevel,
            });

            setItems(items.filter((i) => i.id !== itemId));
            setProcessingId(null);
            resetProcessForm();
            toast.success('Processed to task');
        } catch (error) {
            toast.error('Failed to process');
        }
    };

    const resetProcessForm = () => {
        setProcessForm({
            pillarId: '',
            projectId: '',
            ritualId: '',
            status: 'active',
            estimateMinutes: 30,
            energyLevel: 'medium',
        });
    };

    const filteredProjects = projects.filter((p) => p.pillarId === processForm.pillarId);
    const filteredRituals = rituals.filter((s) => s.pillarId === processForm.pillarId);

    // Helpers
    const relativeTime = (date: string | Date) => {
        const now = Date.now();
        const then = new Date(date).getTime();
        const diff = now - then;
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    return (
        <Sheet isOpen={isOpen} onClose={() => setIsOpen(false)} title="Inbox Capture" side="right">
            <div className="space-y-6 pb-20">
                {/* Capture Input */}
                <form onSubmit={handleQuickCapture} className="sticky top-0 bg-background z-10 pb-4 border-b border-border/50">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newItemText}
                            onChange={(e) => setNewItemText(e.target.value)}
                            placeholder="Capture a thought..."
                            className="flex-1 bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            disabled={isAdding}
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={isAdding || !newItemText.trim()}
                            className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                        <Inbox className="w-3 h-3" />
                        {items.length} items in inbox
                    </p>
                </form>

                {/* List */}
                <StaggerContainer className="space-y-3">
                    {items.length === 0 && !loading ? (
                        <EmptyState
                            icon={Inbox}
                            title="Inbox Zero"
                            description="You're all caught up."
                            color="gray"
                            small
                        />
                    ) : (
                        items.map((item) => (
                            <StaggerItem key={item.id} className={`glass-panel rounded-lg overflow-hidden border border-border/50 ${processingId === item.id ? 'ring-1 ring-primary' : ''}`}>
                                <div className="p-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">{item.title}</p>
                                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                                {relativeTime(item.createdAt)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                onClick={() => {
                                                    if (processingId === item.id) {
                                                        setProcessingId(null);
                                                    } else {
                                                        setProcessingId(item.id);
                                                        resetProcessForm();
                                                    }
                                                }}
                                                className={`p-1.5 rounded-md transition-colors ${processingId === item.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'}`}
                                            >
                                                <ArrowRight className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={(e) => handleDelete(item.id, e)}
                                                className="p-1.5 hover:bg-red-500/10 hover:text-red-500 text-muted-foreground rounded-md transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Process Form */}
                                    {processingId === item.id && (
                                        <div className="mt-3 pt-3 border-t border-border/50 space-y-3 animate-in fade-in slide-in-from-top-2">
                                            {/* Pillar */}
                                            <div>
                                                <select
                                                    value={processForm.pillarId}
                                                    onChange={(e) => setProcessForm({ ...processForm, pillarId: e.target.value, projectId: '', ritualId: '' })}
                                                    className="w-full bg-muted/50 border border-border/50 rounded-md px-2 py-1.5 text-xs"
                                                >
                                                    <option value="">Select Pillar (Required)...</option>
                                                    {pillars.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                </select>
                                            </div>

                                            {/* Project/Ritual Selection */}
                                            {processForm.pillarId && (
                                                <div className="grid grid-cols-2 gap-2">
                                                    <select
                                                        value={processForm.projectId}
                                                        onChange={(e) => setProcessForm({ ...processForm, projectId: e.target.value, ritualId: '' })}
                                                        className="bg-muted/50 border border-border/50 rounded-md px-2 py-1.5 text-xs"
                                                    >
                                                        <option value="">No Project</option>
                                                        {filteredProjects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                                    </select>
                                                    <select
                                                        value={processForm.ritualId}
                                                        onChange={(e) => setProcessForm({ ...processForm, ritualId: e.target.value, projectId: '' })}
                                                        className="bg-muted/50 border border-border/50 rounded-md px-2 py-1.5 text-xs"
                                                    >
                                                        <option value="">No Ritual</option>
                                                        {filteredRituals.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                                                    </select>
                                                </div>
                                            )}

                                            <div className="flex gap-2">
                                                <select
                                                    value={processForm.energyLevel}
                                                    onChange={(e) => setProcessForm({ ...processForm, energyLevel: e.target.value })}
                                                    className="flex-1 bg-muted/50 border border-border/50 rounded-md px-2 py-1.5 text-xs"
                                                >
                                                    <option value="high">High Energy</option>
                                                    <option value="medium">Medium</option>
                                                    <option value="low">Low Energy</option>
                                                </select>
                                                <input
                                                    type="number"
                                                    value={processForm.estimateMinutes}
                                                    onChange={(e) => setProcessForm({ ...processForm, estimateMinutes: parseInt(e.target.value) })}
                                                    className="w-16 bg-muted/50 border border-border/50 rounded-md px-2 py-1.5 text-xs text-center"
                                                />
                                                <span className="text-xs self-center text-muted-foreground">min</span>
                                            </div>

                                            <button
                                                onClick={() => handleProcess(item.id, item.title)}
                                                disabled={!processForm.pillarId}
                                                className="w-full py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-md hover:bg-primary/90 disabled:opacity-50"
                                            >
                                                Confirm Task
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </StaggerItem>
                        ))
                    )}
                </StaggerContainer>
            </div>
        </Sheet>
    );
}
