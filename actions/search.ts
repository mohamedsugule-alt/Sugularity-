'use server';

import { prisma } from '@/lib/prisma';

export type SearchResult = {
    id: string;
    title: string;
    type: 'task' | 'project' | 'ritual' | 'goal' | 'inbox';
    href: string;
    meta?: string;
};

export async function searchAll(query: string): Promise<SearchResult[]> {
    if (!query || query.trim().length < 2) return [];

    const q = query.trim();

    const [tasks, projects, rituals, goals, inboxItems] = await Promise.all([
        prisma.task.findMany({
            where: {
                title: { contains: q },
            },
            select: { id: true, title: true, status: true, pillar: { select: { name: true } } },
            take: 5,
            orderBy: { updatedAt: 'desc' },
        }),
        prisma.project.findMany({
            where: {
                title: { contains: q },
            },
            select: { id: true, title: true, status: true },
            take: 5,
            orderBy: { updatedAt: 'desc' },
        }),
        prisma.ritual.findMany({
            where: {
                title: { contains: q },
            },
            select: { id: true, title: true, status: true },
            take: 5,
            orderBy: { updatedAt: 'desc' },
        }),
        prisma.goal.findMany({
            where: {
                title: { contains: q },
            },
            select: { id: true, title: true, status: true },
            take: 5,
            orderBy: { updatedAt: 'desc' },
        }),
        prisma.inboxItem.findMany({
            where: {
                title: { contains: q },
            },
            select: { id: true, title: true },
            take: 5,
            orderBy: { createdAt: 'desc' },
        }),
    ]);

    const results: SearchResult[] = [
        ...tasks.map(t => ({
            id: t.id,
            title: t.title,
            type: 'task' as const,
            href: '/today',
            meta: t.pillar?.name || t.status,
        })),
        ...projects.map(p => ({
            id: p.id,
            title: p.title,
            type: 'project' as const,
            href: `/projects/${p.id}`,
            meta: p.status,
        })),
        ...rituals.map(s => ({
            id: s.id,
            title: s.title,
            type: 'ritual' as const,
            href: `/rituals/${s.id}`,
            meta: s.status,
        })),
        ...goals.map(g => ({
            id: g.id,
            title: g.title,
            type: 'goal' as const,
            href: `/goals/${g.id}`,
            meta: g.status,
        })),
        ...inboxItems.map(i => ({
            id: i.id,
            title: i.title,
            type: 'inbox' as const,
            href: '/inbox',
        })),
    ];

    return results;
}
