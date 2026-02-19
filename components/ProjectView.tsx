// components/ProjectView.tsx
"use client";

import { useMemo, useState } from "react";
import { DndContext, DragOverlay, closestCorners } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { CheckCircle2, Circle } from "lucide-react";

type Project = {
    id: string;
    title: string;
    archetype: string;
    metadata?: string;
};

// --- KANBAN COMPONENTS ---
function SortableItem({ id, children }: { id: string; children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
    const style = { transform: CSS.Transform.toString(transform), transition };
    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="mb-2">
            {children}
        </div>
    );
}

function KanbanBoard() {
    const [items, setItems] = useState(["To Apply", "Applied", "Interview", "Offer"]);
    return (
        <div className="grid grid-cols-4 gap-4 h-96">
            <DndContext collisionDetection={closestCorners}>
                {items.map((col) => (
                    <div key={col} className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <h3 className="font-bold mb-4 text-electric">{col}</h3>
                        <div className="space-y-2">
                            <div className="bg-black/40 p-3 rounded-lg border border-white/5 text-sm">
                                Sample Task
                            </div>
                        </div>
                    </div>
                ))}
            </DndContext>
        </div>
    );
}

// --- TRACKER COMPONENT ---
function TrackerChart() {
    const data = [
        { name: "Mon", progress: 20 },
        { name: "Tue", progress: 45 },
        { name: "Wed", progress: 60 },
        { name: "Thu", progress: 80 },
        { name: "Fri", progress: 100 },
    ];
    return (
        <div className="h-96 w-full glass-panel p-4 rounded-xl">
            <h3 className="mb-4 font-bold">Progress Velocity</h3>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <XAxis dataKey="name" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#030014', borderColor: '#7c3aed' }}
                        itemStyle={{ color: '#fff' }}
                    />
                    <Line type="monotone" dataKey="progress" stroke="#7c3aed" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

// --- STANDARD COMPONENT ---
function Checklist() {
    return (
        <div className="glass-panel p-6 rounded-xl space-y-4">
            {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-lg transition">
                    <Circle className="text-gray-500 hover:text-electric cursor-pointer" />
                    <span className="text-gray-200">Standard protocol step {i}</span>
                </div>
            ))}
        </div>
    );
}

// --- MAIN PROJECT VIEW ---
export default function ProjectView({ project }: { project: Project }) {
    switch (project.archetype) {
        case "pipeline":
            return <KanbanBoard />;
        case "tracker":
            return <TrackerChart />;
        case "standard":
            return <Checklist />;
        default:
            return <div className="text-red-500">Unknown Archetype</div>;
    }
}
