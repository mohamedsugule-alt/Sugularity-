import {
    getEnhancedDashboardStats,
    getProjectsAtRisk,
    getUpcomingMilestones,
    getRitualsBehindCycle,
    getColdTasks,
    getTriageRequiredTasks,
} from '@/actions/humanNature';
import { getPillars, getTasks } from '@/actions/core';
import { getInboxItems } from '@/actions/inbox';
import { getSettings } from '@/actions/settings';
import { getAccounts, getBudgetCategories } from '@/actions/finance';
import { getActivityStreak } from '@/actions/daily-plan';
import { PremiumDashboard } from '@/components/dashboard/PremiumDashboard';

async function settle<T>(p: Promise<T>, fallback: T): Promise<T> {
    try { return await p; } catch { return fallback; }
}

export default async function DashboardPage() {
    const [
        stats,
        pillars,
        inboxItems,
        projectsHealth,
        upcomingMilestones,
        streamsBehind,
        coldTasks,
        triageTasks,
        settings,
        accounts,
        financeCategories,
        allTasks,
        streakData,
    ] = await Promise.all([
        settle(getEnhancedDashboardStats(), { totalTasks: 0, completedToday: 0, inboxCount: 0, activeProjects: 0, activeGoals: 0, todayPlan: null } as any),
        settle(getPillars(), []),
        settle(getInboxItems(), []),
        settle(getProjectsAtRisk(), []),
        settle(getUpcomingMilestones(), []),
        settle(getRitualsBehindCycle(), []),
        settle(getColdTasks(5), []),
        settle(getTriageRequiredTasks(), []),
        settle(getSettings(), { dailyCapacityHours: 6, defaultEstimateMin: 30, showColdInToday: false, backlogColdLimit: 20, rolloverColdLimit: 2, staleProjectDays: 14, calendarLinkBroken: false } as any),
        settle(getAccounts(), []),
        settle(getBudgetCategories(), []),
        settle(getTasks({ status: ['active', 'scheduled', 'blocked'] }), []),
        settle(getActivityStreak(), { currentStreak: 0, longestStreak: 0, totalDays: 0 } as any),
    ]);

    return (
        <PremiumDashboard
            stats={stats}
            pillars={pillars}
            inboxItems={inboxItems}
            projectsHealth={projectsHealth}
            upcomingMilestones={upcomingMilestones}
            ritualsBehind={streamsBehind}
            coldTasks={coldTasks}
            triageTasks={triageTasks}
            settings={settings}
            allTasks={allTasks}
            accounts={accounts}
            financeCategories={financeCategories}
            streakData={streakData}
        />
    );
}
