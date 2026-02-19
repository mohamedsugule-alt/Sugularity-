'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'system' | 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('system');
    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');
    const [mounted, setMounted] = useState(false);

    // Load from localStorage
    useEffect(() => {
        setMounted(true);
        const stored = localStorage.getItem('sugularity-theme') as Theme | null;
        if (stored) {
            setThemeState(stored);
        }

        // Set initial resolved theme
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (!stored || stored === 'system') {
            setResolvedTheme(systemDark ? 'dark' : 'light');
        } else {
            setResolvedTheme(stored as 'light' | 'dark');
        }
    }, []);

    // Apply theme to document
    useEffect(() => {
        if (!mounted) return;

        const root = document.documentElement;

        if (theme === 'system') {
            const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            root.setAttribute('data-theme', 'system');
            setResolvedTheme(systemDark ? 'dark' : 'light');
        } else {
            root.setAttribute('data-theme', theme);
            setResolvedTheme(theme);
        }
    }, [theme, mounted]);

    // Listen for system theme changes
    useEffect(() => {
        if (!mounted) return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = (e: MediaQueryListEvent) => {
            if (theme === 'system') {
                setResolvedTheme(e.matches ? 'dark' : 'light');
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme, mounted]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem('sugularity-theme', newTheme);
    };

    // Render children immediately, context will be available
    return (
        <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        // Return a safe default if not inside provider
        return {
            theme: 'system' as Theme,
            setTheme: () => { },
            resolvedTheme: 'dark' as 'light' | 'dark',
        };
    }
    return context;
}
