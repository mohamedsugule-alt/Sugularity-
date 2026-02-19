import { getLatestBriefing, getBriefings, generateMondayBriefing } from '@/actions/calendar';
import { BriefingsClient } from '@/components/briefings/BriefingsClient';
import { FileText } from 'lucide-react';

export default async function BriefingsPage() {
    const [latest, history] = await Promise.all([
        getLatestBriefing('monday'),
        getBriefings(10),
    ]);

    // Check if Monday and no briefing today
    const today = new Date();
    const isMonday = today.getDay() === 1;
    const hasToday = latest ? new Date(latest.date).toDateString() === today.toDateString() : false;

    let briefingContent = latest?.content || null;
    let briefingDate = latest?.date.toISOString() || null;

    const serializedHistory = history.map(b => ({
        id: b.id,
        type: b.type,
        date: b.date.toISOString(),
        weeklyWins: b.weeklyWins,
        projectsAtRisk: b.projectsAtRisk,
        ritualsBehind: (b as any).ritualsBehind ?? (b as any).streamsBehind ?? 0,
    }));

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <FileText className="w-8 h-8 text-primary" />
                    Briefings
                </h1>
                <p className="text-muted-foreground mt-1">
                    Executive summaries to start your week with clarity.
                </p>
            </div>

            <BriefingsClient
                currentContent={briefingContent}
                currentDate={briefingDate}
                history={serializedHistory}
                isMonday={isMonday}
                hasTodayBriefing={hasToday}
            />
        </div>
    );
}
