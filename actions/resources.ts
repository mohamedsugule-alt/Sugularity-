'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// ==========================================
// Resource Actions
// ==========================================

export async function getResources(filters?: {
    type?: string;
    search?: string;
    isFavorite?: boolean;
    isArchived?: boolean;
}) {
    const where: any = {
        isArchived: filters?.isArchived || false
    };

    if (filters?.type && filters.type !== 'all') {
        where.type = filters.type;
    }

    if (filters?.search) {
        where.OR = [
            { title: { contains: filters.search } },
            { content: { contains: filters.search } }
        ];
    }

    if (filters?.isFavorite) {
        where.isFavorite = true;
    }

    return await prisma.resource.findMany({
        where,
        orderBy: { updatedAt: 'desc' }
    });
}

export async function createResource(data: {
    title: string;
    type: string;
    content?: string;
    filePath?: string;
    url?: string;
}) {
    const resource = await prisma.resource.create({
        data: {
            title: data.title,
            type: data.type,
            content: data.content,
            filePath: data.filePath,
            url: data.url
        }
    });
    revalidatePath('/library');
    return resource;
}

export async function updateResource(id: string, data: Partial<{
    title: string;
    content: string;
    isFavorite: boolean;
    isArchived: boolean;
}>) {
    const resource = await prisma.resource.update({
        where: { id },
        data
    });
    revalidatePath('/library');
    return resource;
}

export async function deleteResource(id: string) {
    await prisma.resource.delete({ where: { id } });
    revalidatePath('/library');
}
