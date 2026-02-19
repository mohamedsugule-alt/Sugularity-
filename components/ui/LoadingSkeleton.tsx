'use client';

export function LoadingSkeleton() {
    return (
        <div className="animate-pulse space-y-6 p-2">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <div className="h-8 w-48 bg-muted rounded-lg" />
                    <div className="h-4 w-72 bg-muted/60 rounded-md" />
                </div>
                <div className="h-10 w-32 bg-muted rounded-xl" />
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-24 bg-muted/50 rounded-xl border border-border/50" />
                ))}
            </div>

            {/* Content area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                    <div className="h-6 w-32 bg-muted rounded-md" />
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-14 bg-muted/40 rounded-xl border border-border/30" />
                    ))}
                </div>
                <div className="space-y-3">
                    <div className="h-6 w-40 bg-muted rounded-md" />
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-20 bg-muted/40 rounded-xl border border-border/30" />
                    ))}
                </div>
            </div>
        </div>
    );
}

export function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center min-h-[40vh]">
            <div className="relative">
                <div className="w-10 h-10 rounded-full border-2 border-muted" />
                <div className="absolute inset-0 w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
        </div>
    );
}
