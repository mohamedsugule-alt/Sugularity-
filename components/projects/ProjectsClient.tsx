'use client';

import { useState } from 'react';
import { createProject, deleteProject } from '@/actions/core';
import { Plus, FolderKanban, MoreVertical, X, Calendar, Target, ArrowRight, Image as ImageIcon, Upload } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { EmptyState } from '@/components/ui/EmptyState';

type Project = {
    id: string;
    title: string;
    description: string | null;
    status: string;
    coverImage: string | null;
    pillar: { id: string; name: string; colorHex: string };
    tasks: { id: string }[];
    milestones: { id: string }[];
};

type Pillar = {
    id: string;
    name: string;
    colorHex: string;
};

export function ProjectsClient({
    initialProjects,
    pillars,
}: {
    initialProjects: Project[];
    pillars: Pillar[];
}) {
    const [projects, setProjects] = useState(initialProjects);
    const [showCreate, setShowCreate] = useState(false);
    const [newProject, setNewProject] = useState({
        title: '',
        description: '',
        pillarId: pillars[0]?.id || '',
        coverImage: '',
    });
    const [isUploading, setIsUploading] = useState(false);

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProject.title.trim() || !newProject.pillarId) return;

        try {
            const project = await createProject({
                title: newProject.title.trim(),
                description: newProject.description.trim(),
                pillarId: newProject.pillarId,
                coverImage: newProject.coverImage.trim() || undefined,
            });
            setProjects([project, ...projects]);
            setNewProject({ title: '', description: '', pillarId: pillars[0]?.id || '', coverImage: '' });
            setShowCreate(false);
            toast.success('Project created');
        } catch {
            toast.error('Failed to create project');
        }
    };

    const handleDeleteProject = async (id: string) => {
        if (!confirm('Delete this project? This will also delete all tasks within it.')) return;
        try {
            await deleteProject(id);
            setProjects(projects.filter((p) => p.id !== id));
            toast.success('Project deleted');
        } catch {
            toast.error('Failed to delete project');
        }
    };

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
                setNewProject({ ...newProject, coverImage: data.url });
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

    const strategicProjects = projects.filter(p => (p.tasks?.length > 0 || p.milestones?.length > 0));
    const soloProjects = projects.filter(p => (p.tasks?.length === 0 && p.milestones?.length === 0) || (!p.tasks && !p.milestones));

    return (
        <div className="space-y-8">
            {/* Header / Empty State */}
            {projects.length === 0 ? (
                <EmptyState
                    icon={FolderKanban}
                    title="Turn goals into action"
                    description="Projects organize your finite work into tasks and milestones. Each project belongs to a life area and tracks progress toward completion."
                    actionLabel="Create Your First Project"
                    onAction={() => setShowCreate(true)}
                    color="orange"
                    tip="Link projects to goals to build your Golden Thread."
                />
            ) : (
                <>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
                            <p className="text-muted-foreground mt-1">Manage your active commitments.</p>
                        </div>
                        <button
                            onClick={() => setShowCreate(true)}
                            suppressHydrationWarning
                            className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold flex items-center gap-2 hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/25 transition-all hover:scale-[1.02]"
                        >
                            <Plus className="w-4 h-4" />
                            New Project
                        </button>
                    </div>

                    {/* Strategic Projects Grid */}
                    {strategicProjects.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Target className="w-5 h-5 text-orange-500" />
                                Strategic Initiatives
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {strategicProjects.map((project) => (
                                    <ProjectCard key={project.id} project={project} onDelete={handleDeleteProject} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Solo Projects */}
                    {soloProjects.length > 0 && (
                        <div className="space-y-4 pt-4 border-t border-border/50">
                            <h2 className="text-lg font-semibold flex items-center gap-2 text-muted-foreground">
                                <FolderKanban className="w-5 h-5" />
                                Empty Projects
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-80">
                                {soloProjects.map((project) => (
                                    <ProjectCard key={project.id} project={project} onDelete={handleDeleteProject} />
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Create Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="glass-panel rounded-xl p-6 max-w-md w-full">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">New Project</h3>
                            <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground" suppressHydrationWarning>
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateProject} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium block mb-1">Title</label>
                                <input
                                    type="text"
                                    value={newProject.title}
                                    onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                                    placeholder="Project Name"
                                    className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                                    autoFocus
                                    suppressHydrationWarning
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium block mb-1">Pillar</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {pillars.map((pillar) => (
                                        <button
                                            key={pillar.id}
                                            type="button"
                                            onClick={() => setNewProject({ ...newProject, pillarId: pillar.id })}
                                            className={`p-2 rounded-lg text-sm font-medium border text-left flex items-center gap-2 transition-colors ${newProject.pillarId === pillar.id
                                                ? 'bg-primary/10 border-primary text-primary'
                                                : 'bg-muted/30 border-transparent hover:bg-muted/50'
                                                }`}
                                            suppressHydrationWarning
                                        >
                                            <span
                                                className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: pillar.colorHex }}
                                            />
                                            {pillar.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium block mb-1">Description (Optional)</label>
                                <textarea
                                    value={newProject.description}
                                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                    placeholder="What is this project about?"
                                    className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm h-20 resize-none"
                                    suppressHydrationWarning
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium block mb-1">Cover Image</label>
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Image URL or upload..."
                                            value={newProject.coverImage}
                                            onChange={(e) => setNewProject({ ...newProject, coverImage: e.target.value })}
                                            className="flex-1 bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                                            suppressHydrationWarning
                                        />
                                        <label className="cursor-pointer bg-muted hover:bg-muted/80 px-3 py-2 rounded-lg flex items-center justify-center transition-colors">
                                            <Upload className="w-4 h-4 text-muted-foreground" />
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
                                <p className="text-xs text-muted-foreground mt-1">
                                    Leave empty for default gradient.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreate(false)}
                                    className="flex-1 py-2 bg-muted/50 hover:bg-muted rounded-lg font-medium transition-colors"
                                    suppressHydrationWarning
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!newProject.title.trim() || !newProject.pillarId || isUploading}
                                    className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                                    suppressHydrationWarning
                                >
                                    Create Project
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function ProjectCard({ project, onDelete }: { project: Project, onDelete: (id: string) => void }) {
    return (
        <div className="glass-panel hover-card rounded-xl overflow-hidden group flex flex-col h-full">
            {/* Cover Image or Gradient */}
            <div className={`h-24 relative ${project.coverImage ? '' : 'bg-gradient-to-r from-muted to-muted/50'}`}>
                {project.coverImage ? (
                    <img
                        src={project.coverImage}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.currentTarget.src = ''; // Fallback checking
                            e.currentTarget.parentElement?.classList.add('bg-gradient-to-r', 'from-muted', 'to-muted/50');
                        }}
                    />
                ) : (
                    <div className="absolute inset-0 opacity-10" style={{ backgroundColor: project.pillar.colorHex }} />
                )}

                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            onDelete(project.id);
                        }}
                        className="p-1.5 bg-black/20 hover:bg-red-500 text-white rounded-lg backdrop-blur-sm transition-colors"
                        suppressHydrationWarning
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="p-5 flex flex-col flex-1">
                <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {project.pillar.name}
                        </span>
                        {project.status === 'paused' && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500">
                                Paused
                            </span>
                        )}
                    </div>
                    <Link href={`/projects/${project.id}`} className="block">
                        <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
                            {project.title}
                        </h3>
                    </Link>
                    {project.description && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {project.description}
                        </p>
                    )}
                </div>

                <div className="mt-auto flex items-center justify-between text-sm text-muted-foreground pt-4 border-t border-border/50">
                    <div className="flex items-center gap-3">
                        <span title="Tasks">
                            {project.tasks?.length || 0} tasks
                        </span>
                        <span>•</span>
                        <span title="Milestones">
                            {project.milestones?.length || 0} milestones
                        </span>
                    </div>
                    <Link
                        href={`/projects/${project.id}`}
                        className="p-1.5 hover:bg-muted rounded-lg transition-colors text-primary"
                    >
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
