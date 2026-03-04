'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function CoreErrorBoundary({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error("Core Route Error:", error);
    }, [error]);

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
            <div className="glass-panel p-8 rounded-2xl max-w-lg w-full border border-red-500/20 bg-red-500/5 shadow-2xl space-y-6">
                <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-red-500 mb-2">System Interruption</h2>
                    <p className="text-muted-foreground text-sm max-w-md mx-auto">
                        We encountered an unexpected error loading this view. This is often caused by a temporary network issue or a disconnected external service (like Google Calendar API).
                    </p>
                </div>

                <div className="p-4 bg-muted/40 rounded-lg text-left overflow-hidden">
                    <p className="font-mono text-xs text-red-400 break-words line-clamp-3">
                        {error.message || "Unknown error occurred"}
                    </p>
                </div>

                <div className="flex gap-4 pt-4">
                    <button
                        onClick={() => reset()}
                        className="flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Try Again
                    </button>
                    <Link
                        href="/"
                        className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
                    >
                        <Home className="w-4 h-4" />
                        Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
