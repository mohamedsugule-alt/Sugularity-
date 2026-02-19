import { ArchiveRecord } from '@/components/archive/ArchiveClient'; // Check import path or redefine type
import { FileText, CheckSquare, Square } from 'lucide-react';

interface DailyCardProps {
    date: string;
    records: ArchiveRecord[];
    onClick: () => void;
}

export function DailyCard({ date, records, onClick }: DailyCardProps) {
    const displayRecords = records.slice(0, 5);
    const remaining = records.length - 5;
    const dateObj = new Date(records[0]?.completedAt || date); // Fallback

    return (
        <div
            onClick={onClick}
            className="group relative bg-card hover:bg-accent/50 border border-border/50 hover:border-border rounded-xl p-4 transition-all cursor-pointer h-[200px] flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md"
        >
            {/* Content Preview */}
            <div className="space-y-2 mb-4 overflow-hidden mask-linear-fade">
                {displayRecords.map((record) => (
                    <div key={record.id} className="flex items-start gap-2 text-xs text-muted-foreground group-hover:text-foreground/90 transition-colors">
                        <CheckSquare className="w-3.5 h-3.5 mt-0.5 text-primary/60 shrink-0" />
                        <span className="line-clamp-1 decoration-muted-foreground/30">{record.title}</span>
                    </div>
                ))}
                {remaining > 0 && (
                    <div className="text-xs text-muted-foreground/50 pl-5">
                        + {remaining} more items
                    </div>
                )}
            </div>

            {/* Footer Date */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-primary transition-colors mt-auto pt-3 border-t border-border/30">
                <FileText className="w-4 h-4" />
                <span className="font-medium">
                    {dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'numeric', year: 'numeric' })}
                </span>
            </div>

            {/* Hover Effect Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </div>
    );
}
