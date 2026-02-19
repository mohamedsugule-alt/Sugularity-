'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// ============================================
// GOAL ACTIONS
// ============================================

export async function getGoals(filters?: { pillarId?: string; status?: string }) {
    const where: any = {};
    if (filters?.pillarId) where.pillarId = filters.pillarId;
    if (filters?.status) where.status = filters.status;

    return prisma.goal.findMany({
        where,
        include: {
            pillar: true,
            quarterlyObjectives: {
                where: { status: { not: 'archived' } },
            },
            projects: {
                where: { status: { not: 'archived' } },
            },
            rituals: {
                where: { status: { not: 'archived' } },
            },
        },
        orderBy: { updatedAt: 'desc' },
    });
}

export async function getGoal(id: string) {
    return prisma.goal.findUnique({
        where: { id },
        include: {
            pillar: true,
            quarterlyObjectives: {
                include: {
                    projects: { include: { milestones: true, tasks: { where: { status: { not: 'done' } } } } },
                    rituals: { include: { cycleRecords: { take: 6, orderBy: { cycleEnd: 'desc' } } } },
                },
                orderBy: { quarter: 'desc' },
            },
            projects: {
                include: { milestones: true, tasks: { where: { status: { not: 'done' } } } },
            },
            rituals: {
                include: { cycleRecords: { take: 6, orderBy: { cycleEnd: 'desc' } } },
            },
        },
    });
}

export async function createGoal(data: {
    title: string;
    pillarId: string;
    description?: string;
    targetDate?: Date;
    coverImage?: string;
}) {
    const goal = await prisma.goal.create({
        data: {
            title: data.title,
            pillarId: data.pillarId,
            description: data.description,
            targetDate: data.targetDate,
            coverImage: data.coverImage || null,
        },
        include: { pillar: true },
    });
    revalidatePath('/goals');

    try {
        const { rag } = await import('@/lib/ai/rag');
        await rag.indexItem('goal', goal.id, `${goal.title}\n${goal.description || ''}`);
    } catch (e) {
        console.error('Failed to index goal:', e);
    }

    return goal;
}

export async function updateGoal(id: string, data: Partial<{
    title: string;
    description: string | null;
    coverImage: string | null;
    targetDate: Date | null;
    status: string;
    notes: string | null;
}>) {
    const goal = await prisma.goal.update({
        where: { id },
        data,
        include: { pillar: true },
    });
    revalidatePath('/goals');

    try {
        const { rag } = await import('@/lib/ai/rag');
        await rag.indexItem('goal', goal.id, `${goal.title}\n${goal.description || ''}\n${data.notes || ''}`);
    } catch (e) {
        console.error('Failed to update goal index:', e);
    }

    return goal;
}

export async function deleteGoal(id: string) {
    // Manual cascade delete/unlink to handle FK constraints
    await prisma.$transaction([
        // 1. Unlink Projects/Rituals from derived Quarterly Objectives
        prisma.project.updateMany({
            where: { quarterlyObjective: { goalId: id } },
            data: { quarterlyObjectiveId: null }
        }),
        prisma.ritual.updateMany({
            where: { quarterlyObjective: { goalId: id } },
            data: { quarterlyObjectiveId: null }
        }),

        // 2. Delete Quarterly Objectives
        prisma.quarterlyObjective.deleteMany({ where: { goalId: id } }),

        // 3. Unlink direct Projects/Rituals from Goal
        prisma.project.updateMany({ where: { goalId: id }, data: { goalId: null } }),
        prisma.ritual.updateMany({ where: { goalId: id }, data: { goalId: null } }),
        prisma.transaction.updateMany({ where: { goalId: id }, data: { goalId: null } }),

        // 4. Delete Goal
        prisma.goal.delete({ where: { id } }),
    ]);
    revalidatePath('/goals');
    return { success: true };
}

export async function unlinkProjectFromGoal(projectId: string, goalId: string) {
    await prisma.project.update({
        where: { id: projectId },
        data: { goalId: null },
    });
    revalidatePath(`/goals/${goalId}`);
    return { success: true };
}

export async function unlinkRitualFromGoal(ritualId: string, goalId: string) {
    await prisma.ritual.update({
        where: { id: ritualId },
        data: { goalId: null },
    });
    revalidatePath(`/goals/${goalId}`);
    return { success: true };
}

// ============================================
// QUARTERLY OBJECTIVE ACTIONS
// ============================================

export async function getQuarterlyObjectives(goalId?: string) {
    return prisma.quarterlyObjective.findMany({
        where: goalId ? { goalId } : {},
        include: {
            goal: { include: { pillar: true } },
            projects: true,
            rituals: true,
        },
        orderBy: { quarter: 'desc' },
    });
}

export async function createQuarterlyObjective(data: {
    goalId: string;
    quarter: string;
    title: string;
    description?: string;
    topOutcomes?: string[];
    startDate?: Date;
    endDate?: Date;
}) {
    const objective = await prisma.quarterlyObjective.create({
        data: {
            goalId: data.goalId,
            quarter: data.quarter,
            title: data.title,
            description: data.description,
            topOutcomes: data.topOutcomes ? JSON.stringify(data.topOutcomes) : null,
            startDate: data.startDate,
            endDate: data.endDate,
        },
    });
    revalidatePath('/goals');
    return objective;
}

export async function updateQuarterlyObjective(id: string, data: Partial<{
    title: string;
    description: string | null;
    topOutcomes: string[];
    status: string;
}>) {
    const updateData: any = { ...data };
    if (data.topOutcomes) {
        updateData.topOutcomes = JSON.stringify(data.topOutcomes);
    }
    const objective = await prisma.quarterlyObjective.update({
        where: { id },
        data: updateData,
    });
    revalidatePath('/goals');
    return objective;
}

export async function linkContributor(
    type: 'project' | 'ritual',
    id: string,
    quarterlyObjectiveId: string | null
) {
    if (type === 'project') {
        await prisma.project.update({
            where: { id },
            data: { quarterlyObjectiveId },
        });
    } else {
        await prisma.ritual.update({
            where: { id },
            data: { quarterlyObjectiveId },
        });
    }
    revalidatePath('/goals');
}

export async function linkProjectToGoal(projectId: string, goalId: string) {
    await prisma.project.update({
        where: { id: projectId },
        data: { goalId }
    });
    revalidatePath('/goals');
}

export async function linkRitualToGoal(ritualId: string, goalId: string) {
    await prisma.ritual.update({
        where: { id: ritualId },
        data: { goalId }
    });
    revalidatePath('/goals');
}

export async function getAvailableResources(goalId: string) {
    const [projects, rituals] = await Promise.all([
        prisma.project.findMany({
            where: {
                goalId: null,
                quarterlyObjectiveId: null,
                status: 'active'
            },
            select: { id: true, title: true, pillar: { select: { name: true } } }
        }),
        prisma.ritual.findMany({
            where: {
                goalId: null,
                quarterlyObjectiveId: null,
                status: 'active'
            },
            select: { id: true, title: true, pillar: { select: { name: true } } }
        })
    ]);

    return { projects, rituals };
}

// ============================================
// GOAL HEALTH ENGINE
// ============================================

export type GoalHealth = 'on_track' | 'watch' | 'at_risk';

export async function getGoalHealth(goalId: string): Promise<{
    health: GoalHealth;
    reasons: string[];
    contributorCount: number;
    lastActivityAt: Date | null;
    progressEstimate: number;
}> {
    const goal = await prisma.goal.findUnique({
        where: { id: goalId },
        include: {
            quarterlyObjectives: {
                where: { status: 'active' },
                include: {
                    projects: { include: { tasks: true, milestones: true } },
                    rituals: { include: { cycleRecords: { take: 6, orderBy: { cycleEnd: 'desc' } } } },
                },
            },
            projects: { include: { tasks: true, milestones: true } },
            rituals: { include: { cycleRecords: { take: 6, orderBy: { cycleEnd: 'desc' } } } },
        },
    });

    if (!goal) {
        return { health: 'at_risk', reasons: ['Goal not found'], contributorCount: 0, lastActivityAt: null, progressEstimate: 0 };
    }

    const reasons: string[] = [];
    const settings = await prisma.userSettings.findFirst();
    const staleDays = settings?.staleProjectDays || 21;
    const now = new Date();
    const staleThreshold = new Date(now.getTime() - staleDays * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Collect all contributors
    const allProjects = [...goal.projects, ...goal.quarterlyObjectives.flatMap(q => q.projects)];
    const allRituals = [...goal.rituals, ...goal.quarterlyObjectives.flatMap(q => q.rituals)];
    const contributorCount = allProjects.length + allRituals.length;

    // Find last activity
    let lastActivityAt: Date | null = null;
    for (const p of allProjects) {
        if (!lastActivityAt || p.lastActivityAt > lastActivityAt) {
            lastActivityAt = p.lastActivityAt;
        }
    }
    for (const s of allRituals) {
        if (!lastActivityAt || s.lastActivityAt > lastActivityAt) {
            lastActivityAt = s.lastActivityAt;
        }
    }

    // Calculate progress estimate
    let totalMilestones = 0;
    let completedMilestones = 0;
    for (const p of allProjects) {
        totalMilestones += p.milestones.length;
        completedMilestones += p.milestones.filter(m => m.status === 'complete').length;
    }
    const progressEstimate = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

    // Determine health
    let health: GoalHealth = 'on_track';

    // At Risk checks
    if (contributorCount === 0) {
        reasons.push('No contributors linked');
        health = 'at_risk';
    }

    if (lastActivityAt && lastActivityAt < staleThreshold) {
        reasons.push(`No activity in ${staleDays}+ days`);
        health = 'at_risk';
    }

    // Check for at-risk projects
    const atRiskProjects = allProjects.filter(p => {
        const overdueMilestones = p.milestones.filter(m =>
            m.status !== 'complete' && m.targetDate && new Date(m.targetDate) < now
        );
        return overdueMilestones.length > 0 || p.lastActivityAt < staleThreshold;
    });
    if (atRiskProjects.length > 0) {
        reasons.push(`${atRiskProjects.length} project(s) at risk`);
        health = 'at_risk';
    }

    // Check ritual adherence
    for (const s of allRituals) {
        const recentCycles = s.cycleRecords.slice(0, 2);
        const lowAdherence = recentCycles.filter(c => c.achieved < c.target * 0.5).length;
        if (lowAdherence >= 2) {
            reasons.push(`Ritual "${s.title}" below 50% adherence`);
            health = 'at_risk';
        }
    }

    // Watch checks (only if not already at risk)
    if (health === 'on_track') {
        if (lastActivityAt && lastActivityAt < sevenDaysAgo) {
            reasons.push('No completions in last 7 days');
            health = 'watch';
        }

        // Check upcoming milestones
        const fourteenDaysFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
        const upcomingMilestones = allProjects.flatMap(p =>
            p.milestones.filter(m =>
                m.status !== 'complete' &&
                m.targetDate &&
                new Date(m.targetDate) <= fourteenDaysFromNow
            )
        );
        if (upcomingMilestones.length > 0 && lastActivityAt && lastActivityAt < sevenDaysAgo) {
            reasons.push('Milestone due soon but low activity');
            health = 'watch';
        }
    }

    return { health, reasons, contributorCount, lastActivityAt, progressEstimate };
}

export async function getGoalsWithHealth() {
    const goals = await getGoals({ status: 'active' });
    const results = await Promise.all(
        goals.map(async (goal) => {
            const healthData = await getGoalHealth(goal.id);
            return { ...goal, ...healthData };
        })
    );
    return results;
}

// ============================================
// QUARTERLY RESET REVIEW
// ============================================

export async function getQuarterlyReviewData(quarter: string) {
    const [year, q] = quarter.split('-Q');
    const quarterNum = parseInt(q);
    const startMonth = (quarterNum - 1) * 3;
    const startDate = new Date(parseInt(year), startMonth, 1);
    const endDate = new Date(parseInt(year), startMonth + 3, 0);

    const [
        completedTasks,
        goals,
        coldTasks,
        projectsAtRisk,
        ritualsBehind,
    ] = await Promise.all([
        prisma.archiveRecord.findMany({
            where: {
                completedAt: { gte: startDate, lte: endDate },
            },
            orderBy: { completedAt: 'desc' },
        }),
        getGoalsWithHealth(),
        prisma.task.count({
            where: {
                status: { in: ['active', 'scheduled'] },
                lastTouchedAt: { lt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
            },
        }),
        prisma.project.findMany({
            where: {
                status: 'active',
                lastActivityAt: { lt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000) },
            },
        }),
        prisma.ritual.findMany({
            where: {
                status: 'active',
                currentCycleCount: { lt: prisma.ritual.fields.targetPerCycle },
            },
        }),
    ]);

    // Group completed by pillar
    const pillarGroups: Record<string, typeof completedTasks> = {};
    for (const task of completedTasks) {
        const key = task.pillarName || 'Uncategorized';
        if (!pillarGroups[key]) pillarGroups[key] = [];
        pillarGroups[key].push(task);
    }

    return {
        quarter,
        startDate,
        endDate,
        completedTasks,
        completedByPillar: pillarGroups,
        goals,
        coldTasks,
        projectsAtRisk,
        ritualsBehind,
    };
}

export async function saveQuarterlyReview(data: {
    quarter: string;
    notes?: string;
    quarterSummary?: string;
    statsSnapshot?: any;
}) {
    const review = await prisma.reviewLog.create({
        data: {
            reviewType: 'quarterly',
            quarter: data.quarter,
            date: new Date(),
            notes: data.notes,
            quarterSummary: data.quarterSummary,
            statsSnapshot: data.statsSnapshot ? JSON.stringify(data.statsSnapshot) : null,
        },
    });
    revalidatePath('/reviews');
    return review;
}

// ============================================
// INSIGHTS ENGINE
// ============================================

export async function captureInsightSnapshot() {
    const now = new Date();
    const weekNumber = Math.ceil((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
    const coldThreshold = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [
        activeCount,
        coldCount,
        completedCount,
        rolloverCount,
        blockedCount,
        inboxCount,
        projectsAtRisk,
        ritualsOnTrack,
        ritualsMissed,
        pillarData,
    ] = await Promise.all([
        prisma.task.count({ where: { status: { in: ['active', 'scheduled'] } } }),
        prisma.task.count({
            where: {
                status: { in: ['active', 'scheduled'] },
                lastTouchedAt: { lt: coldThreshold },
            },
        }),
        prisma.archiveRecord.count({
            where: { completedAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },
        }),
        prisma.task.count({ where: { rolloverCount: { gte: 1 } } }),
        prisma.task.count({ where: { status: 'blocked' } }),
        prisma.inboxItem.count({ where: { processedAt: null } }),
        prisma.project.count({
            where: {
                status: 'active',
                lastActivityAt: { lt: new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000) },
            },
        }),
        prisma.ritual.count({
            where: {
                status: 'active',
                currentCycleCount: { gte: prisma.ritual.fields.targetPerCycle },
            },
        }),
        prisma.ritual.count({
            where: {
                status: 'active',
                currentCycleCount: { lt: 1 },
            },
        }),
        prisma.archiveRecord.groupBy({
            by: ['pillarId'],
            _count: true,
            where: { completedAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } },
        }),
    ]);

    const pillarDistribution: Record<string, number> = {};
    for (const item of pillarData) {
        if (item.pillarId) pillarDistribution[item.pillarId] = item._count;
    }

    const snapshot = await prisma.insightSnapshot.create({
        data: {
            date: now,
            weekNumber,
            activeTaskCount: activeCount,
            coldTaskCount: coldCount,
            completedCount,
            rolloverCount,
            blockedCount,
            inboxCount,
            projectsAtRisk,
            ritualsOnTrack,
            ritualsMissed,
            pillarDistribution: JSON.stringify(pillarDistribution),
        },
    });

    return snapshot;
}

export async function getInsightSnapshots(days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return prisma.insightSnapshot.findMany({
        where: { date: { gte: since } },
        orderBy: { date: 'asc' },
    });
}

export async function getInsightsDashboard() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const coldThreshold = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [
        snapshots,
        currentActive,
        currentCold,
        currentBlocked,
        currentRollover,
        weeklyCompleted,
        monthlyCompleted,
        rituals,
        projectsAtRisk,
        pillarDistribution,
        pillars,
    ] = await Promise.all([
        getInsightSnapshots(30),
        prisma.task.count({ where: { status: { in: ['active', 'scheduled'] } } }),
        prisma.task.count({
            where: {
                status: { in: ['active', 'scheduled'] },
                lastTouchedAt: { lt: coldThreshold },
            },
        }),
        prisma.task.count({ where: { status: 'blocked' } }),
        prisma.task.count({ where: { rolloverCount: { gte: 1 }, status: { not: 'done' } } }),
        prisma.archiveRecord.count({ where: { completedAt: { gte: sevenDaysAgo } } }),
        prisma.archiveRecord.count({ where: { completedAt: { gte: thirtyDaysAgo } } }),
        prisma.ritual.findMany({
            where: { status: 'active' },
            include: { cycleRecords: { take: 6, orderBy: { cycleEnd: 'desc' } } },
        }),
        prisma.project.findMany({
            where: {
                status: 'active',
                OR: [
                    { lastActivityAt: { lt: new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000) } },
                    { deadline: { lt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) } },
                ],
            },
        }),
        prisma.archiveRecord.groupBy({
            by: ['pillarId', 'pillarName'],
            _count: true,
            where: { completedAt: { gte: thirtyDaysAgo } },
        }),
        prisma.pillar.findMany({ where: { isActive: true } }),
    ]);

    // Calculate ritual adherence
    const ritualAdherence = rituals.map(s => {
        const recentCycles = s.cycleRecords.slice(0, 6);
        const adherenceScores = recentCycles.map(c =>
            c.target > 0 ? Math.min((c.achieved / c.target) * 100, 100) : 100
        );
        const avgAdherence = adherenceScores.length > 0
            ? Math.round(adherenceScores.reduce((a, b) => a + b, 0) / adherenceScores.length)
            : 100;
        return {
            id: s.id,
            title: s.title,
            adherence: avgAdherence,
            cycleScores: adherenceScores,
        };
    });

    // Calculate weekly momentum (0-100)
    const commitmentRatio = currentActive > 0 ? (weeklyCompleted / (currentActive + weeklyCompleted)) * 100 : 100;
    const weeklyMomentum = Math.round(Math.min(commitmentRatio, 100));

    return {
        // Current state
        currentActive,
        currentCold,
        currentBlocked,
        currentRollover,
        weeklyCompleted,
        monthlyCompleted,

        // Trends
        snapshots,

        // Rituals
        ritualAdherence,

        // Projects at risk
        projectsAtRisk: projectsAtRisk.map(p => ({
            id: p.id,
            title: p.title,
            reason: p.deadline && new Date(p.deadline) < new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
                ? 'Deadline approaching'
                : 'Stale (no activity)',
        })),

        // Pillar distribution
        pillarDistribution: pillarDistribution.map(d => ({
            pillarId: d.pillarId,
            pillarName: d.pillarName || 'Unknown',
            count: d._count,
        })),
        pillars,

        // Score
        weeklyMomentum,
    };
}
