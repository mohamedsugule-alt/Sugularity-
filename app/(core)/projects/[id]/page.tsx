import { getProject, getPillars } from '@/actions/core';
import { ProjectDetailClient } from '@/components/projects/ProjectDetailClient';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function ProjectDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const [project, pillars] = await Promise.all([
        getProject(id),
        getPillars(),
    ]);

    if (!project) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/projects"
                    className="p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                </Link>
                <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: project.pillar.colorHex }}
                        />
                        {project.pillar.name}
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
                </div>
            </div>

            <ProjectDetailClient project={project} pillars={pillars} />
        </div>
    );
}
