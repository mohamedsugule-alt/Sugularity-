'use client';

import { useState, useEffect } from 'react';
import { generateMorningBriefing, type BriefingData } from '@/actions/briefing';
import { X, ChevronRight, CheckCircle2, AlertTriangle, Sunrise, Target, Calendar, Link as LinkIcon } from 'lucide-react';
import { addDailyOutcome } from '@/actions/daily-plan';
import { toast } from 'sonner';

type Props = {
    onClose: () => void;
};

export function MorningBriefing({ onClose }: Props) {
    const [step, setStep] = useState(0); // 0: Wake Up, 1: Review, 2: Preview, 3: Intention
    const [data, setData] = useState<BriefingData | null>(null);
    const [loading, setLoading] = useState(true);
    const [newOutcomes, setNewOutcomes] = useState<{ title: string; projectId?: string; ritualId?: string }[]>([{ title: '' }]);

    useEffect(() => {
        generateMorningBriefing().then(d => {
            setData(d);
            setLoading(false);
        });
    }, []);

    const handleCreateOutcomes = async () => {
        const outcomesToCreate = newOutcomes.filter(o => o.title.trim());
        if (outcomesToCreate.length === 0) {
            onClose();
            return;
        }

        const today = new Date();
        // Create sequentially to preserve order
        for (const outcome of outcomesToCreate) {
            await addDailyOutcome(today, outcome.title.trim(), outcome.projectId, outcome.ritualId);
        }

        toast.success("Outcomes set. Let's go!");
        window.location.reload(); // Refresh to show new state
        onClose();
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <Sunrise className="w-12 h-12 text-orange-400" />
                    <p className="text-xl font-medium text-orange-200">Initializing System...</p>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const slides = [
        // 1. Wake Up
        <div key="wake" className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sunrise className="w-8 h-8 text-orange-400" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-amber-200 bg-clip-text text-transparent">
                Good Morning, {data.userName}
            </h2>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
                System is online. Ready to calibrate for the day?
            </p>
        </div>,

        // 2. Review (Yesterday)
        <div key="review" className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
            <h3 className="text-xl font-semibold flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                Yesterday's Wins
            </h3>
            {data.yesterdayWins.length === 0 ? (
                <div className="p-6 bg-muted/10 rounded-xl border border-border/10 text-center">
                    <p className="text-muted-foreground">No records found. A clean slate today.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {data.yesterdayWins.slice(0, 5).map(win => (
                        <div key={win.id} className="flex items-center gap-3 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span className="font-medium">{win.title}</span>
                        </div>
                    ))}
                    {data.yesterdayWins.length > 5 && (
                        <p className="text-center text-xs text-muted-foreground">
                            + {data.yesterdayWins.length - 5} more
                        </p>
                    )}
                </div>
            )}
        </div>,

        // 3. Preview (Today)
        <div key="preview" className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
            <h3 className="text-xl font-semibold flex items-center gap-2 text-blue-400">
                <Calendar className="w-5 h-5" />
                Today's Landscape
            </h3>

            <div className="grid gap-4">
                {/* Schedule */}
                <div className="space-y-2">
                    {data.todaySchedule.length === 0 ? (
                        <p className="text-muted-foreground text-sm italic">Nothing scheduled yet.</p>
                    ) : (
                        data.todaySchedule.map(task => (
                            <div key={task.id} className="flex items-center gap-3 p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                <span className="font-medium">{task.title}</span>
                                {task.time && <span className="ml-auto text-xs bg-blue-500/20 px-2 py-1 rounded">{task.time}</span>}
                            </div>
                        ))
                    )}
                </div>

                {/* Stalled Projects Warning */}
                {data.stalledProjects.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/5">
                        <h4 className="text-sm font-semibold text-yellow-500 mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Attention Needed
                        </h4>
                        {data.stalledProjects.map(p => (
                            <div key={p.id} className="text-sm text-muted-foreground flex justify-between">
                                <span>{p.title}</span>
                                <span className="text-yellow-600/80">{p.daysInactive}d inactive</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>,

        // 4. Intention (Outcomes)
        <div key="intention" className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
            <div className="text-center">
                <Target className="w-12 h-12 text-primary mx-auto mb-2" />
                <h3 className="text-xl font-bold">Set Intentions</h3>
                <p className="text-muted-foreground text-sm">What 1-3 things would make today a success?</p>
            </div>

            <div className="space-y-3">
                {newOutcomes.map((outcome, idx) => (
                    <div key={idx} className="flex gap-2">
                        <input
                            type="text"
                            value={outcome.title}
                            onChange={(e) => {
                                const updated = [...newOutcomes];
                                updated[idx] = { ...updated[idx], title: e.target.value };
                                setNewOutcomes(updated);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && outcome.title.trim() && idx === newOutcomes.length - 1 && newOutcomes.length < 3) {
                                    setNewOutcomes([...newOutcomes, { title: '' }]);
                                }
                            }}
                            autoFocus={idx === newOutcomes.length - 1}
                            placeholder={`Outcome #${idx + 1}`}
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-center"
                        />

                        {/* Parent Selector */}
                        <div className="relative group">
                            <select
                                value={outcome.projectId ? `p:${outcome.projectId}` : outcome.ritualId ? `r:${outcome.ritualId}` : ''}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    const updated = [...newOutcomes];
                                    if (!val) {
                                        updated[idx] = { ...updated[idx], projectId: undefined, ritualId: undefined };
                                    } else if (val.startsWith('p:')) {
                                        updated[idx] = { ...updated[idx], projectId: val.replace('p:', ''), ritualId: undefined };
                                    } else if (val.startsWith('r:')) {
                                        updated[idx] = { ...updated[idx], projectId: undefined, ritualId: val.replace('r:', '') };
                                    }
                                    setNewOutcomes(updated);
                                }}
                                className="h-full w-12 appearance-none bg-white/5 border border-white/10 rounded-lg text-transparent focus:outline-none cursor-pointer absolute inset-0 z-10"
                            >
                                <option value="" className="text-black">No Link</option>
                                {data?.activeProjects && data.activeProjects.length > 0 && (
                                    <optgroup label="Projects" className="text-black">
                                        {data.activeProjects.map(p => (
                                            <option key={p.id} value={`p:${p.id}`}>{p.title}</option>
                                        ))}
                                    </optgroup>
                                )}
                                {data?.activeRituals && data.activeRituals.length > 0 && (
                                    <optgroup label="Rituals" className="text-black">
                                        {data.activeRituals.map(s => (
                                            <option key={s.id} value={`r:${s.id}`}>{s.title}</option>
                                        ))}
                                    </optgroup>
                                )}
                            </select>

                            {/* Visual Icon */}
                            <div className={`h-full aspect-square flex items-center justify-center rounded-lg border transition-colors ${outcome.projectId || outcome.ritualId ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-white/5 border-white/10 text-muted-foreground'}`}>
                                <LinkIcon className="w-5 h-5" />
                            </div>
                        </div>
                    </div>
                ))}
                {newOutcomes.length < 3 && newOutcomes[newOutcomes.length - 1].title.trim() && (
                    <button
                        onClick={() => setNewOutcomes([...newOutcomes, { title: '' }])}
                        className="text-xs text-muted-foreground hover:text-white block mx-auto py-2"
                    >
                        + Add another
                    </button>
                )}
            </div>
        </div>
    ];

    return (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
            <div className="max-w-md w-full relative">
                <button
                    onClick={onClose}
                    className="absolute -top-12 right-0 text-muted-foreground hover:text-white transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Progress Indicators */}
                <div className="flex justify-center gap-2 mb-8">
                    {slides.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-primary' : i < step ? 'w-2 bg-primary/50' : 'w-2 bg-white/10'}`}
                        />
                    ))}
                </div>

                {/* Slide Content */}
                <div className="min-h-[300px] flex flex-col justify-center">
                    {slides[step]}
                </div>

                {/* Controls */}
                <div className="mt-8 flex justify-end">
                    {step < slides.length - 1 ? (
                        <button
                            onClick={() => setStep(s => s + 1)}
                            className="bg-white text-black px-6 py-3 rounded-full font-semibold hover:bg-white/90 transition-all flex items-center gap-2 group"
                        >
                            Next
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    ) : (
                        <button
                            onClick={handleCreateOutcomes}
                            className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 w-full"
                        >
                            Start the Engine
                        </button>
                    )}
                </div>

                {step > 0 && (
                    <button
                        onClick={() => setStep(s => s - 1)}
                        className="absolute bottom-3 left-0 text-sm text-muted-foreground hover:text-white"
                    >
                        Back
                    </button>
                )}
            </div>
        </div>
    );
}
