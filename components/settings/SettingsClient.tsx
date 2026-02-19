'use client';

import { useState } from 'react';
import { createPillar, updatePillar, deletePillar, resetData } from '@/actions/core';
import { updateSettings } from '@/actions/settings';
import { testAIConnection } from '@/actions/ai';
import { Plus, X, Save, Snowflake, Clock, FolderKanban, Trash2, Pencil, AlertTriangle, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useOnboarding } from '@/components/providers/OnboardingProvider';
import { useRouter } from 'next/navigation';

type Settings = {
    id: string;
    dailyCapacityHours: number;
    defaultEstimateMin: number;
    requireEstimate: boolean;
    workDayStart: string;
    workDayEnd: string;
    coldTaskDays: number;
    staleProjectDays: number;
    backlogActiveLimit: number;
    backlogColdLimit: number;
    backlogProjectLimit: number;
    showColdInToday: boolean;
    calendarMode: string;
    aiProvider?: string;
    aiModel?: string;
    aiEndpoint?: string;
    aiApiKey?: string;
    aiContextWindow?: number;
    aiTemperature?: number;
};

type Pillar = {
    id: string;
    name: string;
    colorHex: string;
    isActive: boolean;
};

export function SettingsClient({
    initialSettings,
    initialPillars,
}: {
    initialSettings: Settings;
    initialPillars: Pillar[];
}) {
    const [settings, setSettings] = useState(initialSettings);
    const [pillars, setPillars] = useState(initialPillars);
    const [isSaving, setIsSaving] = useState(false);

    // Pillar State
    const [showAddPillar, setShowAddPillar] = useState(false);
    const [showEditPillar, setShowEditPillar] = useState<Pillar | null>(null);
    const [pillarForm, setPillarForm] = useState({ name: '', colorHex: '#8B5CF6' });

    // Reset State
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [resetInput, setResetInput] = useState('');
    const [isResetting, setIsResetting] = useState(false);
    const [resetType, setResetType] = useState<'soft' | 'hard'>('soft');

    const { completeStep } = useOnboarding();
    const router = useRouter();

    const handleSaveSettings = async () => {
        setIsSaving(true);
        try {
            await updateSettings({
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
                calendarMode: settings.calendarMode,
                aiProvider: settings.aiProvider || 'local-api',
                aiModel: settings.aiModel || 'llama3',
                aiEndpoint: settings.aiEndpoint || 'http://localhost:11434/v1',
                aiApiKey: settings.aiApiKey || '',
                aiContextWindow: settings.aiContextWindow || 4096,
                aiTemperature: settings.aiTemperature || 0.7,
            });
            toast.success('Settings saved');
        } catch {
            toast.error('Failed to save');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreatePillar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pillarForm.name.trim()) return;

        try {
            const pillar = await createPillar({
                name: pillarForm.name.trim(),
                colorHex: pillarForm.colorHex,
            });
            setPillars([...pillars, pillar]);
            setPillarForm({ name: '', colorHex: '#8B5CF6' });
            setShowAddPillar(false);
            toast.success('Pillar created');
            completeStep(1);
        } catch {
            toast.error('Failed to create pillar');
        }
    };

    const handleUpdatePillar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!showEditPillar || !pillarForm.name.trim()) return;

        try {
            const updated = await updatePillar(showEditPillar.id, {
                name: pillarForm.name.trim(),
                colorHex: pillarForm.colorHex,
            });
            setPillars(pillars.map(p => p.id === updated.id ? updated : p));
            setShowEditPillar(null);
            toast.success('Pillar updated');
        } catch {
            toast.error('Failed to update pillar');
        }
    };

    const handleDeletePillar = async (id: string) => {
        if (!confirm('Delete this pillar? This will fail if there are any linked projects or tasks.')) return;

        try {
            await deletePillar(id);
            setPillars(pillars.filter(p => p.id !== id));
            toast.success('Pillar deleted');
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete pillar');
        }
    };

    const handleReset = async () => {
        if (resetInput !== 'DELETE') return;
        setIsResetting(true);
        try {
            await resetData(resetType);
            toast.success('System reset complete');
            router.push('/');
            router.refresh();
        } catch (e) {
            toast.error('Reset failed');
            setIsResetting(false);
        }
    };

    const colorOptions = [
        '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B',
        '#EF4444', '#EC4899', '#06B6D4', '#84CC16',
    ];

    const openEditPillar = (pillar: Pillar) => {
        setPillarForm({ name: pillar.name, colorHex: pillar.colorHex });
        setShowEditPillar(pillar);
    };

    return (
        <div className="space-y-8 max-w-2xl">
            {/* Calendar Settings */}
            <div className="glass-panel rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-blue-500" />
                    Calendar & Schedule
                </h2>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium block mb-1">Calendar Mode</label>
                        <select
                            value={settings.calendarMode}
                            onChange={(e) => setSettings({ ...settings, calendarMode: e.target.value })}
                            suppressHydrationWarning
                            className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                        >
                            <option value="off">Off (Task List Only)</option>
                            <option value="freeBusy">Free/Busy (View Only)</option>
                            <option value="timeBlocking">Time Blocking (Plan Tasks)</option>
                        </select>
                        <p className="text-xs text-muted-foreground mt-1">
                            Choose how deeply you want to integrate calendar scheduling.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium block mb-1">Work Start</label>
                            <input
                                type="time"
                                value={settings.workDayStart}
                                onChange={(e) => setSettings({ ...settings, workDayStart: e.target.value })}
                                suppressHydrationWarning
                                className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium block mb-1">Work End</label>
                            <input
                                type="time"
                                value={settings.workDayEnd}
                                onChange={(e) => setSettings({ ...settings, workDayEnd: e.target.value })}
                                suppressHydrationWarning
                                className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Capacity Settings */}
            <div className="glass-panel rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Capacity
                </h2>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium block mb-1">
                            Daily Capacity (hours)
                        </label>
                        <input
                            type="number"
                            min={1}
                            max={16}
                            step={0.5}
                            value={settings.dailyCapacityHours}
                            onChange={(e) => setSettings({ ...settings, dailyCapacityHours: parseFloat(e.target.value) || 6 })}
                            suppressHydrationWarning
                            className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium block mb-1">
                            Default Estimate (minutes)
                        </label>
                        <input
                            type="number"
                            min={5}
                            max={240}
                            step={5}
                            value={settings.defaultEstimateMin}
                            onChange={(e) => setSettings({ ...settings, defaultEstimateMin: parseInt(e.target.value) || 30 })}
                            suppressHydrationWarning
                            className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="requireEstimate"
                            checked={settings.requireEstimate}
                            onChange={(e) => setSettings({ ...settings, requireEstimate: e.target.checked })}
                            suppressHydrationWarning
                            className="w-4 h-4 rounded"
                        />
                        <label htmlFor="requireEstimate" className="text-sm font-medium">
                            Require estimate before committing tasks
                        </label>
                    </div>
                </div>
            </div>

            {/* Cold Task Settings */}
            <div className="glass-panel rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Snowflake className="w-5 h-5 text-cyan-400" />
                    Cold Task Detection
                </h2>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium block mb-1">
                            Cold threshold (days)
                        </label>
                        <input
                            type="number"
                            min={7}
                            max={60}
                            value={settings.coldTaskDays}
                            onChange={(e) => setSettings({ ...settings, coldTaskDays: parseInt(e.target.value) || 14 })}
                            suppressHydrationWarning
                            className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="showColdInToday"
                            checked={settings.showColdInToday}
                            onChange={(e) => setSettings({ ...settings, showColdInToday: e.target.checked })}
                            suppressHydrationWarning
                            className="w-4 h-4 rounded"
                        />
                        <label htmlFor="showColdInToday" className="text-sm font-medium">
                            Show cold tasks in Today by default
                        </label>
                    </div>
                </div>
            </div>

            {/* Project Health Settings */}
            <div className="glass-panel rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FolderKanban className="w-5 h-5" />
                    Project Health
                </h2>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium block mb-1">
                            Stale project threshold (days)
                        </label>
                        <input
                            type="number"
                            min={7}
                            max={90}
                            value={settings.staleProjectDays}
                            onChange={(e) => setSettings({ ...settings, staleProjectDays: parseInt(e.target.value) || 21 })}
                            suppressHydrationWarning
                            className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Backlog Limits */}
            <div className="glass-panel rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">Backlog Overload Thresholds</h2>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="text-sm font-medium block mb-1">Active Limit</label>
                        <input
                            type="number"
                            min={10}
                            max={100}
                            value={settings.backlogActiveLimit}
                            onChange={(e) => setSettings({ ...settings, backlogActiveLimit: parseInt(e.target.value) || 40 })}
                            suppressHydrationWarning
                            className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium block mb-1">Cold Limit</label>
                        <input
                            type="number"
                            min={5}
                            max={50}
                            value={settings.backlogColdLimit}
                            onChange={(e) => setSettings({ ...settings, backlogColdLimit: parseInt(e.target.value) || 15 })}
                            suppressHydrationWarning
                            className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium block mb-1">Project Limit</label>
                        <input
                            type="number"
                            min={3}
                            max={20}
                            value={settings.backlogProjectLimit}
                            onChange={(e) => setSettings({ ...settings, backlogProjectLimit: parseInt(e.target.value) || 7 })}
                            suppressHydrationWarning
                            className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition-colors w-full justify-center"
                suppressHydrationWarning
            >
                <Save className="w-4 h-4" />
                Save Settings
            </button>

            {/* Pillars */}
            <div className="glass-panel rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Life Pillars</h2>
                    <button
                        onClick={() => {
                            setPillarForm({ name: '', colorHex: '#8B5CF6' });
                            setShowAddPillar(true);
                        }}
                        className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors flex items-center gap-1"
                        suppressHydrationWarning
                    >
                        <Plus className="w-4 h-4" />
                        Add Pillar
                    </button>
                </div>

                <div className="space-y-2">
                    {pillars.map((pillar) => (
                        <div
                            key={pillar.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/30 group hover:bg-muted/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-4 h-4 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: pillar.colorHex }}
                                />
                                <span className="font-medium">{pillar.name}</span>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => openEditPillar(pillar)}
                                    className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                                    suppressHydrationWarning
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDeletePillar(pillar.id)}
                                    className="p-1.5 hover:bg-red-500/10 rounded text-muted-foreground hover:text-red-500"
                                    suppressHydrationWarning
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {pillars.length === 0 && (
                        <p className="text-muted-foreground text-sm">No pillars yet.</p>
                    )}
                </div>
            </div>

            {/* Pillar Modals */}
            {(showAddPillar || showEditPillar) && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="glass-panel rounded-xl p-6 max-w-sm w-full">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">
                                {showEditPillar ? 'Edit Pillar' : 'Add Life Pillar'}
                            </h3>
                            <button
                                onClick={() => { setShowAddPillar(false); setShowEditPillar(null); }}
                                className="text-muted-foreground hover:text-foreground"
                                suppressHydrationWarning
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={showEditPillar ? handleUpdatePillar : handleCreatePillar} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium block mb-1">Name</label>
                                <input
                                    type="text"
                                    value={pillarForm.name}
                                    onChange={(e) => setPillarForm({ ...pillarForm, name: e.target.value })}
                                    placeholder="Pillar Name"
                                    suppressHydrationWarning
                                    className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium block mb-2">Color</label>
                                <div className="flex gap-2 flex-wrap">
                                    {colorOptions.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setPillarForm({ ...pillarForm, colorHex: color })}
                                            className={`w-8 h-8 rounded-full transition-transform ${pillarForm.colorHex === color ? 'ring-2 ring-white ring-offset-2 ring-offset-background scale-110' : ''}`}
                                            style={{ backgroundColor: color }}
                                            suppressHydrationWarning
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setShowAddPillar(false); setShowEditPillar(null); }}
                                    className="flex-1 py-2 bg-muted/50 hover:bg-muted rounded-lg font-medium transition-colors"
                                    suppressHydrationWarning
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!pillarForm.name.trim()}
                                    className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                                    suppressHydrationWarning
                                >
                                    {showEditPillar ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* AI Intelligence Settings (Jarvis) */}
            <div className="glass-panel rounded-xl p-6 border border-purple-500/20">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <div className="p-1 bg-purple-500/10 rounded-md">
                        <Snowflake className="w-5 h-5 text-purple-500" />
                    </div>
                    Intelligence (Taliye)
                </h2>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium block mb-1">AI Provider</label>
                        <select
                            value={settings.aiProvider || 'local-api'}
                            onChange={(e) => {
                                const newProvider = e.target.value;
                                setSettings({
                                    ...settings,
                                    aiProvider: newProvider,
                                    aiModel: newProvider === 'gemini' ? 'gemini-1.5-flash' : 'llama3',
                                    aiEndpoint: newProvider === 'gemini'
                                        ? 'https://generativelanguage.googleapis.com/v1beta/openai'
                                        : 'http://localhost:11434/v1'
                                });
                            }}
                            suppressHydrationWarning
                            className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                        >
                            <option value="local-api">Local (Ollama)</option>
                            <option value="gemini">Google Gemini</option>
                            <option value="web-llm" disabled>Browser Native (WebLLM) - Coming Soon</option>
                        </select>
                        <p className="text-xs text-muted-foreground mt-1">
                            Run intelligence locally (Ollama) or use Google Gemini / Cloud Providers.
                        </p>
                    </div>

                    {(settings.aiProvider === 'local-api' || settings.aiProvider === 'gemini') && (
                        <>
                            {settings.aiProvider === 'local-api' && (
                                <div>
                                    <label className="text-sm font-medium block mb-1">API Endpoint</label>
                                    <input
                                        type="text"
                                        value={settings.aiEndpoint || 'http://localhost:11434/v1'}
                                        onChange={(e) => setSettings({ ...settings, aiEndpoint: e.target.value })}
                                        placeholder="http://localhost:11434/v1"
                                        suppressHydrationWarning
                                        className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm font-mono"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="text-sm font-medium block mb-1">
                                    {settings.aiProvider === 'gemini' ? 'Gemini API Key' : 'API Key (Optional for Local)'}
                                </label>
                                <input
                                    type="password"
                                    value={settings.aiApiKey || ''}
                                    onChange={(e) => setSettings({ ...settings, aiApiKey: e.target.value })}
                                    placeholder={settings.aiProvider === 'gemini' ? 'AIzaGw...' : 'sk-...'}
                                    suppressHydrationWarning
                                    className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm font-mono"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    {settings.aiProvider === 'gemini'
                                        ? 'Required. Get one at aistudio.google.com'
                                        : 'Leave empty for local Ollama.'}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium block mb-1">Model Name</label>
                                <input
                                    type="text"
                                    value={settings.aiModel || (settings.aiProvider === 'gemini' ? 'gemini-1.5-flash' : 'llama3')}
                                    onChange={(e) => setSettings({ ...settings, aiModel: e.target.value })}
                                    placeholder={settings.aiProvider === 'gemini' ? 'gemini-1.5-flash' : 'llama3'}
                                    suppressHydrationWarning
                                    className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                        </>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium block mb-1">Temperature ({settings.aiTemperature})</label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={settings.aiTemperature ?? 0.7}
                                onChange={(e) => setSettings({ ...settings, aiTemperature: parseFloat(e.target.value) })}
                                suppressHydrationWarning
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium block mb-1">Context Window</label>
                            <select
                                value={settings.aiContextWindow || 4096}
                                onChange={(e) => setSettings({ ...settings, aiContextWindow: parseInt(e.target.value) })}
                                suppressHydrationWarning
                                className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                            >
                                <option value={2048}>2k Tokens</option>
                                <option value={4096}>4k Tokens</option>
                                <option value={8192}>8k Tokens</option>
                                <option value={16384}>16k Tokens</option>
                                <option value={32768}>32k Tokens</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="button"
                            onClick={async () => {
                                const toastId = toast.loading('Testing connection...');
                                try {
                                    const result = await testAIConnection({
                                        provider: settings.aiProvider || 'local-api',
                                        model: settings.aiModel || 'llama3',
                                        endpoint: settings.aiEndpoint || 'http://localhost:11434/v1',
                                        apiKey: settings.aiApiKey || ''
                                    });

                                    if (result.success) {
                                        toast.success(result.message, { id: toastId });
                                    } else {
                                        toast.error(result.message, { id: toastId });
                                    }
                                } catch (e) {
                                    toast.error('Connection failed', { id: toastId });
                                }
                            }}
                            className="w-full py-2 bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 rounded-lg text-sm font-medium transition-colors border border-purple-500/20"
                        >
                            Test Connection
                        </button>
                    </div>
                </div>
            </div>

            {/* Data Management (Import/Export) */}
            <div className="glass-panel rounded-xl p-6 border border-blue-500/20">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FolderKanban className="w-5 h-5 text-blue-500" />
                    Data Management
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                        <h3 className="font-medium mb-2">Import System Template</h3>
                        <p className="text-xs text-muted-foreground mb-4">
                            Upload an Excel file (.xlsx) to bulk create Pillars, Goals, Projects, and Rituals.
                        </p>
                        <div className="relative">
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;

                                    if (confirm('Importing a template will add new data to your system. Continue?')) {
                                        const toastId = toast.loading('Reading Excel file...');
                                        try {
                                            const { read, utils } = await import('xlsx');
                                            const arrayBuffer = await file.arrayBuffer();
                                            const workbook = read(arrayBuffer);

                                            // Helper to get sheet data
                                            const getSheetData = (sheetName: string) => {
                                                const sheet = workbook.Sheets[sheetName];
                                                return sheet ? utils.sheet_to_json(sheet) : [];
                                            };

                                            const settingsRows = getSheetData('Settings') as any[];
                                            const pillarRows = getSheetData('Pillars') as any[];
                                            const goalRows = getSheetData('Goals') as any[];
                                            const projectRows = getSheetData('Projects') as any[];
                                            const ritualRows = getSheetData('Rituals') as any[];
                                            const milestoneRows = getSheetData('Milestones') as any[];

                                            // Construct ImportTemplate object
                                            const importData: any = {
                                                settings: {},
                                                pillars: []
                                            };

                                            // 1. Settings
                                            settingsRows.forEach(row => {
                                                if (row.Key && row.Value !== undefined) {
                                                    // Handle numeric values
                                                    let val = row.Value;
                                                    if (['dailyCapacityHours', 'defaultEstimateMin', 'coldTaskDays', 'staleProjectDays', 'backlogActiveLimit', 'backlogColdLimit', 'backlogProjectLimit', 'aiContextWindow', 'aiTemperature'].includes(row.Key)) {
                                                        val = Number(val);
                                                    }
                                                    // Handle booleans
                                                    if (['requireEstimate', 'showColdInToday'].includes(row.Key)) {
                                                        val = String(val).toLowerCase() === 'true';
                                                    }
                                                    importData.settings[row.Key] = val;
                                                }
                                            });

                                            // 2. Pillars
                                            const pillarMap = new Map<string, any>();
                                            pillarRows.forEach(row => {
                                                if (row.Name) {
                                                    const pillar = {
                                                        name: row.Name,
                                                        colorHex: row.Color || '#8B5CF6',
                                                        icon: row.Icon,
                                                        goals: [],
                                                        projects: [], // Loose projects
                                                        rituals: []   // Loose rituals
                                                    };
                                                    pillarMap.set(row.Name, pillar);
                                                    importData.pillars.push(pillar);
                                                }
                                            });

                                            // 3. Goals
                                            const goalMap = new Map<string, any>();
                                            goalRows.forEach(row => {
                                                if (row['Goal Title'] && row.Pillar) {
                                                    const pillar = pillarMap.get(row.Pillar);
                                                    if (pillar) {
                                                        const goal = {
                                                            title: row['Goal Title'],
                                                            description: row.Description,
                                                            status: row.Status || 'active',
                                                            projects: [],
                                                            rituals: []
                                                        };
                                                        pillar.goals.push(goal);
                                                        goalMap.set(row['Goal Title'], goal);
                                                    }
                                                }
                                            });

                                            // 4. Projects
                                            const projectMap = new Map<string, any>();
                                            projectRows.forEach(row => {
                                                if (row['Project Title']) {
                                                    const project = {
                                                        title: row['Project Title'],
                                                        description: row.Description,
                                                        status: row.Status || 'active',
                                                        milestones: []
                                                    };
                                                    projectMap.set(row['Project Title'], project);

                                                    // Link to Goal OR Pillar
                                                    if (row['Goal Title']) {
                                                        const goal = goalMap.get(row['Goal Title']);
                                                        if (goal) {
                                                            goal.projects.push(project);
                                                        } else {
                                                            // Fallback to pillar if goal not found but intended
                                                            const pillar = pillarMap.get(row.Pillar);
                                                            if (pillar) pillar.projects.push(project);
                                                        }
                                                    } else if (row.Pillar) {
                                                        const pillar = pillarMap.get(row.Pillar);
                                                        if (pillar) pillar.projects.push(project);
                                                    }
                                                }
                                            });

                                            // 5. Rituals
                                            ritualRows.forEach(row => {
                                                if (row['Ritual Title']) {
                                                    const ritual = {
                                                        title: row['Ritual Title'],
                                                        cadenceType: row.Cadence || 'daily', // Default to daily
                                                        targetPerCycle: row.Target || 1
                                                    };

                                                    if (row['Goal Title']) {
                                                        const goal = goalMap.get(row['Goal Title']);
                                                        if (goal) goal.rituals.push(ritual);
                                                    } else if (row.Pillar) {
                                                        const pillar = pillarMap.get(row.Pillar);
                                                        if (pillar) pillar.rituals.push(ritual);
                                                    }
                                                }
                                            });

                                            // 6. Milestones
                                            milestoneRows.forEach(row => {
                                                if (row['Milestone Title'] && row['Project Title']) {
                                                    const project = projectMap.get(row['Project Title']);
                                                    if (project) {
                                                        project.milestones.push({
                                                            title: row['Milestone Title'],
                                                            status: row.Status || 'not_started'
                                                        });
                                                    }
                                                }
                                            });

                                            // Send to server
                                            toast.loading('Importing data...', { id: toastId });
                                            const { importSystemTemplate } = await import('@/actions/import');
                                            const result = await importSystemTemplate(importData);

                                            if (result.success) {
                                                toast.success('Template imported successfully', { id: toastId });
                                                router.refresh();
                                                setTimeout(() => window.location.reload(), 1500); // Force full reload to update context
                                            } else {
                                                toast.error(result.message || 'Import failed: ' + result.message, { id: toastId });
                                            }
                                        } catch (error: any) {
                                            console.error(error);
                                            toast.error('Failed to parse Excel file', { id: toastId });
                                        } finally {
                                            e.target.value = '';
                                        }
                                    } else {
                                        e.target.value = '';
                                    }
                                }}
                                className="hidden"
                                id="template-upload"
                            />
                            <label
                                htmlFor="template-upload"
                                className="flex items-center justify-center gap-2 w-full py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition-colors font-medium text-sm"
                            >
                                <Plus className="w-4 h-4" />
                                Upload Excel Template
                            </label>
                        </div>
                    </div>

                    <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                        <h3 className="font-medium mb-2">Download Template</h3>
                        <p className="text-xs text-muted-foreground mb-4">
                            Get a sample JSON template to structure your own bulk import file.
                        </p>
                        <button
                            onClick={async () => {
                                try {
                                    const { utils, writeFile } = await import('xlsx');

                                    // Prepare Sheets
                                    const wb = utils.book_new();

                                    // Settings Sheet
                                    const settingsData = [
                                        { Key: "dailyCapacityHours", Value: 6, Description: "Hours per day" },
                                        { Key: "workDayStart", Value: "09:00", Description: "HH:MM format" },
                                        { Key: "workDayEnd", Value: "17:00", Description: "HH:MM format" },
                                        { Key: "coldTaskDays", Value: 14, Description: "Days until task becomes cold" },
                                    ];
                                    const wsSettings = utils.json_to_sheet(settingsData);
                                    utils.book_append_sheet(wb, wsSettings, "Settings");

                                    // Pillars Sheet
                                    const pillarsData = [
                                        { Name: "Health & Fitness", Color: "#10B981", Icon: "activity" },
                                        { Name: "Career & Business", Color: "#3B82F6", Icon: "briefcase" },
                                    ];
                                    const wsPillars = utils.json_to_sheet(pillarsData);
                                    utils.book_append_sheet(wb, wsPillars, "Pillars");

                                    // Goals Sheet
                                    const goalsData = [
                                        { Pillar: "Health & Fitness", "Goal Title": "Run a Marathon", Description: "Complete 42km by Dec", Status: "active" },
                                        { Pillar: "Career & Business", "Goal Title": "Launch SaaS Product", Description: "Q4 Launch", Status: "active" },
                                    ];
                                    const wsGoals = utils.json_to_sheet(goalsData);
                                    utils.book_append_sheet(wb, wsGoals, "Goals");

                                    // Projects Sheet
                                    const projectsData = [
                                        { "Goal Title": "Run a Marathon", "Project Title": "Marathon Training Plan", Description: "16-week cycle", Status: "active", Pillar: "Health & Fitness" },
                                        { "Goal Title": "Launch SaaS Product", "Project Title": "MVP Development", Description: "Core features", Status: "active", Pillar: "Career & Business" },
                                    ];
                                    const wsProjects = utils.json_to_sheet(projectsData);
                                    utils.book_append_sheet(wb, wsProjects, "Projects");

                                    // Rituals Sheet
                                    const ritualsData = [
                                        { "Goal Title": "Run a Marathon", "Ritual Title": "Morning Run", Cadence: "daily", Target: 5, Pillar: "Health & Fitness" },
                                        { "Goal Title": "Launch SaaS Product", "Ritual Title": "Weekly Code Review", Cadence: "weekly", Target: 1, Pillar: "Career & Business" },
                                    ];
                                    const wsRituals = utils.json_to_sheet(ritualsData);
                                    utils.book_append_sheet(wb, wsRituals, "Rituals");

                                    // Milestones Sheet
                                    const milestonesData = [
                                        { "Project Title": "Marathon Training Plan", "Milestone Title": "Run 10km", Status: "completed" },
                                        { "Project Title": "Marathon Training Plan", "Milestone Title": "Run Half Marathon", Status: "not_started" },
                                        { "Project Title": "MVP Development", "Milestone Title": "Database Schema", Status: "completed" },
                                    ];
                                    const wsMilestones = utils.json_to_sheet(milestonesData);
                                    utils.book_append_sheet(wb, wsMilestones, "Milestones");

                                    // Write file
                                    writeFile(wb, "Sugularity_Template.xlsx");
                                } catch (error) {
                                    console.error(error);
                                    toast.error('Failed to generate Excel template');
                                }
                            }}
                            className="flex items-center justify-center gap-2 w-full py-2 bg-muted text-foreground border border-border rounded-lg hover:bg-muted/80 transition-colors font-medium text-sm"
                        >
                            <Save className="w-4 h-4" />
                            Download Excel Sample
                        </button>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="glass-panel rounded-xl p-6 border border-red-500/20 bg-red-500/5">
                <h2 className="text-lg font-semibold mb-4 text-red-500 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Danger Zone
                </h2>

                <div className="space-y-6">
                    {/* Soft Reset */}
                    <div className="flex items-center justify-between pb-6 border-b border-red-500/10">
                        <div>
                            <p className="font-medium text-foreground">Clear Tasks & Schedule</p>
                            <p className="text-sm text-muted-foreground">
                                Removes all tasks, daily plans, and history. Keeps Projects, Streams, Goals, and Areas.
                            </p>
                        </div>
                        <button
                            onClick={() => { setResetType('soft'); setShowResetConfirm(true); }}
                            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg font-medium transition-colors"
                            suppressHydrationWarning
                        >
                            Reset Tasks
                        </button>
                    </div>

                    {/* Hard Reset */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-foreground">Factory Default</p>
                            <p className="text-sm text-muted-foreground">
                                Complete wipe. Deletes Tasks, Projects, Streams, Goals, and History. Irreversible.
                            </p>
                        </div>
                        <button
                            onClick={() => { setResetType('hard'); setShowResetConfirm(true); }}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                            suppressHydrationWarning
                        >
                            Factory Reset
                        </button>
                    </div>
                </div>
            </div>

            {/* Reset Confirmation Modal */}
            {showResetConfirm && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-xl p-6 max-w-md w-full border border-red-500/50 shadow-2xl">
                        <h3 className="text-xl font-bold text-red-500 mb-4">
                            {resetType === 'hard' ? 'Factory Reset' : 'Clear Tasks'}
                        </h3>
                        <p className="text-muted-foreground mb-4">
                            {resetType === 'hard'
                                ? "This will wipe ALL data (Tasks, Projects, Streams, Goals). Automation history will be lost."
                                : "This will delete all tasks and schedule history. Your structure (Projects/Areas) will be safe."}
                            <br /><br />
                            This action cannot be undone.
                        </p>
                        <p className="text-sm font-medium mb-2">Type "DELETE" to confirm:</p>
                        <input
                            type="text"
                            value={resetInput}
                            onChange={(e) => setResetInput(e.target.value)}
                            className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm mb-6"
                            placeholder="DELETE"
                            suppressHydrationWarning
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowResetConfirm(false); setResetInput(''); }}
                                className="flex-1 py-2 bg-muted hover:bg-muted/80 rounded-lg font-medium"
                                suppressHydrationWarning
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReset}
                                disabled={resetInput !== 'DELETE' || isResetting}
                                className="flex-1 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50"
                                suppressHydrationWarning
                            >
                                {isResetting ? 'Resetting...' : 'Confirm Reset'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
