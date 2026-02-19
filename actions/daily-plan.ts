'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// ============================================
// DAILY PLAN ACTIONS
// ============================================

export async function getDailyPlan(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    let plan = await prisma.dailyPlan.findUnique({
        where: { date: startOfDay },
    });

    if (!plan) {
        plan = await prisma.dailyPlan.create({
            data: { date: startOfDay },
        });
    }

    // Fetch outcomes separately if not included in findUnique (Prisma limitation with create)
    const planWithOutcomes = await prisma.dailyPlan.findUnique({
        where: { id: plan.id },
        include: {
            dailyOutcomes: {
                include: { project: true, ritual: true },
                orderBy: { sortOrder: 'asc' },
            },
        },
    });

    return planWithOutcomes!;
}

export async function updateDailyPlan(
    date: Date,
    data: Partial<{
        outcomes: string;
        committedTaskIds: string;
        status: string;
    }>
) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const plan = await prisma.dailyPlan.upsert({
        where: { date: startOfDay },
        update: data,
        create: { date: startOfDay, ...data },
    });

    revalidatePath('/today');
    return plan;
}

export async function closeDailyPlan(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    await prisma.dailyPlan.update({
        where: { date: startOfDay },
        data: {
            status: 'closed',
            closedAt: new Date(),
        },
    });

    revalidatePath('/today');
}

export async function addDailyOutcome(
    date: Date,
    title: string,
    projectId?: string,
    ritualId?: string,
    estimateMinutes?: number
) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    let plan = await prisma.dailyPlan.findUnique({ where: { date: startOfDay } });
    if (!plan) {
        plan = await prisma.dailyPlan.create({ data: { date: startOfDay } });
    }

    const count = await prisma.dailyOutcome.count({ where: { dailyPlanId: plan.id } });

    // 1. Create the DailyOutcome (Visual/Briefing)
    await prisma.dailyOutcome.create({
        data: {
            dailyPlanId: plan.id,
            title,
            projectId,
            ritualId,
            sortOrder: count,
        },
    });

    // 2. Create the Actual Task (Functional/Today List)
    // We need a pillarId (Golden Thread). Fetch default/first.
    const defaultPillar = await prisma.pillar.findFirst({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' }
    });

    if (defaultPillar) {
        await prisma.task.create({
            data: {
                title: title,
                pillarId: defaultPillar.id,
                projectId: projectId || null,
                ritualId: ritualId || null,
                status: 'active',
                scheduledDate: startOfDay, // Commits it to today (Candidates list initially)
                notes: 'Generated from Daily Outcome',
                estimateMinutes: estimateMinutes || 30,
            }
        });
    }

    revalidatePath('/today');
}

export async function toggleDailyOutcome(id: string) {
    const outcome = await prisma.dailyOutcome.findUnique({ where: { id } });
    if (outcome) {
        const isComplete = !outcome.isComplete;
        await prisma.dailyOutcome.update({
            where: { id },
            data: { isComplete },
        });

        // Sync with Ritual Progress if linked
        if (outcome.ritualId) {
            await prisma.ritual.update({
                where: { id: outcome.ritualId },
                data: {
                    currentCycleCount: isComplete ? { increment: 1 } : { decrement: 1 }
                }
            });
            revalidatePath('/rituals');
        }

        revalidatePath('/today');
    }
}

export async function deleteDailyOutcome(id: string) {
    await prisma.dailyOutcome.delete({ where: { id } });
    revalidatePath('/today');
}

export async function getActivityStreak() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const closedPlans = await prisma.dailyPlan.findMany({
        where: {
            status: 'closed',
            closedAt: { not: null },
            date: { gte: thirtyDaysAgo },
        },
        select: { date: true },
        orderBy: { date: 'desc' },
    });

    const closedDates = new Set(
        closedPlans.map(p => {
            const d = new Date(p.date);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        })
    );

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i <= 30; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const key = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
        if (closedDates.has(key)) {
            streak++;
        } else if (i === 0) {
            continue; // today not closed yet is ok
        } else {
            break;
        }
    }

    const sparkline: number[] = [];
    for (let i = 6; i >= 0; i--) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const key = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
        sparkline.push(closedDates.has(key) ? 1 : 0);
    }

    return { streak, sparkline };
}
