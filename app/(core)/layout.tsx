import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { AutomationsPanel } from '@/components/layout/AutomationsPanel';

export default function CoreLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-background">
            {/* Desktop Sidebar — hidden on mobile */}
            <div className="hidden md:block">
                <Sidebar />
            </div>

            {/* Main Content — responsive padding */}
            <main className="flex-1 h-full overflow-y-auto relative">
                <div className="max-w-full md:max-w-5xl mx-auto p-4 pb-20 md:p-8 md:pb-8">
                    <AutomationsPanel />
                    {children}
                </div>
            </main>

            {/* Mobile Bottom Nav — visible only on mobile */}
            <MobileNav />
        </div>
    );
}
