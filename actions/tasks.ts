'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getAllActiveTasks() {
    return prisma.task.findMany({
        where: {
            status: { notIn: ['done', 'archived'] }
        },
        include: {
            project: { select: { title: true, id: true } },
            ritual: { select: { title: true, id: true } },
            pillar: { select: { name: true, colorHex: true, id: true } },
        },
        orderBy: [
            { order: 'asc' },
            { createdAt: 'desc' }
        ]
    });
}

export async function updateTaskEnergy(taskId: string, energyLevel: string) {
    // Validate
    if (!['high', 'medium', 'low'].includes(energyLevel)) {
        throw new Error('Invalid energy level');
    }

    await prisma.task.update({
        where: { id: taskId },
        data: { energyLevel },
    });

    revalidatePath('/tasks');
}

export async function reorderTasks(items: { id: string; order: number }[]) {
    await prisma.$transaction(
        items.map((item) =>
            prisma.task.update({
                where: { id: item.id },
                data: { order: item.order },
            })
        )
    );
    revalidatePath('/tasks');
}
