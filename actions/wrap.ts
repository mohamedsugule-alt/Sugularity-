"use server";

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getIncompleteTasks() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await prisma.task.findMany({
        where: {
            // Scheduled for today (or before) but NOT done
            scheduledDate: { lt: tomorrow },
            status: { not: 'done' }
        }
    });
}

export async function shiftTask(formData: FormData) {
    const taskId = formData.get('taskId') as string;
    const task = await prisma.task.findUnique({ where: { id: taskId } });

    if (!task) return;

    // Shift logic: Move to tomorrow, increment shiftCount
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    await prisma.task.update({
        where: { id: taskId },
        data: {
            scheduledDate: tomorrow,
            rolloverCount: { increment: 1 }
        }
    });

    revalidatePath('/rail/wrap');
}

export async function moveToVortex(formData: FormData) {
    const taskId = formData.get('taskId') as string;
    await prisma.task.update({
        where: { id: taskId },
        data: { scheduledDate: null }
    });
    revalidatePath('/rail/wrap');
}
