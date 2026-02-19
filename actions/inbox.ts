'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// ============================================
// INBOX ACTIONS
// ============================================

export async function getInboxItems() {
    return prisma.inboxItem.findMany({
        where: { processedAt: null },
        orderBy: { createdAt: 'desc' },
    });
}

export async function createInboxItem(title: string, notes?: string, scheduledDate?: Date, energyLevel?: string) {
    const item = await prisma.inboxItem.create({
        data: { title, notes, scheduledDate, energyLevel },
    });
    revalidatePath('/inbox');
    return item;
}

export async function processInboxItem(
    inboxItemId: string,
    taskData: {
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
    }
) {
    // Golden Thread enforcement: pillarId is required
    if (!taskData.pillarId) {
        throw new Error('Golden Thread: Task must have a Pillar assigned');
    }

    const [task] = await prisma.$transaction([
        prisma.task.create({
            data: {
                title: taskData.title,
                pillarId: taskData.pillarId,
                projectId: taskData.projectId || null,
                ritualId: taskData.ritualId || null,
                status: taskData.status || 'active',
                dueDate: taskData.dueDate || null,
                scheduledDate: taskData.scheduledDate || null,
                estimateMinutes: taskData.estimateMinutes || null,
                energyLevel: taskData.energyLevel || 'medium',
                notes: taskData.notes || null,
            },
        }),
        prisma.inboxItem.update({
            where: { id: inboxItemId },
            data: { processedAt: new Date() },
        }),
    ]);

    revalidatePath('/inbox');
    revalidatePath('/today');
    return task;
}

export async function deleteInboxItem(id: string) {
    await prisma.inboxItem.delete({ where: { id } });
    revalidatePath('/inbox');
}
