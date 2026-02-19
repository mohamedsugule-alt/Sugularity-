'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// ============================================
// PILLAR ACTIONS (formerly Area)
// ============================================

export async function getPillars() {
    return prisma.pillar.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
    });
}

export async function createPillar(data: { name: string; colorHex?: string }) {
    const pillar = await prisma.pillar.create({
        data: {
            name: data.name,
            colorHex: data.colorHex || '#8B5CF6',
        },
    });
    revalidatePath('/');
    return pillar;
}

export async function updatePillar(id: string, data: { name: string; colorHex: string }) {
    const pillar = await prisma.pillar.update({
        where: { id },
        data,
    });
    revalidatePath('/');
    return pillar;
}

export async function deletePillar(id: string) {
    // Check for dependencies
    const [projectCount, taskCount, ritualCount, goalCount] = await Promise.all([
        prisma.project.count({ where: { pillarId: id } }),
        prisma.task.count({ where: { pillarId: id } }),
        prisma.ritual.count({ where: { pillarId: id } }),
        prisma.goal.count({ where: { pillarId: id } }),
    ]);

    if (projectCount > 0 || taskCount > 0 || ritualCount > 0 || goalCount > 0) {
        throw new Error(`Cannot delete Pillar: Linked to ${projectCount} projects, ${taskCount} tasks, ${ritualCount} rituals, ${goalCount} goals.`);
    }

    await prisma.pillar.delete({ where: { id } });
    revalidatePath('/');
}

export async function resetSystem() {
    // Nuclear option: Delete ALL user data
    // Transactional order to respect constraints if any (though usually fine with cascading or leaf-first)

    // 1. Delete dependent children first (Outcomes, Milestones, Tasks, Records)
    await prisma.dailyOutcome.deleteMany({});
    await prisma.milestone.deleteMany({});
    await prisma.ritualCycleRecord.deleteMany({});
    await prisma.archiveRecord.deleteMany({});
    await prisma.inboxItem.deleteMany({});
    await prisma.reviewLog.deleteMany({});
    await prisma.bankruptcyRecord.deleteMany({});
    // await prisma.automationLog.deleteMany({}); (Removed)
    await prisma.insightSnapshot.deleteMany({});
    await prisma.briefing.deleteMany({});
    // await prisma.calendarBusyBlock.deleteMany({}); (Removed)

    // 2. Delete core items
    await prisma.task.deleteMany({}); // Deletes links to Pillar/Project/Ritual
    await prisma.dailyPlan.deleteMany({});

    // 3. Delete Containers
    await prisma.project.deleteMany({});
    await prisma.ritual.deleteMany({});
    await prisma.quarterlyObjective.deleteMany({});

    // 4. Delete High Level
    await prisma.goal.deleteMany({});

    // 5. Reset Settings (Optional: Keep settings or delete? User said "Factory Reset". Let's reset to defaults.)
    await prisma.userSettings.deleteMany({});

    // 6. Keep Pillars? "Factory Reset" usually implies clearing USER CONTENT. Pillars are structural.
    // But if user edited pillars, maybe they want them reset?
    // I'll keep Pillars for now, or maybe only delete non-default ones? Hard to distinguish.
    // I will NOT delete Pillars to avoid bricking the UI if no pillars exist (dashboard needs minimal pillars).
    // Actually, I should probably re-seed default pillars if I delete them.
    // Safer: Keep Pillars. Delete everything else.

    revalidatePath('/');
    return { success: true };
}

// ============================================
// TASK ACTIONS
// ============================================

export async function getTasks(filters?: {
    status?: string | string[];
    pillarId?: string;
    projectId?: string;
    ritualId?: string;
    todayOnly?: boolean; // Legacy flag, try to avoid
    scheduledDate?: Date; // Specific date
    maxScheduledDate?: Date; // Up to this date
    includeOverdue?: boolean;
}) {
    const where: any = {};

    if (filters?.status) {
        where.status = Array.isArray(filters.status)
            ? { in: filters.status }
            : filters.status;
    }

    if (filters?.pillarId) where.pillarId = filters.pillarId;
    if (filters?.projectId) where.projectId = filters.projectId;
    if (filters?.ritualId) where.ritualId = filters.ritualId;

    if (filters?.scheduledDate) {
        const startOfDay = new Date(filters.scheduledDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(filters.scheduledDate);
        endOfDay.setHours(23, 59, 59, 999);
        where.scheduledDate = { gte: startOfDay, lte: endOfDay };
    }

    if (filters?.maxScheduledDate) {
        const endOfDay = new Date(filters.maxScheduledDate);
        endOfDay.setHours(23, 59, 59, 999);
        where.scheduledDate = { lte: endOfDay };
    }

    return prisma.task.findMany({
        where,
        include: {
            pillar: true,
            project: true,
            ritual: true,
        },
        orderBy: [
            { dueDate: 'asc' },
            { createdAt: 'desc' },
        ],
    });
}

export async function createTask(data: {
    title: string;
    pillarId: string;
    projectId?: string;
    ritualId?: string;
    status?: string;
    dueDate?: Date;
    scheduledDate?: Date;
    estimateMinutes?: number;
    energyLevel?: string;
    notes?: string;
}) {
    // Golden Thread enforcement
    if (!data.pillarId) {
        throw new Error('Golden Thread: Task must have a Pillar assigned');
    }

    const task = await prisma.task.create({
        data: {
            title: data.title,
            pillarId: data.pillarId,
            projectId: data.projectId || null,
            ritualId: data.ritualId || null,
            status: data.status || 'active',
            dueDate: data.dueDate || null,
            scheduledDate: data.scheduledDate || null,
            estimateMinutes: data.estimateMinutes || null,
            energyLevel: data.energyLevel || 'medium',
            notes: data.notes || null,
        },
        include: { pillar: true, project: true, ritual: true },
    });

    revalidatePath('/');

    // Background Indexing (Fire & Forget mostly, but await to ensure completion in lambda-like envs)
    try {
        const { rag } = await import('@/lib/ai/rag'); // Dynamic import to avoid circular dep issues if any
        await rag.indexItem('task', task.id, `${task.title}\n${task.notes || ''}`);
    } catch (e) {
        console.error('Failed to index task:', e);
    }

    return task;
}

export async function updateTask(
    id: string,
    data: Partial<{
        title: string;
        pillarId: string;
        projectId: string | null;
        ritualId: string | null;
        status: string;
        dueDate: Date | null;
        scheduledDate: Date | null;
        estimateMinutes: number | null;
        energyLevel: string;
        notes: string | null;
        rolloverCount: number;
        committedDate: Date | null;
        blockedReason: string | null;
        createdAt: Date;
        completedAt: Date | null;
    }>
) {
    const task = await prisma.task.update({
        where: { id },
        data,
        include: { pillar: true, project: true, ritual: true },
    });

    revalidatePath('/');

    // Background Indexing
    try {
        const { rag } = await import('@/lib/ai/rag');
        await rag.indexItem('task', task.id, `${task.title}\n${task.notes || ''}`);
    } catch (e) {
        console.error('Failed to update task index:', e);
    }

    return task;
}

export async function completeTask(id: string, completionNote?: string) {
    const task = await prisma.task.findUnique({
        where: { id },
        include: { pillar: true, project: true, ritual: true },
    });

    if (!task) throw new Error('Task not found');

    const now = new Date();

    // Create archive record
    await prisma.archiveRecord.create({
        data: {
            originalTaskId: task.id,
            title: task.title,
            notes: task.notes,
            pillarId: task.pillarId,
            pillarName: task.pillar?.name || null,
            projectId: task.projectId,
            projectName: task.project?.title || null,
            ritualId: task.ritualId,
            ritualName: task.ritual?.title || null,
            estimateMinutes: task.estimateMinutes,
            energyLevel: task.energyLevel,
            rolloverCount: task.rolloverCount,
            completionNote: completionNote || null,
            completedAt: now,
        },
    });

    // Update task status
    await prisma.task.update({
        where: { id },
        data: {
            status: 'done',
            completedAt: now,
        },
    });

    // If ritual task, increment cycle count
    if (task.ritualId) {
        await prisma.ritual.update({
            where: { id: task.ritualId },
            data: { currentCycleCount: { increment: 1 } },
        });
        revalidatePath('/rituals');
    }

    revalidatePath('/');
    return { success: true };
}

export async function deleteTask(id: string) {
    await prisma.task.delete({ where: { id } });
    revalidatePath('/');
}

// ============================================
// PROJECT ACTIONS
// ============================================

export async function getProjects(includeArchived = false) {
    return prisma.project.findMany({
        where: includeArchived ? {} : { status: { not: 'archived' } },
        include: {
            pillar: true,
            goal: true,
            tasks: {
                where: { status: { not: 'done' } },
            },
            milestones: true,
        },
        orderBy: { updatedAt: 'desc' },
    });
}

export async function getProject(id: string) {
    return prisma.project.findUnique({
        where: { id },
        include: {
            pillar: true,
            goal: true,
            tasks: {
                include: { pillar: true },
                orderBy: { createdAt: 'desc' },
            },
            milestones: {
                orderBy: { sortOrder: 'asc' },
            },
        },
    });
}

export async function createProject(data: {
    title: string;
    pillarId: string;
    goalId?: string;
    description?: string;
    coverImage?: string;
    startDate?: Date;
}) {
    const project = await prisma.project.create({
        data: {
            title: data.title,
            pillarId: data.pillarId,
            goalId: data.goalId || null,
            description: data.description || null,
            coverImage: data.coverImage || null,
            startDate: data.startDate || null,
        },
        include: {
            pillar: true,
            tasks: true,
            milestones: true,
        },
    });

    revalidatePath('/projects');

    try {
        const { rag } = await import('@/lib/ai/rag');
        await rag.indexItem('project', project.id, `${project.title}\n${project.description || ''}`);
    } catch (e) {
        console.error('Failed to index project:', e);
    }

    return project;
}

export async function updateProject(
    id: string,
    data: Partial<{
        title: string;
        description: string | null;
        status: string;
        pillarId: string;
        goalId: string | null;
        coverImage: string | null;
        startDate: Date | null;
    }>
) {
    const project = await prisma.project.update({
        where: { id },
        data,
        include: { pillar: true },
    });

    revalidatePath('/projects');

    try {
        const { rag } = await import('@/lib/ai/rag');
        await rag.indexItem('project', project.id, `${project.title}\n${project.description || ''}`);
    } catch (e) {
        console.error('Failed to update project index:', e);
    }

    return project;
}

export async function archiveProject(id: string) {
    await prisma.project.update({
        where: { id },
        data: { status: 'archived' },
    });
    revalidatePath('/projects');
}

export async function deleteProject(id: string) {
    // Manual cascade delete/unlink to handle FK constraints
    await prisma.$transaction([
        // Delete child records that belong exclusively to project
        prisma.milestone.deleteMany({ where: { projectId: id } }),
        prisma.dailyOutcome.deleteMany({ where: { projectId: id } }),

        // Unlink records that should survive (or are shared)
        prisma.task.updateMany({ where: { projectId: id }, data: { projectId: null } }),
        prisma.resource.updateMany({ where: { projectId: id }, data: { projectId: null } }),
        prisma.transaction.updateMany({ where: { projectId: id }, data: { projectId: null } }),

        // Finally delete the project
        prisma.project.delete({ where: { id } }),
    ]);
    revalidatePath('/projects');
    return { success: true };
}

// ============================================
// MILESTONE ACTIONS
// ============================================

export async function createMilestone(data: {
    projectId: string;
    title: string;
    targetDate?: Date;
    status?: string;
}) {
    const count = await prisma.milestone.count({ where: { projectId: data.projectId } });

    const milestone = await prisma.milestone.create({
        data: {
            projectId: data.projectId,
            title: data.title,
            targetDate: data.targetDate,
            status: data.status || 'not_started',
            sortOrder: count,
        },
    });
    revalidatePath('/projects');
    return milestone;
}

export async function updateMilestone(id: string, data: Partial<{
    title: string;
    targetDate: Date | null;
    status: string;
    sortOrder: number;
}>) {
    const milestone = await prisma.milestone.update({
        where: { id },
        data,
    });
    revalidatePath('/projects');
    return milestone;
}

export async function deleteMilestone(id: string) {
    await prisma.milestone.delete({ where: { id } });
    revalidatePath('/projects');
    return { success: true };
}

// ============================================
// RITUAL ACTIONS (formerly Stream)
// ============================================

export async function deleteRitual(id: string) {
    // Manual cascade delete/unlink to handle FK constraints
    await prisma.$transaction([
        // Delete child records that belong exclusively to ritual
        prisma.ritualEntry.deleteMany({ where: { ritualId: id } }),
        prisma.ritualCycleRecord.deleteMany({ where: { ritualId: id } }),
        prisma.dailyOutcome.deleteMany({ where: { ritualId: id } }),

        // Unlink records that should survive
        prisma.task.updateMany({ where: { ritualId: id }, data: { ritualId: null } }),
        prisma.resource.updateMany({ where: { ritualId: id }, data: { ritualId: null } }),
        prisma.transaction.updateMany({ where: { ritualId: id }, data: { ritualId: null } }),

        // Finally delete the ritual
        prisma.ritual.delete({ where: { id } }),
    ]);
    revalidatePath('/rituals');
    return { success: true };
}
// ============================================

export async function getRituals(includeArchived = false) {
    return prisma.ritual.findMany({
        where: includeArchived ? {} : { status: { not: 'archived' } },
        include: {
            pillar: true,
            goal: true,
            tasks: {
                where: { status: { not: 'done' } },
            },
        },
        orderBy: { updatedAt: 'desc' },
    });
}

export async function getRitual(id: string) {
    return prisma.ritual.findUnique({
        where: { id },
        include: {
            pillar: true,
            goal: true,
            tasks: {
                include: { pillar: true },
                orderBy: { createdAt: 'desc' },
            },
            cycleRecords: {
                orderBy: { cycleStart: 'desc' },
                take: 12,
            },
        },
    });
}

export async function createRitual(data: {
    title: string;
    pillarId: string;
    goalId?: string;
    description?: string;
    cadenceType?: string;
    targetPerCycle?: number;
    coverImage?: string;
    daysOfWeek?: string;
}) {

    try {
        // Try creating with new fields (Requires updated Prisma Client)
        const ritual = await prisma.ritual.create({
            data: {
                title: data.title,
                pillarId: data.pillarId,
                goalId: data.goalId || null,
                description: data.description || null,
                cadenceType: data.cadenceType || 'weekly',
                targetPerCycle: data.targetPerCycle || 3,
                coverImage: data.coverImage || null,
                daysOfWeek: data.daysOfWeek || null,
            },
            include: { pillar: true },
        });
        revalidatePath('/rituals');
        try {
            const { rag } = await import('@/lib/ai/rag');
            await rag.indexItem('ritual', ritual.id, `${ritual.title}\n${ritual.description || ''}`);
        } catch (e) {
            console.error('Failed to index ritual:', e);
        }
        return ritual;
    } catch (error: any) {
        // Fallback: If 'daysOfWeek' is unknown (Schema mismatch), create without it
        if (error.message?.includes('Unknown argument')) {
            console.warn('Prisma Schema Mismatch: Creating ritual without daysOfWeek');
            const ritual = await prisma.ritual.create({
                data: {
                    title: data.title,
                    pillarId: data.pillarId,
                    goalId: data.goalId || null,
                    description: data.description || null,
                    cadenceType: data.cadenceType || 'weekly',
                    targetPerCycle: data.targetPerCycle || 3,
                    coverImage: data.coverImage || null,
                    // daysOfWeek omitted
                },
                include: { pillar: true },
            });
            revalidatePath('/rituals');
            return ritual;
        }
        throw error; // Re-throw other errors
    }
}

export async function updateRitual(
    id: string,
    data: Partial<{
        title: string;
        description: string | null;
        status: string;
        cadenceType: string;
        targetPerCycle: number;
        pillarId: string;
        goalId: string | null;
        coverImage: string | null;
        daysOfWeek: string | null;
    }>
) {
    try {
        const ritual = await prisma.ritual.update({
            where: { id },
            data,
            include: { pillar: true },
        });

        revalidatePath('/rituals');

        try {
            const { rag } = await import('@/lib/ai/rag');
            await rag.indexItem('ritual', ritual.id, `${ritual.title}\n${ritual.description || ''}`);
        } catch (e) {
            console.error('Failed to update ritual index:', e);
        }

        return ritual;
    } catch (error: any) {
        // Fallback: If 'daysOfWeek' is unknown (Schema mismatch), update without it
        if (error.message?.includes('Unknown argument')) {
            console.warn('Prisma Schema Mismatch: Updating ritual without daysOfWeek');
            const { daysOfWeek, ...safeData } = data;
            const ritual = await prisma.ritual.update({
                where: { id },
                data: safeData,
                include: { pillar: true },
            });
            revalidatePath('/rituals');
            return ritual;
        }
        throw error;
    }
}

// ============================================
// DASHBOARD STATS
// ============================================

export async function getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
        totalActiveTasks,
        overdueTasks,
        todayScheduled,
        inboxCount,
        activeProjects,
        activeRituals,
        recentCompleted,
    ] = await Promise.all([
        prisma.task.count({
            where: { status: { in: ['active', 'scheduled', 'blocked'] } },
        }),
        prisma.task.count({
            where: {
                status: { in: ['active', 'scheduled'] },
                dueDate: { lt: today },
            },
        }),
        prisma.task.count({
            where: {
                scheduledDate: {
                    gte: today,
                    lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
                },
                status: { not: 'done' },
            },
        }),
        prisma.inboxItem.count({
            where: { processedAt: null },
        }),
        prisma.project.count({
            where: { status: 'active' },
        }),
        prisma.ritual.count({
            where: { status: 'active' },
        }),
        prisma.archiveRecord.count({
            where: {
                completedAt: {
                    gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
                },
            },
        }),
    ]);

    return {
        totalActiveTasks,
        overdueTasks,
        todayScheduled,
        inboxCount,
        activeProjects,
        activeRituals,
        recentCompleted,
    };
}

// ============================================
// DATA MANAGEMENT
// ============================================

export async function resetData(type: 'soft' | 'hard') {
    if (type === 'soft') {
        // Delete transactional data only
        await prisma.$transaction([
            // Level 1: Children
            prisma.focusSession.deleteMany(),
            prisma.dailyOutcome.deleteMany(),

            // Level 2: Parents
            prisma.task.deleteMany(),
            prisma.dailyPlan.deleteMany(),
            prisma.archiveRecord.deleteMany(),
            prisma.inboxItem.deleteMany(),
            prisma.reviewLog.deleteMany(),
            prisma.briefing.deleteMany(), // Briefings are also transactional
        ]);
    } else if (type === 'hard') {
        // Delete everything except Settings and Pillars (which are fundamental)
        await prisma.$transaction([
            // Level 1: Leaf nodes / Dependencies
            prisma.focusSession.deleteMany(),
            prisma.transaction.deleteMany(),
            prisma.budget.deleteMany(),
            prisma.ritualEntry.deleteMany(),
            prisma.ritualCycleRecord.deleteMany(),
            prisma.dailyOutcome.deleteMany(),
            prisma.milestone.deleteMany(),

            // Level 2: Secondary structures
            prisma.quarterlyObjective.deleteMany(),
            prisma.task.deleteMany(),
            prisma.dailyPlan.deleteMany(),
            prisma.archiveRecord.deleteMany(),
            prisma.inboxItem.deleteMany(),
            prisma.reviewLog.deleteMany(),
            prisma.briefing.deleteMany(),
            prisma.jobApplication.deleteMany(),
            prisma.resource.deleteMany(),

            // Level 3: Core structures
            prisma.project.deleteMany(),
            prisma.ritual.deleteMany(),
            prisma.goal.deleteMany(),

            // Level 4: Finance & Categories
            prisma.financeAccount.deleteMany(),
            prisma.budgetCategory.deleteMany(),

            // Optionally reset Pillars or keep them? Keeping them is safer as they define the structure.
        ]);
    }

    revalidatePath('/');
    return { success: true };
}
