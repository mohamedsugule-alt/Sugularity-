'use client';

import * as React from 'react';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Calendar,
    Briefcase,
    Wallet,
    Brain,
    Settings,
    Search,
    Moon,
    Sun,
    CheckCircle,
    Inbox,
    Scale,
    Plus,
    Target,
    FolderKanban,
    Repeat,
    ListTodo,
    Loader2
} from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { searchAll, type SearchResult } from '@/actions/search';

const TYPE_ICONS: Record<string, any> = {
    task: ListTodo,
    project: FolderKanban,
    ritual: Repeat,
    goal: Target,
    inbox: Inbox,
};

const TYPE_LABELS: Record<string, string> = {
    task: 'Task',
    project: 'Project',
    ritual: 'Ritual',
    goal: 'Goal',
    inbox: 'Inbox',
};

export function CommandMenu() {
    const router = useRouter();
    const [open, setOpen] = React.useState(false);
    const { setTheme } = useTheme();
    const [query, setQuery] = React.useState('');
    const [results, setResults] = React.useState<SearchResult[]>([]);
    const [searching, setSearching] = React.useState(false);
    const debounceRef = React.useRef<NodeJS.Timeout | null>(null);

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        const openFromEvent = () => setOpen(true);

        document.addEventListener('keydown', down);
        window.addEventListener('open-command-menu', openFromEvent);
        return () => {
            document.removeEventListener('keydown', down);
            window.removeEventListener('open-command-menu', openFromEvent);
        };
    }, []);

    // Debounced search
    React.useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (!query || query.trim().length < 2) {
            setResults([]);
            setSearching(false);
            return;
        }

        setSearching(true);
        debounceRef.current = setTimeout(async () => {
            try {
                const res = await searchAll(query);
                setResults(res);
            } catch {
                setResults([]);
            } finally {
                setSearching(false);
            }
        }, 300);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query]);

    // Reset on close
    React.useEffect(() => {
        if (!open) {
            setQuery('');
            setResults([]);
        }
    }, [open]);

    const runCommand = React.useCallback((command: () => unknown) => {
        setOpen(false);
        command();
    }, []);

    if (!open) return null;

    // Group results by type
    const grouped = results.reduce((acc, r) => {
        if (!acc[r.type]) acc[r.type] = [];
        acc[r.type].push(r);
        return acc;
    }, {} as Record<string, SearchResult[]>);

    const hasResults = results.length > 0;
    const showSearch = query.trim().length >= 2;

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={() => setOpen(false)}
            />

            <Command
                className="relative w-full max-w-2xl bg-white/80 dark:bg-black/80 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                loop
                shouldFilter={!showSearch}
            >
                <div className="flex items-center border-b border-black/5 dark:border-white/10 px-4">
                    <Search className="w-5 h-5 text-muted-foreground mr-3" />
                    <Command.Input
                        placeholder="Type a command or search..."
                        className="w-full h-14 bg-transparent outline-none text-lg text-foreground placeholder:text-muted-foreground border-none focus:ring-0 p-0"
                        value={query}
                        onValueChange={setQuery}
                    />
                    {searching && <Loader2 className="w-4 h-4 text-muted-foreground animate-spin mr-2" />}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground bg-black/5 dark:bg-white/10 px-2 py-1 rounded">
                        <span className="font-sans text-xs">ESC</span>
                    </div>
                </div>

                <Command.List className="max-h-[60vh] overflow-y-auto p-2 scroll-py-2">
                    <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                        {searching ? 'Searching...' : showSearch ? 'No results found.' : 'No results found.'}
                    </Command.Empty>

                    {/* Search Results */}
                    {showSearch && hasResults && Object.entries(grouped).map(([type, items]) => (
                        <Command.Group key={type} heading={TYPE_LABELS[type] + 's'} className="text-xs font-medium text-muted-foreground mb-2 px-2">
                            {items.map(item => {
                                const Icon = TYPE_ICONS[item.type] || ListTodo;
                                return (
                                    <Command.Item
                                        key={item.id}
                                        value={item.title}
                                        onSelect={() => runCommand(() => router.push(item.href))}
                                        className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-foreground cursor-pointer select-none transition-colors data-[selected=true]:bg-black/5 data-[selected=true]:dark:bg-white/10"
                                    >
                                        <div className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5 text-muted-foreground">
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="truncate">{item.title}</p>
                                            {item.meta && (
                                                <p className="text-xs text-muted-foreground truncate">{item.meta}</p>
                                            )}
                                        </div>
                                    </Command.Item>
                                );
                            })}
                        </Command.Group>
                    ))}

                    {/* Navigation — only when not actively searching */}
                    {!showSearch && (
                        <>
                            <Command.Group heading="Go To" className="text-xs font-medium text-muted-foreground mb-2 px-2">
                                <CommandItem onSelect={() => runCommand(() => router.push('/'))} icon={LayoutDashboard}>
                                    Dashboard
                                </CommandItem>
                                <CommandItem onSelect={() => runCommand(() => router.push('/inbox'))} icon={Inbox}>
                                    Inbox
                                </CommandItem>
                                <CommandItem onSelect={() => runCommand(() => router.push('/tasks'))} icon={ListTodo}>
                                    Task Board
                                </CommandItem>
                                <CommandItem onSelect={() => runCommand(() => router.push('/finance'))} icon={Wallet}>
                                    Finance
                                </CommandItem>
                                <CommandItem onSelect={() => runCommand(() => router.push('/career/job-tracker'))} icon={Briefcase}>
                                    Career
                                </CommandItem>
                                <CommandItem onSelect={() => runCommand(() => router.push('/calendar'))} icon={Calendar}>
                                    Calendar
                                </CommandItem>
                                <CommandItem onSelect={() => runCommand(() => router.push('/library'))} icon={Brain}>
                                    Library
                                </CommandItem>
                                <CommandItem onSelect={() => runCommand(() => router.push('/decisions'))} icon={Scale}>
                                    Decision Lab
                                </CommandItem>
                            </Command.Group>

                            <Command.Group heading="Quick Actions" className="text-xs font-medium text-muted-foreground mb-2 px-2 mt-4">
                                <CommandItem onSelect={() => runCommand(() => router.push('/inbox?new=true'))} icon={Plus}>
                                    New Inbox Item
                                </CommandItem>
                                <CommandItem onSelect={() => runCommand(() => router.push('/finance?new=true'))} icon={Wallet}>
                                    Log Expense
                                </CommandItem>
                            </Command.Group>

                            <Command.Group heading="System" className="text-xs font-medium text-muted-foreground mb-2 px-2 mt-4">
                                <CommandItem onSelect={() => runCommand(() => setTheme('light'))} icon={Sun}>
                                    Light Mode
                                </CommandItem>
                                <CommandItem onSelect={() => runCommand(() => setTheme('dark'))} icon={Moon}>
                                    Dark Mode
                                </CommandItem>
                                <CommandItem onSelect={() => runCommand(() => router.push('/settings'))} icon={Settings}>
                                    Settings
                                </CommandItem>
                            </Command.Group>
                        </>
                    )}

                </Command.List>
            </Command>
        </div>
    );
}

function CommandItem({ children, icon: Icon, onSelect }: { children: React.ReactNode, icon: any, onSelect: () => void }) {
    return (
        <Command.Item
            onSelect={onSelect}
            className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-foreground cursor-pointer select-none transition-colors data-[selected=true]:bg-black/5 data-[selected=true]:dark:bg-white/10"
        >
            <div className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5 text-muted-foreground">
                <Icon className="w-4 h-4" />
            </div>
            {children}
        </Command.Item>
    );
}
