'use server';

import prisma from '@/lib/prisma';

// ============================================
// SETTINGS ACTIONS
// ============================================

export async function getSettings() {
    let settings = await prisma.userSettings.findFirst();

    if (!settings) {
        settings = await prisma.userSettings.create({
            data: {},
        });
    }

    return settings;
}

export async function updateSettings(data: Partial<{
    dailyCapacityHours: number;
    defaultEstimateMin: number;
    requireEstimate: boolean;
    workDayStart: string;
    workDayEnd: string;
    // Sprint 2
    coldTaskDays: number;
    staleProjectDays: number;
    backlogActiveLimit: number;
    backlogColdLimit: number;
    backlogProjectLimit: number;
    showColdInToday: boolean;
    calendarMode: string;
    dashboardCoverImage: string | null;
    // Sprint 8: AI
    aiProvider: string;
    aiModel: string;
    aiEndpoint: string;
    aiApiKey: string;
    aiContextWindow: number;
    aiTemperature: number;
}>) {
    const existing = await prisma.userSettings.findFirst();

    if (existing) {
        return prisma.userSettings.update({
            where: { id: existing.id },
            data,
        });
    }

    return prisma.userSettings.create({ data: data as any });
}
