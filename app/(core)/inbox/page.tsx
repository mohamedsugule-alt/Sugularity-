import { getPillars, getProjects, getRituals } from '@/actions/core';
import { getInboxItems } from '@/actions/inbox';
import { InboxClient } from '@/components/inbox/InboxClient';
import { Inbox } from 'lucide-react';

export default async function InboxPage() {
    const [items, pillars, projects, rituals] = await Promise.all([
        getInboxItems(),
        getPillars(),
        getProjects(),
        getRituals(),
    ]);

    // Serialize Date objects to prevent hydration mismatch
    const serializedItems = items.map((item: any) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        processedAt: item.processedAt?.toISOString() || null,
        snoozedUntil: item.snoozedUntil?.toISOString() || null,
        emailReceivedAt: item.emailReceivedAt?.toISOString() || null,
    }));

    const serializedPillars = pillars.map((p: any) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
    }));

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <Inbox className="w-8 h-8 text-primary" />
                    Inbox
                </h1>
                <p className="text-muted-foreground mt-1">
                    Capture fast, process later. Every item needs a home.
                </p>
            </div>

            <InboxClient
                initialItems={serializedItems}
                pillars={serializedPillars}
                projects={projects}
                rituals={rituals}
            />
        </div>
    );
}
