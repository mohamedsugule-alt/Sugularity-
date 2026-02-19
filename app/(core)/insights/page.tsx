import { getInsightsDashboard } from '@/actions/goals';
import { getPillars } from '@/actions/core';
import { InsightsClient } from '@/components/insights/InsightsClient';
import { LineChart } from 'lucide-react';

export default async function InsightsPage() {
    const [insights, pillars] = await Promise.all([
        getInsightsDashboard(),
        getPillars(),
    ]);

    // Serialize for client
    const serializedInsights = {
        currentActive: insights.currentActive,
        currentCold: insights.currentCold,
        currentBlocked: insights.currentBlocked,
        currentRollover: insights.currentRollover,
        weeklyCompleted: insights.weeklyCompleted,
        monthlyCompleted: insights.monthlyCompleted,
        weeklyMomentum: insights.weeklyMomentum,
        snapshots: insights.snapshots.map((s: any) => ({
            date: s.date.toISOString(),
            activeTaskCount: s.activeTaskCount,
            coldTaskCount: s.coldTaskCount,
            completedCount: s.completedCount,
            rolloverCount: s.rolloverCount,
            projectsAtRisk: s.projectsAtRisk,
        })),
        ritualAdherence: insights.ritualAdherence,
        projectsAtRisk: insights.projectsAtRisk,
        pillarDistribution: insights.pillarDistribution,
        pillars: pillars.map((p: any) => ({ id: p.id, name: p.name, colorHex: p.colorHex })),
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <LineChart className="w-8 h-8 text-primary" />
                    Insights
                </h1>
                <p className="text-muted-foreground mt-1">
                    Decision-supporting trends and metrics.
                </p>
            </div>

            <InsightsClient insights={serializedInsights} />
        </div>
    );
}
