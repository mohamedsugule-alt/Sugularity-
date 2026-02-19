// components/logic/PhoenixProtocol.tsx
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function PhoenixProtocol() {
    const [isRecoveryMode, setIsRecoveryMode] = useState(false);
    const [daysAbsent, setDaysAbsent] = useState(0);

    useEffect(() => {
        const checkSystemDrift = () => {
            const lastLogin = localStorage.getItem("sugularity_last_login");
            const now = new Date();

            if (lastLogin) {
                const lastDate = new Date(lastLogin);
                const diffTime = Math.abs(now.getTime() - lastDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays > 7) {
                    setDaysAbsent(diffDays);
                    setIsRecoveryMode(true);
                } else {
                    // Update login if within safe threshold
                    localStorage.setItem("sugularity_last_login", now.toISOString());
                }
            } else {
                // First login
                localStorage.setItem("sugularity_last_login", now.toISOString());
            }
        };

        checkSystemDrift();
    }, []);

    const handleResume = () => {
        localStorage.setItem("sugularity_last_login", new Date().toISOString());
        setIsRecoveryMode(false);
    };

    const handleSoftReset = () => {
        // Logic to move overdue tasks to backlog would go here
        console.log("Initiating Soft Reset Sequence...");
        handleResume();
    };

    return (
        <AnimatePresence>
            {isRecoveryMode && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-void/90 backdrop-blur-xl flex items-center justify-center p-8"
                >
                    <div className="max-w-md w-full glass-panel p-8 rounded-2xl border-orange-500/20 shadow-[0_0_50px_rgba(249,115,22,0.1)]">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mb-6">
                                <Flame size={32} className="text-orange-500 animate-pulse" />
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-2">System Drift Detected</h2>
                            <p className="text-gray-400 mb-6">
                                Welcome back, Pilot. You have been absent for <span className="text-orange-400 font-mono">{daysAbsent} days</span>.
                                The Phoenix Protocol ensures you don't return to a wall of red notifications.
                            </p>

                            <div className="grid grid-cols-2 gap-4 w-full">
                                <button
                                    onClick={handleResume}
                                    className="flex flex-col items-center justify-center p-4 rounded-xl bg-surface border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all"
                                >
                                    <span className="font-bold text-white mb-1">Resume</span>
                                    <span className="text-xs text-gray-500">No changes</span>
                                </button>
                                <button
                                    onClick={handleSoftReset}
                                    className="flex flex-col items-center justify-center p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 transition-all text-orange-400"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <RefreshCw size={14} />
                                        <span className="font-bold">Soft Reset</span>
                                    </div>
                                    <span className="text-xs opacity-70">Archive Overdue</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

