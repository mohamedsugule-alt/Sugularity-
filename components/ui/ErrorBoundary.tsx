'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    name?: string;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="glass-panel p-6 rounded-xl border border-red-500/20 bg-red-500/5 flex flex-col items-center justify-center text-center space-y-4 m-4">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                    <div>
                        <h3 className="font-semibold text-red-500">{this.props.name || 'Component'} Failed to Load</h3>
                        <p className="text-sm text-red-400 mt-1 max-w-sm">
                            {this.state.error?.message || "An unexpected error occurred while communicating with the service."}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                            This typically happens without a network connection or if an external API is down.
                        </p>
                    </div>
                    <button
                        onClick={() => this.setState({ hasError: false, error: undefined })}
                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
