'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// ============================================
// AUTOMATION DEFINITIONS
// ============================================

export type AutomationName =
    | 'weeklyReview'
    | 'dailyReview'
    | 'inboxThreshold'
    | 'coldCleanup'
    | 'rolloverTriage'
    | 'bankruptcy'
    | 'capacityWarning'
    | 'meetingHeavy'
    | 'stalledProject'
    | 'streamNudge'
    | 'scheduleOutcomes'
    | 'brokenLink';

export interface AutomationPrompt {
    name: AutomationName;
    title: string;
    message: string;
    triggerReason: string;
    actions: {
        label: string;
        action: 'accept' | 'decline' | 'snooze' | 'resolve';
        href?: string;
    }[];
    severity: 'info' | 'warning' | 'critical';
}

// ============================================
// CHECK AUTOMATIONS
// ============================================

// ============================================
// CHECK AUTOMATIONS
// ============================================

export async function checkAutomations(): Promise<AutomationPrompt[]> {
    // Automations temporarily disabled during system migration (Sprint 4 cleanup)
    return [];
}

// ============================================
// LOG AUTOMATION ACTION
// ============================================

export async function logAutomationAction(
    automationName: string,
    triggerReason: string,
    suggestion: string,
    userAction: 'accepted' | 'declined' | 'snoozed',
    changesApplied?: any
) {
    // No-op
}

// ============================================
// SNOOZE AUTOMATION
// ============================================

export async function snoozeAutomation(automationName: string, hours = 24) {
    // No-op
}

// ============================================
// GET AUTOMATION AUDIT LOG
// ============================================

export async function getAutomationLog(limit = 50): Promise<any[]> {
    return [];
}

// ============================================
// UPDATE AUTOMATION SETTINGS
// ============================================

export async function updateAutomationSettings(data: Partial<{
    automationsEnabled: boolean;
    quietHoursStart: string;
    quietHoursEnd: string;
    maxPromptsPerDay: number;
    powerUserMode: boolean;
    autoWeeklyReview: boolean;
    autoDailyReview: boolean;
    autoInboxThreshold: boolean;
    autoColdCleanup: boolean;
    autoRolloverTriage: boolean;
    autoBankruptcy: boolean;
    autoCapacityWarning: boolean;
    autoMeetingHeavy: boolean;
    autoStalledProject: boolean;
    autoStreamNudge: boolean;
    autoScheduleOutcomes: boolean;
    autoBrokenLink: boolean;
}>) {
    const existing = await prisma.userSettings.findFirst();
    if (existing) {
        return prisma.userSettings.update({
            where: { id: existing.id },
            data,
        });
    }
    return prisma.userSettings.create({ data });
}
