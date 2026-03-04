import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Starting Stress Test Seeding...");

    try {
        // Ensure UserSettings exists
        let settings = await prisma.userSettings.findFirst();
        if (!settings) {
            settings = await prisma.userSettings.create({ data: {} });
            console.log("Created default UserSettings.");
        }

        // Create 10 Pillars
        console.log("Creating 10 Pillars...");
        const pillars = [];
        const colors = ["#10b981", "#3b82f6", "#ef4444", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f43f5e", "#6366f1", "#84cc16"];
        for (let i = 0; i < 10; i++) {
            const p = await prisma.pillar.create({
                data: { name: `Test Pillar ${i}`, colorHex: colors[i] }
            });
            pillars.push(p);
        }

        // Create 50 Projects
        console.log("Creating 50 Projects...");
        const projects = [];
        for (let i = 0; i < 50; i++) {
            const pillar = pillars[i % 10];
            const p = await prisma.project.create({
                data: {
                    title: `Stress Project ${i}`,
                    pillarId: pillar.id,
                    status: 'active'
                }
            });
            projects.push(p);
        }

        // Create 1000 Tasks
        console.log("Creating 1000 Tasks...");
        const tasksData = [];
        const now = new Date();

        for (let i = 0; i < 1000; i++) {
            const statuses = ['todo', 'in_progress', 'completed'];
            const status = statuses[Math.floor(Math.random() * statuses.length)];

            // Random dates around today (-30 days to + 30 days)
            const daysOffset = Math.floor(Math.random() * 60) - 30;
            const scheduledDate = new Date(now);
            scheduledDate.setDate(now.getDate() + daysOffset);

            const isCompleted = status === 'completed';

            tasksData.push({
                title: `Stress Task ${i} - ${status}`,
                projectId: projects[i % 50].id,
                pillarId: pillars[i % 10].id,
                status: status,
                energyLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
                scheduledDate: Math.random() > 0.3 ? scheduledDate : null,
                isFrog: Math.random() < 0.05,
                shiftCount: Math.floor(Math.random() * 5),
                completedAt: isCompleted ? scheduledDate : null
            });
        }

        await prisma.task.createMany({
            data: tasksData
        });

        // Create 100 DailyLogs
        console.log("Creating 100 Daily Logs...");
        const logsData = [];
        for (let i = 0; i < 100; i++) {
            const logDate = new Date(now);
            logDate.setDate(now.getDate() - i);
            logsData.push({
                date: logDate,
                energyUsed: Math.floor(Math.random() * 100),
                tasksCompleted: Math.floor(Math.random() * 10),
                frogCompleted: Math.random() > 0.5,
                notes: `Auto-generated log entry for stress testing. Day ${i}.`,
                mood: ['Great', 'Good', 'Okay', 'Bad'][Math.floor(Math.random() * 4)]
            });
        }

        // Using manual loop for logs to avoid unique constraint if re-running
        for (const log of logsData) {
            await prisma.dailyLog.upsert({
                where: { date: log.date },
                update: log,
                create: log
            });
        }

        console.log("Stress Test Seeding Complete! 🎯");

    } catch (error) {
        console.error("Error during stress test seeding:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
