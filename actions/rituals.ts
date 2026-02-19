'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Toggle Ritual Entry (Check / Uncheck)
export async function toggleRitualEntry(
    ritualId: string,
    date: Date, // The date being checked (e.g. today or a past date)
    status: string = 'completed'
) {
    // Normalize date to midnight UTC or local? 
    // Best practice: Store date at midnight UTC for "Day" records.
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    // Check if exists
    const existing = await (prisma as any).ritualEntry.findUnique({
        where: {
            ritualId_date: {
                ritualId,
                date: normalizedDate,
            }
        }
    });

    if (existing) {
        // Toggle OFF (Delete)
        await (prisma as any).ritualEntry.delete({
            where: { id: existing.id }
        });
    } else {
        // Create
        await (prisma as any).ritualEntry.create({
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
    console.log('[getRitualsForDay] Starting for date:', date);

    // Create a fresh client to debug global instance issues
    const { PrismaClient } = await import('@prisma/client');
    const localPrisma = new PrismaClient();

    try {
        const dayOfWeek = date.getDay(); // 0-6
        const normalizedDate = new Date(date);
        normalizedDate.setHours(0, 0, 0, 0);

        console.log('[getRitualsForDay] normalizedDate:', normalizedDate);

        // Get all active rituals (Filter safely in memory to avoid Prisma Schema mismatch until restart)
        // Explicitly using the local client
        const allRituals = await (localPrisma as any).ritual.findMany({
            where: {
                status: 'active',
            },
            include: { pillar: true }
        });

        console.log('[getRitualsForDay] Fetched rituals count:', allRituals.length);

        // Manual Filter & manual Entry fetch (fallback)
        const ritualsForDay = allRituals.filter((r: any) => {
            if (!r.daysOfWeek) return true; // Show all if no days set (fallback)
            return r.daysOfWeek.includes(String(dayOfWeek));
        });

        const ritualIds = ritualsForDay.map((r: any) => r.id);

        // Fetch entries
        // Using strict raw query if needed, but let's try standard first with local client
        let entriesMap: Record<string, any> = {};

        try {
            // Using 'any' cast to avoid build errors if types are stale
            const entries = await (localPrisma as any).ritualEntry.findMany({
                where: {
                    ritualId: { in: ritualIds },
                    date: normalizedDate
                }
            });
            entries.forEach((e: any) => entriesMap[e.ritualId] = e);
        } catch (entryError) {
            console.error('[getRitualsForDay] Error fetching entries:', entryError);
            // Ignore entry error and return rituals as not completed
        }

        return ritualsForDay.map((r: any) => ({
            ...r,
            isCompleted: !!entriesMap[r.id],
            entryId: entriesMap[r.id]?.id
        }));

    } catch (error) {
        console.error('[getRitualsForDay] CRITICAL ERROR:', error);
        // Fallback to empty array to prevent page crash
        return [];
    } finally {
        await localPrisma.$disconnect();
    }
}
