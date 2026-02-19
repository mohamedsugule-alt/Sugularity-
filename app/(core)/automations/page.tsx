import { getAutomationLog } from '@/actions/automations';
import { getSettings } from '@/actions/settings';
import { AutomationsClient } from '@/components/automations/AutomationsClient';
import { Zap } from 'lucide-react';

export default async function AutomationsPage() {
    const [settings, logs] = await Promise.all([
        getSettings(),
        getAutomationLog(100),
    ]);

    const serializedSettings = settings ? JSON.parse(JSON.stringify(settings)) : null;
    const serializedLogs = logs.map(l => ({
        id: l.id,
        automationName: l.automationName,
        triggerReason: l.triggerReason,
        suggestion: l.suggestion,
        userAction: l.userAction,
        changesApplied: l.changesApplied,
        createdAt: l.createdAt.toISOString(),
    }));

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <Zap className="w-8 h-8 text-primary" />
                    Automations
                </h1>
                <p className="text-muted-foreground mt-1">
                    Smart prompts and audit log. Every change requires your approval.
                </p>
            </div>

            <AutomationsClient settings={serializedSettings} logs={serializedLogs} />
        </div>
    );
}
