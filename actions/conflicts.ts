'use server';

import prisma from '@/lib/prisma';
import { getSettings } from '@/actions/settings';

export type Conflict = {
    taskId?: string; // If conflict is with a task
    calendarBlockId?: string; // If conflict is with a calendar event
    type: 'meeting_overlap' | 'workday_limit' | 'double_booking';
    severity: 'warning' | 'critical';
    message: string;
    startTime: Date;
    endTime: Date;
};

export async function detectConflicts(date: Date): Promise<Conflict[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const settings = await getSettings();
    const [workStartH, workStartM] = settings.workDayStart.split(':').map(Number);
    const [workEndH, workEndM] = settings.workDayEnd.split(':').map(Number);

    // Construct Work Day Boundaries
    const workStart = new Date(startOfDay);
    workStart.setHours(workStartH, workStartM, 0, 0);
    const workEnd = new Date(startOfDay);
    workEnd.setHours(workEndH, workEndM, 0, 0);

    // 1. Fetch Data
    // We need tasks that have a scheduled time (not just date)
    const tasks = await prisma.task.findMany({
        where: {
            scheduledDate: { gte: startOfDay, lte: endOfDay },
            status: { not: 'done' }
        }
    });

    const conflicts: Conflict[] = [];

    // Helper: Filter tasks that actually have a TIME component (not midnight)
    // Heuristic: If scheduledDate is exactly midnight, it's likely "Anytime today".
    // If it's not midnight, it's specific.
    const timedTasks = tasks.filter(t => {
        if (!t.scheduledDate) return false;
        const d = new Date(t.scheduledDate);
        return !(d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0);
    });

    // 2. Check Task Conflicts
    for (const task of timedTasks) {
        if (!task.scheduledDate) continue;
        const taskStart = new Date(task.scheduledDate);
        const duration = task.estimateMinutes || settings.defaultEstimateMin;
        const taskEnd = new Date(taskStart.getTime() + duration * 60000);

        // A. Check vs Work Day End
        if (taskEnd > workEnd) {
            conflicts.push({
                taskId: task.id,
                type: 'workday_limit',
                severity: 'warning',
                message: `Task extends past workday end (${settings.workDayEnd})`,
                startTime: taskStart,
                endTime: taskEnd
            });
        }

        // B. Check vs Other Tasks (Double Booking)
        for (const otherTask of timedTasks) {
            if (task.id === otherTask.id) continue;

            const otherStart = new Date(otherTask.scheduledDate!);
            const otherDuration = otherTask.estimateMinutes || settings.defaultEstimateMin;
            const otherEnd = new Date(otherStart.getTime() + otherDuration * 60000);

            if (taskStart < otherEnd && taskEnd > otherStart) {
                // Deduplicate: Only add if task.id < otherTask.id to avoid double reporting
                if (task.id < otherTask.id) {
                    conflicts.push({
                        taskId: task.id,
                        type: 'double_booking',
                        severity: 'critical',
                        message: `Double booked with "${otherTask.title}"`,
                        startTime: taskStart,
                        endTime: taskEnd
                    });
                }
            }
        }
    }

    return conflicts;
}
