'use client';

import { useState, useEffect } from 'react';
import { getMonthlyStats } from '@/actions/analytics';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
    ChevronLeft,
    ChevronRight,
    Trophy,
    Target,
    Clock,
    Zap,
    CalendarDays,
    Flame,
} from 'lucide-react';
import { motion } from 'framer-motion';

type MonthlyStats = Awaited<ReturnType<typeof getMonthlyStats>>;

export function AnalyticsClient() {
    const [date, setDate] = useState(new Date());
    const [stats, setStats] = useState<MonthlyStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, [date]);

    const loadStats = async () => {
        setLoading(true);
        try {
            const data = await getMonthlyStats(date);
            setStats(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const changeMonth = (delta: number) => {
        const newDate = new Date(date);
        newDate.setMonth(newDate.getMonth() + delta);
        setDate(newDate);
    };

    if (loading && !stats) return <div className="p-8 text-center text-muted-foreground">Loading flight data...</div>;

    if (!stats) return null;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                        Pilot's Log
                    </h1>
                    <p className="text-muted-foreground">Behavioral Analytics & Performance</p>
                </div>
                <div className="flex items-center gap-4 bg-muted/30 rounded-full p-1 pl-4 pr-1 border border-border/50">
                    <span className="font-medium min-w-[120px] text-center">{stats.monthLabel}</span>
                    <div className="flex gap-1">
                        <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-muted rounded-full transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button onClick={() => changeMonth(1)} className="p-1 hover:bg-muted rounded-full transition-colors">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KPICard
                    icon={<Target className="w-5 h-5 text-emerald-500" />}
                    label="Completion Rate"
                    value={`${stats.completionRate}%`}
                    subtext={`${stats.completedTasks}/${stats.totalTasks} Tasks`}
                    delay={0.1}
                />
                <KPICard
                    icon={<Clock className="w-5 h-5 text-blue-500" />}
                    label="Focus Time"
                    value={`${stats.totalFocusHours}h`}
                    subtext={`Avg ${stats.avgDailyFocusMinutes}m / day`}
                    delay={0.2}
                />
                <KPICard
                    icon={<Zap className="w-5 h-5 text-yellow-500" />}
                    label="Peak Hour"
                    value={stats.optimumHour}
                    subtext="Most Focus Time"
                    delay={0.3}
                />
                <KPICard
                    icon={<CalendarDays className="w-5 h-5 text-purple-500" />}
                    label="Power Day"
                    value={stats.optimumDay}
                    subtext="Most Consistent"
                    delay={0.4}
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Consistency Chart */}
                <div className="glass-panel p-6 rounded-xl relative overflow-hidden group">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-orange-500" />
                        Consistency Trend
                    </h3>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats.dailyCompletion}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis
                                    dataKey="date"
                                    stroke="rgba(255,255,255,0.2)"
                                    tickFormatter={(str) => str.split('-')[2]}
                                    tick={{ fontSize: 12 }}
                                />
                                <YAxis stroke="rgba(255,255,255,0.2)" domain={[0, 100]} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="rate"
                                    stroke="#ec4899"
                                    strokeWidth={3}
                                    dot={{ r: 3, fill: '#ec4899' }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Focus Distribution — daily focus minutes bar chart */}
                <div className="glass-panel p-6 rounded-xl">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <Flame className="w-5 h-5 text-orange-500" />
                        Daily Focus Minutes
                    </h3>
                    {stats.dailyFocusData.length === 0 ? (
                        <div className="h-[250px] flex items-center justify-center text-muted-foreground/50 border border-dashed border-border/30 rounded-lg text-sm">
                            No focus sessions logged yet this month.
                        </div>
                    ) : (
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.dailyFocusData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis
                                        dataKey="date"
                                        stroke="rgba(255,255,255,0.2)"
                                        tickFormatter={(str) => str.split('-')[2]}
                                        tick={{ fontSize: 12 }}
                                    />
                                    <YAxis stroke="rgba(255,255,255,0.2)" unit="m" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }}
                                        formatter={(v: number) => [`${v}m`, 'Focus']}
                                        labelFormatter={(l) => `Day ${l.split('-')[2]}`}
                                    />
                                    <Bar dataKey="minutes" fill="#f97316" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>

            {/* Pillar Distribution + Streak Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pillar Distribution Pie */}
                <div className="glass-panel p-6 rounded-xl">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <Target className="w-5 h-5 text-violet-500" />
                        Completed by Pillar
                    </h3>
                    {stats.pillarDistribution.length === 0 ? (
                        <div className="h-[220px] flex items-center justify-center text-muted-foreground/50 border border-dashed border-border/30 rounded-lg text-sm">
                            No completed tasks this month.
                        </div>
                    ) : (
                        <div className="h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.pillarDistribution}
                                        dataKey="count"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`}
                                        labelLine={false}
                                    >
                                        {stats.pillarDistribution.map((entry, i) => (
                                            <Cell key={i} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }}
                                        formatter={(v: number, name: string) => [v, name]}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Streak / Consistency Heatmap */}
                <div className="glass-panel p-6 rounded-xl">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-500" />
                        Completion Heatmap
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">Daily completion rate across the month</p>
                    <div className="flex flex-wrap gap-1.5">
                        {stats.dailyCompletion.map((d) => {
                            const rate = d.rate;
                            const bg = rate >= 80 ? 'bg-emerald-500' : rate >= 50 ? 'bg-yellow-500' : rate > 0 ? 'bg-red-500/70' : 'bg-muted/30';
                            const day = d.date.split('-')[2];
                            return (
                                <div
                                    key={d.date}
                                    title={`${d.date}: ${rate}%`}
                                    className={`w-8 h-8 rounded-md ${bg} flex items-center justify-center text-[10px] font-bold text-white/80 cursor-default transition-opacity hover:opacity-80`}
                                >
                                    {day}
                                </div>
                            );
                        })}
                        {stats.dailyCompletion.length === 0 && (
                            <p className="text-sm text-muted-foreground">No data for this month yet.</p>
                        )}
                    </div>
                    <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> ≥80%</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-500 inline-block" /> 50–79%</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500/70 inline-block" /> &lt;50%</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-muted/30 inline-block" /> No data</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function KPICard({ icon, label, value, subtext, delay }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5 }}
            className="glass-panel p-5 rounded-xl hover:bg-muted/5 transition-colors"
        >
            <div className="flex items-start justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">{label}</span>
                {icon}
            </div>
            <div className="text-2xl font-bold mb-1">{value}</div>
            <div className="text-xs text-muted-foreground">{subtext}</div>
        </motion.div>
    );
}
