'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { Search, FolderKanban, Settings, CalendarDays, Inbox, Target, Repeat, Briefcase, BadgeDollarSign } from 'lucide-react';

export function CommandPalette({ powerUserMode = true }: { powerUserMode?: boolean }) {
    const [open, setOpen] = React.useState(false);
    const router = useRouter();

    // Toggle the menu when ⌘K or Ctrl K is pressed
    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        // Listen for custom event from UI buttons (like Sidebar search button)
        const customOpen = () => setOpen(true);
        window.addEventListener('open-command-menu', customOpen);
        document.addEventListener('keydown', down);

        return () => {
            document.removeEventListener('keydown', down);
            window.removeEventListener('open-command-menu', customOpen);
        };
    }, []);

    const runCommand = React.useCallback(
        (command: () => unknown) => {
            setOpen(false);
            command();
        },
        [setOpen]
    );

    return (
        <>
            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-background/80 backdrop-blur-sm sm:items-start"
                    onClick={() => setOpen(false)}
                >
                    <div
                        className="w-full max-w-2xl bg-card border border-border shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Command className="w-full h-full flex flex-col" filter={(value, search) => {
                            if (value.toLowerCase().includes(search.toLowerCase())) return 1
                            return 0
                        }}>
                            <div className="flex items-center px-4 py-3 border-b border-border/50">
                                <Search className="w-5 h-5 text-muted-foreground mr-3" />
                                <Command.Input
                                    autoFocus
                                    placeholder="Type a command or search..."
                                    className="flex w-full bg-transparent outline-none placeholder:text-muted-foreground text-foreground text-base px-2"
                                />
                                <div className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded ml-2">ESC</div>
                            </div>

                            <Command.List className="max-h-[300px] overflow-y-auto p-2">
                                <Command.Empty className="p-4 text-sm text-center text-muted-foreground">
                                    No results found.
                                </Command.Empty>

                                <Command.Group heading="Actions" className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                                    <Command.Item
                                        onSelect={() => runCommand(() => router.push('/inbox'))}
                                        className="flex items-center px-3 py-2 mt-1 text-sm rounded-lg hover:bg-muted/50 aria-selected:bg-muted/50 cursor-pointer text-foreground"
                                    >
                                        <Inbox className="w-4 h-4 mr-3 text-amber-500" />
                                        Quick Capture (Vortex)
                                    </Command.Item>
                                </Command.Group>

                                <Command.Group heading="Navigation" className="px-2 py-1.5 mt-2 text-xs font-medium text-muted-foreground">
                                    <Command.Item
                                        onSelect={() => runCommand(() => router.push('/today'))}
                                        className="flex items-center px-3 py-2 mt-1 text-sm rounded-lg hover:bg-muted/50 aria-selected:bg-muted/50 cursor-pointer text-foreground"
                                    >
                                        <CalendarDays className="w-4 h-4 mr-3 text-blue-500" />
                                        Today Overview
                                    </Command.Item>
                                    <Command.Item
                                        onSelect={() => runCommand(() => router.push('/projects'))}
                                        className="flex items-center px-3 py-2 mt-1 text-sm rounded-lg hover:bg-muted/50 aria-selected:bg-muted/50 cursor-pointer text-foreground"
                                    >
                                        <FolderKanban className="w-4 h-4 mr-3 text-orange-500" />
                                        Projects
                                    </Command.Item>
                                    <Command.Item
                                        onSelect={() => runCommand(() => router.push('/goals'))}
                                        className="flex items-center px-3 py-2 mt-1 text-sm rounded-lg hover:bg-muted/50 aria-selected:bg-muted/50 cursor-pointer text-foreground"
                                    >
                                        <Target className="w-4 h-4 mr-3 text-emerald-500" />
                                        Goals
                                    </Command.Item>
                                    <Command.Item
                                        onSelect={() => runCommand(() => router.push('/rituals'))}
                                        className="flex items-center px-3 py-2 mt-1 text-sm rounded-lg hover:bg-muted/50 aria-selected:bg-muted/50 cursor-pointer text-foreground"
                                    >
                                        <Repeat className="w-4 h-4 mr-3 text-cyan-500" />
                                        Rituals
                                    </Command.Item>

                                    {powerUserMode && (
                                        <>
                                            <Command.Item
                                                onSelect={() => runCommand(() => router.push('/career/job-tracker'))}
                                                className="flex items-center px-3 py-2 mt-1 text-sm rounded-lg hover:bg-muted/50 aria-selected:bg-muted/50 cursor-pointer text-foreground"
                                            >
                                                <Briefcase className="w-4 h-4 mr-3 text-violet-500" />
                                                Job Tracker
                                            </Command.Item>
                                            <Command.Item
                                                onSelect={() => runCommand(() => router.push('/finance'))}
                                                className="flex items-center px-3 py-2 mt-1 text-sm rounded-lg hover:bg-muted/50 aria-selected:bg-muted/50 cursor-pointer text-foreground"
                                            >
                                                <BadgeDollarSign className="w-4 h-4 mr-3 text-green-500" />
                                                Finance
                                            </Command.Item>
                                        </>
                                    )}

                                    <Command.Item
                                        onSelect={() => runCommand(() => router.push('/settings'))}
                                        className="flex items-center px-3 py-2 mt-1 text-sm rounded-lg hover:bg-muted/50 aria-selected:bg-muted/50 cursor-pointer text-foreground"
                                    >
                                        <Settings className="w-4 h-4 mr-3" />
                                        System Settings
                                    </Command.Item>
                                </Command.Group>
                            </Command.List>
                        </Command>
                    </div>
                </div>
            )}
        </>
    );
}
