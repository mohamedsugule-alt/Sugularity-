'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// ============================================
// TEMPLATE DEFINITIONS
// ============================================

export type TemplateType = 'project' | 'ritual' | 'goalKit';
export type TemplateCategory = 'health' | 'career' | 'finance' | 'learning' | 'family' | 'lifeAdmin';

export interface ProjectTemplateData {
    description?: string;
    milestones: { title: string; daysFromStart: number }[];
    tasks: { title: string; estimateMinutes?: number; optional?: boolean }[];
}

export interface RitualTemplateData {
    description?: string;
    cadenceType: 'weekly' | 'monthly';
    targetPerCycle: number;
    starterTasks?: { title: string; estimateMinutes?: number }[];
}

export interface GoalKitTemplateData {
    description?: string;
    goal: { title: string; description?: string };
    quarterlyObjective: { title: string; topOutcomes: string[] };
    project?: ProjectTemplateData;
    ritual?: RitualTemplateData;
    starterTasks?: { title: string; estimateMinutes?: number }[];
}

// ============================================
// BUILT-IN TEMPLATES
// ============================================

const BUILT_IN_TEMPLATES = [
    // PROJECT TEMPLATES
    {
        name: 'Portfolio Upgrade Sprint',
        type: 'project' as TemplateType,
        category: 'career' as TemplateCategory,
        description: 'Refresh your professional portfolio in 4 weeks',
        templateData: JSON.stringify({
            description: 'A focused sprint to update and improve your professional portfolio',
            milestones: [
                { title: 'Audit current portfolio', daysFromStart: 7 },
                { title: 'Update content and projects', daysFromStart: 21 },
                { title: 'Polish and launch', daysFromStart: 28 },
            ],
            tasks: [
                { title: 'Review current portfolio critically', estimateMinutes: 60 },
                { title: 'List recent projects to add', estimateMinutes: 30 },
                { title: 'Write case study for best project', estimateMinutes: 90 },
                { title: 'Update bio and headshot', estimateMinutes: 45 },
                { title: 'Test on mobile devices', estimateMinutes: 20 },
                { title: 'Get feedback from 2 peers', estimateMinutes: 30, optional: true },
            ],
        } as ProjectTemplateData),
    },
    {
        name: 'Course Completion (8 weeks)',
        type: 'project' as TemplateType,
        category: 'learning' as TemplateCategory,
        description: 'Complete an online course with structured milestones',
        templateData: JSON.stringify({
            description: 'Structured approach to completing an 8-week online course',
            milestones: [
                { title: 'Complete Module 1-2', daysFromStart: 14 },
                { title: 'Complete Module 3-4', daysFromStart: 28 },
                { title: 'Complete Module 5-6', daysFromStart: 42 },
                { title: 'Final project/exam', daysFromStart: 56 },
            ],
            tasks: [
                { title: 'Enroll and download materials', estimateMinutes: 20 },
                { title: 'Set up study schedule', estimateMinutes: 15 },
                { title: 'Complete week 1 lessons', estimateMinutes: 120 },
                { title: 'Complete week 2 lessons', estimateMinutes: 120 },
                { title: 'Take mid-course assessment', estimateMinutes: 60, optional: true },
            ],
        } as ProjectTemplateData),
    },
    {
        name: 'Emergency Fund Setup',
        type: 'project' as TemplateType,
        category: 'finance' as TemplateCategory,
        description: 'Build a 3-month emergency fund systematically',
        templateData: JSON.stringify({
            description: 'Plan and execute building your emergency fund',
            milestones: [
                { title: 'Calculate target amount', daysFromStart: 7 },
                { title: 'Set up auto-savings', daysFromStart: 14 },
                { title: 'Reach 1-month buffer', daysFromStart: 90 },
            ],
            tasks: [
                { title: 'Calculate monthly expenses', estimateMinutes: 45 },
                { title: 'Open high-yield savings account', estimateMinutes: 30 },
                { title: 'Set up automatic transfers', estimateMinutes: 20 },
                { title: 'Review and cut unnecessary expenses', estimateMinutes: 60 },
            ],
        } as ProjectTemplateData),
    },
    {
        name: 'Home Organization Sprint',
        type: 'project' as TemplateType,
        category: 'lifeAdmin' as TemplateCategory,
        description: 'Declutter and organize one room at a time',
        templateData: JSON.stringify({
            description: 'Systematic approach to home organization',
            milestones: [
                { title: 'Kitchen organized', daysFromStart: 7 },
                { title: 'Living room organized', daysFromStart: 14 },
                { title: 'Bedroom organized', daysFromStart: 21 },
            ],
            tasks: [
                { title: 'Take before photos', estimateMinutes: 10 },
                { title: 'Sort items into keep/donate/trash', estimateMinutes: 90 },
                { title: 'Deep clean surfaces', estimateMinutes: 60 },
                { title: 'Install organizers', estimateMinutes: 45 },
                { title: 'Donate items', estimateMinutes: 30 },
            ],
        } as ProjectTemplateData),
    },
    {
        name: 'Build Resume + Applications',
        type: 'project' as TemplateType,
        category: 'career' as TemplateCategory,
        description: 'Update resume and apply to target jobs',
        templateData: JSON.stringify({
            description: 'Job search preparation project',
            milestones: [
                { title: 'Resume updated', daysFromStart: 7 },
                { title: '5 applications sent', daysFromStart: 14 },
                { title: '10 applications sent', daysFromStart: 28 },
            ],
            tasks: [
                { title: 'List accomplishments from last role', estimateMinutes: 45 },
                { title: 'Update resume with metrics', estimateMinutes: 60 },
                { title: 'Write master cover letter template', estimateMinutes: 45 },
                { title: 'Research target companies', estimateMinutes: 60 },
                { title: 'Customize and send first application', estimateMinutes: 30 },
            ],
        } as ProjectTemplateData),
    },
    {
        name: 'Plan a Trip',
        type: 'project' as TemplateType,
        category: 'lifeAdmin' as TemplateCategory,
        description: 'Plan a vacation from research to booking',
        templateData: JSON.stringify({
            description: 'End-to-end trip planning',
            milestones: [
                { title: 'Destination decided', daysFromStart: 7 },
                { title: 'Flights and hotels booked', daysFromStart: 21 },
                { title: 'Itinerary finalized', daysFromStart: 35 },
            ],
            tasks: [
                { title: 'Research destinations', estimateMinutes: 60 },
                { title: 'Compare flight prices', estimateMinutes: 45 },
                { title: 'Book accommodations', estimateMinutes: 30 },
                { title: 'Create daily itinerary', estimateMinutes: 45 },
                { title: 'Pack checklist', estimateMinutes: 20, optional: true },
            ],
        } as ProjectTemplateData),
    },

    // RITUAL TEMPLATES
    {
        name: 'Workout Routine',
        type: 'ritual' as TemplateType,
        category: 'health' as TemplateCategory,
        description: 'Maintain consistent weekly exercise',
        templateData: JSON.stringify({
            description: 'Track and maintain your workout consistency',
            cadenceType: 'weekly',
            targetPerCycle: 4,
            starterTasks: [
                { title: 'Morning workout session', estimateMinutes: 45 },
                { title: 'Evening walk/jog', estimateMinutes: 30 },
            ],
        } as RitualTemplateData),
    },
    {
        name: 'Weekly Finance Check-in',
        type: 'ritual' as TemplateType,
        category: 'finance' as TemplateCategory,
        description: 'Review spending and budget weekly',
        templateData: JSON.stringify({
            description: 'Regular financial health check',
            cadenceType: 'weekly',
            targetPerCycle: 1,
            starterTasks: [
                { title: 'Review last week\'s spending', estimateMinutes: 20 },
                { title: 'Update budget tracker', estimateMinutes: 15 },
                { title: 'Check account balances', estimateMinutes: 10 },
            ],
        } as RitualTemplateData),
    },
    {
        name: 'Daily Learning (30 min)',
        type: 'ritual' as TemplateType,
        category: 'learning' as TemplateCategory,
        description: 'Consistent daily learning habit',
        templateData: JSON.stringify({
            description: 'Build a daily learning practice',
            cadenceType: 'weekly',
            targetPerCycle: 5,
            starterTasks: [
                { title: 'Read/study session', estimateMinutes: 30 },
            ],
        } as RitualTemplateData),
    },
    {
        name: 'Weekly Home Reset',
        type: 'ritual' as TemplateType,
        category: 'lifeAdmin' as TemplateCategory,
        description: 'Keep home tidy with weekly maintenance',
        templateData: JSON.stringify({
            description: 'Prevent clutter buildup',
            cadenceType: 'weekly',
            targetPerCycle: 1,
            starterTasks: [
                { title: 'Vacuum/mop floors', estimateMinutes: 30 },
                { title: 'Wipe down surfaces', estimateMinutes: 20 },
                { title: 'Laundry and fold', estimateMinutes: 45 },
            ],
        } as RitualTemplateData),
    },
    {
        name: 'Weekly Family Connection',
        type: 'ritual' as TemplateType,
        category: 'family' as TemplateCategory,
        description: 'Maintain family relationships',
        templateData: JSON.stringify({
            description: 'Regular family check-ins',
            cadenceType: 'weekly',
            targetPerCycle: 2,
            starterTasks: [
                { title: 'Call family member', estimateMinutes: 30 },
                { title: 'Plan family activity', estimateMinutes: 15 },
            ],
        } as RitualTemplateData),
    },
    {
        name: 'Weekly Planning + Review',
        type: 'ritual' as TemplateType,
        category: 'lifeAdmin' as TemplateCategory,
        description: 'Weekly review and planning ritual',
        templateData: JSON.stringify({
            description: 'Stay on top of your system',
            cadenceType: 'weekly',
            targetPerCycle: 1,
            starterTasks: [
                { title: 'Complete weekly review', estimateMinutes: 45 },
                { title: 'Plan next week priorities', estimateMinutes: 20 },
            ],
        } as RitualTemplateData),
    },

    // GOAL KITS
    {
        name: 'Get Fit This Year',
        type: 'goalKit' as TemplateType,
        category: 'health' as TemplateCategory,
        description: 'Comprehensive fitness goal with workout ritual and quarterly milestones',
        templateData: JSON.stringify({
            description: 'Annual fitness transformation kit',
            goal: {
                title: 'Get Fit This Year',
                description: 'Build sustainable fitness habits and reach target weight/strength',
            },
            quarterlyObjective: {
                title: 'Establish Workout Routine',
                topOutcomes: [
                    'Exercise 3-4x weekly consistently',
                    'Track progress metrics',
                    'Build habit that lasts',
                ],
            },
            ritual: {
                description: 'Weekly workout tracking',
                cadenceType: 'weekly',
                targetPerCycle: 4,
            },
            starterTasks: [
                { title: 'Get gym membership or home equipment', estimateMinutes: 60 },
                { title: 'Schedule workout times in calendar', estimateMinutes: 15 },
                { title: 'Take baseline measurements', estimateMinutes: 20 },
            ],
        } as GoalKitTemplateData),
    },
    {
        name: 'Career Upgrade',
        type: 'goalKit' as TemplateType,
        category: 'career' as TemplateCategory,
        description: 'Level up your career with skills, networking, and opportunities',
        templateData: JSON.stringify({
            description: 'Career growth kit',
            goal: {
                title: 'Career Upgrade',
                description: 'Advance to next level through skills, visibility, and opportunities',
            },
            quarterlyObjective: {
                title: 'Build Skills & Visibility',
                topOutcomes: [
                    'Complete 1 certification/course',
                    'Expand professional network',
                    'Update professional presence',
                ],
            },
            project: {
                description: 'Portfolio and skills upgrade',
                milestones: [
                    { title: 'Course selected and started', daysFromStart: 14 },
                    { title: 'Portfolio updated', daysFromStart: 45 },
                    { title: 'Certification complete', daysFromStart: 90 },
                ],
                tasks: [
                    { title: 'Research relevant certifications', estimateMinutes: 45 },
                    { title: 'Update LinkedIn profile', estimateMinutes: 30 },
                    { title: 'Connect with 5 industry peers', estimateMinutes: 30 },
                ],
            },
            starterTasks: [
                { title: 'Define career target role', estimateMinutes: 30 },
                { title: 'List skill gaps', estimateMinutes: 20 },
            ],
        } as GoalKitTemplateData),
    },
    {
        name: 'Financial Stability',
        type: 'goalKit' as TemplateType,
        category: 'finance' as TemplateCategory,
        description: 'Build emergency fund, reduce debt, and establish financial routines',
        templateData: JSON.stringify({
            description: 'Financial foundation kit',
            goal: {
                title: 'Financial Stability',
                description: 'Build emergency fund, manage debt, and establish healthy money habits',
            },
            quarterlyObjective: {
                title: 'Build Emergency Fund',
                topOutcomes: [
                    'Save 1 month of expenses',
                    'Track spending weekly',
                    'Reduce unnecessary subscriptions',
                ],
            },
            project: {
                description: 'Emergency fund project',
                milestones: [
                    { title: 'Budget created', daysFromStart: 7 },
                    { title: 'Auto-savings configured', daysFromStart: 14 },
                    { title: '1-month buffer reached', daysFromStart: 90 },
                ],
                tasks: [
                    { title: 'Calculate monthly expenses', estimateMinutes: 45 },
                    { title: 'Open high-yield savings', estimateMinutes: 30 },
                    { title: 'Set up automatic transfers', estimateMinutes: 20 },
                ],
            },
            ritual: {
                description: 'Weekly finance check-in',
                cadenceType: 'weekly',
                targetPerCycle: 1,
            },
            starterTasks: [
                { title: 'List all income sources', estimateMinutes: 15 },
                { title: 'List all recurring expenses', estimateMinutes: 30 },
            ],
        } as GoalKitTemplateData),
    },

    // SPRINT 4 ADDITIONS (to reach 20)
    {
        name: 'Sleep Routine',
        type: 'ritual' as TemplateType,
        category: 'health' as TemplateCategory,
        description: 'Maintain consistent sleep schedule',
        templateData: JSON.stringify({
            description: 'Track and improve your sleep habits',
            cadenceType: 'weekly',
            targetPerCycle: 7,
            starterTasks: [
                { title: 'Wind-down routine (9pm)', estimateMinutes: 30 },
                { title: 'No screens after 10pm', estimateMinutes: 5 },
            ],
        } as RitualTemplateData),
    },
    {
        name: 'Meal Prep Sunday',
        type: 'project' as TemplateType,
        category: 'health' as TemplateCategory,
        description: 'Weekly meal prep routine setup',
        templateData: JSON.stringify({
            description: 'Establish a sustainable meal prep habit',
            milestones: [
                { title: 'Recipe collection ready', daysFromStart: 7 },
                { title: 'First meal prep complete', daysFromStart: 14 },
                { title: 'Routine established', daysFromStart: 28 },
            ],
            tasks: [
                { title: 'Gather 5-7 simple recipes', estimateMinutes: 30 },
                { title: 'Create grocery list template', estimateMinutes: 15 },
                { title: 'Buy meal prep containers', estimateMinutes: 20 },
                { title: 'Complete first prep session', estimateMinutes: 120 },
            ],
        } as ProjectTemplateData),
    },
    {
        name: 'Monthly Budget Review',
        type: 'ritual' as TemplateType,
        category: 'finance' as TemplateCategory,
        description: 'Monthly financial review and adjustment',
        templateData: JSON.stringify({
            description: 'Regular monthly financial checkup',
            cadenceType: 'monthly',
            targetPerCycle: 1,
            starterTasks: [
                { title: 'Review all transactions', estimateMinutes: 30 },
                { title: 'Update budget categories', estimateMinutes: 15 },
                { title: 'Plan next month spending', estimateMinutes: 20 },
            ],
        } as RitualTemplateData),
    },
    {
        name: 'Interview Prep Sprint',
        type: 'project' as TemplateType,
        category: 'career' as TemplateCategory,
        description: 'Prepare for job interviews systematically',
        templateData: JSON.stringify({
            description: 'Comprehensive interview preparation',
            milestones: [
                { title: 'STAR stories ready', daysFromStart: 7 },
                { title: 'Technical prep complete', daysFromStart: 14 },
                { title: 'Mock interviews done', daysFromStart: 21 },
            ],
            tasks: [
                { title: 'Write 10 STAR stories', estimateMinutes: 90 },
                { title: 'Research common questions', estimateMinutes: 45 },
                { title: 'Prepare your 2-minute pitch', estimateMinutes: 30 },
                { title: 'Schedule mock interview', estimateMinutes: 15 },
                { title: 'Research target company', estimateMinutes: 45 },
            ],
        } as ProjectTemplateData),
    },
    {
        name: 'Document Renewal Tracker',
        type: 'project' as TemplateType,
        category: 'lifeAdmin' as TemplateCategory,
        description: 'Track and renew important documents',
        templateData: JSON.stringify({
            description: 'Never miss a renewal deadline',
            milestones: [
                { title: 'Document inventory complete', daysFromStart: 7 },
                { title: 'Calendar reminders set', daysFromStart: 14 },
                { title: 'All urgent renewals done', daysFromStart: 30 },
            ],
            tasks: [
                { title: 'List all documents with expiry dates', estimateMinutes: 45 },
                { title: 'Create renewal calendar', estimateMinutes: 20 },
                { title: 'Gather required documents for renewals', estimateMinutes: 30 },
                { title: 'Schedule appointments', estimateMinutes: 20 },
            ],
        } as ProjectTemplateData),
    },
];

// ============================================
// TEMPLATE ACTIONS
// ============================================

export async function getTemplates(filters?: { type?: TemplateType; category?: TemplateCategory }) {
    const where: any = {};
    if (filters?.type) where.type = filters.type;
    if (filters?.category) where.category = filters.category;

    return prisma.template.findMany({
        where,
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
}

export async function getTemplate(id: string) {
    return prisma.template.findUnique({ where: { id } });
}

export async function seedBuiltInTemplates() {
    for (const template of BUILT_IN_TEMPLATES) {
        await prisma.template.upsert({
            where: { id: template.name.toLowerCase().replace(/\s+/g, '-') },
            update: {},
            create: {
                id: template.name.toLowerCase().replace(/\s+/g, '-'),
                ...template,
                isBuiltIn: true,
            },
        });
    }
    return { success: true, count: BUILT_IN_TEMPLATES.length };
}

export async function applyTemplate(
    templateId: string,
    config: {
        pillarId: string;
        goalId?: string;
        quarterlyObjectiveId?: string;
        customNames?: Record<string, string>;
        startDate?: Date;
        includeOptional?: boolean;
    }
) {
    const template = await prisma.template.findUnique({ where: { id: templateId } });
    if (!template) throw new Error('Template not found');

    const data = JSON.parse(template.templateData);
    const startDate = config.startDate || new Date();
    const results: { projects: string[]; rituals: string[]; tasks: string[]; goal?: string } = {
        projects: [],
        rituals: [],
        tasks: [],
    };

    // Apply based on template type
    if (template.type === 'project') {
        const projectData = data as ProjectTemplateData;
        const project = await prisma.project.create({
            data: {
                title: config.customNames?.project || template.name,
                description: projectData.description,
                pillarId: config.pillarId,
                goalId: config.goalId,
                quarterlyObjectiveId: config.quarterlyObjectiveId,
            },
        });
        results.projects.push(project.id);

        // Create milestones
        for (const m of projectData.milestones) {
            const targetDate = new Date(startDate.getTime() + m.daysFromStart * 24 * 60 * 60 * 1000);
            await prisma.milestone.create({
                data: {
                    projectId: project.id,
                    title: m.title,
                    targetDate,
                },
            });
        }

        // Create tasks
        for (const t of projectData.tasks) {
            if (t.optional && !config.includeOptional) continue;
            const task = await prisma.task.create({
                data: {
                    title: t.title,
                    pillarId: config.pillarId,
                    projectId: project.id,
                    estimateMinutes: t.estimateMinutes,
                },
            });
            results.tasks.push(task.id);
        }
    }

    if (template.type === 'ritual') {
        const ritualData = data as RitualTemplateData;
        const ritual = await prisma.ritual.create({
            data: {
                title: config.customNames?.ritual || template.name,
                description: ritualData.description,
                pillarId: config.pillarId,
                goalId: config.goalId,
                quarterlyObjectiveId: config.quarterlyObjectiveId,
                cadenceType: ritualData.cadenceType,
                targetPerCycle: ritualData.targetPerCycle,
            },
        });
        results.rituals.push(ritual.id);

        // Create starter tasks
        if (ritualData.starterTasks) {
            for (const t of ritualData.starterTasks) {
                const task = await prisma.task.create({
                    data: {
                        title: t.title,
                        pillarId: config.pillarId,
                        ritualId: ritual.id,
                        estimateMinutes: t.estimateMinutes,
                    },
                });
                results.tasks.push(task.id);
            }
        }
    }

    if (template.type === 'goalKit') {
        const kitData = data as GoalKitTemplateData;

        // Create goal
        const goal = await prisma.goal.create({
            data: {
                title: config.customNames?.goal || kitData.goal.title,
                description: kitData.goal.description,
                pillarId: config.pillarId,
            },
        });
        results.goal = goal.id;

        // Create quarterly objective
        const now = new Date();
        const quarter = `${now.getFullYear()}-Q${Math.ceil((now.getMonth() + 1) / 3)}`;
        const quarterlyObj = await prisma.quarterlyObjective.create({
            data: {
                goalId: goal.id,
                quarter,
                title: config.customNames?.objective || kitData.quarterlyObjective.title,
                topOutcomes: JSON.stringify(kitData.quarterlyObjective.topOutcomes),
            },
        });

        // Create project if in kit
        if (kitData.project) {
            const project = await prisma.project.create({
                data: {
                    title: `${goal.title} - Project`,
                    description: kitData.project.description,
                    pillarId: config.pillarId,
                    goalId: goal.id,
                    quarterlyObjectiveId: quarterlyObj.id,
                },
            });
            results.projects.push(project.id);

            for (const m of kitData.project.milestones) {
                const targetDate = new Date(startDate.getTime() + m.daysFromStart * 24 * 60 * 60 * 1000);
                await prisma.milestone.create({
                    data: { projectId: project.id, title: m.title, targetDate },
                });
            }

            for (const t of kitData.project.tasks) {
                const task = await prisma.task.create({
                    data: {
                        title: t.title,
                        pillarId: config.pillarId,
                        projectId: project.id,
                        estimateMinutes: t.estimateMinutes,
                    },
                });
                results.tasks.push(task.id);
            }
        }

        // Create ritual if in kit
        if (kitData.ritual) {
            const ritual = await prisma.ritual.create({
                data: {
                    title: `${goal.title} - Ritual`,
                    description: kitData.ritual.description,
                    pillarId: config.pillarId,
                    goalId: goal.id,
                    quarterlyObjectiveId: quarterlyObj.id,
                    cadenceType: kitData.ritual.cadenceType,
                    targetPerCycle: kitData.ritual.targetPerCycle,
                },
            });
            results.rituals.push(ritual.id);
        }

        // Create starter tasks
        if (kitData.starterTasks) {
            for (const t of kitData.starterTasks) {
                const task = await prisma.task.create({
                    data: {
                        title: t.title,
                        pillarId: config.pillarId,
                        estimateMinutes: t.estimateMinutes,
                    },
                });
                results.tasks.push(task.id);
            }
        }
    }

    revalidatePath('/');
    return results;
}
