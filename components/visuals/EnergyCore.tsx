// components/visuals/EnergyCore.tsx
"use client";

import { motion } from "framer-motion";
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface EnergyCoreProps {
    capacity?: number;
    currentLoad?: number;
}

export function EnergyCore({ capacity = 100, currentLoad = 0 }: EnergyCoreProps) {
    const integrity = Math.max(0, capacity - currentLoad);
    const percentage = (integrity / capacity) * 100;

    // Determine State
    const isCritical = percentage < 30;
    const isOptimal = percentage > 70;

    // Color Logic
    let fillColor = "#7c3aed"; // Default Primary (Violet)
    if (isOptimal) fillColor = "#10b981"; // Emerald
    if (isCritical) fillColor = "#f43f5e"; // Rose

    const data = [{ name: "Energy", value: integrity, fill: fillColor }];

    return (
        <motion.div
            className={cn(
                "glass-panel p-6 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden",
                isCritical && "border-red-500/30 shadow-[0_0_20px_rgba(244,63,94,0.2)]"
            )}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            {/* Background Pulse for Critical State */}
            {isCritical && (
                <motion.div
                    className="absolute inset-0 bg-red-500/10 z-0"
                    animate={{ opacity: [0.1, 0.3, 0.1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
            )}

            <div className="z-10 w-full flex flex-col items-center">
                <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-gray-200">
                    <Zap className={cn("w-5 h-5", isCritical ? "text-red-400" : "text-electric")} />
                    CORE INTEGRITY
                </h2>

                <div className="h-48 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                            innerRadius="80%"
                            outerRadius="100%"
                            barSize={12}
                            data={data}
                            startAngle={90}
                            endAngle={-270}
                        >
                            <PolarAngleAxis
                                type="number"
                                domain={[0, capacity]}
                                angleAxisId={0}
                                tick={false}
                            />
                            <RadialBar
                                background={{ fill: "rgba(255,255,255,0.05)" }}
                                dataKey="value"
                                cornerRadius={10}
                            />
                        </RadialBarChart>
                    </ResponsiveContainer>

                    {/* Center Digital Readout */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span
                            className={cn(
                                "text-5xl font-mono font-bold tracking-tighter",
                                isCritical ? "text-red-400" : isOptimal ? "text-emerald-400" : "text-white"
                            )}
                        >
                            {integrity}
                        </span>
                        <span className="text-xs text-gray-500 uppercase tracking-widest mt-1">
                            UNITS
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
