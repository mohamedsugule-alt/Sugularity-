'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import dynamic from 'next/dynamic';
const UserButton = dynamic(() => import('@clerk/nextjs').then(mod => mod.UserButton), { ssr: false, loading: () => <div className="w-7 h-7 rounded-full bg-muted" /> });
import {
    LayoutDashboard,
    CalendarDays,
    Inbox,
    Calendar,
    Menu,
    X,
    FolderKanban,
    Repeat,
    Archive,
    Settings,
    ClipboardCheck,
    Target,
    Sun,
    Moon,
    Monitor,
    Briefcase,
    BadgeDollarSign,
    BookOpen,
    Trophy,
    ListTodo,
    LineChart
} from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import Image from 'next/image';

const primaryNav = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Today', href: '/today', icon: CalendarDays },
    { label: 'Inbox', href: '/inbox', icon: Inbox },
    { label: 'Calendar', href: '/calendar', icon: Calendar },
];

const fullNav = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, color: '' },
    { label: 'Today', href: '/today', icon: CalendarDays, color: 'text-blue-500' },
    { label: 'Calendar', href: '/calendar', icon: Calendar, color: 'text-purple-500' },
    { label: 'Inbox', href: '/inbox', icon: Inbox, color: 'text-amber-500' },
    { label: 'Task Board', href: '/tasks', icon: ListTodo, color: 'text-pink-500' },
    { label: 'Goals', href: '/goals', icon: Target, color: 'text-emerald-500' },
    { label: 'Projects', href: '/projects', icon: FolderKanban, color: 'text-orange-500' },
    { label: 'Rituals', href: '/rituals', icon: Repeat, color: 'text-cyan-500' },
    { label: 'Library', href: '/library', icon: BookOpen, color: 'text-indigo-500' },
    { label: 'Job Tracker', href: '/career/job-tracker', icon: Briefcase, color: 'text-violet-500' },
    { label: 'Finance', href: '/finance', icon: BadgeDollarSign, color: 'text-green-500' },
    { label: 'Insights', href: '/insights', icon: LineChart, color: 'text-rose-500' },
    { label: 'Weekly Review', href: '/reviews', icon: ClipboardCheck, color: '' },
    { label: 'Archive', href: '/archive', icon: Archive, color: '' },
    { label: 'Settings', href: '/settings', icon: Settings, color: '' },
];

export function MobileNav({ powerUserMode = true }: { powerUserMode?: boolean }) {
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { theme, setTheme } = useTheme();

    const filteredFullNav = fullNav.filter(item => {
        if (!powerUserMode) {
            const advancedLabels = ['Job Tracker', 'Finance', 'Insights', 'Archive'];
            if (advancedLabels.includes(item.label)) return false;
        }
        return true;
    });

    const cycleTheme = () => {
        if (theme === 'system') setTheme('light');
        else if (theme === 'light') setTheme('dark');
        else setTheme('system');
    };

    const ThemeIcon = theme === 'system' ? Monitor : theme === 'light' ? Sun : Moon;

    return (
        <>
            {/* Bottom Navigation Bar */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-card/95 backdrop-blur-xl safe-area-bottom">
                <div className="flex items-center justify-around h-16 px-2">
                    {primaryNav.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center justify-center gap-0.5 min-w-[3rem] py-1.5 px-3 rounded-xl transition-colors ${isActive
                                    ? 'text-primary'
                                    : 'text-muted-foreground'
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                    <button
                        onClick={() => setIsMenuOpen(true)}
                        className="flex flex-col items-center justify-center gap-0.5 min-w-[3rem] py-1.5 px-3 rounded-xl text-muted-foreground transition-colors"
                    >
                        <Menu className="w-5 h-5" />
                        <span className="text-[10px] font-medium">Menu</span>
                    </button>
                </div>
            </nav>

            {/* Full Navigation Overlay */}
            {isMenuOpen && (
                <div className="md:hidden fixed inset-0 z-[100]">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setIsMenuOpen(false)}
                    />

                    {/* Slide-in Panel */}
                    <div className="absolute left-0 top-0 bottom-0 w-72 bg-card shadow-2xl animate-slide-in-left overflow-y-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-border/50">
                            <div className="flex items-center gap-3">
                                <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 p-0.5 shadow-lg shadow-violet-500/20">
                                    <div className="w-full h-full rounded-[10px] bg-card flex items-center justify-center overflow-hidden">
                                        <Image
                                            src="/logo.png"
                                            alt="Sugularity"
                                            fill
                                            className="object-contain p-1"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-foreground">Sugularity</h2>
                                    <p className="text-[10px] text-muted-foreground">Life OS</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsMenuOpen(false)}
                                className="p-2 rounded-xl hover:bg-muted/50 text-muted-foreground"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Navigation Items */}
                        <div className="p-3 space-y-0.5">
                            {filteredFullNav.map((item) => {
                                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                                const showSeparator = item.label === 'Goals' || item.label === 'Analytics';

                                return (
                                    <div key={item.href}>
                                        {showSeparator && (
                                            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent my-3" />
                                        )}
                                        <Link
                                            href={item.href}
                                            onClick={() => setIsMenuOpen(false)}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive
                                                ? 'bg-gradient-to-r from-primary/15 to-primary/5 text-primary shadow-sm'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                                }`}
                                        >
                                            <item.icon className={`w-4.5 h-4.5 ${isActive ? 'text-primary' : item.color || ''}`} />
                                            {item.label}
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className="p-3 border-t border-border/50 mt-2 space-y-2">
                            <button
                                onClick={cycleTheme}
                                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs bg-muted/30 text-muted-foreground hover:bg-muted/50 transition-all"
                            >
                                <span className="flex items-center gap-2">
                                    <ThemeIcon className="w-4 h-4" />
                                    {theme === 'system' ? 'System' : theme === 'light' ? 'Light' : 'Dark'}
                                </span>
                                <span className="text-[10px] opacity-60">Theme</span>
                            </button>
                            <div className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs bg-muted/30 text-muted-foreground">
                                <span className="flex items-center gap-2 font-medium text-foreground">Local Profile</span>
                                <UserButton afterSignOutUrl="/sign-in" />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
