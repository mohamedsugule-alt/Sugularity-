'use client';

import { useState, useEffect } from 'react';
import { getMonthlyStats } from '@/actions/analytics';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line
} from 'recharts';
import {
    ChevronLeft,
    ChevronRight,
    Trophy,
    Target,
    Clock,
    Zap,
    CalendarDays
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

                {/* Focus Distribution (Placeholder for now, reusing completion data or static until we have granular data access) */}
                {/* Note: In getMonthlyStats we didn't return daily focus data array, only total. 
                    I'll add it to the server action in next iteration if needed, for now showing a static message or simple bar */}
                <div className="glass-panel p-6 rounded-xl">
                    <h3 className="text-lg font-semibold mb-2">Focus Distribution</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Accumulated focus sessions by day.
                    </p>
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground/50 border border-dashed border-border/30 rounded-lg">
                        Detailed distribution coming soon...
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
