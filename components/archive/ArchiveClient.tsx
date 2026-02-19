'use client';

import { useState } from 'react';
import { DailyCard } from './DailyCard';
import { getArchiveRecords, deleteArchiveRecord } from '@/actions/archive';
import { duplicateFromArchive } from '@/actions/humanNature';
import { Search, Filter, Calendar, X, Clock, Zap, Trash2, RotateCcw, CheckSquare } from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/ui/EmptyState';

export type ArchiveRecord = {
    id: string;
    originalTaskId: string;
    title: string;
    notes: string | null;
    pillarId: string | null;
    pillarName: string | null;
    projectId: string | null;
    projectName: string | null;
    ritualId: string | null;
    ritualName: string | null;
    estimateMinutes: number | null;
    energyLevel: string | null;
    rolloverCount: number;
    completionNote: string | null;
    completedAt: Date;
};

type Pillar = { id: string; name: string; colorHex: string };
type Project = { id: string; title: string };
type Ritual = { id: string; title: string };

export function ArchiveClient({
    initialRecords,
    pillars,
    projects,
    rituals,
}: {
    initialRecords: ArchiveRecord[];
    pillars: Pillar[];
    projects: Project[];
    rituals: Ritual[];
}) {
    const [records, setRecords] = useState(initialRecords);
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({
        pillarId: '',
        projectId: '',
        ritualId: '',
    });
    const [showFilters, setShowFilters] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<ArchiveRecord | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async () => {
        setIsSearching(true);
        try {
            const results = await getArchiveRecords({
                search: search || undefined,
                pillarId: filters.pillarId || undefined,
                projectId: filters.projectId || undefined,
                ritualId: filters.ritualId || undefined,
            });
            setRecords(results as any);
        } catch {
            toast.error('Search failed');
        } finally {
            setIsSearching(false);
        }
    };

    const clearFilters = async () => {
        setSearch('');
        setFilters({ pillarId: '', projectId: '', ritualId: '' });
        const results = await getArchiveRecords({ limit: 100 });
        setRecords(results as any);
    };

    const handleDelete = async (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!confirm('Permanently delete this archive record?')) return;
        try {
            await deleteArchiveRecord(id);
            setRecords(records.filter(r => r.id !== id));
            setSelectedRecord(null);
            toast.success('Record deleted');
        } catch {
            toast.error('Failed to delete record');
        }
    };

    const handleRecover = async (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        try {
            await duplicateFromArchive(id);
            toast.success('Task recreated! Check your task list.');
        } catch (err: any) {
            toast.error(err?.message || 'Failed to recover task');
        }
    };

    const getPillarColor = (pillarId: string | null) => {
        const pillar = pillars.find((a) => a.id === pillarId);
        return pillar?.colorHex || '#666';
    };

    return (
        <div className="space-y-6">
            {/* Search & Filters */}
            <div className="glass-panel rounded-xl p-4">
                <div className="flex gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Search completed tasks..."
                            className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`px-3 py-2 rounded-lg border transition-colors ${showFilters ? 'bg-primary/10 border-primary/30 text-primary' : 'border-border/50 text-muted-foreground hover:text-foreground'}`}
                    >
                        <Filter className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleSearch}
                        disabled={isSearching}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                        Search
                    </button>
                </div>

                {showFilters && (
                    <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/30">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1">Pillar</label>
                            <select
                                value={filters.pillarId}
                                onChange={(e) => setFilters({ ...filters, pillarId: e.target.value })}
                                className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                            >
                                <option value="">All pillars</option>
                                {pillars.map((pillar) => (
                                    <option key={pillar.id} value={pillar.id}>{pillar.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1">Project</label>
                            <select
                                value={filters.projectId}
                                onChange={(e) => setFilters({ ...filters, projectId: e.target.value })}
                                className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                            >
                                <option value="">All projects</option>
                                {projects.map((project) => (
                                    <option key={project.id} value={project.id}>{project.title}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1">Ritual</label>
                            <select
                                value={filters.ritualId}
                                onChange={(e) => setFilters({ ...filters, ritualId: e.target.value })}
                                className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                            >
                                <option value="">All rituals</option>
                                {rituals.map((ritual) => (
                                    <option key={ritual.id} value={ritual.id}>{ritual.title}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                {(search || filters.pillarId || filters.projectId || filters.ritualId) && (
                    <button
                        onClick={clearFilters}
                        className="mt-3 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                        <X className="w-3 h-3" />
                        Clear filters
                    </button>
                )}
            </div>

            {/* Results */}
            <div className="space-y-6">
                {records.length === 0 ? (
                    <EmptyState
                        icon={CheckSquare}
                        title="Your achievement wall"
                        description="Completed tasks appear here as your personal history of accomplishments. Complete some tasks from your Today view to start building your archive."
                        actionLabel="Go to Today"
                        actionHref="/today"
                        color="amber"
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in zoom-in-50 duration-500">
                        {Object.entries(
                            records.reduce((groups, record) => {
                                const dateKey = new Date(record.completedAt).toDateString();
                                if (!groups[dateKey]) groups[dateKey] = [];
                                groups[dateKey].push(record);
                                return groups;
                            }, {} as Record<string, ArchiveRecord[]>)
                        )
                            .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
                            .map(([dateKey, groupRecords]) => (
                                <DailyCard
                                    key={dateKey}
                                    date={dateKey}
                                    records={groupRecords}
                                    onClick={() => setSelectedRecord(groupRecords[0])} // Just trigger modal with first record to identify the group
                                />
                            ))}
                    </div>
                )}
            </div>

            {/* Detail Modal (Day View) */}
            {selectedRecord && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    {/* Overlay Click to Close */}
                    <div className="absolute inset-0" onClick={() => setSelectedRecord(null)} />

                    <div className="glass-panel rounded-2xl p-0 max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col relative z-10 shadow-2xl border-border/20 bg-background/95 backdrop-blur-xl">
                        {/* Header */}
                        <div className="p-6 pb-4 border-b border-border/10 bg-muted/20">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-3xl font-bold tracking-tight">
                                        {new Date(selectedRecord.completedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'numeric', year: 'numeric' })}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                                        <Calendar className="w-4 h-4" />
                                        <span>{new Date(selectedRecord.completedAt).toLocaleDateString('en-US', { weekday: 'long' })}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        if (!confirm(`Delete all ${records.filter(r => new Date(r.completedAt).toDateString() === new Date(selectedRecord.completedAt).toDateString()).length} records for this day?`)) return;

                                        const dayRecords = records.filter(r => new Date(r.completedAt).toDateString() === new Date(selectedRecord.completedAt).toDateString());
                                        for (const r of dayRecords) {
                                            await deleteArchiveRecord(r.id).catch(console.error);
                                        }
                                        setRecords(prev => prev.filter(r => new Date(r.completedAt).toDateString() !== new Date(selectedRecord.completedAt).toDateString()));
                                        setSelectedRecord(null);
                                        toast.success('Day deleted');
                                    }}
                                    className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-full transition-colors"
                                    title="Delete Day"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setSelectedRecord(null)}
                                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Content Scrollable */}
                    <div className="overflow-y-auto p-6 space-y-6 bg-background">

                        {/* Properties (Fake Notion-style properties) */}
                        <div className="space-y-3 pb-6 border-b border-border/10 text-sm">
                            <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                                <span className="text-muted-foreground flex items-center gap-2">
                                    <Clock className="w-4 h-4" /> Created
                                </span>
                                <span>{new Date(selectedRecord.completedAt).toLocaleTimeString()}</span>
                            </div>
                            <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                                <span className="text-muted-foreground flex items-center gap-2">
                                    <CheckSquare className="w-4 h-4" /> Archive
                                </span>
                                <div className="w-4 h-4 rounded border border-muted-foreground bg-primary/20 flex items-center justify-center">
                                    <div className="w-2.5 h-2.5 bg-primary rounded-[1px]" />
                                </div>
                            </div>
                            <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                                <span className="text-muted-foreground flex items-center gap-2">
                                    <Calendar className="w-4 h-4" /> Date
                                </span>
                                <span>{new Date(selectedRecord.completedAt).toLocaleDateString()}</span>
                            </div>
                        </div>

                        {/* Task List */}
                        <div className="space-y-2">
                            {records
                                .filter(r => new Date(r.completedAt).toDateString() === new Date(selectedRecord.completedAt).toDateString())
                                .map(record => (
                                    <div key={record.id} className="group flex items-start gap-3 p-2 hover:bg-muted/50 rounded-lg -mx-2 transition-colors">
                                        {/* Checkbox (Checked) */}
                                        <div className="mt-1 bg-primary text-primary-foreground rounded-sm w-4 h-4 flex items-center justify-center shrink-0">
                                            <CheckSquare className="w-3 h-3" />
                                        </div>

                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm font-medium line-through text-muted-foreground/70 group-hover:text-muted-foreground transition-colors">
                                                {record.title}
                                            </p>

                                            <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground opacity-60 group-hover:opacity-100 transition-opacity">
                                                {record.pillarName && (
                                                    <span className="px-1.5 py-0.5 rounded bg-muted border border-border/50">
                                                        {record.pillarName}
                                                    </span>
                                                )}
                                                {record.estimateMinutes && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" /> {record.estimateMinutes}m
                                                    </span>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-3 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => handleRecover(record.id, e)}
                                                    className="text-xs text-emerald-500 hover:underline flex items-center gap-1"
                                                >
                                                    <RotateCcw className="w-3 h-3" /> Recover
                                                </button>
                                                <button
                                                    onClick={(e) => handleDelete(record.id, e)}
                                                    className="text-xs text-red-500 hover:underline flex items-center gap-1"
                                                >
                                                    <Trash2 className="w-3 h-3" /> Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
