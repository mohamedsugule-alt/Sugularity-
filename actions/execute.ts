"use server";

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getExecutionData() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasks = await prisma.task.findMany({
        where: {
            OR: [
                { scheduledDate: { gte: today, lt: tomorrow }, status: 'todo' },
                { status: 'doing' }
            ]
        },
        orderBy: [
            { status: 'asc' }
        ]
    });

    return { tasks };
}

export async function toggleTaskStatus(formData: FormData) {
    const taskId = formData.get('taskId') as string;
    const currentStatus = formData.get('currentStatus') as string;

    const newStatus = currentStatus === 'done' ? 'todo' : 'done';
    const completedAt = newStatus === 'done' ? new Date() : null;

    await prisma.task.update({
        where: { id: taskId },
        data: {
            status: newStatus,
            completedAt
        }
    });

    revalidatePath('/rail/execute');
}

export async function saveTaskNotes(formData: FormData) {
    const taskId = formData.get('taskId') as string;
    const notes = formData.get('notes') as string;

    await prisma.task.update({
        where: { id: taskId },
        data: { notes }
    });

    revalidatePath('/rail/execute');
}
