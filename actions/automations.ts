'use server';

import { prisma } from '@/lib/prisma';
import type { AutomationPrompt } from '@/lib/types';

// ============================================
// AUTOMATION ENGINE — All 12 checks
// Snooze state is managed client-side via
// localStorage key 'taliye-automation-snoozes'
// ============================================

export async function checkAutomations(): Promise<AutomationPrompt[]> {
    try {
        const settings = await prisma.userSettings.findFirst();
        if (!settings || !settings.automationsEnabled) return [];

        const now = new Date();
        const hour = now.getHours();
        const dayOfWeek = now.getDay(); // 0=Sunday, 1=Monday

        const prompts: AutomationPrompt[] = [];

        // ── 1. Weekly Review (Monday) ─────────────────────────────────
        if (settings.autoWeeklyReview && dayOfWeek === 1) {
            const weekStart = startOfWeek(now);
            const existingReview = await prisma.reviewLog.findFirst({
                where: { reviewType: 'weekly', createdAt: { gte: weekStart } },
            });
            if (!existingReview) {
                prompts.push({
                    name: 'weeklyReview',
                    title: 'Weekly Review Ready',
                    message: "It's Monday — take 10 minutes to reflect on last week and set your intentions for this one.",
                    triggerReason: 'No weekly review this week',
                    severity: 'info',
                    actions: [
                        { label: 'Start Review', action: 'accept', href: '/review' },
                        { label: 'Later', action: 'snooze' },
                    ],
                });
            }
        }

        // ── 2. Daily Review (evening) ─────────────────────────────────
        if (settings.autoDailyReview && hour >= 17) {
            const today = startOfDay(now);
            const plan = await prisma.dailyPlan.findFirst({
                where: { date: { gte: today } },
            });
            if (plan && plan.status === 'open') {
                const committedIds: string[] = safeParseJSON(plan.committedTaskIds, []);
                if (committedIds.length > 0) {
                    prompts.push({
                        name: 'dailyReview',
                        title: 'Close Out Your Day',
                        message: `You have ${committedIds.length} committed task${committedIds.length > 1 ? 's' : ''} still open. Take 2 minutes to close the day.`,
                        triggerReason: 'Daily plan open after 5pm with committed tasks',
                        severity: 'info',
                        actions: [
                            { label: 'Close Day', action: 'accept', href: '/today' },
                            { label: 'Dismiss', action: 'decline' },
                        ],
                    });
                }
            }
        }

        // ── 3. Inbox Threshold ────────────────────────────────────────
        if (settings.autoInboxThreshold) {
            const inboxCount = await prisma.inboxItem.count({
                where: { processedAt: null },
            });
            if (inboxCount > 10) {
                prompts.push({
                    name: 'inboxThreshold',
                    title: 'Inbox Getting Full',
                    message: `${inboxCount} unprocessed items in your inbox. Clear the backlog before it becomes overwhelming.`,
                    triggerReason: `Inbox count: ${inboxCount} (threshold: 10)`,
                    severity: inboxCount > 20 ? 'warning' : 'info',
                    actions: [
                        { label: 'Process Inbox', action: 'accept', href: '/inbox' },
                        { label: 'Later', action: 'snooze' },
                    ],
                });
            }
        }

        // ── 4. Cold Task Cleanup ──────────────────────────────────────
        if (settings.autoColdCleanup) {
            const coldCount = await prisma.task.count({
                where: {
                    status: { in: ['active', 'scheduled'] },
                    lastTouchedAt: { lt: daysAgo(settings.coldTaskDays) },
                },
            });
            if (coldCount > settings.backlogColdLimit) {
                prompts.push({
                    name: 'coldCleanup',
                    title: 'Cold Tasks Piling Up',
                    message: `${coldCount} tasks haven't been touched in ${settings.coldTaskDays}+ days. Time to triage.`,
                    triggerReason: `${coldCount} cold tasks (limit: ${settings.backlogColdLimit})`,
                    severity: 'warning',
                    actions: [
                        { label: 'Triage Now', action: 'accept', href: '/tasks' },
                        { label: 'Snooze 24h', action: 'snooze' },
                    ],
                });
            }
        }

        // ── 5. Rollover Triage ────────────────────────────────────────
        if (settings.autoRolloverTriage) {
            const rolloverCount = await prisma.task.count({
                where: {
                    status: { in: ['active', 'scheduled'] },
                    rolloverCount: { gte: 2 },
                },
            });
            if (rolloverCount > 0) {
                prompts.push({
                    name: 'rolloverTriage',
                    title: 'Stuck Tasks Need a Decision',
                    message: `${rolloverCount} task${rolloverCount > 1 ? 's have' : ' has'} rolled over 2+ times. Schedule, defer, or delete them.`,
                    triggerReason: `Tasks with rolloverCount ≥ 2: ${rolloverCount}`,
                    severity: 'warning',
                    actions: [
                        { label: 'Triage', action: 'accept', href: '/tasks' },
                        { label: 'Later', action: 'snooze' },
                    ],
                });
            }
        }

        // ── 6. Bankruptcy ─────────────────────────────────────────────
        if (settings.autoBankruptcy) {
            const [activeCount, coldCount] = await Promise.all([
                prisma.task.count({ where: { status: { in: ['active', 'scheduled', 'blocked'] } } }),
                prisma.task.count({
                    where: {
                        status: { in: ['active', 'scheduled'] },
                        lastTouchedAt: { lt: daysAgo(settings.coldTaskDays) },
                    },
                }),
            ]);
            if (activeCount > settings.backlogActiveLimit * 1.5 && coldCount > settings.backlogColdLimit * 1.5) {
                prompts.push({
                    name: 'bankruptcy',
                    title: 'System Overload',
                    message: `${activeCount} active tasks, ${coldCount} cold. Your system is overloaded. Consider a reset.`,
                    triggerReason: `Active: ${activeCount}/${settings.backlogActiveLimit}, Cold: ${coldCount}/${settings.backlogColdLimit}`,
                    severity: 'critical',
                    actions: [
                        { label: 'Go to Settings', action: 'accept', href: '/settings' },
                        { label: 'Dismiss', action: 'decline' },
                    ],
                });
            }
        }

        // ── 7. Capacity Warning ───────────────────────────────────────
        if (settings.autoCapacityWarning) {
            const today = startOfDay(now);
            const plan = await prisma.dailyPlan.findFirst({
                where: { date: { gte: today } },
            });
            if (plan) {
                const committedIds: string[] = safeParseJSON(plan.committedTaskIds, []);
                if (committedIds.length > 0) {
                    const tasks = await prisma.task.findMany({
                        where: { id: { in: committedIds }, estimateMinutes: { not: null } },
                        select: { estimateMinutes: true },
                    });
                    const totalMinutes = tasks.reduce((s, t) => s + (t.estimateMinutes ?? 0), 0);
                    const capacityMinutes = settings.dailyCapacityHours * 60;
                    if (totalMinutes > capacityMinutes * 1.1) {
                        const overBy = ((totalMinutes - capacityMinutes) / 60).toFixed(1);
                        prompts.push({
                            name: 'capacityWarning',
                            title: 'Over Daily Capacity',
                            message: `You're ${overBy}h over your ${settings.dailyCapacityHours}h limit. Consider deferring some tasks.`,
                            triggerReason: `Committed: ${(totalMinutes / 60).toFixed(1)}h / Limit: ${settings.dailyCapacityHours}h`,
                            severity: 'warning',
                            actions: [
                                { label: 'Review Today', action: 'accept', href: '/today' },
                                { label: 'Ignore', action: 'decline' },
                            ],
                        });
                    }
                }
            }
        }

        // ── 8. Stalled Projects ───────────────────────────────────────
        if (settings.autoStalledProject) {
            const stalledProjects = await prisma.project.findMany({
                where: {
                    status: 'active',
                    tasks: {
                        none: { lastTouchedAt: { gte: daysAgo(settings.staleProjectDays) } },
                    },
                },
                select: { title: true },
                take: 3,
            });
            if (stalledProjects.length > 0) {
                const names = stalledProjects.map((p) => p.title).join(', ');
                prompts.push({
                    name: 'stalledProject',
                    title: 'Projects Going Stale',
                    message: `${stalledProjects.length} project${stalledProjects.length > 1 ? 's have' : ' has'} had no activity in ${settings.staleProjectDays}+ days: ${names}.`,
                    triggerReason: `Stalled projects: ${stalledProjects.length}`,
                    severity: 'warning',
                    actions: [
                        { label: 'View Projects', action: 'accept', href: '/projects' },
                        { label: 'Snooze 24h', action: 'snooze' },
                    ],
                });
            }
        }

        // ── 9. Ritual Nudge ───────────────────────────────────────────
        if (settings.autoRitualNudge) {
            const today = startOfDay(now);
            const rituals = await prisma.ritual.findMany({
                where: { status: 'active' },
                select: { title: true, targetPerCycle: true, currentCycleCount: true, currentCycleStart: true, cadenceType: true },
            });
            const lagging = rituals.filter((r) => {
                const cycleDays = r.cadenceType === 'monthly' ? 30 : r.cadenceType === 'daily' ? 1 : 7;
                const daysSinceStart = Math.floor((today.getTime() - new Date(r.currentCycleStart).getTime()) / 86_400_000);
                const cyclePct = Math.min(daysSinceStart / cycleDays, 1);
                const progressPct = r.targetPerCycle > 0 ? r.currentCycleCount / r.targetPerCycle : 1;
                return cyclePct > 0.5 && progressPct < 0.4;
            });
            if (lagging.length > 0) {
                const names = lagging.slice(0, 2).map((r) => r.title).join(', ');
                prompts.push({
                    name: 'ritualNudge',
                    title: 'Habits Falling Behind',
                    message: `${lagging.length} habit${lagging.length > 1 ? 's are' : ' is'} lagging this cycle: ${names}.`,
                    triggerReason: `Lagging rituals: ${lagging.length}`,
                    severity: 'info',
                    actions: [
                        { label: 'View Habits', action: 'accept', href: '/rituals' },
                        { label: 'Dismiss', action: 'decline' },
                    ],
                });
            }
        }

        // ── 10. Unscheduled Tasks ─────────────────────────────────────
        if (settings.autoScheduleOutcomes) {
            const unscheduledCount = await prisma.task.count({
                where: { status: 'active', scheduledDate: null, dueDate: null },
            });
            if (unscheduledCount > 20) {
                prompts.push({
                    name: 'scheduleOutcomes',
                    title: 'Tasks Without Dates',
                    message: `${unscheduledCount} active tasks have no scheduled or due date. Unscheduled tasks get forgotten.`,
                    triggerReason: `Unscheduled: ${unscheduledCount}`,
                    severity: 'info',
                    actions: [
                        { label: 'Go to Board', action: 'accept', href: '/tasks' },
                        { label: 'Later', action: 'snooze' },
                    ],
                });
            }
        }

        // ── 11. Broken Calendar Links ──────────────────────────────────
        if (settings.autoBrokenLink) {
            const brokenCount = await prisma.task.count({
                where: { calendarLinkBroken: true },
            });
            if (brokenCount > 0) {
                prompts.push({
                    name: 'brokenLink',
                    title: 'Broken Calendar Blocks',
                    message: `${brokenCount} task${brokenCount > 1 ? 's have' : ' has'} a broken calendar block. Reschedule to fix.`,
                    triggerReason: `Broken calendar links: ${brokenCount}`,
                    severity: 'info',
                    actions: [
                        { label: 'View Calendar', action: 'accept', href: '/calendar' },
                        { label: 'Dismiss', action: 'decline' },
                    ],
                });
            }
        }

        // Sort: critical first, warning second, info last
        const severityOrder = { critical: 0, warning: 1, info: 2 };
        prompts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

        return prompts;
    } catch (err) {
        console.error('[checkAutomations] Error:', err);
        return [];
    }
}

export async function logAutomationAction(
    _automationName: string,
    _triggerReason: string,
    _suggestion: string,
    _userAction: 'accepted' | 'declined' | 'snoozed',
    _changesApplied?: unknown
) {
    // Future: write to AutomationLog table
}

export async function snoozeAutomation(_automationName: string, _hours = 24) {
    // Snooze state managed client-side via localStorage
}

export async function getAutomationLog(_limit = 50): Promise<unknown[]> {
    return [];
}

export async function updateAutomationSettings(data: Partial<{
    automationsEnabled: boolean;
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
        return prisma.userSettings.update({ where: { id: existing.id }, data });
    }
    return prisma.userSettings.create({ data });
}

// ── Helpers ───────────────────────────────────────────────────────

function startOfDay(d: Date): Date {
    const s = new Date(d);
    s.setHours(0, 0, 0, 0);
    return s;
}

function startOfWeek(d: Date): Date {
    const s = new Date(d);
    s.setDate(s.getDate() - s.getDay());
    s.setHours(0, 0, 0, 0);
    return s;
}

function daysAgo(n: number): Date {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
}

function safeParseJSON<T>(value: string | null, fallback: T): T {
    if (!value) return fallback;
    try { return JSON.parse(value) as T; }
    catch { return fallback; }
}
