import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        console.log("Starting Full Data Export...");

        // Fetch all major tables
        const [
            userSettings,
            pillars,
            goals,
            quarterlyObjectives,
            projects,
            milestones,
            rituals,
            ritualEntries,
            ritualCycleRecords,
            tasks,
            inboxItems,
            dailyOutcomes,
            dailyLogs,
            transactions,
            budgetCategories,
            budgetPeriods,
            jobApplications,
            reviewLogs,
            archiveRecords,
            bankruptcyRecords,
            focusSessions
        ] = await Promise.all([
            prisma.userSettings.findMany(),
            prisma.pillar.findMany(),
            prisma.goal.findMany(),
            prisma.quarterlyObjective.findMany(),
            prisma.project.findMany(),
            prisma.milestone.findMany(),
            prisma.ritual.findMany(),
            prisma.ritualEntry.findMany(),
            prisma.ritualCycleRecord.findMany(),
            prisma.task.findMany(),
            prisma.inboxItem.findMany(),
            prisma.dailyOutcome.findMany(),
            prisma.dailyLog.findMany(),
            prisma.transaction.findMany(),
            prisma.budgetCategory.findMany(),
            prisma.budgetPeriod.findMany(),
            prisma.jobApplication.findMany(),
            prisma.reviewLog.findMany(),
            prisma.archiveRecord.findMany(),
            prisma.bankruptcyRecord.findMany(),
            prisma.focusSession.findMany(),
        ]);

        const exportData = {
            exportDate: new Date().toISOString(),
            version: '1.0',
            data: {
                userSettings,
                pillars,
                goals,
                quarterlyObjectives,
                projects,
                milestones,
                rituals,
                ritualEntries,
                ritualCycleRecords,
                tasks,
                inboxItems,
                dailyOutcomes,
                dailyLogs,
                transactions,
                budgetCategories,
                budgetPeriods,
                jobApplications,
                reviewLogs,
                archiveRecords,
                bankruptcyRecords,
                focusSessions
            }
        };

        console.log("Export Successful.");

        return new NextResponse(JSON.stringify(exportData, null, 2), {
            status: 200,
            headers: {
                'Content-Disposition': `attachment; filename="sugularity-export-${new Date().toISOString().split('T')[0]}.json"`,
                'Content-Type': 'application/json',
            },
        });

    } catch (error) {
        console.error("Error generating export:", error);
        return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
    }
}
