'use client';

import { useState } from 'react';
import { generateMondayBriefing } from '@/actions/calendar';
import {
    FileText,
    RefreshCw,
    Copy,
    CheckCircle2,
    Calendar,
    TrendingUp,
    AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

type BriefingHistoryItem = {
    id: string;
    type: string;
    date: string;
    weeklyWins: number;
    projectsAtRisk: number;
    ritualsBehind: number;
};

export function BriefingsClient({
    currentContent,
    currentDate,
    history,
    isMonday,
    hasTodayBriefing,
}: {
    currentContent: string | null;
    currentDate: string | null;
    history: BriefingHistoryItem[];
    isMonday: boolean;
    hasTodayBriefing: boolean;
}) {
    const [content, setContent] = useState(currentContent);
    const [date, setDate] = useState(currentDate);
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const briefing = await generateMondayBriefing();
            setContent(briefing.content);
            setDate(briefing.date.toISOString());
            toast.success('Briefing generated!');
        } catch {
            toast.error('Failed to generate briefing');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = async () => {
        if (!content) return;
        await navigator.clipboard.writeText(content);
        setCopied(true);
        toast.success('Copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
    };

    // Simple markdown to JSX converter
    const renderMarkdown = (md: string) => {
        const lines = md.split('\n');
        const elements: React.ReactNode[] = [];

        lines.forEach((line, i) => {
            if (line.startsWith('# ')) {
                elements.push(<h1 key={i} className="text-2xl font-bold mb-4">{line.slice(2)}</h1>);
            } else if (line.startsWith('## ')) {
                elements.push(<h2 key={i} className="text-lg font-semibold mt-6 mb-2 flex items-center gap-2">{line.slice(3)}</h2>);
            } else if (line.startsWith('### ')) {
                elements.push(<h3 key={i} className="text-md font-medium mt-4 mb-1">{line.slice(4)}</h3>);
            } else if (line.startsWith('- ')) {
                elements.push(<li key={i} className="ml-4 list-disc text-muted-foreground">{line.slice(2)}</li>);
            } else if (line.match(/^\d\. /)) {
                elements.push(<li key={i} className="ml-4 list-decimal text-foreground">{line.slice(3)}</li>);
            } else if (line.trim() === '') {
                elements.push(<br key={i} />);
            } else {
                // Handle bold text
                const boldFormatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                elements.push(
                    <p
                        key={i}
                        className="text-muted-foreground"
                        dangerouslySetInnerHTML={{ __html: boldFormatted }}
                    />
                );
            }
        });

        return elements;
    };

    return (
        <div className="space-y-6">
            {/* Action Banner */}
            {isMonday && !hasTodayBriefing && (
                <div className="glass-panel rounded-xl p-4 border-l-4 border-primary">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold">Happy Monday! 🌅</h3>
                            <p className="text-sm text-muted-foreground">
                                Generate your weekly briefing to start the week with clarity.
                            </p>
                        </div>
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
                        >
                            <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                            Generate Briefing
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Current Briefing */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Current Briefing
                        </h3>
                        <div className="flex gap-2">
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className="px-3 py-1.5 bg-muted/50 hover:bg-muted rounded-lg text-sm flex items-center gap-2"
                            >
                                <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                                Regenerate
                            </button>
                            <button
                                onClick={handleCopy}
                                disabled={!content}
                                className="px-3 py-1.5 bg-muted/50 hover:bg-muted rounded-lg text-sm flex items-center gap-2"
                            >
                                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                Copy
                            </button>
                        </div>
                    </div>

                    <div className="glass-panel rounded-xl p-6">
                        {content ? (
                            <div className="prose prose-sm prose-invert max-w-none">
                                {renderMarkdown(content)}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-lg font-medium">No briefing yet</p>
                                <p className="text-muted-foreground mt-1 mb-4">
                                    Generate your first Monday briefing.
                                </p>
                                <button
                                    onClick={handleGenerate}
                                    disabled={isGenerating}
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90"
                                >
                                    Generate Now
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* History */}
                <div className="glass-panel rounded-xl p-5">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        History
                    </h3>

                    {history.length === 0 ? (
                        <p className="text-muted-foreground text-sm text-center py-4">
                            No previous briefings
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {history.map((item) => (
                                <div key={item.id} className="p-3 bg-muted/30 rounded-lg">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium">
                                            {new Date(item.date).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </span>
                                        <span className="text-xs text-muted-foreground capitalize">
                                            {item.type}
                                        </span>
                                    </div>
                                    <div className="flex gap-3 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <TrendingUp className="w-3 h-3 text-emerald-500" />
                                            {item.weeklyWins} wins
                                        </span>
                                        {item.projectsAtRisk > 0 && (
                                            <span className="flex items-center gap-1">
                                                <AlertTriangle className="w-3 h-3 text-yellow-500" />
                                                {item.projectsAtRisk} at risk
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* AI Enhancement Note */}
            <div className="glass-panel rounded-xl p-4 border border-dashed border-border/50">
                <p className="text-sm text-muted-foreground text-center">
                    💡 AI-enhanced briefings coming in a future update.
                </p>
            </div>
        </div>
    );
}
