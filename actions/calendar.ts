'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getRitualsForDay } from './rituals';

// ============================================
// CALENDAR TIME-BLOCKING (One-Way: Sugularity → Google)
// ============================================

export interface TimeBlockRequest {
    taskId: string;
    calendarId?: string;
    date: Date;
    startTime: string; // HH:mm
    duration: number;  // minutes
    includeNotes?: boolean;
}

export interface ConflictInfo {
    hasConflict: boolean;
    conflictingBlocks: {
        start: Date;
        end: Date;
        title?: string;
    }[];
}

export type RitualItem = {
    id: string;
    title: string;
    pillarColor?: string;
    isCompleted: boolean;
    entryId?: string;
};

export type Agenda = {
    taskBlocks: {
        id: string;
        title: string;
        startTime?: Date;
        endTime?: Date;
        pillarColor?: string;
        projectTitle?: string;
        calendarLinkBroken: boolean;
        energyLevel?: string; // Added
    }[];
    unscheduledTasks: {
        id: string;
        title: string;
        estimateMinutes?: number | null;
        pillarColor?: string;
        scheduledDate?: string; // ISO
        energyLevel?: string; // Added
    }[];
    backlogTasks: {
        id: string;
        title: string;
        pillarColor?: string;
        energyLevel?: string; // Added
    }[];
    milestones: {
        id: string;
        title: string;
        targetDate: Date;
        projectTitle?: string;
    }[];
    rituals: RitualItem[];
};

// Update a time block (Drag and Drop)
export async function updateTaskTime(
    taskId: string,
    newDate: Date,
    newStartTime: string, // HH:mm
    duration: number
) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new Error('Task not found');

    const [hours, minutes] = newStartTime.split(':').map(Number);
    const blockStart = new Date(newDate);
    blockStart.setHours(hours, minutes, 0, 0);
    const blockEnd = new Date(blockStart.getTime() + duration * 60 * 1000);

    // Update Task
    const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: {
            calendarBlockStart: blockStart,
            calendarBlockEnd: blockEnd,
            scheduledDate: blockStart, // Keep scheduled date in sync
            lastTouchedAt: new Date(),
        },
    });

    revalidatePath('/today');
    revalidatePath('/calendar');
    return updatedTask;
}

// Check for conflicts before time-blocking
export async function checkTimeBlockConflicts(
    date: Date,
    startTime: string,
    duration: number
): Promise<ConflictInfo> {
    const [hours, minutes] = startTime.split(':').map(Number);
    const blockStart = new Date(date);
    blockStart.setHours(hours, minutes, 0, 0);
    const blockEnd = new Date(blockStart.getTime() + duration * 60 * 1000);

    // Check against existing task time blocks
    const taskBlocks = await prisma.task.findMany({
        where: {
            calendarBlockStart: { lt: blockEnd },
            calendarBlockEnd: { gt: blockStart },
            status: { not: 'done' },
        },
    });

    const conflicts = [
        ...taskBlocks.map(t => ({
            start: t.calendarBlockStart!,
            end: t.calendarBlockEnd!,
            title: t.title,
        })),
    ];

    return {
        hasConflict: conflicts.length > 0,
        conflictingBlocks: conflicts,
    };
}

// Create a time block for a task
export async function createTimeBlock(request: TimeBlockRequest) {
    const task = await prisma.task.findUnique({ where: { id: request.taskId } });
    if (!task) throw new Error('Task not found');

    const settings = await prisma.userSettings.findFirst();
    const calendarId = request.calendarId || settings?.defaultCalendarId || 'primary';

    const [hours, minutes] = request.startTime.split(':').map(Number);
    const blockStart = new Date(request.date);
    blockStart.setHours(hours, minutes, 0, 0);
    const blockEnd = new Date(blockStart.getTime() + request.duration * 60 * 1000);

    // In a real implementation, this would call Google Calendar API
    // For now, we simulate by storing locally
    const eventId = `sugularity-${task.id}-${Date.now()}`;

    const updatedTask = await prisma.task.update({
        where: { id: request.taskId },
        data: {
            calendarProvider: 'google',
            calendarEventId: eventId,
            calendarBlockStart: blockStart,
            calendarBlockEnd: blockEnd,
            calendarId: calendarId,
            calendarLinkBroken: false,
            scheduledDate: blockStart,
            lastTouchedAt: new Date(),
        },
    });

    revalidatePath('/today');
    revalidatePath('/calendar');
    return updatedTask;
}

// Remove calendar link from task
export async function removeTimeBlock(taskId: string) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new Error('Task not found');

    const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: {
            calendarProvider: null,
            calendarEventId: null,
            calendarBlockStart: null,
            calendarBlockEnd: null,
            calendarId: null,
            calendarLinkBroken: false,
        },
    });

    revalidatePath('/today');
    revalidatePath('/calendar');
    return updatedTask;
}

// Check calendar links for broken references
export async function checkCalendarLinks() {
    const tasksWithLinks = await prisma.task.findMany({
        where: {
            calendarEventId: { not: null },
            status: { not: 'done' },
        },
    });

    // In a real implementation, this would verify against Google Calendar API
    // For now, we check if the block still exists locally
    const results: { taskId: string; broken: boolean }[] = [];

    for (const task of tasksWithLinks) {
        if (task.calendarBlockStart && task.calendarBlockEnd) {
            // Start blockExists stub
            const blockExists = true; // Assume exists for now
            // End stub

            if (!blockExists) {
                await prisma.task.update({
                    where: { id: task.id },
                    data: { calendarLinkBroken: true },
                });
                results.push({ taskId: task.id, broken: true });
            } else {
                results.push({ taskId: task.id, broken: false });
            }
        }
    }

    revalidatePath('/today');
    return results;
}

// Get day agenda with blocks
export async function getDayAgenda(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get committed tasks from Daily Plan
    const dailyPlan = await prisma.dailyPlan.findUnique({
        where: { date: startOfDay }
    });
    const committedIds: string[] = dailyPlan?.committedTaskIds ? JSON.parse(dailyPlan.committedTaskIds) : [];

    const dayRituals = await getRitualsForDay(date);

    const [taskBlocks, scheduledTasks, committedTasks, backlogTasks, milestones] = await Promise.all([
        // 1. Time-blocked tasks
        prisma.task.findMany({
            where: {
                calendarBlockStart: { gte: startOfDay, lt: endOfDay },
                status: { not: 'done' },
            },
            include: { pillar: true, project: true },
            orderBy: { calendarBlockStart: 'asc' },
        }),
        // 2. Tasks scheduled for today (but not blocked)
        prisma.task.findMany({
            where: {
                scheduledDate: { gte: startOfDay, lt: endOfDay },
                calendarBlockStart: null,
                status: { not: 'done' },
            },
            include: { pillar: true, project: true },
        }),
        // 3. Committed tasks (that might not be scheduled explicitly)
        prisma.task.findMany({
            where: {
                id: { in: committedIds },
                calendarBlockStart: null, // Avoid duplicates with blocks
                status: { not: 'done' },
            },
            include: { pillar: true, project: true },
        }),
        // 4. Backlog
        prisma.task.findMany({
            where: {
                status: 'active',
                scheduledDate: null,
                calendarBlockStart: null,
                id: { notIn: committedIds } // Exclude committed
            },
            include: { pillar: true, project: true },
            orderBy: { createdAt: 'desc' },
            take: 50,
        }),
        // 5. Milestones
        prisma.milestone.findMany({
            where: {
                targetDate: { gte: startOfDay, lt: endOfDay },
            },
            include: { project: true },
        }),
    ]);

    // Merge scheduled and committed, remove duplicates
    const combinedUnscheduled = [...scheduledTasks];
    committedTasks.forEach((t: any) => {
        if (!combinedUnscheduled.find(existing => existing.id === t.id)) {
            combinedUnscheduled.push(t);
        }
    });

    return {
        taskBlocks,
        unscheduledTasks: combinedUnscheduled,
        backlogTasks,
        milestones,
        rituals: dayRituals.map((s: any) => ({
            id: s.id,
            title: s.title,
            pillarColor: s.pillar?.colorHex,
            isCompleted: s.isCompleted,
            entryId: s.entryId
        })),
    };
}

// Get weekly agenda
export async function getWeeklyAgenda(startDate: Date) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    const [taskBlocks, tasks, milestones] = await Promise.all([
        prisma.task.findMany({
            where: {
                calendarBlockStart: { gte: start, lt: end },
                status: { not: 'done' },
            },
            include: { pillar: true, project: true },
            orderBy: { calendarBlockStart: 'asc' },
        }),
        prisma.task.findMany({
            where: {
                scheduledDate: { gte: start, lt: end },
                calendarBlockStart: null,
                status: { not: 'done' },
            },
            include: { pillar: true, project: true },
            orderBy: { scheduledDate: 'asc' },
        }),
        prisma.milestone.findMany({
            where: {
                targetDate: { gte: start, lt: end },
            },
            include: { project: true },
        }),
    ]);

    // For Weekly view, we probably don't need backlog as much, or we can include it.
    // Let's include it for consistency if we want drag-drop there too.
    const backlogTasks = await prisma.task.findMany({
        where: {
            status: 'active',
            scheduledDate: null,
            calendarBlockStart: null,
        },
        include: { pillar: true, project: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
    });

    return {
        taskBlocks,
        unscheduledTasks: tasks,
        backlogTasks,
        milestones,
        rituals: [],
    };
}

// ============================================
// MONDAY MORNING BRIEFING
// ============================================

export async function generateMondayBriefing() {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAhead = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const settings = await prisma.userSettings.findFirst();
    const coldThreshold = new Date(now.getTime() - (settings?.coldTaskDays || 14) * 24 * 60 * 60 * 1000);
    const staleThreshold = new Date(now.getTime() - (settings?.staleProjectDays || 21) * 24 * 60 * 60 * 1000);

    // Gather data
    const [
        weeklyWins,
        lastReview,
        projectsAtRisk,
        ritualsBehind,
        upcomingMilestones,
        activeTaskCount,
        coldTaskCount,
        inboxCount,
        blockedCount,
        pillars,
    ] = await Promise.all([
        prisma.archiveRecord.findMany({
            where: { completedAt: { gte: weekAgo } },
            orderBy: { completedAt: 'desc' },
        }),
        prisma.reviewLog.findFirst({
            where: { reviewType: 'weekly' },
            orderBy: { date: 'desc' },
        }),
        prisma.project.findMany({
            where: { status: 'active', lastActivityAt: { lt: staleThreshold } },
        }),
        prisma.ritual.findMany({
            where: { status: 'active' },
        }),
        prisma.milestone.findMany({
            where: {
                status: { not: 'complete' },
                targetDate: { gte: now, lte: twoWeeksAhead },
            },
            include: { project: true },
            orderBy: { targetDate: 'asc' },
        }),
        prisma.task.count({ where: { status: { in: ['active', 'scheduled'] } } }),
        prisma.task.count({
            where: {
                status: { in: ['active', 'scheduled'] },
                lastTouchedAt: { lt: coldThreshold },
            },
        }),
        prisma.inboxItem.count({ where: { processedAt: null } }),
        prisma.task.count({ where: { status: 'blocked' } }),
        prisma.pillar.findMany({ where: { isActive: true } }),
    ]);

    // Parse weekly outcomes
    let topOutcomes: string[] = [];
    if (lastReview?.weeklyOutcomes) {
        try {
            topOutcomes = JSON.parse(lastReview.weeklyOutcomes);
        } catch { }
    }

    // Check ritual health
    const behindRituals = ritualsBehind.filter((s: any) => {
        const cycleStart = new Date(s.currentCycleStart);
        const cycleDays = s.cadenceType === 'weekly' ? 7 : 30;
        const cycleEnd = new Date(cycleStart.getTime() + cycleDays * 24 * 60 * 60 * 1000);
        return now > cycleEnd || s.currentCycleCount < s.targetPerCycle;
    });

    // Generate narrative
    const lines: string[] = [];

    lines.push(`# Monday Briefing — ${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`);
    lines.push('');

    // Last Week Wins
    lines.push('## 🏆 Last Week Wins');
    if (weeklyWins.length === 0) {
        lines.push('No completed tasks recorded last week.');
    } else {
        lines.push(`You completed **${weeklyWins.length} task(s)** last week.`);
        const groupedByPillar: Record<string, number> = {};
        weeklyWins.forEach(w => {
            const key = (w as any).pillarName || 'Uncategorized';
            groupedByPillar[key] = (groupedByPillar[key] || 0) + 1;
        });
        Object.entries(groupedByPillar).forEach(([pillar, count]) => {
            lines.push(`- ${pillar}: ${count}`);
        });
    }
    lines.push('');

    // This Week's Focus
    lines.push('## 🎯 This Week\'s Focus');
    if (topOutcomes.length > 0) {
        topOutcomes.forEach((o, i) => {
            lines.push(`${i + 1}. ${o}`);
        });
    } else {
        lines.push('No outcomes set. Consider running your Weekly Review.');
    }
    lines.push('');

    // Health Check
    lines.push('## 📊 System Health');
    lines.push(`- **Active Tasks:** ${activeTaskCount}`);
    lines.push(`- **Cold Tasks:** ${coldTaskCount}`);
    lines.push(`- **Inbox:** ${inboxCount}`);
    lines.push(`- **Blocked:** ${blockedCount}`);
    lines.push('');

    // Attention Items
    if (projectsAtRisk.length > 0 || behindRituals.length > 0 || upcomingMilestones.length > 0) {
        lines.push('## ⚠️ Needs Attention');

        if (projectsAtRisk.length > 0) {
            lines.push(`### Stalled Projects (${projectsAtRisk.length})`);
            projectsAtRisk.slice(0, 3).forEach((p: any) => {
                lines.push(`- ${p.title}`);
            });
        }

        if (behindRituals.length > 0) {
            lines.push(`### Rituals Behind (${behindRituals.length})`);
            behindRituals.slice(0, 3).forEach((s: any) => {
                lines.push(`- ${s.title}: ${s.currentCycleCount}/${s.targetPerCycle}`);
            });
        }

        if (upcomingMilestones.length > 0) {
            lines.push(`### Upcoming Milestones (${upcomingMilestones.length})`);
            upcomingMilestones.slice(0, 3).forEach((m: any) => {
                const dueDate = m.targetDate ? new Date(m.targetDate).toLocaleDateString() : 'No date';
                lines.push(`- ${m.title} (${m.project.title}) — ${dueDate}`);
            });
        }
        lines.push('');
    }

    // Recommendations
    lines.push('## 💡 Recommendations');
    const recs: string[] = [];

    if (inboxCount > 5) recs.push('Process your inbox to maintain clarity.');
    if (coldTaskCount > 10) recs.push('Schedule time to clean up cold tasks.');
    if (projectsAtRisk.length > 0) recs.push('Review stalled projects and decide: push, pause, or archive.');
    if (behindRituals.length > 0) recs.push('Prioritize ritual tasks today to get back on cycle.');
    if (!lastReview || new Date(lastReview.date) < weekAgo) recs.push('Complete your Weekly Review to reset clarity.');

    if (recs.length === 0) {
        lines.push('System is healthy. Focus on your top outcomes this week.');
    } else {
        recs.forEach(r => lines.push(`- ${r}`));
    }

    const content = lines.join('\n');

    // Save briefing
    const briefing = await prisma.briefing.create({
        data: {
            type: 'monday',
            date: now,
            content,
            weeklyWins: weeklyWins.length,
            topOutcomes: topOutcomes.length > 0 ? JSON.stringify(topOutcomes) : null,
            projectsAtRisk: projectsAtRisk.length,
            ritualsBehind: behindRituals.length,
        } as any,
    });

    return briefing;
}

export async function getLatestBriefing(type = 'monday') {
    return prisma.briefing.findFirst({
        where: { type },
        orderBy: { date: 'desc' },
    });
}

export async function getBriefings(limit = 10) {
    return prisma.briefing.findMany({
        orderBy: { date: 'desc' },
        take: limit,
    });
}

// ============================================
// BACKUP / EXPORT
// ============================================

export async function exportAllData() {
    const [
        settings,
        pillars,
        goals,
        quarterlyObjectives,
        projects,
        milestones,
        rituals,
        ritualCycleRecords,
        tasks,
        inboxItems,
        dailyPlans,
        archiveRecords,
        reviewLogs,
        bankruptcyRecords,
        templates,
        insightSnapshots,
        automationLogs,
        briefings,
    ] = await Promise.all([
        prisma.userSettings.findFirst(),
        prisma.pillar.findMany(),
        prisma.goal.findMany(),
        prisma.quarterlyObjective.findMany(),
        prisma.project.findMany(),
        prisma.milestone.findMany(),
        prisma.ritual.findMany(),
        prisma.ritualCycleRecord.findMany(),
        prisma.task.findMany(),
        prisma.inboxItem.findMany(),
        prisma.dailyPlan.findMany(),
        prisma.archiveRecord.findMany(),
        prisma.reviewLog.findMany(),
        prisma.bankruptcyRecord.findMany(),
        prisma.template.findMany(),
        prisma.insightSnapshot.findMany(),
        prisma.insightSnapshot.findMany(),
        [], // prisma.automationLog.findMany(),
        prisma.briefing.findMany(),
    ]);

    const exportData = {
        version: '4.0',
        exportDate: new Date().toISOString(),
        settings,
        pillars,
        goals,
        quarterlyObjectives,
        projects,
        milestones,
        rituals,
        ritualCycleRecords,
        tasks,
        inboxItems,
        dailyPlans,
        archiveRecords,
        reviewLogs,
        bankruptcyRecords,
        templates,
        insightSnapshots,
        automationLogs: [], // Removed
        briefings,
    };

    const recordCount =
        pillars.length + goals.length + projects.length + rituals.length +
        tasks.length + inboxItems.length + archiveRecords.length;

    // Log export
    await prisma.dataExport.create({
        data: {
            filename: `sugularity-export-${new Date().toISOString().split('T')[0]}.json`,
            dataVersion: '4.0',
            recordCount,
        },
    });

    return exportData;
}

export async function getExportHistory() {
    return prisma.dataExport.findMany({
        orderBy: { exportDate: 'desc' },
        take: 10,
    });
}
