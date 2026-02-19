'use client';

import { useState, useRef, useEffect } from 'react';
import { updateTask } from '@/actions/core';
import { Zap, Battery, BatteryMedium, BatteryLow } from 'lucide-react';
import { toast } from 'sonner';

type Props = {
    taskId: string;
    currentLevel: string;
    onUpdate?: (level: string) => void;
};

export function EnergySelector({ taskId, currentLevel, onUpdate }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [level, setLevel] = useState(currentLevel);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = async (newLevel: string) => {
        setLevel(newLevel);
        setIsOpen(false);
        try {
            await updateTask(taskId, { energyLevel: newLevel });
            if (onUpdate) onUpdate(newLevel);
            toast.success('Energy level updated');
        } catch (error) {
            toast.error('Failed to update energy level');
            setLevel(currentLevel); // Revert
        }
    };

    const getIcon = (l: string) => {
        switch (l) {
            case 'high': return <Zap className="w-4 h-4 text-orange-500" />;
            case 'medium': return <BatteryMedium className="w-4 h-4 text-yellow-500" />;
            case 'low': return <BatteryLow className="w-4 h-4 text-blue-500" />;
            default: return <Battery className="w-4 h-4 text-muted-foreground" />;
        }
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                className="p-1 hover:bg-muted rounded-full transition-colors flex items-center gap-1"
                title="Set Importance/Energy"
            >
                {getIcon(level)}
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 flex flex-col p-1 min-w-[100px] animate-in fade-in zoom-in-95 duration-200">
                    <button onClick={() => handleSelect('high')} className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted rounded text-xs font-medium text-orange-500">
                        <Zap className="w-3 h-3" /> High
                    </button>
                    <button onClick={() => handleSelect('medium')} className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted rounded text-xs font-medium text-yellow-500">
                        <BatteryMedium className="w-3 h-3" /> Medium
                    </button>
                    <button onClick={() => handleSelect('low')} className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted rounded text-xs font-medium text-blue-500 block">
                        <BatteryLow className="w-3 h-3" /> Low
                    </button>
                </div>
            )}
        </div>
    );
}
