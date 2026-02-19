'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    Bell,
    Search,
    LayoutGrid,
    Calendar,
    Inbox,
    Target,
    ArrowRight,
    TrendingUp,
    Snowflake,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Zap,
    ChevronRight,
    Sun,
    Moon,
    CloudSun,
    Upload,
    Pen,
    Plus,
    DollarSign,
    ListTodo,
    Flame
} from 'lucide-react';
import { updateSettings } from '@/actions/settings';
import { toast } from 'sonner';
import { AddTransactionModal } from '@/components/finance/AddTransactionModal';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/motion';
// import { TasksClient } from '@/components/tasks/TasksClient';

// Types for props
type DashboardProps = {
    stats: any;
    pillars: any[];
    inboxItems: any[];
    projectsHealth: any;
    upcomingMilestones: any[];
    ritualsBehind: any[];
    coldTasks: any[];
    triageTasks: any[];
    settings: any;
    allTasks?: any[];
    accounts?: { id: string; name: string }[];
    financeCategories?: { id: string; name: string }[];
    streakData?: { streak: number; sparkline: number[] };
};

export function PremiumDashboard({
    stats,
    pillars,
    inboxItems,
    projectsHealth,
    upcomingMilestones,
    ritualsBehind,
    coldTasks,
    triageTasks,
    settings,
    allTasks = [],
    accounts = [],
    financeCategories = [],
    streakData = { streak: 0, sparkline: [0, 0, 0, 0, 0, 0, 0] },
}: DashboardProps) {
    const [greeting, setGreeting] = useState('');
    const [time, setTime] = useState('');
    const [dateStr, setDateStr] = useState('');
    const [coverImage, setCoverImage] = useState(settings?.dashboardCoverImage || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop");
    const [isUploading, setIsUploading] = useState(false);
    const [showAddTransaction, setShowAddTransaction] = useState(false);
    const [viewMode, setViewMode] = useState<'overview' | 'tasks'>('overview');

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            const data = await res.json();

            if (data.success) {
                setCoverImage(data.url);
                await updateSettings({ dashboardCoverImage: data.url });
                toast.success('Dashboard cover updated');
            } else {
                toast.error('Upload failed');
            }
        } catch {
            toast.error('Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            const hours = now.getHours();

            if (hours < 12) setGreeting('Good morning');
            else if (hours < 18) setGreeting('Good afternoon');
            else setGreeting('Good evening');

            setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            setDateStr(now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }));
        };

        updateTime();
        const interval = setInterval(updateTime, 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

    const capacityUsed = (stats.todayScheduledMinutes || 0) / 60;
    const capacityPercent = Math.min((capacityUsed / settings.dailyCapacityHours) * 100, 100);

    return (
        <div className="space-y-8">
            {/* Hero Section */}
            <FadeIn className="relative rounded-3xl overflow-hidden min-h-[280px] bg-black group">
                <Image
                    src={coverImage}
                    alt="Dashboard Cover"
                    fill
                    className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />

                {/* Edit Cover Button */}
                <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <label className={`cursor-pointer bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg backdrop-blur-sm flex items-center gap-2 text-xs font-medium transition-colors ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                        <Upload className="w-4 h-4" />
                        <span>Change Cover</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleUpload} />
                    </label>
                </div>

                <div className="absolute inset-0 p-8 flex flex-col justify-end">
                    <div className="max-w-xl">
                        <h2 className="text-xl font-medium text-primary/80 mb-2">{greeting}, Pilot</h2>
                        <h1 className="text-5xl font-bold tracking-tight mb-4">
                            Ready for takeoff?
                        </h1>

                        {/* View Toggles */}
                        <div className="flex items-center gap-4 mt-6">
                            <button
                                suppressHydrationWarning
                                onClick={() => setViewMode('overview')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md transition-all ${viewMode === 'overview' ? 'bg-white text-black font-bold' : 'bg-white/10 text-white hover:bg-white/20'}`}
                            >
                                <LayoutGrid className="w-4 h-4" />
                                Overview
                            </button>
                            <button
                                suppressHydrationWarning
                                onClick={() => setViewMode('tasks')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md transition-all ${viewMode === 'tasks' ? 'bg-white text-black font-bold' : 'bg-white/10 text-white hover:bg-white/20'}`}
                            >
                                <ListTodo className="w-4 h-4" />
                                Energy Board
                            </button>
                        </div>

                        <div className="flex items-center gap-6 text-sm font-medium text-muted-foreground/80 mt-6">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span>{time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span suppressHydrationWarning>{dateStr}</span>
                            </div>
                            {streakData.streak > 0 && (
                                <div className="flex items-center gap-2 bg-orange-500/20 text-orange-300 px-3 py-1 rounded-full backdrop-blur-md">
                                    <Flame className="w-4 h-4" />
                                    <span className="font-bold">{streakData.streak} day streak</span>
                                </div>
                            )}
                            <div className="flex items-center gap-0.5" title="Last 7 days activity">
                                {streakData.sparkline.map((v, i) => (
                                    <div
                                        key={i}
                                        className={`w-2 rounded-sm transition-all ${v ? 'bg-emerald-400 h-4' : 'bg-white/20 h-2'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </FadeIn>

            {/* Content Switch */}
            {viewMode === 'tasks' ? (
                <div className="glass-panel p-6 rounded-3xl min-h-[500px]">
                    {/* <TasksClient initialTasks={allTasks} /> */}
                    <div className="text-center py-10 text-muted-foreground">Tasks View Temporarily Unavailable</div>
                </div>
            ) : (
                /* Main Grid */
                <>
                    {/* Welcome Hero — shown for new users */}
                    {(stats.totalTasks || 0) < 3 && pillars.length <= 2 && (
                        <FadeIn>
                            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-violet-600/90 via-violet-500/80 to-fuchsia-500/70 p-8 md:p-10 text-white">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_70%)]" />
                                <div className="absolute top-4 right-6 text-6xl opacity-20 pointer-events-none">🌟</div>

                                <div className="relative z-10">
                                    <h2 className="text-2xl md:text-3xl font-bold mb-2">Welcome to Sugularity</h2>
                                    <p className="text-white/80 text-lg mb-8 max-w-lg">
                                        Your Life Operating System. Get started in 3 steps — it takes less than 5 minutes.
                                    </p>

                                    <div className="space-y-4">
                                        {[
                                            {
                                                done: pillars.length > 2,
                                                label: 'Create your Life Pillars',
                                                sub: 'Health, Career, Finance...',
                                                href: '/settings',
                                            },
                                            {
                                                done: inboxItems.length > 0 || (stats.totalTasks || 0) > 0,
                                                label: 'Capture your first thought',
                                                sub: 'Ideas, tasks, reminders...',
                                                href: '/inbox',
                                            },
                                            {
                                                done: false, // No goals yet if we're in this block
                                                label: 'Set a goal',
                                                sub: 'What do you want to achieve?',
                                                href: '/goals',
                                            },
                                        ].map((step, i) => (
                                            <Link
                                                key={i}
                                                href={step.href}
                                                className="flex items-center gap-4 p-4 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all group"
                                            >
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shrink-0 ${step.done ? 'bg-emerald-400 text-emerald-900' : 'bg-white/20 text-white'}`}>
                                                    {step.done ? '✓' : i + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <p className={`font-semibold ${step.done ? 'line-through opacity-60' : ''}`}>{step.label}</p>
                                                    <p className="text-sm text-white/60">{step.sub}</p>
                                                </div>
                                                <ArrowRight className="w-5 h-5 text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </FadeIn>
                    )}

                    {/* Start Your Day CTA */}
                    {(stats.totalTasks || 0) >= 1 && (
                        <FadeIn delay={0.1}>
                            <Link
                                href="/today"
                                className="group flex items-center justify-between p-5 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 hover:border-primary/40 transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Sun className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-foreground">Start Your Day</p>
                                        <p className="text-sm text-muted-foreground">
                                            {stats.remainingCount || 0} tasks waiting • {(capacityUsed || 0).toFixed(1)}h committed
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                                    <span className="hidden sm:inline">Go to Today</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </Link>
                        </FadeIn>
                    )}
                    <StaggerContainer className="grid grid-cols-1 lg:grid-cols-12 gap-6" delay={0.1}>

                        {/* Left Column - Flight Status (Capacity) */}
                        <StaggerItem className="lg:col-span-8 h-full">
                            {/* Today's Capacity Card */}
                            <Link href="/today" className="group block relative overflow-hidden rounded-3xl card-vibrant card-vibrant-blue p-8 h-full">
                                <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                                <div className="relative flex items-start justify-between mb-8">
                                    <div>
                                        <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                                            <Zap className="w-6 h-6 text-white" />
                                            Today's Flight Plan
                                        </h3>
                                        <p className="text-blue-100 mt-1 font-medium">
                                            {stats.remainingCount} tasks remaining • {capacityUsed.toFixed(1)}h total load
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white/20 group-hover:scale-110 transition-transform backdrop-blur-md">
                                        <ArrowRight className="w-6 h-6 text-white" />
                                    </div>
                                </div>

                                <div className="relative space-y-3">
                                    <div className="flex justify-between text-sm font-bold text-white/90">
                                        <span>Day Progress ({Math.round((stats.completedCount / (stats.todayScheduled || 1)) * 100)}%)</span>
                                        <span>{Math.round(capacityPercent)}% Capacity</span>
                                    </div>
                                    <div className="h-4 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm border border-white/10">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 bg-white`}
                                            style={{ width: `${capacityPercent}%` }}
                                        />
                                    </div>
                                </div>
                            </Link>
                        </StaggerItem>

                        {/* Right Column - Radar */}
                        <StaggerItem className="lg:col-span-4 h-full">
                            {/* Projects at Risk - Keep this one Glass/Clean for balance */}
                            <div className="rounded-3xl glass-panel p-6 h-full border-white/10 dark:border-white/5 bg-white/50 dark:bg-black/20">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-bold flex items-center gap-2 text-foreground">
                                        <Target className="w-5 h-5 text-primary" />
                                        Radar
                                    </h3>
                                    <Link href="/projects" className="text-xs text-primary hover:underline">View All</Link>
                                </div>

                                <div className="space-y-3">
                                    {projectsHealth.atRisk.length === 0 && ritualsBehind.length === 0 && (
                                        <div className="text-center py-10">
                                            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                                                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                            </div>
                                            <p className="text-sm font-medium text-muted-foreground">Systems Nominal</p>
                                        </div>
                                    )}

                                    {projectsHealth.atRisk.slice(0, 2).map((p: any) => (
                                        <Link key={p.id} href={`/projects/${p.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-red-500/20 group">
                                            <div className="w-1.5 h-8 rounded-full bg-red-500" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold truncate group-hover:text-red-500 transition-colors text-foreground">{p.title}</p>
                                                <p className="text-[10px] text-red-500 uppercase tracking-wider font-bold">At Risk</p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                    ))}

                                    {ritualsBehind.slice(0, 2).map((s: any) => (
                                        <Link key={s.id} href={`/rituals/${s.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-yellow-500/20 group">
                                            <div className="w-1.5 h-8 rounded-full bg-yellow-500" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold truncate group-hover:text-yellow-500 transition-colors text-foreground">{s.title}</p>
                                                <p className="text-[10px] text-yellow-500 uppercase tracking-wider font-bold">Falling Behind</p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </StaggerItem>
                    </StaggerContainer>

                    {/* Middle Row - Key Status Cards (Bigger) */}
                    <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8" delay={0.2}>
                        {/* Inbox Status */}
                        <StaggerItem>
                            <Link href="/inbox" className="group rounded-[2rem] card-vibrant card-vibrant-amber p-10 min-h-[300px] flex flex-col justify-between h-full">
                                <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                                <div className="relative flex justify-between items-start">
                                    <div className="p-5 rounded-2xl bg-white/20 text-white group-hover:scale-110 transition-transform backdrop-blur-md">
                                        <Inbox className="w-10 h-10" />
                                    </div>
                                    {stats.inboxCount > 0 && (
                                        <span className="flex h-5 w-5 relative">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-5 w-5 bg-white"></span>
                                        </span>
                                    )}
                                </div>
                                <div className="relative">
                                    <h3 className="text-7xl font-black text-white mb-2">{stats.inboxCount}</h3>
                                    <p className="text-2xl font-bold text-white/90">Inbox Items</p>
                                    <p className="text-sm text-white/70 mt-2 font-medium">
                                        {stats.inboxCount === 0 ? "Inbox zero achieved" : "Awaiting processing"}
                                    </p>
                                </div>
                            </Link>
                        </StaggerItem>

                        {/* Critical Attention */}
                        <StaggerItem>
                            <Link href="/today" className="group rounded-[2rem] card-vibrant card-vibrant-red p-10 min-h-[300px] flex flex-col justify-between h-full">
                                <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                                <div className="relative flex justify-between items-start">
                                    <div className="p-5 rounded-2xl bg-white/20 text-white group-hover:scale-110 transition-transform backdrop-blur-md">
                                        <AlertTriangle className="w-10 h-10" />
                                    </div>
                                </div>
                                <div className="relative">
                                    <h3 className="text-7xl font-black text-white mb-2">{stats.overdueTasks}</h3>
                                    <p className="text-2xl font-bold text-white/90">Overdue</p>
                                    <p className="text-sm text-white/70 mt-2 font-medium">
                                        {stats.overdueTasks === 0 ? "Schedule is clear" : "Action required immediately"}
                                    </p>
                                </div>
                            </Link>
                        </StaggerItem>

                        {/* Focus Tasks Today */}
                        <StaggerItem>
                            <Link href="/today" className="group rounded-[2rem] card-vibrant card-vibrant-purple p-10 min-h-[300px] flex flex-col justify-between h-full">
                                <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                                <div className="relative flex justify-between items-start">
                                    <div className="p-5 rounded-2xl bg-white/20 text-white group-hover:scale-110 transition-transform backdrop-blur-md">
                                        <CheckCircle2 className="w-10 h-10" />
                                    </div>
                                </div>
                                <div className="relative">
                                    <h3 className="text-7xl font-black text-white mb-2">{stats.activeTasks}</h3>
                                    <p className="text-2xl font-bold text-white/90">Focus Tasks</p>
                                    <p className="text-sm text-white/70 mt-2 font-medium">
                                        Committed for today
                                    </p>
                                </div>
                            </Link>
                        </StaggerItem>
                    </StaggerContainer>

                    {/* Bottom Section - Systems and Stats */}
                    <StaggerContainer className="grid grid-cols-1 lg:grid-cols-1 gap-6" delay={0.3}>

                        {/* Quick Actions / Stats */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                            <StaggerItem>
                                <Link href="/archive" className="rounded-3xl card-vibrant card-vibrant-emerald p-6 text-center group min-h-[160px] flex flex-col items-center justify-center h-full">
                                    <TrendingUp className="w-8 h-8 text-white mx-auto mb-3 group-hover:scale-110 transition-transform" />
                                    <p className="text-4xl font-bold text-white mb-1">{stats.recentCompleted}</p>
                                    <p className="text-sm text-emerald-100 font-medium">Done this week</p>
                                </Link>
                            </StaggerItem>

                            <StaggerItem>
                                <Link href="/today?filter=cold" className="rounded-3xl card-vibrant card-vibrant-cyan p-6 text-center group min-h-[160px] flex flex-col items-center justify-center h-full">
                                    <Snowflake className="w-8 h-8 text-white mx-auto mb-3 group-hover:scale-110 transition-transform" />
                                    <p className="text-4xl font-bold text-white mb-1">{stats.coldCount}</p>
                                    <p className="text-sm text-cyan-100 font-medium">Cold Items</p>
                                </Link>
                            </StaggerItem>

                            <StaggerItem className="col-span-2">
                                <button
                                    suppressHydrationWarning
                                    onClick={() => setShowAddTransaction(true)}
                                    className="w-full h-full rounded-3xl card-vibrant card-vibrant-violet p-6 flex items-center justify-center gap-6 group min-h-[160px]"
                                >
                                    <div className="p-4 rounded-full bg-white/20 text-white group-hover:scale-110 transition-transform backdrop-blur-md">
                                        <DollarSign className="w-8 h-8" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-2xl font-bold text-white">Log Expense</p>
                                        <p className="text-violet-100 font-medium mt-1">Add transaction breakdown</p>
                                    </div>
                                </button>
                            </StaggerItem>
                        </div>
                    </StaggerContainer>
                </>
            )}



            {/* Mobile Floating Action Button (FAB) */}
            <button
                onClick={() => setShowAddTransaction(true)}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-2xl flex items-center justify-center md:hidden hover:scale-110 active:scale-95 transition-all"
                aria-label="Add Transaction"
            >
                <Plus className="w-8 h-8" />
            </button>

            <AddTransactionModal
                isOpen={showAddTransaction}
                onClose={() => setShowAddTransaction(false)}
                accounts={accounts}
                categories={financeCategories}
            />

        </div>
    );
}
