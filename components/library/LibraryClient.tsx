'use client';

import { useState } from 'react';
import { Search, Plus, FileText, File, ExternalLink, Trash2, Heart, Download, Filter, LayoutGrid, List } from 'lucide-react';
import { toast } from 'sonner';
import { createResource, deleteResource, updateResource } from '@/actions/resources';
import { CreateResourceModal } from './CreateResourceModal';
import { format } from 'date-fns';

type Resource = {
    id: string;
    title: string;
    type: string;
    content: string | null;
    filePath: string | null;
    url: string | null;
    isFavorite: boolean;
    updatedAt: Date;
};

export function LibraryClient({ initialResources }: { initialResources: Resource[] }) {
    const [resources, setResources] = useState(initialResources);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

    const filteredResources = resources.filter(r => {
        const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase()) ||
            (r.content && r.content.toLowerCase().includes(search.toLowerCase()));
        const matchesType = filterType === 'all' || r.type === filterType;
        return matchesSearch && matchesType;
    });

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this resource?')) return;

        try {
            await deleteResource(id);
            setResources(prev => prev.filter(r => r.id !== id));
            toast.success('Resource deleted');
            if (selectedResource?.id === id) setSelectedResource(null);
        } catch (error) {
            toast.error('Failed to delete resource');
        }
    };

    const handleToggleFavorite = async (e: React.MouseEvent, resource: Resource) => {
        e.stopPropagation();
        try {
            const updated = await updateResource(resource.id, { isFavorite: !resource.isFavorite });
            setResources(prev => prev.map(r => r.id === resource.id ? { ...r, isFavorite: !r.isFavorite } : r));
            if (selectedResource?.id === resource.id) {
                setSelectedResource({ ...resource, isFavorite: !resource.isFavorite });
            }
        } catch (error) {
            toast.error('Failed to update');
        }
    };

    return (
        <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                        placeholder="Search your library..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-muted/50 border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                        <option value="all">All Types</option>
                        <option value="note">Notes</option>
                        <option value="pdf">PDFs</option>
                        <option value="link">Links</option>
                    </select>

                    <div className="flex bg-muted rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-background shadow-sm' : 'hover:bg-background/50'}`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-background shadow-sm' : 'hover:bg-background/50'}`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>

                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="ml-auto md:ml-0 flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden md:inline">Add Resource</span>
                        <span className="md:hidden">Add</span>
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 gap-6 overflow-hidden">
                {/* Resource List */}
                <div className={`flex-1 overflow-y-auto pr-2 ${selectedResource ? 'hidden md:block md:w-1/3 md:flex-none' : 'w-full'}`}>
                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {filteredResources.map(resource => (
                                <div
                                    key={resource.id}
                                    onClick={() => setSelectedResource(resource)}
                                    className={`group relative aspect-[3/4] p-4 rounded-xl border transition-all cursor-pointer flex flex-col ${selectedResource?.id === resource.id
                                            ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                            : 'border-border bg-card hover:border-primary/50 hover:shadow-lg'
                                        }`}
                                >
                                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                        <button
                                            onClick={(e) => handleToggleFavorite(e, resource)}
                                            className={`p-1.5 rounded-full hover:bg-background ${resource.isFavorite ? 'text-amber-400 opacity-100' : 'text-muted-foreground'}`}
                                        >
                                            <Heart className={`w-4 h-4 ${resource.isFavorite ? 'fill-amber-400' : ''}`} />
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(e, resource.id)}
                                            className="p-1.5 rounded-full hover:bg-background text-rose-500"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="mb-4">
                                        {resource.type === 'pdf' ? (
                                            <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                                                <FileText className="w-6 h-6" />
                                            </div>
                                        ) : resource.type === 'link' ? (
                                            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                                                <ExternalLink className="w-6 h-6" />
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                                                <File className="w-6 h-6" />
                                            </div>
                                        )}
                                    </div>

                                    <h3 className="font-semibold line-clamp-2 mb-2">{resource.title}</h3>
                                    <p className="text-xs text-muted-foreground mt-auto">
                                        {format(new Date(resource.updatedAt), 'MMM d, yyyy')}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredResources.map(resource => (
                                <div
                                    key={resource.id}
                                    onClick={() => setSelectedResource(resource)}
                                    className={`flex items-center gap-4 p-3 rounded-lg border transition-all cursor-pointer ${selectedResource?.id === resource.id
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border bg-card hover:border-primary/50'
                                        }`}
                                >
                                    {resource.type === 'pdf' ? (
                                        <FileText className="w-5 h-5 text-rose-500" />
                                    ) : resource.type === 'link' ? (
                                        <ExternalLink className="w-5 h-5 text-blue-500" />
                                    ) : (
                                        <File className="w-5 h-5 text-amber-500" />
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium truncate">{resource.title}</h3>
                                        <p className="text-xs text-muted-foreground">
                                            {format(new Date(resource.updatedAt), 'MMM d, yyyy')}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => handleToggleFavorite(e, resource)}
                                            className={`p-1.5 rounded-full hover:bg-muted ${resource.isFavorite ? 'text-amber-400' : 'text-muted-foreground opacity-0 group-hover:opacity-100'}`}
                                        >
                                            <Heart className={`w-4 h-4 ${resource.isFavorite ? 'fill-amber-400' : ''}`} />
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(e, resource.id)}
                                            className="p-1.5 rounded-full hover:bg-muted text-rose-500 opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Preview Panel */}
                {selectedResource && (
                    <div className="hidden md:flex flex-col w-2/3 bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-in slide-in-from-right-10 duration-300">
                        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
                            <div>
                                <h2 className="font-bold text-lg">{selectedResource.title}</h2>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">{selectedResource.type}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setSelectedResource(null)} className="p-2 hover:bg-muted rounded-lg md:hidden">Close</button>
                                {selectedResource.filePath && (
                                    <a
                                        href={selectedResource.filePath}
                                        download
                                        className="p-2 hover:bg-muted rounded-lg"
                                        title="Download"
                                    >
                                        <Download className="w-5 h-5" />
                                    </a>
                                )}
                                {selectedResource.url && (
                                    <a
                                        href={selectedResource.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 hover:bg-muted rounded-lg"
                                        title="Open Link"
                                    >
                                        <ExternalLink className="w-5 h-5" />
                                    </a>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-zinc-900">
                            {selectedResource.type === 'pdf' && selectedResource.filePath ? (
                                <iframe
                                    src={selectedResource.filePath}
                                    className="w-full h-full min-h-[500px] border-none rounded-lg"
                                    title="PDF Viewer"
                                />
                            ) : selectedResource.type === 'link' ? (
                                <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
                                    <ExternalLink className="w-16 h-16 opacity-50" />
                                    <p>External Link</p>
                                    <a
                                        href={selectedResource.url!}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline break-all"
                                    >
                                        {selectedResource.url}
                                    </a>
                                </div>
                            ) : (
                                <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
                                    {selectedResource.content}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <CreateResourceModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreated={() => {
                    // Refresh logic handled by server action revalidating path
                    // But local state might need refresh? 
                    // Ideally we force router refresh or optimistically update. 
                    // For now, simple re-render.
                    // Actually we passed initialResources so we might need to router.refresh() in parent
                    // or simply rely on revalidatePath and router.refresh() call in a useEffect?
                    // For MVP, window.location.reload() or router.refresh()
                    window.location.reload();
                }}
            />
        </div>
    );
}
