// components/projects/ProjectView.tsx
"use client";

import { cn } from "@/lib/utils";
import { KanbanSquare, ListTodo, Route } from "lucide-react";

// --- Types ---
interface Project {
    id: string;
    title: string;
    archetype: string; // 'pipeline', 'roadmap', 'standard'
    // Add other project fields as needed
}

// --- Placeholder Sub-Components ---

function KanbanBoard({ project }: { project: Project }) {
    return (
        <div className="flex gap-4 overflow-x-auto pb-4 h-[500px]">
            {["To Apply", "Applied", "Interview", "Offer"].map((col) => (
                <div key={col} className="min-w-[280px] glass-panel p-4 rounded-xl flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-300">{col}</h3>
                        <span className="text-xs bg-white/5 px-2 py-1 rounded text-gray-500">0</span>
                    </div>
                    <div className="flex-1 border-2 border-dashed border-white/5 rounded-lg flex items-center justify-center text-gray-600 text-sm">
                        Drop Zone
                    </div>
                </div>
            ))}
        </div>
    );
}

function TimelineView({ project }: { project: Project }) {
    return (
        <div className="glass-panel p-6 rounded-xl flex flex-col gap-6 h-[400px]">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Route size={18} />
                <span>Timeline Logic Initializing...</span>
            </div>
            <div className="flex-1 relative border-l-2 border-white/10 ml-4 space-y-8">
                {/* Mock Milestones */}
                {[1, 2, 3].map((i) => (
                    <div key={i} className="pl-6 relative">
                        <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-void border-2 border-electric" />
                        <h4 className="font-semibold text-white">Milestone Phase {i}</h4>
                        <p className="text-sm text-gray-500">Projected completion: Q{i} 2026</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function TaskChecklist({ project }: { project: Project }) {
    return (
        <div className="glass-panel p-6 rounded-xl">
            <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-lg group cursor-pointer transition-colors"
                    >
                        <div className="w-5 h-5 rounded-full border-2 border-gray-600 group-hover:border-electric transition-colors" />
                        <span className="text-gray-300 group-hover:text-white transition-colors">
                            Standard operating procedure task #{i}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- Main Engine ---

export default function ProjectView({ project }: { project: Project }) {
    if (!project) return null;

    switch (project.archetype) {
        case "pipeline":
            return <KanbanBoard project={project} />;
        case "roadmap": // or 'timeline' based on schema v2, mapped here
        case "timeline":
            return <TimelineView project={project} />;
        case "standard":
            return <TaskChecklist project={project} />;
        case "tracker":
            return <div className="glass-panel p-6 rounded-xl text-center text-gray-400">Tracker View Placeholder</div>
        default:
            return (
                <div className="glass-panel p-6 rounded-xl border-l-4 border-red-500 bg-red-500/5">
                    <h3 className="text-red-400 font-bold mb-1">Unknown Signal</h3>
                    <p className="text-sm text-gray-500">
                        Archetype <span className="text-white font-mono">'{project.archetype}'</span> not recognized by the Shape-Shifter engine.
                    </p>
                </div>
            );
    }
}
