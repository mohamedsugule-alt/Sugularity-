import cron from 'node-cron';
import { exec } from 'child_process';
import path from 'path';

console.log("=========================================");
console.log("Sugularity Background Daemon Started 🚀");
console.log(`Current Time: ${new Date().toISOString()}`);
console.log("=========================================");

const rolloverScript = path.join(__dirname, 'runRollover.ts');

// Schedule 4:00 AM Daily Run for Rollover
// Cron expression: "0 4 * * *" means at 04:00 every day
cron.schedule('0 4 * * *', () => {
    console.log(`\n[${new Date().toISOString()}] 🕰️ Running 4 AM Daily Cron (Rollover + Backup)...`);
    exec(`npx tsx "${rolloverScript}"`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing rollover: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Stderr from rollover: ${stderr}`);
        }
        console.log(stdout);
    });
}, {
    scheduled: true,
    timezone: "America/New_York" // Change as needed, Node timezone is fine too if system time is correct
});

// For testing purposes during audit: A script to manually force it from command line later if needed.
console.log("Daemon scheduled the following jobs:");
console.log("- Daily Rollover & Backup: 04:00 AM");
console.log("Daemon is now listening in the background...");
