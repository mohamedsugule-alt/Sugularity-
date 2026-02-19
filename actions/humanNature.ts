'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// ============================================
// SPRINT 2: HUMAN-NATURE ENGINE ACTIONS
// ============================================

// Helper: Get cold task threshold from settings
async function getColdThreshold(): Promise<number> {
    const settings = await prisma.userSettings.findFirst();
    return settings?.coldTaskDays || 14;
}

// Helper: Calculate cold date threshold
function getColdDate(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
}

// ============================================
// COLD TASKS
// ============================================

export async function getColdTasks(limit = 20) {
    const coldDays = await getColdThreshold();
    const coldDate = getColdDate(coldDays);

    return prisma.task.findMany({
        where: {
            status: 'active',
            scheduledDate: null,
            lastTouchedAt: { lt: coldDate },
        },
        include: {
            pillar: true,
            project: true,
            ritual: true,
        },
        orderBy: { lastTouchedAt: 'asc' },
        take: limit,
    });
}

export async function getColdTaskCount(): Promise<number> {
    const coldDays = await getColdThreshold();
    const coldDate = getColdDate(coldDays);

    return prisma.task.count({
        where: {
            status: 'active',
            scheduledDate: null,
            lastTouchedAt: { lt: coldDate },
        },
    });
}

// ============================================
// TOUCH TASK (Update lastTouchedAt)
// ============================================

export async function touchTask(taskId: string) {
    await prisma.task.update({
        where: { id: taskId },
        data: { lastTouchedAt: new Date() },
    });
    revalidatePath('/');
}

// ============================================
// FORCED TRIAGE
// ============================================

export type TriageDecision =
    | { type: 'schedule'; scheduledDate: Date }
    | { type: 'defer'; reason: string; reviewOn: Date }
    | { type: 'blocked'; reason: string }
    | { type: 'someday' }
    | { type: 'archive' }
    | { type: 'delete' };

export async function executeTriageDecision(taskId: string, decision: TriageDecision) {
    const now = new Date();

    switch (decision.type) {
        case 'schedule':
            await prisma.task.update({
                where: { id: taskId },
                data: {
                    scheduledDate: decision.scheduledDate,
                    rolloverCount: 0,
                    lastTouchedAt: now,
                    committedDate: null,
                },
            });
            break;

        case 'defer':
            await prisma.task.update({
                where: { id: taskId },
                data: {
                    deferReason: decision.reason,
                    deferReviewOn: decision.reviewOn,
                    rolloverCount: 0,
                    lastTouchedAt: now,
                    committedDate: null,
                },
            });
            break;

        case 'blocked':
            await prisma.task.update({
                where: { id: taskId },
                data: {
                    status: 'blocked',
                    blockedReason: decision.reason,
                    rolloverCount: 0,
                    lastTouchedAt: now,
                    committedDate: null,
                },
            });
            break;

        case 'someday':
            await prisma.task.update({
                where: { id: taskId },
                data: {
                    status: 'someday',
                    rolloverCount: 0,
                    lastTouchedAt: now,
                    committedDate: null,
                },
            });
            break;

        case 'archive':
            const task = await prisma.task.findUnique({
                where: { id: taskId },
                include: { pillar: true, project: true, ritual: true },
            });
            if (task) {
                await prisma.archiveRecord.create({
                    data: {
                        originalTaskId: task.id,
                        title: task.title,
                        notes: task.notes,
                        pillarId: task.pillarId,
                        pillarName: task.pillar?.name,
                        projectId: task.projectId,
                        projectName: task.project?.title,
                        ritualId: task.ritualId,
                        ritualName: task.ritual?.title,
                        estimateMinutes: task.estimateMinutes,
                        energyLevel: task.energyLevel,
                        rolloverCount: task.rolloverCount,
                        completionNote: 'Archived via triage',
                    },
                });
                await prisma.task.update({
                    where: { id: taskId },
                    data: { status: 'archived' },
                });
            }
            break;

        case 'delete':
            await prisma.task.delete({ where: { id: taskId } });
            break;
    }

    revalidatePath('/');
    return { success: true };
}

// Get tasks requiring forced triage (rolloverCount >= 1)
export async function getTriageRequiredTasks() {
    return prisma.task.findMany({
        where: {
            rolloverCount: { gte: 1 },
            status: { in: ['active', 'scheduled'] },
        },
        include: {
            pillar: true,
            project: true,
            ritual: true,
        },
        orderBy: { rolloverCount: 'desc' },
    });
}

// ============================================
// ROLLOVER HANDLING
// ============================================

export async function rolloverTask(taskId: string) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new Error('Task not found');

    // If already rolled once, return error - needs triage
    if (task.rolloverCount >= 1) {
        return { requiresTriage: true, task };
    }

    // First rollover - allowed
    await prisma.task.update({
        where: { id: taskId },
        data: {
            rolloverCount: task.rolloverCount + 1,
            committedDate: null,
            lastTouchedAt: new Date(),
        },
    });

    revalidatePath('/today');
    return { requiresTriage: false };
}

// ============================================
// BACKLOG BANKRUPTCY
// ============================================

export async function getBacklogStats() {
    const settings = await prisma.userSettings.findFirst();
    const coldDays = settings?.coldTaskDays || 14;
    const coldDate = getColdDate(coldDays);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [active, cold, overdue, blocked, someday, inbox, projects] = await Promise.all([
        prisma.task.count({ where: { status: 'active' } }),
        prisma.task.count({
            where: {
                status: 'active',
                scheduledDate: null,
                lastTouchedAt: { lt: coldDate },
            },
        }),
        prisma.task.count({
            where: {
                status: { in: ['active', 'scheduled'] },
                dueDate: { lt: today },
            },
        }),
        prisma.task.count({ where: { status: 'blocked' } }),
        prisma.task.count({ where: { status: 'someday' } }),
        prisma.inboxItem.count({ where: { processedAt: null } }),
        prisma.project.count({ where: { status: 'active' } }),
    ]);

    const limits = {
        activeLimit: settings?.backlogActiveLimit || 40,
        coldLimit: settings?.backlogColdLimit || 15,
        projectLimit: settings?.backlogProjectLimit || 7,
    };

    const needsBankruptcy = active > limits.activeLimit || cold > limits.coldLimit || projects > limits.projectLimit;

    return {
        counts: { active, cold, overdue, blocked, someday, inbox, projects },
        limits,
        needsBankruptcy,
    };
}

export async function executeBankruptcy(
    keepTaskIds: string[],
    somedayTaskIds: string[],
    archiveTaskIds: string[]
) {
    const beforeStats = await getBacklogStats();

    // Archive tasks
    for (const taskId of archiveTaskIds) {
        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: { pillar: true, project: true, ritual: true },
        });
        if (task) {
            await prisma.archiveRecord.create({
                data: {
                    originalTaskId: task.id,
                    title: task.title,
                    notes: task.notes,
                    pillarId: task.pillarId,
                    pillarName: task.pillar?.name,
                    projectId: task.projectId,
                    projectName: task.project?.title,
                    ritualId: task.ritualId,
                    ritualName: task.ritual?.title,
                    estimateMinutes: task.estimateMinutes,
                    energyLevel: task.energyLevel,
                    rolloverCount: task.rolloverCount,
                    completionNote: 'Archived via backlog bankruptcy',
                },
            });
            await prisma.task.update({
                where: { id: taskId },
                data: { status: 'archived' },
            });
        }
    }

    // Move to someday
    await prisma.task.updateMany({
        where: { id: { in: somedayTaskIds } },
        data: { status: 'someday', lastTouchedAt: new Date() },
    });

    // Touch kept tasks
    await prisma.task.updateMany({
        where: { id: { in: keepTaskIds } },
        data: { lastTouchedAt: new Date() },
    });

    const afterStats = await getBacklogStats();

    // Record bankruptcy
    await prisma.bankruptcyRecord.create({
        data: {
            beforeCounts: JSON.stringify(beforeStats.counts),
            afterCounts: JSON.stringify(afterStats.counts),
            archivedCount: archiveTaskIds.length,
            somedayCount: somedayTaskIds.length,
            keptActiveCount: keepTaskIds.length,
        },
    });

    revalidatePath('/');
    return { success: true, afterStats };
}

// ============================================
// PROJECT HEALTH
// ============================================

export type ProjectHealth = 'on_track' | 'watch' | 'at_risk';

export async function getProjectHealth(projectId: string): Promise<ProjectHealth> {
    const settings = await prisma.userSettings.findFirst();
    const staleDays = settings?.staleProjectDays || 21;
    const staleDate = new Date();
    staleDate.setDate(staleDate.getDate() - staleDays);

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
            milestones: true,
            tasks: {
                where: { status: { in: ['active', 'scheduled'] } },
            },
        },
    });

    if (!project) return 'on_track';

    const today = new Date();
    const twoWeeks = new Date();
    twoWeeks.setDate(today.getDate() + 14);
    const oneWeek = new Date();
    oneWeek.setDate(today.getDate() + 7);

    // At Risk: any milestone overdue
    const hasOverdueMilestone = project.milestones.some(
        (m) => m.status !== 'complete' && m.targetDate && new Date(m.targetDate) < today
    );
    if (hasOverdueMilestone) return 'at_risk';

    // At Risk: no activity in 21 days
    if (project.lastActivityAt < staleDate) return 'at_risk';

    // At Risk: deadline within 14 days with low progress
    if (project.deadline && new Date(project.deadline) <= twoWeeks) {
        const completedRecently = await prisma.archiveRecord.count({
            where: {
                projectId: project.id,
                completedAt: { gte: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000) },
            },
        });
        if (completedRecently < 3) return 'at_risk';
    }

    // Watch: milestone due within 7 days
    const hasUpcomingMilestone = project.milestones.some(
        (m) => m.status !== 'complete' && m.targetDate &&
            new Date(m.targetDate) <= oneWeek && new Date(m.targetDate) >= today
    );
    if (hasUpcomingMilestone) return 'watch';

    // Watch: repeated rollovers in project
    const rollovers = project.tasks.filter((t) => t.rolloverCount >= 1).length;
    if (rollovers >= 3) return 'watch';

    return 'on_track';
}

export async function getProjectsAtRisk() {
    const projects = await prisma.project.findMany({
        where: { status: 'active' },
        include: {
            pillar: true,
            milestones: true,
            tasks: { where: { status: { in: ['active', 'scheduled'] } } },
        },
    });

    const atRisk: typeof projects = [];
    const watch: typeof projects = [];

    for (const project of projects) {
        const health = await getProjectHealth(project.id);
        if (health === 'at_risk') atRisk.push(project);
        else if (health === 'watch') watch.push(project);
    }

    return { atRisk: atRisk.slice(0, 5), watch: watch.slice(0, 5) };
}

export async function getUpcomingMilestones(days = 14) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return prisma.milestone.findMany({
        where: {
            status: { not: 'complete' },
            targetDate: { lte: futureDate, gte: new Date() },
        },
        include: {
            project: { include: { pillar: true } },
        },
        orderBy: { targetDate: 'asc' },
        take: 10,
    });
}

// ============================================
// RITUAL CYCLE TRACKING
// ============================================

export async function logRitualAction(ritualId: string) {
    const ritual = await prisma.ritual.update({
        where: { id: ritualId },
        data: {
            currentCycleCount: { increment: 1 },
            lastActivityAt: new Date(),
        },
    });
    revalidatePath('/rituals');
    return ritual;
}

export async function checkAndResetRitualCycle(ritualId: string) {
    const ritual = await prisma.ritual.findUnique({ where: { id: ritualId } });
    if (!ritual) return null;

    const now = new Date();
    let shouldReset = false;
    let cycleEnd = new Date(ritual.currentCycleStart);

    if (ritual.cadenceType === 'weekly') {
        cycleEnd.setDate(cycleEnd.getDate() + 7);
        shouldReset = now >= cycleEnd;
    } else {
        cycleEnd.setMonth(cycleEnd.getMonth() + 1);
        shouldReset = now >= cycleEnd;
    }

    if (shouldReset) {
        // Record the past cycle
        await prisma.ritualCycleRecord.create({
            data: {
                ritualId: ritual.id,
                cycleStart: ritual.currentCycleStart,
                cycleEnd: cycleEnd,
                target: ritual.targetPerCycle,
                achieved: ritual.currentCycleCount,
            },
        });

        // Reset cycle
        await prisma.ritual.update({
            where: { id: ritualId },
            data: {
                currentCycleStart: now,
                currentCycleCount: 0,
            },
        });

        revalidatePath('/rituals');
        return { reset: true };
    }

    return { reset: false };
}

export type RitualHealth = 'on_track' | 'watch' | 'at_risk';

export async function getRitualHealth(ritualId: string): Promise<RitualHealth> {
    const ritual = await prisma.ritual.findUnique({
        where: { id: ritualId },
        include: { cycleRecords: { orderBy: { cycleEnd: 'desc' }, take: 2 } },
    });

    if (!ritual) return 'on_track';

    // At Risk: missed target 2 cycles in a row
    if (ritual.cycleRecords.length >= 2) {
        const lastTwo = ritual.cycleRecords.slice(0, 2);
        if (lastTwo.every((r) => r.achieved < r.target)) {
            return 'at_risk';
        }
    }

    // Watch: behind mid-cycle
    const now = new Date();
    const cycleStart = new Date(ritual.currentCycleStart);
    let cycleDays = ritual.cadenceType === 'weekly' ? 7 : 30;
    let elapsed = (now.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24);
    let expectedProgress = (elapsed / cycleDays) * ritual.targetPerCycle;

    if (ritual.currentCycleCount < expectedProgress * 0.5) {
        return 'watch';
    }

    return 'on_track';
}

export async function getRitualsBehindCycle() {
    const rituals = await prisma.ritual.findMany({
        where: { status: 'active' },
        include: { pillar: true, cycleRecords: { orderBy: { cycleEnd: 'desc' }, take: 2 } },
    });

    const behind: (typeof rituals[0] & { health: RitualHealth })[] = [];

    for (const ritual of rituals) {
        const health = await getRitualHealth(ritual.id);
        if (health !== 'on_track') {
            behind.push({ ...ritual, health });
        }
    }

    return behind;
}

// ============================================
// WEEKLY REVIEW
// ============================================

export async function getWeeklyReviewData() {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeks = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

    const [
        inbox,
        completedThisWeek,
        coldTasks,
        triageTasks,
        projectsAtRisk,
        upcomingMilestones,
        ritualsBehind,
        backlogStats,
    ] = await Promise.all([
        prisma.inboxItem.findMany({ where: { processedAt: null } }),
        prisma.archiveRecord.findMany({
            where: { completedAt: { gte: weekAgo } },
            orderBy: { completedAt: 'desc' },
        }),
        getColdTasks(50),
        getTriageRequiredTasks(),
        getProjectsAtRisk(),
        getUpcomingMilestones(14),
        getRitualsBehindCycle(),
        getBacklogStats(),
    ]);

    return {
        inbox,
        completedThisWeek,
        coldTasks,
        triageTasks,
        projectsAtRisk,
        upcomingMilestones,
        ritualsBehind,
        backlogStats,
    };
}

export async function saveWeeklyReview(data: {
    notes?: string;
    weeklyOutcomes?: string[];
    shortlistTaskIds?: string[];
    statsSnapshot: {
        active: number;
        cold: number;
        overdue: number;
        blocked: number;
        inbox: number;
        completed: number;
    };
}) {
    const review = await prisma.reviewLog.create({
        data: {
            reviewType: 'weekly',
            date: new Date(),
            notes: data.notes,
            weeklyOutcomes: data.weeklyOutcomes ? JSON.stringify(data.weeklyOutcomes) : null,
            shortlistTaskIds: data.shortlistTaskIds ? JSON.stringify(data.shortlistTaskIds) : null,
            statsSnapshot: JSON.stringify(data.statsSnapshot),
        },
    });

    revalidatePath('/');
    return review;
}

export async function getLastReview(type: 'weekly' | 'daily') {
    return prisma.reviewLog.findFirst({
        where: { reviewType: type },
        orderBy: { date: 'desc' },
    });
}

// ============================================
// DASHBOARD STATS (ENHANCED)
// ============================================

export async function getEnhancedDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const settings = await prisma.userSettings.findFirst();
    const coldDays = settings?.coldTaskDays || 14;
    const coldDate = getColdDate(coldDays);

    const [
        activeTasks,
        overdueTasks,
        todayScheduled,
        coldCount,
        blockedCount,
        rolloverPressure,
        inboxCount,
        activeProjects,
        activeRituals,
        recentCompleted,
    ] = await Promise.all([
        prisma.task.count({ where: { status: { in: ['active', 'scheduled'] } } }),
        prisma.task.count({
            where: { status: { in: ['active', 'scheduled'] }, dueDate: { lt: today } },
        }),
        prisma.task.findMany({
            where: {
                OR: [
                    { committedDate: { gte: today, lt: tomorrow } },
                    { completedAt: { gte: today, lt: tomorrow } },
                ],
                status: { in: ['active', 'scheduled', 'blocked', 'done'] }
            },
            select: { estimateMinutes: true, title: true, status: true, scheduledDate: true, committedDate: true }
        }),
        prisma.task.count({
            where: { status: 'active', scheduledDate: null, lastTouchedAt: { lt: coldDate } },
        }),
        prisma.task.count({ where: { status: 'blocked' } }),
        prisma.task.count({
            where: { rolloverCount: { gte: 1 }, status: { in: ['active', 'scheduled'] } },
        }),
        prisma.inboxItem.count({ where: { processedAt: null } }),
        prisma.project.count({ where: { status: 'active' } }),
        prisma.ritual.count({ where: { status: 'active' } }),
        prisma.archiveRecord.count({ where: { completedAt: { gte: weekAgo } } }),
    ]);

    console.log('--- DASHBOARD STATS DEBUG ---');
    console.log('Today Range:', today, 'to', tomorrow);
    console.log('Found Tasks:', todayScheduled.length);
    todayScheduled.forEach(t => console.log(`[${t.status}] ${t.title} - Est: ${t.estimateMinutes}, Sched: ${t.scheduledDate}, Commit: ${t.committedDate}`));

    const defaultEst = settings?.defaultEstimateMin || 30;
    const todayCalc = todayScheduled.reduce((acc, t) => acc + (t.estimateMinutes || defaultEst), 0);

    const remainingScheduled = todayScheduled.filter(t => t.status !== 'done');
    const completedScheduled = todayScheduled.filter(t => t.status === 'done');
    const remainingMinutes = remainingScheduled.reduce((acc, t) => acc + (t.estimateMinutes || defaultEst), 0);

    return {
        activeTasks,
        overdueTasks,
        todayScheduled: todayScheduled.length,
        todayScheduledMinutes: todayCalc,
        remainingCount: remainingScheduled.length,
        completedCount: completedScheduled.length,
        inboxCount,
        activeProjects,
        activeRituals,
        recentCompleted,
    };
}

// ============================================
// MILESTONE CRUD
// ============================================

export async function createMilestone(data: {
    projectId: string;
    title: string;
    description?: string;
    targetDate?: Date;
}) {
    const milestone = await prisma.milestone.create({
        data: {
            projectId: data.projectId,
            title: data.title,
            description: data.description,
            targetDate: data.targetDate,
        },
    });

    // Update project activity
    await prisma.project.update({
        where: { id: data.projectId },
        data: { lastActivityAt: new Date() },
    });

    revalidatePath('/projects');
    return milestone;
}

export async function updateMilestoneStatus(id: string, status: string) {
    const milestone = await prisma.milestone.update({
        where: { id },
        data: {
            status,
            completedAt: status === 'complete' ? new Date() : null,
        },
    });

    // Update project activity
    await prisma.project.update({
        where: { id: milestone.projectId },
        data: { lastActivityAt: new Date() },
    });

    revalidatePath('/projects');
    return milestone;
}

// ============================================
// DUPLICATE ARCHIVED TASK
// ============================================

export async function duplicateFromArchive(archiveId: string) {
    const archive = await prisma.archiveRecord.findUnique({ where: { id: archiveId } });
    if (!archive || !archive.pillarId) {
        throw new Error('Cannot duplicate: missing pillar information');
    }

    const task = await prisma.task.create({
        data: {
            title: archive.title,
            notes: archive.notes,
            pillarId: archive.pillarId,
            projectId: archive.projectId,
            ritualId: archive.ritualId,
            status: 'active',
            estimateMinutes: archive.estimateMinutes,
            energyLevel: archive.energyLevel || 'medium',
        },
        include: { pillar: true, project: true, ritual: true },
    });

    revalidatePath('/');
    return task;
}
