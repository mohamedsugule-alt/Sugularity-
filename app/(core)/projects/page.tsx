import { getProjects, getPillars } from '@/actions/core';
import { ProjectsClient } from '@/components/projects/ProjectsClient';
import { FolderKanban, CheckSquare } from 'lucide-react';

export default async function ProjectsPage() {
    const [projects, pillars] = await Promise.all([
        getProjects(),
        getPillars(),
    ]);

    return (
        <div className="space-y-6">
            {/* Distinctive header for Projects */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent border border-orange-500/20 p-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-orange-500/20">
                        <FolderKanban className="w-8 h-8 text-orange-500" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-orange-600 dark:text-orange-400">
                            Projects
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            <strong>Work with an end date</strong> — Specific outcomes you'll finish. Projects have milestones and tasks. When done, archive them.
                        </p>
                    </div>
                </div>
                <CheckSquare className="absolute right-4 bottom-4 w-24 h-24 text-orange-500/10" />
            </div>

            <ProjectsClient initialProjects={projects} pillars={pillars} />
        </div>
    );
}
