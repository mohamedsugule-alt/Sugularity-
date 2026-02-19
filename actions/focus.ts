'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function startFocusSession(taskId: string) {
    const session = await prisma.focusSession.create({
        data: {
            taskId,
            startTime: new Date(),
        },
    });
    return session;
}

export async function endFocusSession(sessionId: string, notes?: string) {
    const session = await prisma.focusSession.findUnique({ where: { id: sessionId } });
    if (!session) return null;

    const endTime = new Date();
    const duration = Math.round((endTime.getTime() - session.startTime.getTime()) / 1000); // Seconds

    const updated = await prisma.focusSession.update({
        where: { id: sessionId },
        data: {
            endTime,
            duration,
            notes,
        },
    });

    return updated;
}

export async function getDailyFocusStats(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const sessions = await prisma.focusSession.findMany({
        where: {
            startTime: {
                gte: startOfDay,
                lte: endOfDay,
            },
        },
        include: { task: true },
    });

    const totalSeconds = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);

    // Group by hour for "Optimum Condition" analysis later
    const hourlyDistribution = new Array(24).fill(0);
    sessions.forEach(s => {
        const hour = s.startTime.getHours();
        hourlyDistribution[hour] += (s.duration || 0);
    });

    return {
        totalMinutes: Math.round(totalSeconds / 60),
        sessionCount: sessions.length,
        hourlyDistribution
    };
}
