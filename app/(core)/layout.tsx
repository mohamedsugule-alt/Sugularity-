import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { getSettings } from '@/actions/settings';

export const dynamic = 'force-dynamic';

export default async function CoreLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const settings = await getSettings();
    const isPowerUser = settings.powerUserMode;
    return (
        <div className="flex h-screen bg-background">
            {/* Desktop Sidebar — hidden on mobile */}
            <div className="hidden md:block">
                <Sidebar powerUserMode={isPowerUser} />
            </div>

            {/* Global Command Palette */}
            <CommandPalette powerUserMode={isPowerUser} />

            {/* Main Content — responsive padding */}
            <main className="flex-1 h-full overflow-y-auto relative">
                <div className="max-w-full md:max-w-5xl mx-auto p-4 pb-20 md:p-8 md:pb-8">
                    {children}
                </div>
            </main>

            {/* Mobile Bottom Nav — visible only on mobile */}
            <MobileNav powerUserMode={isPowerUser} />
        </div>
    );
}

