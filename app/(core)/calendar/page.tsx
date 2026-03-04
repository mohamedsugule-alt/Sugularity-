import { getDayAgenda, getWeeklyAgenda } from '@/actions/calendar';
import { getPillars } from '@/actions/core';
import { getSettings } from '@/actions/settings';
import { CalendarClient } from '@/components/calendar/CalendarClient';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Calendar } from 'lucide-react';

export default async function CalendarPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const params = await searchParams;
    const view = (typeof params?.view === 'string' ? params.view : 'day') as 'day' | 'week';
    const dateStr = typeof params?.date === 'string' ? params.date : undefined;
    const date = dateStr ? new Date(dateStr) : new Date();

    // Calculate Week Start (Monday) for fetching scope
    // This ensures Server data matches Client grid (Mon-Sun)
    const day = date.getDay(); // 0 (Sun) - 6 (Sat)
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const weekStart = new Date(date);
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);

    const [dayAgenda, weeklyAgendaData, settings, pillars] = await Promise.all([
        getDayAgenda(date),
        view === 'week' ? getWeeklyAgenda(weekStart) : Promise.resolve(null),
        getSettings(),
        getPillars(),
    ]);

    const serializedDayAgenda = {
        // busyBlocks: [], (Removed)
        taskBlocks: dayAgenda.taskBlocks.map(t => ({
            id: t.id,
            title: t.title,
            startTime: t.calendarBlockStart?.toISOString(),
            endTime: t.calendarBlockEnd?.toISOString(),
            pillarColor: (t as any).pillar?.colorHex || (t as any).area?.colorHex,
            projectTitle: t.project?.title,
            calendarLinkBroken: t.calendarLinkBroken,
        })),
        unscheduledTasks: dayAgenda.unscheduledTasks.map(t => ({
            id: t.id,
            title: t.title,
            estimateMinutes: t.estimateMinutes,
            pillarColor: (t as any).pillar?.colorHex || (t as any).area?.colorHex,
        })),
        backlogTasks: dayAgenda.backlogTasks.map(t => ({
            id: t.id,
            title: t.title,
            estimateMinutes: t.estimateMinutes,
            pillarColor: (t as any).pillar?.colorHex || (t as any).area?.colorHex,
        })),
        milestones: dayAgenda.milestones.map(m => ({
            id: m.id,
            title: m.title,
            targetDate: m.targetDate ? m.targetDate.toISOString() : new Date().toISOString(),
            projectTitle: m.project?.title,
        })),
        rituals: (dayAgenda as any).rituals || (dayAgenda as any).streams || [],
    };

    const serializedWeeklyAgenda = weeklyAgendaData ? {
        // busyBlocks: [], (Removed)
        taskBlocks: weeklyAgendaData.taskBlocks.map(t => ({
            id: t.id,
            title: t.title,
            startTime: t.calendarBlockStart?.toISOString(),
            endTime: t.calendarBlockEnd?.toISOString(),
            pillarColor: (t as any).pillar?.colorHex || (t as any).area?.colorHex,
            projectTitle: t.project?.title,
            calendarLinkBroken: t.calendarLinkBroken,
        })),
        unscheduledTasks: weeklyAgendaData.unscheduledTasks.map(t => ({
            id: t.id,
            title: t.title,
            estimateMinutes: t.estimateMinutes,
            pillarColor: (t as any).pillar?.colorHex || (t as any).area?.colorHex,
            scheduledDate: t.scheduledDate ? t.scheduledDate.toISOString() : undefined,
        })),
        backlogTasks: weeklyAgendaData.backlogTasks.map(t => ({
            id: t.id,
            title: t.title,
            estimateMinutes: t.estimateMinutes,
            pillarColor: (t as any).pillar?.colorHex || (t as any).area?.colorHex,
        })),
        milestones: weeklyAgendaData.milestones.map(m => ({
            id: m.id,
            title: m.title,
            targetDate: m.targetDate ? m.targetDate.toISOString() : new Date().toISOString(),
            projectTitle: m.project?.title,
        })),
        rituals: (weeklyAgendaData as any).rituals || (weeklyAgendaData as any).streams || [],
    } : undefined;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <Calendar className="w-8 h-8 text-primary" />
                    Calendar
                </h1>
                <p className="text-muted-foreground mt-1">
                    Time-block tasks and view your schedule.
                </p>
            </div>

            <ErrorBoundary name="Calendar Service">
                <CalendarClient
                    initialDate={date.toISOString()}
                    agenda={serializedDayAgenda}
                    weeklyAgenda={serializedWeeklyAgenda}
                    calendarMode={settings?.calendarMode || 'off'}
                    currentView={view}
                    pillars={pillars}
                />
            </ErrorBoundary>
        </div>
    );
}
