'use client';
import { ErrorFallback } from '@/components/ui/ErrorFallback';
export default function SettingsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return <ErrorFallback error={error} reset={reset} />;
}
