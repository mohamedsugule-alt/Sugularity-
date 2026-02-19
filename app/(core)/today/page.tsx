import { getTasks, getProjects, getRituals, getPillars } from '@/actions/core';
import { getDailyPlan } from '@/actions/daily-plan';
import { getSettings } from '@/actions/settings';
import { getDayAgenda } from '@/actions/calendar';
import { getTriageRequiredTasks, getColdTasks } from '@/actions/humanNature';
import { TodayClient } from '@/components/today/TodayClient';
import { CalendarDays, Sun, Moon, CloudSun } from 'lucide-react';

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good morning', Icon: Sun };
    if (hour < 17) return { text: 'Good afternoon', Icon: CloudSun };
    return { text: 'Good evening', Icon: Moon };
}

export default async function TodayPage() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [plan, tasks, agenda, settings, triageTasks, coldTasks, projects, rituals, pillars] = await Promise.all([
        getDailyPlan(today),
        getTasks({
            status: ['active', 'scheduled', 'blocked'],
            maxScheduledDate: today
        }),
        getDayAgenda(today),
        getSettings(),
        getTriageRequiredTasks(),
        getColdTasks(20),
        getProjects(),
        getRituals(),
        getPillars(),
    ]);

    // Format date
    const dateStr = today.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const greeting = getGreeting();
    const committedIds = plan.committedTaskIds ? JSON.parse(plan.committedTaskIds) : [];
    const committedCount = committedIds.length;

    return (
        <div className="space-y-6">
            {/* Welcoming header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 via-violet-500/5 to-transparent border border-blue-500/20 p-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-blue-500/20">
                        <greeting.Icon className="w-8 h-8 text-blue-500" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                            {greeting.text}!
                        </h1>
                        <p className="text-muted-foreground mt-1">{dateStr}</p>
                        {committedCount > 0 ? (
                            <p className="text-sm mt-2">
                                You have <strong className="text-primary">{committedCount} task{committedCount !== 1 ? 's' : ''}</strong> committed for today.
                            </p>
                        ) : (
                            <p className="text-sm mt-2 text-muted-foreground">
                                No tasks committed yet. Pick from Candidates below →
                            </p>
                        )}
                    </div>
                </div>
                <CalendarDays className="absolute right-4 bottom-4 w-24 h-24 text-blue-500/10" />
            </div>

            <TodayClient
                initialPlan={plan as any}
                initialTasks={tasks}
                agenda={{
                    ...agenda,
                    outcomes: []
                } as any}
                triageRequiredTasks={triageTasks}
                coldTasks={coldTasks}
                projects={projects}
                rituals={rituals}
                pillars={pillars}
                settings={{
                    dailyCapacityHours: settings.dailyCapacityHours,
                    defaultEstimateMin: settings.defaultEstimateMin,
                    showColdInToday: settings.showColdInToday,
                }}
                referenceDate={today.toISOString()}
            />
        </div>
    );
}
