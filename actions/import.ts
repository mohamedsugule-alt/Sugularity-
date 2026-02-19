'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export type ImportTemplate = {
    settings?: {
        dailyCapacityHours?: number;
        defaultEstimateMin?: number;
        workDayStart?: string;
        workDayEnd?: string;
    };
    pillars?: Array<{
        name: string;
        colorHex?: string;
        icon?: string;
        goals?: Array<{
            title: string;
            description?: string;
            status?: string;
            projects?: Array<{
                title: string;
                description?: string;
                status?: string;
                milestones?: Array<{
                    title: string;
                    status?: string;
                }>;
            }>;
            rituals?: Array<{
                title: string;
                cadenceType?: string;
                targetPerCycle?: number;
            }>;
        }>;
        projects?: Array<{
            title: string;
            description?: string;
            status?: string;
            milestones?: Array<{
                title: string;
                status?: string;
            }>;
        }>;
        rituals?: Array<{
            title: string;
            cadenceType?: string;
            targetPerCycle?: number;
        }>;
    }>;
};

export async function importSystemTemplate(data: ImportTemplate) {
    try {
        console.log('Starting system import...');

        await prisma.$transaction(async (tx) => {
            // 1. Update Settings if provided
            if (data.settings) {
                // Find existing settings or create default
                const existing = await tx.userSettings.findFirst();
                if (existing) {
                    await tx.userSettings.update({
                        where: { id: existing.id },
                        data: {
                            ...data.settings,
                        },
                    });
                } else {
                    await tx.userSettings.create({
                        data: {
                            ...data.settings,
                        },
                    });
                }
            }

            // 2. Process Pillars
            if (data.pillars && data.pillars.length > 0) {
                for (const pillarData of data.pillars) {
                    // Upsert Pillar by name
                    let pillar = await tx.pillar.findFirst({
                        where: { name: pillarData.name }
                    });

                    if (!pillar) {
                        pillar = await tx.pillar.create({
                            data: {
                                name: pillarData.name,
                                colorHex: pillarData.colorHex || '#8B5CF6',
                                icon: pillarData.icon,
                            }
                        });
                    } else {
                        // Optional: Update color if provided? Let's just keep existing to avoid overwriting user prefs unless explicitly asked.
                    }

                    // Process Goals within Pillar
                    if (pillarData.goals) {
                        for (const goalData of pillarData.goals) {
                            const goal = await tx.goal.create({
                                data: {
                                    title: goalData.title,
                                    description: goalData.description,
                                    status: goalData.status || 'active',
                                    pillarId: pillar.id,
                                }
                            });

                            // Process Projects linked to this Goal
                            if (goalData.projects) {
                                for (const projectData of goalData.projects) {
                                    const project = await tx.project.create({
                                        data: {
                                            title: projectData.title,
                                            description: projectData.description,
                                            status: projectData.status || 'active',
                                            pillarId: pillar.id,
                                            goalId: goal.id,
                                        }
                                    });

                                    // Milestones
                                    if (projectData.milestones) {
                                        for (const ms of projectData.milestones) {
                                            await tx.milestone.create({
                                                data: {
                                                    title: ms.title,
                                                    status: ms.status || 'not_started',
                                                    projectId: project.id,
                                                }
                                            });
                                        }
                                    }
                                }
                            }

                            // Process Rituals linked to this Goal
                            if (goalData.rituals) {
                                for (const ritualData of goalData.rituals) {
                                    await tx.ritual.create({
                                        data: {
                                            title: ritualData.title,
                                            cadenceType: ritualData.cadenceType || 'weekly',
                                            targetPerCycle: ritualData.targetPerCycle || 3,
                                            pillarId: pillar.id,
                                            goalId: goal.id,
                                        }
                                    });
                                }
                            }
                        }
                    }

                    // Process loose Projects (directly under Pillar)
                    if (pillarData.projects) {
                        for (const projectData of pillarData.projects) {
                            const project = await tx.project.create({
                                data: {
                                    title: projectData.title,
                                    description: projectData.description,
                                    status: projectData.status || 'active',
                                    pillarId: pillar.id,
                                }
                            });

                            // Milestones
                            if (projectData.milestones) {
                                for (const ms of projectData.milestones) {
                                    await tx.milestone.create({
                                        data: {
                                            title: ms.title,
                                            status: ms.status || 'not_started',
                                            projectId: project.id,
                                        }
                                    });
                                }
                            }
                        }
                    }

                    // Process loose Rituals (directly under Pillar)
                    if (pillarData.rituals) {
                        for (const ritualData of pillarData.rituals) {
                            await tx.ritual.create({
                                data: {
                                    title: ritualData.title,
                                    cadenceType: ritualData.cadenceType || 'weekly',
                                    targetPerCycle: ritualData.targetPerCycle || 3,
                                    pillarId: pillar.id,
                                }
                            });
                        }
                    }
                }
            }
        });

        revalidatePath('/');
        return { success: true, message: 'Import successful' };
    } catch (error) {
        console.error('Import failed:', error);
        return { success: false, message: 'Import failed: ' + (error as Error).message };
    }
}
