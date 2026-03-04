const fs = require('fs');
const path = require('path');

function backup() {
    console.log("Starting Database Backup (Phase A)...");
    const dbPath = path.join(__dirname, '..', 'prisma', 'sugularity.db');
    const backupDir = path.join(__dirname, '..', '.backups');

    if (!fs.existsSync(dbPath)) {
        console.error("Database not found at " + dbPath);
        process.exit(1);
    }

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
        console.log("Created .backups directory.");
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `sugularity-${timestamp}.db`);

    // Copy file safely
    fs.copyFileSync(dbPath, backupPath);
    console.log(`Successfully backed up database to: ${backupPath}`);

    // Cleanup old backups (keep last 7 days)
    const files = fs.readdirSync(backupDir)
        .filter(f => f.startsWith('sugularity-') && f.endsWith('.db'))
        .map(f => ({ name: f, time: fs.statSync(path.join(backupDir, f)).mtime.getTime() }))
        .sort((a, b) => b.time - a.time);

    if (files.length > 7) {
        const toDelete = files.slice(7);
        for (const file of toDelete) {
            fs.unlinkSync(path.join(backupDir, file.name));
            console.log(`Cleaned up old backup: ${file.name}`);
        }
    }
}

backup();
