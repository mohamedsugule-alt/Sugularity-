'use client';

import {
    TrendingUp,
    TrendingDown,
    Snowflake,
    AlertTriangle,
    RotateCcw,
    CheckCircle2,
    Repeat,
    FolderKanban,
    PieChart,
    Activity,
    Target,
    Lightbulb,
} from 'lucide-react';
import Link from 'next/link';

type Insights = {
    currentActive: number;
    currentCold: number;
    currentBlocked: number;
    currentRollover: number;
    weeklyCompleted: number;
    monthlyCompleted: number;
    weeklyMomentum: number;
    snapshots: {
        date: string;
        activeTaskCount: number;
        coldTaskCount: number;
        completedCount: number;
        rolloverCount: number;
        projectsAtRisk: number;
    }[];
    ritualAdherence: { id: string; title: string; adherence: number; cycleScores: number[] }[];
    projectsAtRisk: { id: string; title: string; reason: string }[];
    pillarDistribution: { pillarId: string | null; pillarName: string; count: number }[];
    pillars: { id: string; name: string; colorHex: string }[];
};

export function InsightsClient({ insights }: { insights: Insights }) {
    const getPillarColor = (pillarId: string | null) => {
        const pillar = insights.pillars.find((p) => p.id === pillarId);
        return pillar?.colorHex || '#8B5CF6';
    };

    // Simple sparkline component
    const Sparkline = ({ data, color = 'primary' }: { data: number[]; color?: string }) => {
        if (data.length === 0) return null;
        const max = Math.max(...data, 1);
        const points = data.map((v, i) => ({
            x: (i / (data.length - 1)) * 100,
            y: 100 - (v / max) * 100,
        }));
        const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

        return (
            <svg className="w-full h-12" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path
                    d={pathD}
                    fill="none"
                    stroke={color === 'primary' ? 'hsl(var(--primary))' : color}
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                />
            </svg>
        );
    };

    // Progress ring component
    const ProgressRing = ({ value, size = 48, stroke = 4 }: { value: number; size?: number; stroke?: number }) => {
        const radius = (size - stroke) / 2;
        const circumference = radius * 2 * Math.PI;
        const offset = circumference - (Math.min(value, 100) / 100) * circumference;
        const color = value >= 80 ? '#10B981' : value >= 50 ? '#F59E0B' : '#EF4444';

        return (
            <svg width={size} height={size} className="transform -rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="hsl(var(--muted))"
                    strokeWidth={stroke}
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={stroke}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                />
            </svg>
        );
    };

    return (
        <div className="space-y-6">
            {/* Momentum Score */}
            <div className="glass-panel rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Activity className="w-5 h-5 text-primary" />
                            Weekly Momentum
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Based on completion rate and activity
                        </p>
                    </div>
                    <div className="relative">
                        <ProgressRing value={insights.weeklyMomentum} size={80} stroke={8} />
                        <span className="absolute inset-0 flex items-center justify-center text-xl font-bold">
                            {insights.weeklyMomentum}
                        </span>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="p-3 bg-muted/30 rounded-lg text-center">
                        <p className="text-2xl font-bold text-emerald-500">{insights.weeklyCompleted}</p>
                        <p className="text-xs text-muted-foreground">Completed This Week</p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg text-center">
                        <p className="text-2xl font-bold">{insights.currentActive}</p>
                        <p className="text-xs text-muted-foreground">Active Tasks</p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg text-center">
                        <p className="text-2xl font-bold text-cyan-400">{insights.currentCold}</p>
                        <p className="text-xs text-muted-foreground">Cold Tasks</p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg text-center">
                        <p className="text-2xl font-bold text-yellow-500">{insights.currentRollover}</p>
                        <p className="text-xs text-muted-foreground">Rollover Pressure</p>
                    </div>
                </div>
            </div>

            {/* Trends Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Backlog Health Trend */}
                <div className="glass-panel rounded-xl p-5">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Backlog Health (30 days)
                    </h3>
                    <div className="h-16">
                        <Sparkline data={insights.snapshots.map((s) => s.activeTaskCount)} />
                    </div>
                    <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                        <span>Active tasks over time</span>
                        <span className="font-medium text-foreground">{insights.currentActive}</span>
                    </div>
                    <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Lightbulb className="w-3 h-3" />
                            {insights.currentActive > 40
                                ? 'Backlog exceeds 40. Consider Restore Clarity.'
                                : 'Backlog is under control.'}
                        </p>
                        {insights.currentActive > 40 && (
                            <Link href="/bankruptcy" className="text-xs text-primary hover:underline mt-1 block">
                                → Restore Clarity
                            </Link>
                        )}
                    </div>
                </div>

                {/* Cold Tasks Trend */}
                <div className="glass-panel rounded-xl p-5">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Snowflake className="w-4 h-4 text-cyan-400" />
                        Cold Tasks Trend
                    </h3>
                    <div className="h-16">
                        <Sparkline data={insights.snapshots.map((s) => s.coldTaskCount)} color="#22D3EE" />
                    </div>
                    <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                        <span>Cold tasks over time</span>
                        <span className="font-medium text-cyan-400">{insights.currentCold}</span>
                    </div>
                    <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Lightbulb className="w-3 h-3" />
                            {insights.currentCold > 10
                                ? 'Many cold tasks. Weekly review cleanup suggested.'
                                : 'Cold task count is healthy.'}
                        </p>
                    </div>
                </div>

                {/* Rollover Pressure */}
                <div className="glass-panel rounded-xl p-5">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <RotateCcw className="w-4 h-4 text-yellow-500" />
                        Rollover Pressure
                    </h3>
                    <div className="h-16">
                        <Sparkline data={insights.snapshots.map((s) => s.rolloverCount)} color="#F59E0B" />
                    </div>
                    <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                        <span>Tasks with rollovers</span>
                        <span className="font-medium text-yellow-500">{insights.currentRollover}</span>
                    </div>
                    <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Lightbulb className="w-3 h-3" />
                            {insights.currentRollover > 5
                                ? 'High rollover. Force triage on stuck tasks.'
                                : 'Rollover pressure is manageable.'}
                        </p>
                    </div>
                </div>

                {/* Projects at Risk */}
                <div className="glass-panel rounded-xl p-5">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <FolderKanban className="w-4 h-4 text-red-500" />
                        Projects at Risk
                    </h3>
                    {insights.projectsAtRisk.length === 0 ? (
                        <div className="flex items-center gap-2 text-emerald-500">
                            <CheckCircle2 className="w-5 h-5" />
                            <span>All projects on track</span>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {insights.projectsAtRisk.slice(0, 3).map((p) => (
                                <Link
                                    key={p.id}
                                    href={`/projects/${p.id}`}
                                    className="flex items-center justify-between p-2 bg-red-500/10 rounded-lg hover:bg-red-500/15"
                                >
                                    <span className="text-sm font-medium">{p.title}</span>
                                    <span className="text-xs text-red-400">{p.reason}</span>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Ritual Adherence */}
            <div className="glass-panel rounded-xl p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Repeat className="w-5 h-5" />
                    Ritual Adherence (Last 6 Cycles)
                </h3>
                {insights.ritualAdherence.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No active rituals</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {insights.ritualAdherence.map((ritual) => (
                            <Link
                                key={ritual.id}
                                href={`/rituals/${ritual.id}`}
                                className="p-4 bg-muted/30 rounded-lg hover:bg-muted/50"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-sm">{ritual.title}</span>
                                    <span className={`text-sm font-bold ${ritual.adherence >= 80 ? 'text-emerald-500' :
                                        ritual.adherence >= 50 ? 'text-yellow-500' : 'text-red-500'
                                        }`}>
                                        {ritual.adherence}%
                                    </span>
                                </div>
                                <div className="flex gap-1">
                                    {ritual.cycleScores.map((score, i) => (
                                        <div
                                            key={i}
                                            className={`flex-1 h-2 rounded ${score >= 100 ? 'bg-emerald-500' :
                                                score >= 50 ? 'bg-yellow-500' : 'bg-red-500/30'
                                                }`}
                                        />
                                    ))}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Pillar Distribution */}
            <div className="glass-panel rounded-xl p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Pillar Balance (Last 30 Days)
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Distribution of completed tasks by life pillar.
                </p>
                {insights.pillarDistribution.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No completed tasks in the last 30 days</p>
                ) : (
                    <div className="space-y-3">
                        {(() => {
                            const total = insights.pillarDistribution.reduce((acc, d) => acc + d.count, 0);
                            return insights.pillarDistribution.map((d) => {
                                const percent = total > 0 ? Math.round((d.count / total) * 100) : 0;
                                return (
                                    <div key={d.pillarId || 'unknown'} className="flex items-center gap-3">
                                        <div
                                            className="w-3 h-3 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: getPillarColor(d.pillarId) }}
                                        />
                                        <span className="text-sm flex-1">{d.pillarName}</span>
                                        <div className="w-32 h-2 bg-muted/50 rounded-full overflow-hidden">
                                            <div
                                                className="h-full"
                                                style={{
                                                    width: `${percent}%`,
                                                    backgroundColor: getPillarColor(d.pillarId),
                                                }}
                                            />
                                        </div>
                                        <span className="text-sm text-muted-foreground w-12 text-right">
                                            {percent}%
                                        </span>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                )}
            </div>
        </div>
    );
}
