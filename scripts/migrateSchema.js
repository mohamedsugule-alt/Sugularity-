const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

// 1. Swap SQLite for PostgreSQL
schema = schema.replace(
    /provider\s*=\s*"sqlite"/,
    'provider = "postgresql"'
);
schema = schema.replace(
    /url\s*=\s*"file:\.\/sugularity\.db"/,
    'url      = env("DATABASE_URL")'
);

// 2. Inject userId into ALL models
const lines = schema.split('\n');
const newLines = [];
let insideModel = false;
let modelHasUserId = false;
let modelName = '';

for (const line of lines) {
    if (line.trim().startsWith('model ')) {
        insideModel = true;
        modelHasUserId = false;
        modelName = line.trim().split(' ')[1];
        newLines.push(line);
        continue;
    }

    if (insideModel && line.trim().startsWith('userId')) {
        modelHasUserId = true;
    }

    if (insideModel && line.trim() === '}') {
        // We are at the end of the model block
        if (!modelHasUserId) {
            newLines.push('  userId String');
            newLines.push('  @@index([userId])');
        }
        insideModel = false;
        newLines.push(line);
        continue;
    }

    newLines.push(line);
}

fs.writeFileSync(schemaPath, newLines.join('\n'), 'utf8');
console.log('Successfully updated schema.prisma for multi-tenancy.');
