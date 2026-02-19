'use client';

import { useState } from 'react';
import { executeTriageDecision, type TriageDecision } from '@/actions/humanNature';
import { X, Calendar, Clock, Pause, Archive, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

type Task = {
    id: string;
    title: string;
    rolloverCount: number;
    estimateMinutes: number | null;
    pillar?: { name: string; colorHex: string } | null;
    project?: { title: string } | null;
};

type TriageOption = 'schedule' | 'defer' | 'blocked' | 'someday' | 'archive' | 'delete';

export function ForcedTriageModal({
    task,
    onClose,
    onComplete,
}: {
    task: Task;
    onClose: () => void;
    onComplete: () => void;
}) {
    const [selectedOption, setSelectedOption] = useState<TriageOption | null>(null);
    const [scheduledDate, setScheduledDate] = useState<string>('');
    const [deferReason, setDeferReason] = useState('');
    const [deferReviewDate, setDeferReviewDate] = useState('');
    const [blockedReason, setBlockedReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const handleSubmit = async () => {
        if (!selectedOption) return;

        let decision: TriageDecision;

        switch (selectedOption) {
            case 'schedule':
                if (!scheduledDate) {
                    toast.error('Please select a date');
                    return;
                }
                decision = { type: 'schedule', scheduledDate: new Date(scheduledDate) };
                break;
            case 'defer':
                if (!deferReason || !deferReviewDate) {
                    toast.error('Please provide reason and review date');
                    return;
                }
                decision = { type: 'defer', reason: deferReason, reviewOn: new Date(deferReviewDate) };
                break;
            case 'blocked':
                if (!blockedReason) {
                    toast.error('Please describe what\'s blocking this');
                    return;
                }
                decision = { type: 'blocked', reason: blockedReason };
                break;
            case 'someday':
                decision = { type: 'someday' };
                break;
            case 'archive':
                decision = { type: 'archive' };
                break;
            case 'delete':
                if (!confirmDelete) {
                    setConfirmDelete(true);
                    return;
                }
                decision = { type: 'delete' };
                break;
        }

        setIsSubmitting(true);
        try {
            await executeTriageDecision(task.id, decision);
            toast.success('Decision recorded');
            onComplete();
        } catch (error) {
            toast.error('Failed to process decision');
        } finally {
            setIsSubmitting(false);
        }
    };

    const options = [
        { id: 'schedule', label: 'Schedule It', icon: Calendar, desc: 'Pick a specific date to work on this' },
        { id: 'defer', label: 'Defer with Reason', icon: Clock, desc: 'Set aside with a note and review date' },
        { id: 'blocked', label: 'Mark Blocked', icon: AlertCircle, desc: 'Waiting on something external' },
        { id: 'someday', label: 'Move to Someday', icon: Pause, desc: 'Not now, but worth keeping' },
        { id: 'archive', label: 'Archive', icon: Archive, desc: 'Done enough, or no longer relevant' },
        { id: 'delete', label: 'Delete', icon: Trash2, desc: 'Remove completely (rare)' },
    ];

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="glass-panel rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-semibold">Time for a Decision</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            You've carried this task {task.rolloverCount + 1} times. Let's make a call so it stops draining attention.
                        </p>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Task Info */}
                <div className="p-4 bg-muted/30 rounded-lg mb-6">
                    <p className="font-medium">{task.title}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        {task.pillar && (
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: task.pillar.colorHex }} />
                                {task.pillar.name}
                            </span>
                        )}
                        {task.project && <span>→ {task.project.title}</span>}
                        {task.estimateMinutes && <span>{task.estimateMinutes}m</span>}
                        <span className="text-yellow-500">Rolled over {task.rolloverCount}×</span>
                    </div>
                </div>

                {/* Options */}
                <div className="space-y-2 mb-6">
                    {options.map((opt) => (
                        <button
                            key={opt.id}
                            onClick={() => {
                                setSelectedOption(opt.id as TriageOption);
                                setConfirmDelete(false);
                            }}
                            className={`w-full p-3 rounded-lg border text-left transition-all flex items-start gap-3 ${selectedOption === opt.id
                                ? 'border-primary bg-primary/10'
                                : 'border-border/50 hover:border-border'
                                }`}
                        >
                            <opt.icon className={`w-5 h-5 mt-0.5 ${opt.id === 'delete' ? 'text-red-500' : 'text-muted-foreground'}`} />
                            <div>
                                <p className={`font-medium text-sm ${opt.id === 'delete' ? 'text-red-500' : ''}`}>{opt.label}</p>
                                <p className="text-xs text-muted-foreground">{opt.desc}</p>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Option-specific inputs */}
                {selectedOption === 'schedule' && (
                    <div className="mb-6">
                        <label className="text-sm font-medium block mb-2">When will you do this?</label>
                        <input
                            type="date"
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                        />
                    </div>
                )}

                {selectedOption === 'defer' && (
                    <div className="space-y-4 mb-6">
                        <div>
                            <label className="text-sm font-medium block mb-2">Why are you deferring this?</label>
                            <input
                                type="text"
                                value={deferReason}
                                onChange={(e) => setDeferReason(e.target.value)}
                                placeholder="e.g., Need more information..."
                                className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium block mb-2">Review again on</label>
                            <input
                                type="date"
                                value={deferReviewDate}
                                onChange={(e) => setDeferReviewDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                    </div>
                )}

                {selectedOption === 'blocked' && (
                    <div className="mb-6">
                        <label className="text-sm font-medium block mb-2">What's blocking this?</label>
                        <input
                            type="text"
                            value={blockedReason}
                            onChange={(e) => setBlockedReason(e.target.value)}
                            placeholder="e.g., Waiting for response from..."
                            className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                        />
                    </div>
                )}

                {confirmDelete && (
                    <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <p className="text-sm text-red-400">
                            Are you sure? This will permanently delete the task. Consider archiving instead.
                        </p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 bg-muted/50 hover:bg-muted rounded-lg font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!selectedOption || isSubmitting}
                        className={`flex-1 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${selectedOption === 'delete' && confirmDelete
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-primary text-primary-foreground hover:bg-primary/90'
                            }`}
                    >
                        <CheckCircle className="w-4 h-4" />
                        {confirmDelete ? 'Confirm Delete' : 'Confirm Decision'}
                    </button>
                </div>
            </div>
        </div>
    );
}
