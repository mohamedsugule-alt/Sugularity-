'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
const UserButton = dynamic(() => import('@clerk/nextjs').then(mod => mod.UserButton), { ssr: false, loading: () => <div className="w-7 h-7 rounded-full bg-muted" /> });
import { useTheme } from '@/components/providers/ThemeProvider';
import {
    LayoutDashboard,
    CalendarDays,
    Inbox,
    FolderKanban,
    Repeat,
    Archive,
    Settings,
    ClipboardCheck,
    Target,
    Calendar,
    Sun,
    Moon,
    Monitor,
    Briefcase,
    BadgeDollarSign,
    BookOpen,
    Scale,
    Trophy,
    ListTodo,
    Search,
    LineChart
} from 'lucide-react';

// Navigation with Calendar restored and better grouping
const navItems = [
    // Daily use
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, color: '' },
    { label: 'Today', href: '/today', icon: CalendarDays, color: 'text-blue-500' },
    { label: 'Calendar', href: '/calendar', icon: Calendar, color: 'text-purple-500' },
    { label: 'Inbox', href: '/inbox', icon: Inbox, color: 'text-amber-500' },
    { label: 'Task Board', href: '/tasks', icon: ListTodo, color: 'text-pink-500' },

    // Organization - with visual distinction
    { label: 'Goals', href: '/goals', icon: Target, color: 'text-emerald-500' },
    { label: 'Projects', href: '/projects', icon: FolderKanban, color: 'text-orange-500' },
    { label: 'Rituals', href: '/rituals', icon: Repeat, color: 'text-cyan-500' },
    { label: 'Library', href: '/library', icon: BookOpen, color: 'text-indigo-500' },

    // Career & Finance
    { label: 'Job Tracker', href: '/career/job-tracker', icon: Briefcase, color: 'text-violet-500' },
    { label: 'Finance', href: '/finance', icon: BadgeDollarSign, color: 'text-green-500' },


    // Review & Results
    { label: 'Insights', href: '/insights', icon: LineChart, color: 'text-rose-500' },
    { label: 'Weekly Review', href: '/reviews', icon: ClipboardCheck, color: '' },
    { label: 'Archive', href: '/archive', icon: Archive, color: '' },
    { label: 'Settings', href: '/settings', icon: Settings, color: '' },
];

export function Sidebar({ powerUserMode = true }: { powerUserMode?: boolean }) {
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();

    // All nav items are always visible
    const filteredNavItems = navItems;

    const cycleTheme = () => {
        if (theme === 'system') setTheme('light');
        else if (theme === 'light') setTheme('dark');
        else setTheme('system');
    };

    const ThemeIcon = theme === 'system' ? Monitor : theme === 'light' ? Sun : Moon;

    return (
        <aside className="w-56 h-screen flex flex-col border-r border-border bg-gradient-to-b from-card to-card/95">
            {/* Logo */}
            <div className="p-4 border-b border-border/50">
                <Link href="/dashboard" className="flex items-center gap-3 group">
                    <div className="relative w-10 h-10 flex-shrink-0 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 p-0.5 shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/40 transition-shadow">
                        <div className="w-full h-full rounded-[10px] bg-card flex items-center justify-center overflow-hidden">
                            <Image
                                src="/logo.png"
                                alt="Sugularity"
                                fill
                                className="object-contain p-1"
                                priority
                            />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-base font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                            Sugularity
                        </h1>
                        <p className="text-[10px] text-muted-foreground">
                            Life OS
                        </p>
                    </div>
                </Link>
            </div>

            {/* Search Trigger */}
            <div className="px-3 pt-3">
                <button
                    onClick={() => {
                        window.dispatchEvent(new Event('open-command-menu'));
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-muted-foreground bg-muted/30 hover:bg-muted/60 border border-border/50 hover:border-border transition-all cursor-pointer group"
                >
                    <Search className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    <span className="flex-1 text-left text-muted-foreground/70">Search...</span>
                    <kbd className="hidden sm:inline text-[10px] bg-muted px-1.5 py-0.5 rounded border border-border/50 text-muted-foreground">Ctrl K</kbd>
                </button>
            </div>

            {/* Main Nav */}
            <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
                {filteredNavItems.map((item, index) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    // Add separators for visual grouping
                    const showSeparator = item.label === 'Goals' || item.label === 'Weekly Review';

                    return (
                        <div key={item.href}>
                            {showSeparator && (
                                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent my-3" />
                            )}
                            <Link
                                href={item.href}
                                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                                    ? 'bg-gradient-to-r from-primary/15 to-primary/5 text-primary shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                    }`}
                            >
                                <item.icon className={`w-4 h-4 ${isActive ? 'text-primary' : item.color || ''}`} />
                                {item.label}
                            </Link>
                        </div>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-3 border-t border-border/50 space-y-2">
                <button
                    onClick={cycleTheme}
                    suppressHydrationWarning
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs bg-muted/30 text-muted-foreground hover:bg-muted/50 transition-all"
                >
                    <span className="flex items-center gap-2">
                        <ThemeIcon className="w-3.5 h-3.5" />
                        {theme === 'system' ? 'System' : theme === 'light' ? 'Light' : 'Dark'}
                    </span>
                    <span className="text-[10px] opacity-60">Theme</span>
                </button>
                <div className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs bg-muted/30 text-muted-foreground">
                    <span className="flex items-center gap-2 font-medium text-foreground">Local Profile</span>
                    <UserButton afterSignOutUrl="/sign-in" />
                </div>
            </div>
        </aside>
    );
}
