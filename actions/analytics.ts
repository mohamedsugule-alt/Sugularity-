'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getMonthlyStats(date: Date) {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    // 1. Fetch Daily Plans for the month
    const dailyPlans = await prisma.dailyPlan.findMany({
        where: {
            date: {
                gte: startOfMonth,
                lte: endOfMonth,
            },
        },
    });

    // 2. Fetch Tasks scheduled or completed in this month
    const tasks = await prisma.task.findMany({
        where: {
            OR: [
                { committedDate: { gte: startOfMonth, lte: endOfMonth } },
                { completedAt: { gte: startOfMonth, lte: endOfMonth } }
            ]
        },
        include: {
            pillar: { select: { id: true, name: true, colorHex: true } },
            focusSessions: true,
        },
    });

    // 3b. Pillar distribution (completed tasks)
    const pillarMap: Record<string, { name: string; color: string; count: number }> = {};
    for (const task of tasks) {
        if (task.status !== 'done') continue;
        const key = task.pillar?.id ?? 'none';
        if (!pillarMap[key]) {
            pillarMap[key] = { name: task.pillar?.name ?? 'No Pillar', color: task.pillar?.colorHex ?? '#6b7280', count: 0 };
        }
        pillarMap[key].count++;
    }
    const pillarDistribution = Object.values(pillarMap).sort((a, b) => b.count - a.count);

    // 3. Activity Calculation
    let totalCommitted = 0;
    let totalCompleted = 0;
    let totalFocusSeconds = 0;

    const dailyCompletion: { date: string; rate: number }[] = [];
    const focusByDay: Record<number, number> = {}; // 0-6 (Sun-Sat)
    const focusByHour: Record<number, number> = {}; // 0-23

    // Process Daily Plans for Completion Rate consistency
    for (const plan of dailyPlans) {
        if (!plan.committedTaskIds) continue;
        const committedIds = JSON.parse(plan.committedTaskIds) as string[];
        const count = committedIds.length;
        if (count === 0) continue;

        // Find how many of these are done
        const completedCount = await prisma.task.count({
            where: {
                id: { in: committedIds },
                status: 'done'
            }
        });

        totalCommitted += count;
        totalCompleted += completedCount;

        dailyCompletion.push({
            date: plan.date.toISOString().split('T')[0],
            rate: Math.round((completedCount / count) * 100)
        });
    }

    // Process Focus Sessions
    const focusByDate: Record<string, number> = {}; // ISO date → minutes
    for (const task of tasks) {
        for (const session of task.focusSessions) {
            if (!session.duration) continue;
            totalFocusSeconds += session.duration;

            const day = session.startTime.getDay();
            const hour = session.startTime.getHours();
            const dateKey = session.startTime.toISOString().split('T')[0];

            focusByDay[day] = (focusByDay[day] || 0) + session.duration;
            focusByHour[hour] = (focusByHour[hour] || 0) + session.duration;
            focusByDate[dateKey] = (focusByDate[dateKey] || 0) + Math.round(session.duration / 60);
        }
    }

    // Build daily focus array aligned with dailyCompletion dates
    const dailyFocusData = dailyCompletion.map(d => ({
        date: d.date,
        minutes: focusByDate[d.date] || 0,
    }));

    const completionRate = totalCommitted > 0 ? Math.round((totalCompleted / totalCommitted) * 100) : 0;
    const avgDailyFocusMinutes = dailyPlans.length > 0 ? Math.round((totalFocusSeconds / 60) / dailyPlans.length) : 0;

    // Determine Optimum Conditions
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const bestDay = Object.entries(focusByDay).sort((a, b) => b[1] - a[1])[0];
    const bestHour = Object.entries(focusByHour).sort((a, b) => b[1] - a[1])[0];

    return {
        monthLabel: startOfMonth.toLocaleDateString('default', { month: 'long', year: 'numeric' }),
        completionRate,
        totalTasks: totalCommitted,
        completedTasks: totalCompleted,
        totalFocusHours: Math.round(totalFocusSeconds / 3600 * 10) / 10,
        avgDailyFocusMinutes,
        dailyCompletion,
        dailyFocusData,
        pillarDistribution,
        optimumDay: bestDay ? days[parseInt(bestDay[0])] : 'N/A',
        optimumHour: bestHour ? `${bestHour[0]}:00` : 'N/A',
    };
}
