import { getPillars, getProjects, getRituals, getTasks } from '@/actions/core';
import { getArchiveRecords } from '@/actions/archive';
import { ArchiveClient } from '@/components/archive/ArchiveClient';
import { Archive } from 'lucide-react';

export default async function ArchivePage() {
    const [records, pillars, projects, rituals] = await Promise.all([
        getArchiveRecords({ limit: 100 }),
        getPillars(),
        getProjects(),
        getRituals(),
    ]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <Archive className="w-8 h-8 text-primary" />
                    Archive
                </h1>
                <p className="text-muted-foreground mt-1">
                    Your proof of work. Every completed task lives here.
                </p>
            </div>

            <ArchiveClient
                initialRecords={records}
                pillars={pillars}
                projects={projects}
                rituals={rituals}
            />
        </div>
    );
}

