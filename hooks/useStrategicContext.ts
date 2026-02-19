// hooks/useStrategicContext.ts
"use client";

import { useState, useEffect } from "react";

// Types
// Types
interface StrategicContext {
    valueName: string;
    goalName: string;
    projectName: string;
    projectColor: string;
    isLoading: boolean;
    error?: string;
}

export function useStrategicContext(taskId: string): StrategicContext {
    const [context, setContext] = useState<StrategicContext>({
        valueName: "",
        goalName: "",
        projectName: "",
        projectColor: "",
        isLoading: true,
    });

    useEffect(() => {
        async function fetchHierarchy() {
            try {
                // SIMULATION: In a real app, this calls a Server Action (e.g., getTaskHierarchy(taskId))
                // simulating DB latency
                await new Promise((resolve) => setTimeout(resolve, 500));

                // Mock Logic based on Task ID patterns (for demo)
                const mockData = {
                    value: "Sovereign Individual",
                    goal: "Achieve Location Independence",
                    project: "Immigration Pipeline",
                    color: "#64748b", // Admin
                };

                setContext({
                    valueName: mockData.value,
                    goalName: mockData.goal,
                    projectName: mockData.project,
                    projectColor: mockData.color,
                    isLoading: false,
                });
            } catch (err) {
                setContext((prev) => ({ ...prev, isLoading: false, error: "Failed to connect to Neural Link" }));
            }
        }

        if (taskId) {
            fetchHierarchy();
        }
    }, [taskId]);

    return context;
}
