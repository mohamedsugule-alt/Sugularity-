import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Sugularity database (Sprint 4)...\n');

    // 1. Create default settings with Sprint 4 fields
    const settings = await prisma.userSettings.upsert({
        where: { id: 'default' },
        update: {},
        create: {
            id: 'default',
            dailyCapacityHours: 6,
            defaultEstimateMin: 30,
            requireEstimate: false,
            workDayStart: '09:00',
            workDayEnd: '17:00',
            coldTaskDays: 14,
            staleProjectDays: 21,
            backlogActiveLimit: 40,
            backlogColdLimit: 15,
            backlogProjectLimit: 7,
            showColdInToday: false,
            // Sprint 4: Calendar time-blocking
            calendarMode: 'off',
            defaultCalendarId: null,
            includeNotesInEvents: false,
            gmailMode: 'off',
            showEventTitles: false,
            storeEmailSnippet: true,
            // Sprint 4: Automations
            automationsEnabled: true,
            quietHoursStart: '22:00',
            quietHoursEnd: '07:00',
            maxPromptsPerDay: 5,
            powerUserMode: false,
        },
    });
    console.log('✓ Created user settings with automation toggles');

    // 2. Create life areas
    const areas = await Promise.all([
        prisma.area.create({
            data: { name: 'Health', colorHex: '#10B981', sortOrder: 1 },
        }),
        prisma.area.create({
            data: { name: 'Career', colorHex: '#3B82F6', sortOrder: 2 },
        }),
        prisma.area.create({
            data: { name: 'Finance', colorHex: '#F59E0B', sortOrder: 3 },
        }),
        prisma.area.create({
            data: { name: 'Relationships', colorHex: '#EC4899', sortOrder: 4 },
        }),
        prisma.area.create({
            data: { name: 'Personal Growth', colorHex: '#8B5CF6', sortOrder: 5 },
        }),
        prisma.area.create({
            data: { name: 'Home', colorHex: '#06B6D4', sortOrder: 6 },
        }),
    ]);
    console.log(`✓ Created ${areas.length} life areas`);

    // 3. Create a sample goal with quarterly objective
    const goal = await prisma.goal.create({
        data: {
            title: 'Get Fit This Year',
            description: 'Build sustainable fitness habits and improve overall health',
            areaId: areas[0].id,
            status: 'active',
        },
    });
    console.log('✓ Created sample goal');

    const now = new Date();
    const quarter = `${now.getFullYear()}-Q${Math.ceil((now.getMonth() + 1) / 3)}`;
    const quarterlyObjective = await prisma.quarterlyObjective.create({
        data: {
            goalId: goal.id,
            quarter,
            title: 'Establish Workout Routine',
            topOutcomes: JSON.stringify([
                'Exercise 4x weekly consistently',
                'Track progress metrics',
                'Build lasting habit',
            ]),
            status: 'active',
        },
    });
    console.log('✓ Created quarterly objective');

    // 4. Create a project with milestones
    const project = await prisma.project.create({
        data: {
            title: 'Learn Sugularity',
            description: 'Master the Sugularity life operating system',
            areaId: areas[4].id,
            status: 'active',
            lastActivityAt: new Date(),
            milestones: {
                create: [
                    {
                        title: 'Complete Sprint 4 Tutorial',
                        status: 'not_started',
                        targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                        sortOrder: 1,
                    },
                    {
                        title: 'Configure Automations',
                        status: 'not_started',
                        targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                        sortOrder: 2,
                    },
                    {
                        title: 'Set up Calendar Time-Blocking',
                        status: 'not_started',
                        targetDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
                        sortOrder: 3,
                    },
                ],
            },
        },
    });
    console.log('✓ Created sample project with milestones');

    // 5. Create a stream linked to goal
    const stream = await prisma.stream.create({
        data: {
            title: 'Weekly Workout',
            description: 'Consistent weekly exercise',
            areaId: areas[0].id,
            goalId: goal.id,
            quarterlyObjectiveId: quarterlyObjective.id,
            cadenceType: 'weekly',
            targetPerCycle: 4,
            status: 'active',
            currentCycleStart: new Date(),
            currentCycleCount: 2,
            lastActivityAt: new Date(),
        },
    });
    console.log('✓ Created sample stream linked to goal');

    // 6. Create sample tasks (including some with time blocks)
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);

    // Task with scheduled time block
    const blockStart = new Date(now);
    blockStart.setHours(14, 0, 0, 0);
    const blockEnd = new Date(blockStart.getTime() + 60 * 60 * 1000);

    await Promise.all([
        prisma.task.create({
            data: {
                title: 'Read Sugularity documentation',
                areaId: areas[4].id,
                projectId: project.id,
                status: 'active',
                estimateMinutes: 30,
                energyLevel: 'low',
                lastTouchedAt: now,
                scheduledDate: now,
                // Simulated time block
                calendarProvider: 'google',
                calendarEventId: `demo-${Date.now()}`,
                calendarBlockStart: blockStart,
                calendarBlockEnd: blockEnd,
                calendarId: 'primary',
            },
        }),
        prisma.task.create({
            data: {
                title: 'Morning workout session',
                areaId: areas[0].id,
                streamId: stream.id,
                status: 'active',
                estimateMinutes: 45,
                energyLevel: 'high',
                lastTouchedAt: twoDaysAgo,
            },
        }),
        prisma.task.create({
            data: {
                title: 'Review investment portfolio',
                areaId: areas[2].id,
                status: 'active',
                estimateMinutes: 45,
                energyLevel: 'high',
                lastTouchedAt: fifteenDaysAgo,
            },
        }),
        prisma.task.create({
            data: {
                title: 'Schedule doctor appointment',
                areaId: areas[0].id,
                status: 'blocked',
                blockedReason: 'Waiting for clinic to confirm availability',
                estimateMinutes: 15,
                energyLevel: 'low',
                lastTouchedAt: twoDaysAgo,
            },
        }),
    ]);
    console.log('✓ Created 4 sample tasks (1 with calendar block)');

    // 7. Create busy block (Removed)
    /*
    await prisma.calendarBusyBlock.create({ ... });
    */

    // 8. Create sample inbox item
    await prisma.inboxItem.create({
        data: {
            title: 'Explore the new Calendar page',
            notes: 'Try time-blocking a task to your calendar',
        },
    });
    console.log('✓ Created 1 sample inbox item');

    // 9. Create sample automation log entry (Removed)
    /*
    await prisma.automationLog.create({ ... });
    */

    console.log('\n🎉 Seeding complete!\n');
    console.log('Sprint 4 Demo Ready:');
    console.log('- 1 Goal with Quarterly Objective');
    console.log('- 1 Project with 3 milestones');
    console.log('- 1 Stream linked to Goal');
    console.log('- 1 Task with calendar time-block');
    console.log('- 20 built-in templates');
    console.log('- Automations system enabled');
    console.log('\nNext steps:');
    console.log('1. Run: npm run dev');
    console.log('2. Try Calendar at /calendar');
    console.log('3. Check Automations at /automations');
    console.log('4. Generate briefing at /briefings\n');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
