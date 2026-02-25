'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Toggle Ritual Entry (Check / Uncheck)
export async function toggleRitualEntry(
    ritualId: string,
    date: Date,
    status: string = 'completed'
) {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    const existing = await prisma.ritualEntry.findUnique({
        where: {
            ritualId_date: {
                ritualId,
                date: normalizedDate,
            }
        }
    });

    if (existing) {
        await prisma.ritualEntry.delete({
            where: { id: existing.id }
        });
    } else {
        await prisma.ritualEntry.create({
            data: {
                ritualId,
                date: normalizedDate,
                status
            }
        });
    }

    revalidatePath('/today');
    revalidatePath('/calendar');
}

// Get Rituals for a specific Day
export async function getRitualsForDay(date: Date) {
    const dayOfWeek = date.getDay();
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    try {
        const allRituals = await prisma.ritual.findMany({
            where: { status: 'active' },
            include: { pillar: true }
        });

        const ritualsForDay = allRituals.filter((r) => {
            if (!r.daysOfWeek) return true;
            return r.daysOfWeek.includes(String(dayOfWeek));
        });

        const ritualIds = ritualsForDay.map((r) => r.id);

        let entriesMap: Record<string, { id: string }> = {};

        if (ritualIds.length > 0) {
            const entries = await prisma.ritualEntry.findMany({
                where: {
                    ritualId: { in: ritualIds },
                    date: normalizedDate
                }
            });
            entries.forEach((e) => { entriesMap[e.ritualId] = e; });
        }

        return ritualsForDay.map((r) => ({
            ...r,
            isCompleted: !!entriesMap[r.id],
            entryId: entriesMap[r.id]?.id ?? null
        }));

    } catch (error) {
        console.error('[getRitualsForDay] Error:', error);
        return [];
    }
}
