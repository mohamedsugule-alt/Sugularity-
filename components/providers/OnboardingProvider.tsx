'use client';

import { createContext, useContext, useState, useEffect } from 'react';

type OnboardingStep = {
    id: number;
    title: string;
    description: string;
    action: string;
    route: string;
    completed: boolean;
};

const ONBOARDING_STEPS: Omit<OnboardingStep, 'completed'>[] = [
    {
        id: 1,
        title: 'Create Your Life Areas',
        description: 'Areas are the pillars of your life: Health, Career, Finance, Relationships, etc.',
        action: 'Add your first area in Settings',
        route: '/settings',
    },
    {
        id: 2,
        title: 'Capture Something',
        description: 'Throw any idea, task, or thought into the Inbox. Don\'t think, just capture.',
        action: 'Add your first inbox item',
        route: '/inbox',
    },
    {
        id: 3,
        title: 'Create a Goal',
        description: 'What do you want to achieve this year? Pick ONE goal to start.',
        action: 'Create your first goal',
        route: '/goals',
    },
    {
        id: 4,
        title: 'Plan Your Day',
        description: 'Move tasks to "Committed" for today. Start small with 1-3 tasks.',
        action: 'Commit your first task',
        route: '/today',
    },
    {
        id: 5,
        title: 'You\'re Ready!',
        description: 'You now know the basics. Use Inbox → Organize → Today → Review.',
        action: 'Start using Sugularity',
        route: '/dashboard',
    },
];

interface OnboardingContextType {
    steps: OnboardingStep[];
    currentStep: number;
    isOnboarding: boolean;
    completeStep: (stepId: number) => void;
    skipOnboarding: () => void;
    resetOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
    const [steps, setSteps] = useState<OnboardingStep[]>([]);
    const [isOnboarding, setIsOnboarding] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('sugularity-onboarding');
        if (stored) {
            const data = JSON.parse(stored);
            setSteps(data.steps);
            setIsOnboarding(data.isOnboarding);
        } else {
            // First time user
            const initialSteps = ONBOARDING_STEPS.map(s => ({ ...s, completed: false }));
            setSteps(initialSteps);
            setIsOnboarding(true);
            localStorage.setItem('sugularity-onboarding', JSON.stringify({
                steps: initialSteps,
                isOnboarding: true,
            }));
        }
    }, []);

    const currentStep = steps.findIndex(s => !s.completed) + 1 || steps.length;

    const completeStep = (stepId: number) => {
        const newSteps = steps.map(s =>
            s.id === stepId ? { ...s, completed: true } : s
        );
        setSteps(newSteps);

        const allDone = newSteps.every(s => s.completed);
        if (allDone) {
            setIsOnboarding(false);
        }

        localStorage.setItem('sugularity-onboarding', JSON.stringify({
            steps: newSteps,
            isOnboarding: !allDone,
        }));
    };

    const skipOnboarding = () => {
        setIsOnboarding(false);
        localStorage.setItem('sugularity-onboarding', JSON.stringify({
            steps: steps.map(s => ({ ...s, completed: true })),
            isOnboarding: false,
        }));
    };

    const resetOnboarding = () => {
        const initialSteps = ONBOARDING_STEPS.map(s => ({ ...s, completed: false }));
        setSteps(initialSteps);
        setIsOnboarding(true);
        localStorage.setItem('sugularity-onboarding', JSON.stringify({
            steps: initialSteps,
            isOnboarding: true,
        }));
    };

    return (
        <OnboardingContext.Provider value={{
            steps,
            currentStep,
            isOnboarding,
            completeStep,
            skipOnboarding,
            resetOnboarding,
        }}>
            {children}
        </OnboardingContext.Provider>
    );
}

export function useOnboarding() {
    const context = useContext(OnboardingContext);
    if (!context) {
        return {
            steps: [],
            currentStep: 0,
            isOnboarding: false,
            completeStep: () => { },
            skipOnboarding: () => { },
            resetOnboarding: () => { },
        };
    }
    return context;
}
