'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// ============================================
// ARCHIVE ACTIONS
// ============================================

export async function getArchiveRecords(filters?: {
    search?: string;
    pillarId?: string;
    projectId?: string;
    ritualId?: string;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
}) {
    const where: any = {};

    if (filters?.search) {
        where.title = { contains: filters.search };
    }

    if (filters?.pillarId) where.pillarId = filters.pillarId;
    if (filters?.projectId) where.projectId = filters.projectId;
    if (filters?.ritualId) where.ritualId = filters.ritualId;

    if (filters?.fromDate || filters?.toDate) {
        where.completedAt = {};
        if (filters.fromDate) where.completedAt.gte = filters.fromDate;
        if (filters.toDate) where.completedAt.lte = filters.toDate;
    }

    return prisma.archiveRecord.findMany({
        where,
        orderBy: { completedAt: 'desc' },
        take: filters?.limit || 100,
    });
}

export async function deleteArchiveRecord(id: string) {
    await prisma.archiveRecord.delete({ where: { id } });
    revalidatePath('/archive');
}
