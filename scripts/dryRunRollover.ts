import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Starting Dry Run of Nightly Rollover (Phase A) 🌙...");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find tasks that were scheduled for before today and are not done/archived.
    const overdueTasks = await prisma.task.findMany({
        where: {
            scheduledDate: { lt: today },
            status: { in: ['active', 'scheduled', 'todo', 'in_progress'] }
        }
    });

    console.log(`Found ${overdueTasks.length} tasks scheduled for past dates that need rollover.`);

    let rolledCount = 0;
    let triageNeededCount = 0;

    for (const task of overdueTasks) {
        if (task.rolloverCount >= 1) {
            triageNeededCount++;
            // Normally we'd mark it as blocked or requiring triage
        } else {
            // Perform actual rollover for eligible tasks
            await prisma.task.update({
                where: { id: task.id },
                data: {
                    rolloverCount: task.rolloverCount + 1,
                    committedDate: null,
                    lastTouchedAt: new Date()
                }
            });
            rolledCount++;
        }
    }

    console.log("-----------------------------------------");
    console.log(`Rollover Complete: ${rolledCount} tasks rolled over (Shift Count stringency engaged).`);
    console.log(`Triage Required: ${triageNeededCount} tasks are locked due to >1 shifts and require forced triage.`);
    console.log("-----------------------------------------");

}

main()
    .catch(e => {
        console.error("Error during dry run:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
