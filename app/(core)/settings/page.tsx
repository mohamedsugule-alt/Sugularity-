import { getPillars } from '@/actions/core';
import { getSettings } from '@/actions/settings';
import { SettingsClient } from '@/components/settings/SettingsClient';
import { Cog } from 'lucide-react';

export default async function SettingsPage() {
    const [settings, pillars] = await Promise.all([
        getSettings(),
        getPillars(),
    ]);

    // Serialize settings to avoid hydration mismatch (Date objects)
    const serializedSettings = {
        id: settings.id,
        dailyCapacityHours: settings.dailyCapacityHours,
        defaultEstimateMin: settings.defaultEstimateMin,
        requireEstimate: settings.requireEstimate,
        workDayStart: settings.workDayStart,
        workDayEnd: settings.workDayEnd,
        coldTaskDays: settings.coldTaskDays,
        staleProjectDays: settings.staleProjectDays,
        backlogActiveLimit: settings.backlogActiveLimit,
        backlogColdLimit: settings.backlogColdLimit,
        backlogProjectLimit: settings.backlogProjectLimit,
        showColdInToday: settings.showColdInToday,
        calendarMode: settings.calendarMode ?? 'off',
    };

    // Serialize pillars to avoid hydration mismatch
    const serializedPillars = pillars.map((pillar: any) => ({
        id: pillar.id,
        name: pillar.name,
        colorHex: pillar.colorHex,
        isActive: pillar.isActive,
    }));

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <Cog className="w-8 h-8 text-primary" />
                    Settings
                </h1>
                <p className="text-muted-foreground mt-1">
                    Configure your Sugularity experience.
                </p>
            </div>

            <SettingsClient initialSettings={serializedSettings} initialPillars={serializedPillars} />
        </div>
    );
}
