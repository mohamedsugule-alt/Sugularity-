'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export type BriefingData = {
    userName: string;
    yesterdayWins: {
        id: string;
        title: string;
        completedAt: Date;
    }[];
    todaySchedule: {
        id: string;
        title: string;
        time?: string;
    }[];
    stalledProjects: {
        id: string;
        title: string;
        daysInactive: number;
    }[];
    activeProjects: {
        id: string;
        title: string;
    }[];
    activeRituals: {
        id: string;
        title: string;
    }[];
    streakDays: number;
};

export async function generateMorningBriefing(): Promise<BriefingData> {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    // 1. Get User Name (Mock for now, or from settings if we had it)
    const settings = await prisma.userSettings.findFirst();
    // Logic to get name if we had a User model, detailed settings, or auth. 
    // For V1 local, we'll genericize or use a placeholder.
    const userName = "Commander";

    // 2. Yesterday's Wins (Completed tasks between yesterday start and today start)
    // Actually, let's just look at 'archiveRecord' for yesterday? 
    // Or tasks with completedAt? ArchiveRecords are safer as tasks move to 'done' status but might just be regular tasks.
    // Let's query ArchiveRecords for yesterday.
    const yesterdayWins = await prisma.archiveRecord.findMany({
        where: {
            completedAt: {
                gte: yesterdayStart,
                lt: todayStart,
            }
        },
        select: {
            id: true,
            title: true,
            completedAt: true,
        },
        orderBy: { completedAt: 'desc' },
    });

    // 3. Today's Schedule (Tasks with scheduledDate = today)
    const todayScheduleTasks = await prisma.task.findMany({
        where: {
            scheduledDate: {
                gte: todayStart,
                lt: new Date(todayStart.getTime() + 24 * 60 * 60 * 1000),
            },
            status: { not: 'done' },
        },
        select: {
            id: true,
            title: true,
            // We don't strictly have a 'time' field separate from date yet in Task, 
            // but if we did distinct calendar events, we'd pull them here.
            // For now, just listing them.
        }
    });

    const todaySchedule = todayScheduleTasks.map(t => ({
        id: t.id,
        title: t.title,
        time: undefined // Placeholder for future time-blocking
    }));

    // 4. Stalled Projects (No activity in > 14 days)
    const stallThreshold = new Date(now);
    stallThreshold.setDate(stallThreshold.getDate() - 14);

    const stalled = await prisma.project.findMany({
        where: {
            status: 'active',
            lastActivityAt: { lt: stallThreshold }
        },
        select: {
            id: true,
            title: true,
            lastActivityAt: true
        },
        take: 3
    });

    const stalledProjects = stalled.map(p => ({
        id: p.id,
        title: p.title,
        daysInactive: Math.floor((now.getTime() - p.lastActivityAt.getTime()) / (1000 * 60 * 60 * 24))
    }));

    // 5. Streak (Simple count of consecutive days with an ArchiveRecord? Or just a random number for fun for now?)
    // Let's calculate a simple consistency score later. For now, 0.
    const streakDays = 0; // TODO: Implement streak logic

    // 6. Active Contexts (for linking outcomes)
    const [activeProjects, activeRituals] = await Promise.all([
        prisma.project.findMany({
            where: { status: 'active' },
            select: { id: true, title: true },
            orderBy: { title: 'asc' }
        }),
        prisma.ritual.findMany({
            where: { status: 'active' },
            select: { id: true, title: true },
            orderBy: { title: 'asc' }
        })
    ]);

    return {
        userName,
        yesterdayWins: yesterdayWins.map(w => ({ ...w, completedAt: w.completedAt })),
        todaySchedule,
        stalledProjects,
        streakDays,
        activeProjects,
        activeRituals
    };
}
