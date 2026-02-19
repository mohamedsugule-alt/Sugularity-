import { getRitual, getPillars, getTasks } from '@/actions/core';
import { RitualDetailClient } from '@/components/rituals/RitualDetailClient';
import { notFound } from 'next/navigation';

export default async function RitualDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const [ritual, pillars, allTasks] = await Promise.all([
        getRitual(id),
        getPillars(),
        getTasks(),
    ]);

    if (!ritual) {
        notFound();
    }

    // Get tasks for this ritual
    const ritualTasks = allTasks.filter((t: any) => t.ritualId === id);

    // Serialize dates
    const serializedRitual = {
        ...ritual,
        createdAt: ritual.createdAt.toISOString(),
        updatedAt: ritual.updatedAt.toISOString(),
        lastActivityAt: (ritual as any).lastActivityAt?.toISOString() || null,
        currentCycleStart: ritual.currentCycleStart?.toISOString() || null,
        daysOfWeek: (ritual as any).daysOfWeek || null,
    };

    const serializedTasks = ritualTasks.map((t: any) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        estimateMinutes: t.estimateMinutes,
        scheduledDate: t.scheduledDate?.toISOString() || null,
        completedAt: t.completedAt?.toISOString() || null,
    }));

    return (
        <div className="space-y-6">
            <RitualDetailClient
                ritual={serializedRitual as any}
                tasks={serializedTasks}
                pillars={pillars.map((a: any) => ({ id: a.id, name: a.name, colorHex: a.colorHex }))}
            />
        </div>
    );
}
