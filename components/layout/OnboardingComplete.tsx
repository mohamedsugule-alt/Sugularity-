'use client';

import { useEffect } from 'react';
import { useOnboarding } from '@/components/providers/OnboardingProvider';

export function OnboardingComplete({ step }: { step: number }) {
    const { completeStep } = useOnboarding();

    useEffect(() => {
        completeStep(step);
    }, [step, completeStep]);

    return null;
}
