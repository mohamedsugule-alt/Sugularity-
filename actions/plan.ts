"use server";

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getPlanData() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 1. Get Settings (Capacity)
    const settings = await prisma.userSettings.findFirst() || await prisma.userSettings.create({ data: {} });

    // 2. Get Today's Tasks
    const tasks = await prisma.task.findMany({
        where: {
            scheduledDate: { gte: today, lt: tomorrow },
            status: 'todo'
        },
        orderBy: [
            { dueDate: 'asc' },
            { createdAt: 'desc' }
        ]
    });

    // 3. Calc Load
    const totalLoad = tasks.reduce((sum, t) => sum + (t.status === 'done' ? 0 : (t.estimateMinutes || 0)), 0);

    return {
        settings,
        tasks,
        totalLoad
    };
}

export async function removeFromToday(formData: FormData) {
    const taskId = formData.get('taskId') as string;
    if (!taskId) return;

    await prisma.task.update({
        where: { id: taskId },
        data: { scheduledDate: null } // Send back to Vortex
    });

    revalidatePath('/rail/plan');
}
