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

import { getColdTasks, getTriageRequiredTasks } from './humanNature';

export async function checkAutomations(): Promise<AutomationPrompt[]> {
    const settings = await prisma.userSettings.findFirst();
    if (!settings || !settings.automationsEnabled) return [];

    const prompts: AutomationPrompt[] = [];

    // 1. Cold Task Cleanup
    if (settings.autoColdCleanup) {
        const coldTasks = await getColdTasks();
        if (coldTasks.length > 0) {
            prompts.push({
                name: 'coldCleanup',
                title: 'Ice Age Warning',
                message: `You have ${coldTasks.length} tasks that haven't been touched in ${settings.coldTaskDays} days.`,
                triggerReason: `Cold Threshold Exceeded`,
                actions: [
                    { label: 'Review Cold Tasks', action: 'resolve', href: '/insights' },
                    { label: 'Snooze', action: 'snooze' }
                ],
                severity: coldTasks.length > settings.backlogColdLimit ? 'warning' : 'info'
            });
        }
    }

    // 2. Rollover Triage
    if (settings.autoRolloverTriage) {
        const triageTasks = await getTriageRequiredTasks();
        if (triageTasks.length > 0) {
            prompts.push({
                name: 'rolloverTriage',
                title: 'Stalled Momentum',
                message: `${triageTasks.length} tasks have shifted past their scheduled date multiple times and need manual intervention.`,
                triggerReason: `Shift Count Exceeded`,
                actions: [
                    { label: 'Force Triage', action: 'resolve', href: '/tasks/triage' },
                    { label: 'Snooze', action: 'snooze' }
                ],
                severity: 'warning'
            });
        }
    }

    // 3. Bankruptcy (System Overload)
    if (settings.autoBankruptcy) {
        const activeCount = await prisma.task.count({ where: { status: 'active' } });
        if (activeCount > settings.backlogActiveLimit) {
            prompts.push({
                name: 'bankruptcy',
                title: 'System Overload',
                message: `Your active backlog (${activeCount} tasks) exceeds your cognitive limit of ${settings.backlogActiveLimit}. Initiate backlog bankruptcy?`,
                triggerReason: `Active tasks > ${settings.backlogActiveLimit}`,
                actions: [
                    { label: 'Declare Bankruptcy', action: 'resolve', href: '/bankruptcy' },
                    { label: 'Dismiss', action: 'decline' }
                ],
                severity: 'critical'
            });
        }
    }

    return prompts;
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
    return prisma.userSettings.create({ data: data as any });
}
