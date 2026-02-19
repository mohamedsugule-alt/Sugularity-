'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export function ErrorFallback({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Page Error:', error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-8">
            <div className="w-16 h-16 rounded-2xl bg-danger/10 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-danger" />
            </div>
            <div className="text-center space-y-2 max-w-md">
                <h2 className="text-xl font-semibold text-foreground">
                    Something went wrong
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    {error.message || 'An unexpected error occurred. Please try again.'}
                </p>
                {error.digest && (
                    <p className="text-xs text-muted-foreground/60 font-mono">
                        Error ID: {error.digest}
                    </p>
                )}
            </div>
            <button
                onClick={reset}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
                <RotateCcw className="w-4 h-4" />
                Try Again
            </button>
        </div>
    );
}
