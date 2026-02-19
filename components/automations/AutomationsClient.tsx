'use client';

import { useState } from 'react';
import { updateAutomationSettings } from '@/actions/automations';
import {
    Zap,
    Bell,
    Clock,
    Shield,
    CheckCircle2,
    XCircle,
    Pause,
    Power,
    History,
} from 'lucide-react';
import { toast } from 'sonner';

type Settings = {
    automationsEnabled: boolean;
    quietHoursStart: string;
    quietHoursEnd: string;
    maxPromptsPerDay: number;
    powerUserMode: boolean;
    autoWeeklyReview: boolean;
    autoDailyReview: boolean;
    autoInboxThreshold: boolean;
    autoColdCleanup: boolean;
    autoRolloverTriage: boolean;
    autoBankruptcy: boolean;
    autoCapacityWarning: boolean;
    autoMeetingHeavy: boolean;
    autoStalledProject: boolean;
    autoStreamNudge: boolean;
    autoScheduleOutcomes: boolean;
    autoBrokenLink: boolean;
};

type LogEntry = {
    id: string;
    automationName: string;
    triggerReason: string;
    suggestion: string;
    userAction: string;
    changesApplied: string | null;
    createdAt: string;
};

const AUTOMATION_LABELS: Record<string, { name: string; description: string }> = {
    autoWeeklyReview: { name: 'Weekly Review Reminder', description: 'Prompt on Mondays if no review completed' },
    autoDailyReview: { name: 'Daily Review Reminder', description: 'Prompt for daily planning' },
    autoInboxThreshold: { name: 'Inbox Threshold', description: 'Alert when inbox exceeds 10 items' },
    autoColdCleanup: { name: 'Cold Tasks Cleanup', description: 'Weekly prompt for stale task cleanup' },
    autoRolloverTriage: { name: 'Rollover Triage', description: 'Force decisions on frequently rolled tasks' },
    autoBankruptcy: { name: 'Backlog Bankruptcy', description: 'Suggest reset when limits exceeded' },
    autoCapacityWarning: { name: 'Capacity Warning', description: 'Alert when overcommitting' },
    autoMeetingHeavy: { name: 'Meeting-Heavy Day', description: 'Suggest focus blocks on busy days' },
    autoStalledProject: { name: 'Stalled Projects', description: 'Alert on projects with no activity' },
    autoStreamNudge: { name: 'Ritual Nudge', description: 'Mid-cycle reminders for behind rituals' },
    autoScheduleOutcomes: { name: 'Schedule Outcomes', description: 'Prompt to time-block top priorities' },
    autoBrokenLink: { name: 'Broken Calendar Links', description: 'Alert when calendar events are missing' },
};

export function AutomationsClient({
    settings,
    logs,
}: {
    settings: Settings | null;
    logs: LogEntry[];
}) {
    const [config, setConfig] = useState(settings || {
        automationsEnabled: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
        maxPromptsPerDay: 5,
        powerUserMode: false,
        autoWeeklyReview: true,
        autoDailyReview: false,
        autoInboxThreshold: true,
        autoColdCleanup: true,
        autoRolloverTriage: true,
        autoBankruptcy: true,
        autoCapacityWarning: true,
        autoMeetingHeavy: true,
        autoStalledProject: true,
        autoStreamNudge: true,
        autoScheduleOutcomes: true,
        autoBrokenLink: true,
    });
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'settings' | 'log'>('settings');

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateAutomationSettings(config);
            toast.success('Automation settings saved');
        } catch {
            toast.error('Failed to save settings');
        } finally {
            setIsSaving(false);
        }
    };

    const ActionBadge = ({ action }: { action: string }) => {
        const colors = {
            accepted: 'bg-emerald-500/10 text-emerald-500',
            declined: 'bg-red-500/10 text-red-400',
            snoozed: 'bg-yellow-500/10 text-yellow-500',
        };
        const icons = {
            accepted: CheckCircle2,
            declined: XCircle,
            snoozed: Pause,
        };
        const Icon = icons[action as keyof typeof icons] || Pause;
        return (
            <span className={`px-2 py-0.5 rounded text-xs flex items-center gap-1 ${colors[action as keyof typeof colors] || 'bg-muted'}`}>
                <Icon className="w-3 h-3" />
                {action}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            {/* Tabs */}
            <div className="flex gap-2">
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${activeTab === 'settings'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                        }`}
                >
                    <Zap className="w-4 h-4" />
                    Settings
                </button>
                <button
                    onClick={() => setActiveTab('log')}
                    className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${activeTab === 'log'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                        }`}
                >
                    <History className="w-4 h-4" />
                    Audit Log ({logs.length})
                </button>
            </div>

            {/* Settings Tab */}
            {activeTab === 'settings' && (
                <div className="space-y-6">
                    {/* Master Toggle */}
                    <div className="glass-panel rounded-xl p-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Power className={`w-6 h-6 ${config.automationsEnabled ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                                <div>
                                    <h3 className="font-semibold">Automations Enabled</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Master switch for all automation prompts
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setConfig({ ...config, automationsEnabled: !config.automationsEnabled })}
                                className={`w-12 h-6 rounded-full transition-colors ${config.automationsEnabled ? 'bg-primary' : 'bg-muted'
                                    }`}
                            >
                                <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${config.automationsEnabled ? 'translate-x-6' : 'translate-x-0.5'
                                    }`} />
                            </button>
                        </div>
                    </div>

                    {/* Quiet Hours */}
                    <div className="glass-panel rounded-xl p-5">
                        <h3 className="font-semibold flex items-center gap-2 mb-4">
                            <Bell className="w-5 h-5" />
                            Quiet Hours
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            No prompts will appear during these hours.
                        </p>
                        <div className="flex items-center gap-4">
                            <div>
                                <label className="text-sm text-muted-foreground block mb-1">Start</label>
                                <input
                                    type="time"
                                    value={config.quietHoursStart}
                                    onChange={(e) => setConfig({ ...config, quietHoursStart: e.target.value })}
                                    className="bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                            <span className="text-muted-foreground mt-5">to</span>
                            <div>
                                <label className="text-sm text-muted-foreground block mb-1">End</label>
                                <input
                                    type="time"
                                    value={config.quietHoursEnd}
                                    onChange={(e) => setConfig({ ...config, quietHoursEnd: e.target.value })}
                                    className="bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Limits */}
                    <div className="glass-panel rounded-xl p-5">
                        <h3 className="font-semibold flex items-center gap-2 mb-4">
                            <Shield className="w-5 h-5" />
                            Rate Limits
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium block mb-1">Max Prompts Per Day</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={20}
                                    value={config.maxPromptsPerDay}
                                    onChange={(e) => setConfig({ ...config, maxPromptsPerDay: parseInt(e.target.value) || 5 })}
                                    className="w-24 bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Max automation prompts you'll see per day.
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="powerUser"
                                    checked={config.powerUserMode}
                                    onChange={(e) => setConfig({ ...config, powerUserMode: e.target.checked })}
                                    className="w-4 h-4 rounded"
                                />
                                <label htmlFor="powerUser" className="text-sm">
                                    Power User Mode (allows up to 15 prompts/day)
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Individual Automations */}
                    <div className="glass-panel rounded-xl p-5">
                        <h3 className="font-semibold flex items-center gap-2 mb-4">
                            <Clock className="w-5 h-5" />
                            Automation Toggles
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(AUTOMATION_LABELS).map(([key, { name, description }]) => (
                                <div key={key} className="flex items-start justify-between p-3 bg-muted/30 rounded-lg">
                                    <div>
                                        <p className="font-medium text-sm">{name}</p>
                                        <p className="text-xs text-muted-foreground">{description}</p>
                                    </div>
                                    <button
                                        onClick={() => setConfig({ ...config, [key]: !(config as any)[key] })}
                                        className={`w-10 h-5 rounded-full flex-shrink-0 ml-3 transition-colors ${(config as any)[key] ? 'bg-primary' : 'bg-muted'
                                            }`}
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${(config as any)[key] ? 'translate-x-5' : 'translate-x-0.5'
                                            }`} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
                    >
                        {isSaving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            )}

            {/* Audit Log Tab */}
            {activeTab === 'log' && (
                <div className="glass-panel rounded-xl p-5">
                    <h3 className="font-semibold mb-4">Automation Audit Log</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Every automation prompt and your response is logged here.
                    </p>

                    {logs.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                            No automation activity yet.
                        </p>
                    ) : (
                        <div className="space-y-3 max-h-[500px] overflow-y-auto">
                            {logs.map((log) => (
                                <div key={log.id} className="p-3 bg-muted/30 rounded-lg">
                                    <div className="flex items-start justify-between mb-2">
                                        <span className="font-medium text-sm">
                                            {AUTOMATION_LABELS[`auto${log.automationName.charAt(0).toUpperCase() + log.automationName.slice(1)}`]?.name || log.automationName}
                                        </span>
                                        <ActionBadge action={log.userAction} />
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-1">
                                        Trigger: {log.triggerReason}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {new Date(log.createdAt).toLocaleString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
