'use server';

import prisma from '@/lib/prisma';
import { getSettings } from '@/actions/settings';
import { updateDailyPlan } from '@/actions/daily-plan';

export async function generateDailyPlan(date: Date, currentEnergy: string = 'medium') {
    // 1. Get Settings & Capacity
    const settings = await getSettings();
    const capacityHours = settings.dailyCapacityHours || 6;
    const capacityMinutes = capacityHours * 60;

    // 2. Get Tasks
    //   - Must-Dos: Scheduled for Today OR Overdue
    //   - Should-Dos: Active backlog items
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const [todayTasks, overdueTasks, backlogTasks] = await Promise.all([
        // Scheduled for today
        prisma.task.findMany({
            where: {
                scheduledDate: { gte: startOfDay, lte: endOfDay },
                status: { not: 'done' }
            }
        }),
        // Overdue (scheduled before today and not done)
        prisma.task.findMany({
            where: {
                scheduledDate: { lt: startOfDay },
                status: { not: 'done' }
            }
        }),
        // Backlog (no scheduled date, not done)
        prisma.task.findMany({
            where: {
                scheduledDate: null,
                status: 'active'
            },
            orderBy: { createdAt: 'desc' }, // Simple ordering for now, revised by scoring below
            take: 50 // Limit candidate pool for performance
        })
    ]);

    // 3. Selection Logic (Greedy Knapsack)
    const selectedTaskIds: string[] = [];
    let usedMinutes = 0;

    // Helper to add task if fits
    const attemptAddTask = (task: any, force = false) => {
        if (selectedTaskIds.includes(task.id)) return;

        const estimate = task.estimateMinutes || settings.defaultEstimateMin;

        // If force (overdue/scheduled) or fits in capacity
        if (force || (usedMinutes + estimate <= capacityMinutes)) {
            selectedTaskIds.push(task.id);
            usedMinutes += estimate;
        }
    };

    // A. Add Must-Dos (Force add even if over capacity to show reality)
    [...overdueTasks, ...todayTasks].forEach(t => attemptAddTask(t, true));

    // B. Fill Remaining Capacity with Backlog
    if (usedMinutes < capacityMinutes) {
        // Score backlog tasks
        const candidates = backlogTasks.map(t => {
            let score = 0;

            // Age factor (older = higher score)
            const daysOld = (new Date().getTime() - new Date(t.createdAt).getTime()) / (1000 * 3600 * 24);
            score += daysOld * 0.5;

            // Energy Matching
            if (currentEnergy === 'low' && t.energyLevel === 'low') score += 20;
            if (currentEnergy === 'high' && t.energyLevel === 'high') score += 20;

            // Project bias (if project is active)
            if (t.projectId) score += 5;

            return { task: t, score };
        });

        // Sort by score
        candidates.sort((a, b) => b.score - a.score);

        // Add until full
        for (const candidate of candidates) {
            if (usedMinutes >= capacityMinutes) break;
            attemptAddTask(candidate.task);
        }
    }

    // 4. Commit Plan
    // We don't save to DB yet, we return the proposal for the user to confirm.
    // Or we can save to DailyPlan 'committedTaskIds' but simpler to just return list first.

    return {
        selectedTaskIds,
        totalMinutes: usedMinutes,
        capacityMinutes,
        tasks: {
            mustDo: [...overdueTasks, ...todayTasks],
            suggested: backlogTasks.filter(t => selectedTaskIds.includes(t.id) && !todayTasks.find(tt => tt.id === t.id) && !overdueTasks.find(ot => ot.id === t.id))
        }
    };
}

export async function commitAutoPlan(date: Date, taskIds: string[]) {
    // 1. Update tasks to be scheduled for today
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    await prisma.task.updateMany({
        where: { id: { in: taskIds } },
        data: { scheduledDate: startOfDay }
    });

    // 2. Update Daily Plan
    await updateDailyPlan(date, {
        committedTaskIds: JSON.stringify(taskIds)
    });

    return { success: true };
}
