// components/layout/Header.tsx
"use client";

import { usePathname } from "next/navigation";

export function Header() {
    const pathname = usePathname();

    // Simple mapping for display titles (can be expanded)
    const getTitle = () => {
        switch (pathname) {
            case "/": return "COCKPIT";
            case "/strategy": return "MISSION CONTROL";
            case "/projects": return "VECTORS";
            case "/inbox": return "VORTEX";
            default: return "SYSTEM";
        }
    };

    return (
        <header className="fixed top-0 left-[260px] right-0 h-16 border-b border-white/5 bg-transparent backdrop-blur-sm z-40 flex items-center justify-between px-8">
            <div>
                <h2 className="text-sm font-bold tracking-[0.2em] text-gray-400 uppercase">
                    {getTitle()}
                </h2>
            </div>
            <div>
                {/* Placeholder for Energy Core */}
                <div className="text-xs text-gray-600 border border-dashed border-gray-700 px-3 py-1 rounded">
          /* Energy Component Here */
                </div>
            </div>
        </header>
    );
}
