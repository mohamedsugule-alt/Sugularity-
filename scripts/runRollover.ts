import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log(`[${new Date().toISOString()}] Starting Nightly Rollover...`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
        // Find tasks that were scheduled for before today and are not done/archived.
        const overdueTasks = await prisma.task.findMany({
            where: {
                scheduledDate: { lt: today },
                status: { in: ['active', 'scheduled', 'todo', 'in_progress'] }
            }
        });

        console.log(`Found ${overdueTasks.length} overdue tasks.`);

        let rolledCount = 0;
        let lockedCount = 0;

        for (const task of overdueTasks) {
            if (task.rolloverCount >= 1) {
                // Lock task if it's rolled over too many times (requires triage)
                // For now, we leave it as is but it will show up in humanNature.ts Triage needed
                lockedCount++;
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

        console.log(`[${new Date().toISOString()}] Rollover Complete. Rolled: ${rolledCount}, Locked for Triage: ${lockedCount}`);

        // Trigger Backup after Rollover
        console.log(`[${new Date().toISOString()}] Triggering Database Backup...`);
        const backupScript = path.join(__dirname, 'backupDb.js');
        exec(`node "${backupScript}"`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Backup execution error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error(`Backup stderr: ${stderr}`);
                return;
            }
            console.log(stdout.trim());
        });

    } catch (e) {
        console.error("Error during rollover:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
