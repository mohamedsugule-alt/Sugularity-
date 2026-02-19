'use client';

import { useState } from 'react';
import { createTask, updateProject, archiveProject, completeTask, createMilestone, deleteMilestone, updateMilestone } from '@/actions/core';
import { Plus, Circle, Clock, Archive, Pause, Play, X, Pencil, CheckCircle2, Image as ImageIcon, Upload, Flag } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ProjectTimeline } from './ProjectTimeline';

type Task = {
    id: string;
    title: string;
    status: string;
    estimateMinutes: number | null;
    energyLevel: string;
    dueDate: Date | null;
    scheduledDate: Date | null;
    pillar: { id: string; name: string; colorHex: string } | null;
};

type Milestone = {
    id: string;
    title: string;
    targetDate: Date | null;
    status: string;
};

type Project = {
    id: string;
    title: string;
    description: string | null;
    status: string;
    pillar: { id: string; name: string; colorHex: string };
    goal: { id: string; title: string } | null;
    coverImage: string | null;
    startDate: Date | null;
    deadline?: Date | null; // Add deadline to type if missing, helpful for future
    tasks: Task[];
    milestones: Milestone[];
};

type Pillar = {
    id: string;
    name: string;
    colorHex: string;
};

export function ProjectDetailClient({
    project: initialProject,
    pillars,
}: {
    project: Project;
    pillars: Pillar[];
}) {
    const [project, setProject] = useState(initialProject);
    const [tasks, setTasks] = useState(initialProject.tasks);

    // Add Task State
    const [showAddTask, setShowAddTask] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '',
        estimateMinutes: 30,
        energyLevel: 'medium',
        scheduledDate: '', // Add scheduledDate
    });

    // Edit Project State
    const [showEdit, setShowEdit] = useState(false);
    const [editForm, setEditForm] = useState({
        title: initialProject.title,
        description: initialProject.description || '',
        pillarId: initialProject.pillar.id,
        goalId: initialProject.goal?.id || '',
        coverImage: initialProject.coverImage || '',
        startDate: initialProject.startDate ? new Date(initialProject.startDate).toISOString().split('T')[0] : '',
    });
    const [isUploading, setIsUploading] = useState(false);

    // Add Milestone State
    const [showAddMilestone, setShowAddMilestone] = useState(false);
    const [newMilestone, setNewMilestone] = useState({
        title: '',
        targetDate: '',
    });

    const router = useRouter();

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTask.title.trim()) return;

        try {
            const task = await createTask({
                title: newTask.title.trim(),
                pillarId: project.pillar.id,
                projectId: project.id,
                estimateMinutes: newTask.estimateMinutes,
                energyLevel: newTask.energyLevel,
                scheduledDate: newTask.scheduledDate ? new Date(newTask.scheduledDate) : undefined,
            });
            // Ensure task has pillar for local state
            const taskWithPillar = { ...task, pillar: project.pillar };
            setTasks([taskWithPillar, ...tasks]);
            setNewTask({ title: '', estimateMinutes: 30, energyLevel: 'medium', scheduledDate: '' });
            setShowAddTask(false);
            toast.success('Task added');
        } catch {
            toast.error('Failed to add task');
        }
    };

    const handleUpdateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editForm.title.trim()) return;

        try {
            const updated = await updateProject(project.id, {
                title: editForm.title.trim(),
                description: editForm.description.trim() || null,
                pillarId: editForm.pillarId,
                goalId: editForm.goalId || null,
                coverImage: editForm.coverImage.trim() || null,
                startDate: editForm.startDate ? new Date(editForm.startDate) : null,
            });
            // Update local state is tricky with Date object vs string form.
            // Better to refresh router or handle type casting carefully.
            // setProject({ ...project, ...updated, tasks: project.tasks, milestones: project.milestones }); 
            // The above spread might be risky if updated returns dates as strings (JSON) vs Dates. 
            // Server actions usually return simple objects. 
            // Let's trust router.refresh() but update optimistic state safely.
            setProject(prev => ({
                ...prev,
                title: editForm.title,
                description: editForm.description || null,
                pillar: pillars.find(p => p.id === editForm.pillarId) || prev.pillar,
                goal: prev.goal, // Assuming goal doesn't change for now or complex lookup
                coverImage: editForm.coverImage || null,
                startDate: editForm.startDate ? new Date(editForm.startDate) : null,
            }));
            setShowEdit(false);
            toast.success('Project updated');
            router.refresh();
        } catch {
            toast.error('Failed to update project');
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

    const handleCompleteTask = async (taskId: string) => {
        await completeTask(taskId);
        setTasks(tasks.filter((t) => t.id !== taskId));
        toast.success('Task completed');
    };

    const handlePause = async () => {
        await updateProject(project.id, { status: project.status === 'paused' ? 'active' : 'paused' });
        setProject({ ...project, status: project.status === 'paused' ? 'active' : 'paused' });
        toast.success(project.status === 'paused' ? 'Project resumed' : 'Project paused');
    };

    const handleArchive = async () => {
        if (!confirm('Archive this project?')) return;
        await archiveProject(project.id);
        toast.success('Project archived');
        window.location.href = '/projects';
    };

    const handleCreateMilestone = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMilestone.title.trim()) return;

        try {
            const milestone = await createMilestone({
                projectId: project.id,
                title: newMilestone.title.trim(),
                targetDate: newMilestone.targetDate ? new Date(newMilestone.targetDate) : undefined,
            });
            // Update local state (optimistic-ish, though we rely on revalidate mostly)
            setProject({
                ...project,
                milestones: [...project.milestones, {
                    id: milestone.id,
                    title: milestone.title,
                    targetDate: milestone.targetDate,
                    status: milestone.status
                }]
            });
            setNewMilestone({ title: '', targetDate: '' });
            setShowAddMilestone(false);
            toast.success('Milestone created');
        } catch {
            toast.error('Failed to create milestone');
        }
    };

    const handleDeleteMilestone = async (id: string) => {
        if (!confirm("Delete this milestone?")) return;
        try {
            await deleteMilestone(id);
            setProject({
                ...project,
                milestones: project.milestones.filter(m => m.id !== id)
            });
            toast.success('Milestone deleted');
        } catch {
            toast.error('Failed to delete milestone');
        }
    }

    const handleToggleMilestone = async (milestone: Milestone) => {
        const newStatus = milestone.status === 'complete' ? 'not_started' : 'complete';
        // Optimistic update
        const updatedMilestones = project.milestones.map(m =>
            m.id === milestone.id ? { ...m, status: newStatus } : m
        );
        setProject({ ...project, milestones: updatedMilestones });

        try {
            await updateMilestone(milestone.id, { status: newStatus });
            toast.success(newStatus === 'complete' ? 'Milestone reached!' : 'Milestone reopened');
        } catch {
            toast.error('Failed to update milestone');
            // Revert
            setProject({ ...project });
        }
    };

    // Split tasks into Active and Upcoming
    const todayStr = new Date().toISOString().split('T')[0];

    const activeTasks = tasks.filter((t) => {
        if (t.status === 'done') return false;
        if (!t.scheduledDate) return true; // No date = Active
        const scheduledStr = new Date(t.scheduledDate).toISOString().split('T')[0];
        return scheduledStr <= todayStr; // Past or Today = Active
    });

    const upcomingTasks = tasks.filter((t) => {
        if (t.status === 'done') return false;
        if (!t.scheduledDate) return false;
        const scheduledStr = new Date(t.scheduledDate).toISOString().split('T')[0];
        return scheduledStr > todayStr; // Future = Upcoming
    });

    const totalEstimate = activeTasks.reduce((sum, t) => sum + (t.estimateMinutes || 30), 0);
    const upcomingEstimate = upcomingTasks.reduce((sum, t) => sum + (t.estimateMinutes || 30), 0);

    return (
        <div className="space-y-6">
            {/* Project Info */}
            <div className="glass-panel rounded-xl overflow-hidden">
                {/* ... (Cover Image code remains same) ... */}
                <div className={`h-32 relative ${project.coverImage ? '' : 'bg-gradient-to-r from-muted to-muted/50'}`}>
                    {project.coverImage ? (
                        <img
                            src={project.coverImage}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.currentTarget.parentElement?.classList.add('bg-gradient-to-r', 'from-muted', 'to-muted/50');
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                    ) : (
                        <div className="absolute inset-0 opacity-10" style={{ backgroundColor: project.pillar.colorHex }} />
                    )}
                </div>

                <div className="p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${project.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                                    project.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
                                        'bg-muted text-muted-foreground'
                                    }`}>
                                    {project.status}
                                </span>
                                <span className="text-xs font-medium px-2 py-0.5 rounded bg-muted/50 text-muted-foreground">
                                    {project.pillar.name}
                                </span>
                                {project.startDate && (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        Started {new Date(project.startDate).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                            <h1 className="text-2xl font-bold mb-2">{project.title}</h1>
                            {project.description && (
                                <p className="text-muted-foreground">{project.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                                <span>{activeTasks.length} active tasks</span>
                                <span>{Math.round(totalEstimate / 60 * 10) / 10}h active estimate</span>
                                <span>{project.milestones.length} milestones</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowEdit(true)}
                                className="p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                                title="Edit Project"
                                suppressHydrationWarning
                            >
                                <Pencil className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handlePause}
                                className="p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                                title={project.status === 'paused' ? 'Resume' : 'Pause'}
                                suppressHydrationWarning
                            >
                                {project.status === 'paused' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={handleArchive}
                                className="p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-muted-foreground hover:text-red-500"
                                title="Archive"
                                suppressHydrationWarning
                            >
                                <Archive className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Project Timeline */}
            <ProjectTimeline
                tasks={tasks}
                milestones={project.milestones}
                projectDeadline={null}
            />

            {/* Tasks */}
            <div className="glass-panel rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Active Tasks</h2>
                    <button
                        onClick={() => setShowAddTask(true)}
                        className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors flex items-center gap-1"
                        suppressHydrationWarning
                    >
                        <Plus className="w-4 h-4" />
                        Add Task
                    </button>
                </div>

                {/* Add Task Form with Date Picker */}
                {showAddTask && (
                    <div className="mb-4 p-4 bg-muted/30 rounded-lg">
                        <form onSubmit={handleAddTask} className="space-y-3">
                            <input
                                type="text"
                                value={newTask.title}
                                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                placeholder="Task title..."
                                className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                                autoFocus
                                suppressHydrationWarning
                            />
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <label className="text-xs text-muted-foreground block mb-1">Estimate (min)</label>
                                    <input
                                        type="number"
                                        value={newTask.estimateMinutes}
                                        onChange={(e) => setNewTask({ ...newTask, estimateMinutes: parseInt(e.target.value) || 30 })}
                                        className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                                        suppressHydrationWarning
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs text-muted-foreground block mb-1">Energy</label>
                                    <select
                                        value={newTask.energyLevel}
                                        onChange={(e) => setNewTask({ ...newTask, energyLevel: e.target.value })}
                                        className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                                        suppressHydrationWarning
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs text-muted-foreground block mb-1">Schedule For</label>
                                    <input
                                        type="date"
                                        value={newTask.scheduledDate}
                                        onChange={(e) => setNewTask({ ...newTask, scheduledDate: e.target.value })}
                                        className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                                        suppressHydrationWarning
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowAddTask(false)}
                                    className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
                                    suppressHydrationWarning
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!newTask.title.trim()}
                                    className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50"
                                    suppressHydrationWarning
                                >
                                    {newTask.scheduledDate && new Date(newTask.scheduledDate) > new Date() ? 'Schedule Task' : 'Add Task'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Active Task List */}
                {activeTasks.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-8">
                        No active tasks. Add a task or check the upcoming list.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {activeTasks.map((task) => (
                            <div
                                key={task.id}
                                className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
                            >
                                <button
                                    onClick={() => handleCompleteTask(task.id)}
                                    className="text-muted-foreground hover:text-primary transition-colors"
                                    suppressHydrationWarning
                                >
                                    <Circle className="w-5 h-5" />
                                </button>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm">{task.title}</p>
                                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                        {task.estimateMinutes && (
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {task.estimateMinutes}m
                                            </span>
                                        )}
                                        <span className="capitalize">{task.energyLevel}</span>
                                        {task.scheduledDate && (
                                            <span className="flex items-center gap-1 text-primary">
                                                <Clock className="w-3 h-3" />
                                                Scheduled for Today
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Upcoming Tasks Section */}
                {upcomingTasks.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-border/30">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-muted-foreground flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Upcoming & Scheduled
                            </h3>
                            <span className="text-xs text-muted-foreground">{upcomingTasks.length} tasks ({Math.round(upcomingEstimate / 60 * 10) / 10}h)</span>
                        </div>
                        <div className="space-y-2 opacity-75">
                            {upcomingTasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/10 border border-border/30"
                                >
                                    <div className="w-5 h-5 flex items-center justify-center">
                                        <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm text-muted-foreground">{task.title}</p>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                            {task.scheduledDate && (
                                                <span className="flex items-center gap-1 text-blue-400">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(task.scheduledDate).toLocaleDateString()}
                                                </span>
                                            )}
                                            {task.estimateMinutes && (
                                                <span>{task.estimateMinutes}m</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Milestones */}
            <div className="glass-panel rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Milestones</h2>
                    <button
                        onClick={() => setShowAddMilestone(true)}
                        className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors flex items-center gap-1"
                    >
                        <Plus className="w-4 h-4" />
                        Add Milestone
                    </button>
                </div>
                {project.milestones.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-4">
                        No milestones yet. Milestones help track major progress points.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {project.milestones.map((milestone) => (
                            <div
                                key={milestone.id}
                                className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 group"
                            >
                                <button
                                    onClick={() => handleToggleMilestone(milestone)}
                                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${milestone.status === 'complete'
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-muted-foreground/30 hover:bg-emerald-500/50'
                                        }`}
                                    title={milestone.status === 'complete' ? "Mark as incomplete" : "Mark as reached"}
                                >
                                    {milestone.status === 'complete' && <CheckCircle2 className="w-3 h-3" />}
                                </button>
                                <span className={`font-medium ${milestone.status === 'complete' ? 'line-through text-muted-foreground' : ''}`}>
                                    {milestone.title}
                                </span>
                                {milestone.targetDate && (
                                    <span className={`ml-auto text-xs ${milestone.status === 'complete' ? 'text-muted-foreground' :
                                        new Date(milestone.targetDate) < new Date(todayStr) ? 'text-red-500 font-medium' :
                                            new Date(milestone.targetDate).toISOString().split('T')[0] === todayStr ? 'text-emerald-500 font-medium' :
                                                'text-muted-foreground'
                                        }`}>
                                        {new Date(milestone.targetDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        {new Date(milestone.targetDate).toISOString().split('T')[0] === todayStr && " (Today)"}
                                    </span>
                                )}
                                <button
                                    onClick={() => handleDeleteMilestone(milestone.id)}
                                    className="ml-2 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Milestone Modal */}
            {
                showAddMilestone && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="glass-panel rounded-xl p-6 max-w-md w-full">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Add Milestone</h3>
                                <button onClick={() => setShowAddMilestone(false)} className="text-muted-foreground hover:text-foreground">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleCreateMilestone} className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium block mb-1">Title</label>
                                    <input
                                        type="text"
                                        value={newMilestone.title}
                                        onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                                        placeholder="e.g. Prototype Complete"
                                        className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium block mb-1">Target Date</label>
                                    <input
                                        type="date"
                                        value={newMilestone.targetDate}
                                        onChange={(e) => setNewMilestone({ ...newMilestone, targetDate: e.target.value })}
                                        className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddMilestone(false)}
                                        className="flex-1 py-2 bg-muted/50 hover:bg-muted rounded-lg font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!newMilestone.title.trim()}
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

            {/* Edit Modal */}
            {
                showEdit && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="glass-panel rounded-xl p-6 max-w-md w-full">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Edit Project</h3>
                                <button onClick={() => setShowEdit(false)} className="text-muted-foreground hover:text-foreground" suppressHydrationWarning>
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleUpdateProject} className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium block mb-1">Title</label>
                                    <input
                                        type="text"
                                        value={editForm.title}
                                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                        className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"

                                        autoFocus
                                        suppressHydrationWarning
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-sm font-medium block mb-1">Start Date</label>
                                        <input
                                            type="date"
                                            value={editForm.startDate}
                                            onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                                            className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                                            suppressHydrationWarning
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium block mb-1">Deadline (Future)</label>
                                        <input
                                            type="date"
                                            disabled
                                            placeholder="Use milestones"
                                            className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm opacity-50 cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium block mb-1">Pillar</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {pillars.map((pillar) => (
                                            <button
                                                key={pillar.id}
                                                type="button"
                                                onClick={() => setEditForm({ ...editForm, pillarId: pillar.id })}
                                                className={`p-2 rounded-lg text-sm font-medium border text-left flex items-center gap-2 transition-colors ${editForm.pillarId === pillar.id
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
                                    <label className="text-sm font-medium block mb-1">Description</label>
                                    <textarea
                                        value={editForm.description}
                                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
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
                                                placeholder="Image URL..."
                                                value={editForm.coverImage}
                                                onChange={(e) => setEditForm({ ...editForm, coverImage: e.target.value })}
                                                className="flex-1 bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                                                suppressHydrationWarning
                                            />
                                            <label className="cursor-pointer bg-muted hover:bg-muted/80 px-3 py-2 rounded-lg flex items-center justify-center transition-colors" title="Upload Image">
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
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowEdit(false)}
                                        className="flex-1 py-2 bg-muted/50 hover:bg-muted rounded-lg font-medium transition-colors"
                                        suppressHydrationWarning
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!editForm.title.trim() || isUploading}
                                        className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                                        suppressHydrationWarning
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
