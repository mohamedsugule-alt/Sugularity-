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

export default async function DashboardPage() {
    console.log("Rendering Dashboard Page...");
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
        getEnhancedDashboardStats(),
        getPillars(),
        getInboxItems(),
        getProjectsAtRisk(),
        getUpcomingMilestones(),
        getRitualsBehindCycle(),
        getColdTasks(5),
        getTriageRequiredTasks(),
        getSettings(),
        getAccounts(),
        getBudgetCategories(),
        getTasks({ status: ['active', 'scheduled', 'blocked'] }),
        getActivityStreak(),
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
