import { getAllActiveTasks } from '@/actions/tasks';
import { getPillars, getProjects } from '@/actions/core';
import { TasksClient } from '@/components/tasks/TasksClient';
import { ListTodo } from 'lucide-react';

export default async function TasksPage() {
    const [tasks, pillars, projects] = await Promise.all([
        getAllActiveTasks(),
        getPillars(),
        getProjects()
    ]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <div className="p-2 rounded-2xl bg-pink-500/10 text-pink-500">
                            <ListTodo className="w-7 h-7" />
                        </div>
                        Task Board
                    </h1>
                    <p className="text-muted-foreground mt-1 font-medium italic">
                        The Master list. All Commitments. Zero Friction.
                    </p>
                </div>
            </div>

            <TasksClient
                initialTasks={tasks as any}
                pillars={pillars}
                projects={projects}
            />
        </div>
    );
}
