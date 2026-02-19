import { getGoal, getGoalHealth } from '@/actions/goals';
import { GoalDetailClient } from '@/components/goals/GoalDetailClient';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import prisma from '@/lib/prisma';

export default async function GoalDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const [goal, healthData, userSettings] = await Promise.all([
        getGoal(id),
        getGoalHealth(id),
        prisma.userSettings.findFirst(),
    ]);

    if (!goal) notFound();

    // Serialize for client
    const serializedGoal = {
        id: goal.id,
        title: goal.title,
        description: goal.description,
        status: goal.status,
        targetDate: goal.targetDate?.toISOString() || null,
        notes: goal.notes,
        pillar: {
            id: goal.pillar.id,
            name: goal.pillar.name,
            colorHex: goal.pillar.colorHex,
        },
        quarterlyObjectives: goal.quarterlyObjectives.map((q) => ({
            id: q.id,
            quarter: q.quarter,
            title: q.title,
            status: q.status,
            topOutcomes: q.topOutcomes ? JSON.parse(q.topOutcomes) : [],
            projects: q.projects.map((p) => ({
                id: p.id,
                title: p.title,
                status: p.status,
                milestones: p.milestones,
                milestonesTotal: p.milestones.length,
                milestonesComplete: p.milestones.filter((m) => m.status === 'complete').length,
                tasksCount: p.tasks.length,
                tasks: p.tasks.map(t => ({ // Pass full tasks
                    id: t.id,
                    title: t.title,
                    status: t.status,
                    estimateMinutes: t.estimateMinutes,
                    energyLevel: t.energyLevel,
                    scheduledDate: t.scheduledDate ? t.scheduledDate.toISOString() : null,
                })),
            })),
            rituals: q.rituals.map((s) => ({
                id: s.id,
                title: s.title,
                cadenceType: s.cadenceType,
                targetPerCycle: s.targetPerCycle,
                currentCycleCount: s.currentCycleCount,
            })),
        })),
        projects: goal.projects.filter((p) => !p.quarterlyObjectiveId).map((p) => ({
            id: p.id,
            title: p.title,
            status: p.status,
            milestones: p.milestones,
            milestonesTotal: p.milestones.length,
            milestonesComplete: p.milestones.filter((m) => m.status === 'complete').length,
            tasksCount: p.tasks.length,
            tasks: p.tasks.map(t => ({ // Pass full tasks
                id: t.id,
                title: t.title,
                status: t.status,
                estimateMinutes: t.estimateMinutes,
                energyLevel: t.energyLevel,
                scheduledDate: t.scheduledDate ? t.scheduledDate.toISOString() : null,
            })),
        })),
        rituals: goal.rituals.filter((s) => !s.quarterlyObjectiveId).map((s) => ({
            id: s.id,
            title: s.title,
            cadenceType: s.cadenceType,
            targetPerCycle: s.targetPerCycle,
            currentCycleCount: s.currentCycleCount,
        })),
    };

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link href="/goals" className="hover:text-foreground transition-colors">
                    Goals
                </Link>
                <ChevronRight className="w-4 h-4" />
                <span
                    className="flex items-center gap-1"
                    style={{ color: goal.pillar.colorHex }}
                >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: goal.pillar.colorHex }} />
                    {goal.pillar.name}
                </span>
                <ChevronRight className="w-4 h-4" />
                <span className="text-foreground">{goal.title}</span>
            </div>

            <GoalDetailClient
                goal={serializedGoal}
                health={{
                    health: healthData.health,
                    reasons: healthData.reasons,
                    contributorCount: healthData.contributorCount,
                    progressEstimate: healthData.progressEstimate,
                }}
                jobHuntingRitualId={userSettings?.jobHuntingRitualId}
            />
        </div>
    );
}
