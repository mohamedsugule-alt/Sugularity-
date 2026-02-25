import { prisma } from '@/lib/prisma';

// ============================================
// RAG SERVICE — SQLite full-text search
// No external vector DB needed for local-first.
// Uses keyword matching with relevance scoring.
// ============================================

export interface RetrievedChunk {
    id: string;
    entityType: string;
    entityId: string;
    content: string;
    metadata: string | null;
    score: number;
    preview: string;
}

function scoreMatch(content: string, query: string): number {
    const contentLower = content.toLowerCase();
    const queryLower = query.toLowerCase();

    // Exact phrase match — highest score
    if (contentLower.includes(queryLower)) return 1.0;

    // Word-level scoring
    const queryWords = queryLower
        .split(/\s+/)
        .filter((w) => w.length > 2); // skip short words like "a", "is", "in"

    if (queryWords.length === 0) return 0;

    const matchedWords = queryWords.filter((word) => contentLower.includes(word));
    const ratio = matchedWords.length / queryWords.length;

    // Boost if multiple words match in sequence
    if (matchedWords.length >= 2) {
        const twoWordPhrase = `${matchedWords[0]} ${matchedWords[1]}`;
        if (contentLower.includes(twoWordPhrase)) return Math.min(ratio + 0.2, 1.0);
    }

    return ratio * 0.9; // slight penalty vs exact match
}

export class RAGService {

    // Index a single entity (upsert — removes old chunks for entityId first)
    async indexItem(
        entityType: string,
        entityId: string,
        content: string,
        metadata?: Record<string, unknown>
    ): Promise<void> {
        if (!content?.trim()) return;

        try {
            // Delete previous chunks for this entity
            await prisma.ragChunk.deleteMany({
                where: { entityType, entityId }
            });

            // Split into chunks if content is long
            const chunks = chunkText(content, 800);

            await prisma.ragChunk.createMany({
                data: chunks.map((chunk) => ({
                    entityType,
                    entityId,
                    content: chunk,
                    metadata: metadata ? JSON.stringify(metadata) : null,
                }))
            });
        } catch {
            // Silent fail — RAG indexing should never crash the main operation
        }
    }

    // Remove all chunks for a deleted entity
    async removeItem(entityType: string, entityId: string): Promise<void> {
        try {
            await prisma.ragChunk.deleteMany({
                where: { entityType, entityId }
            });
        } catch {
            // Silent fail
        }
    }

    // Retrieve relevant chunks for a query using keyword scoring
    async retrieve(query: string, limit = 5, minScore = 0.3): Promise<RetrievedChunk[]> {
        if (!query?.trim()) return [];

        try {
            // Build LIKE conditions for each meaningful word
            const queryWords = query
                .toLowerCase()
                .split(/\s+/)
                .filter((w) => w.length > 2);

            if (queryWords.length === 0) return [];

            // Fetch candidate chunks using DB-level LIKE filter (narrows the set)
            // Use the first 3 words as candidates to avoid fetching everything
            const primaryWords = queryWords.slice(0, 3);
            const whereConditions = primaryWords.map((w) => ({
                content: { contains: w }
            }));

            const candidates = await prisma.ragChunk.findMany({
                where: { OR: whereConditions },
                take: 100, // cap to avoid huge result sets
            });

            if (candidates.length === 0) return [];

            // Score all candidates in memory
            const scored = candidates
                .map((chunk) => ({
                    ...chunk,
                    score: scoreMatch(chunk.content, query),
                    preview: chunk.content.slice(0, 100).replace(/\n/g, ' '),
                }))
                .filter((c) => c.score >= minScore)
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);

            return scored;
        } catch {
            return [];
        }
    }

    // Bulk index all existing data (call from Settings page)
    async indexAllEntities(): Promise<{ indexed: number; errors: number }> {
        let indexed = 0;
        let errors = 0;

        try {
            // Clear all existing chunks first
            await prisma.ragChunk.deleteMany({});

            // Index Tasks
            const tasks = await prisma.task.findMany({
                where: { status: { not: 'archived' } },
                include: { pillar: true, project: true, ritual: true }
            });
            for (const task of tasks) {
                const content = [
                    `Task: ${task.title}`,
                    task.notes ? `Notes: ${task.notes}` : '',
                    task.pillar ? `Area: ${task.pillar.name}` : '',
                    task.project ? `Project: ${task.project.title}` : '',
                    task.ritual ? `Ritual: ${task.ritual.title}` : '',
                    `Status: ${task.status}`,
                    `Energy: ${task.energyLevel}`,
                ].filter(Boolean).join('\n');

                await this.indexItem('task', task.id, content, {
                    title: task.title,
                    pillarName: task.pillar?.name,
                    status: task.status,
                });
                indexed++;
            }

            // Index Projects
            const projects = await prisma.project.findMany({
                where: { status: 'active' },
                include: { pillar: true }
            });
            for (const project of projects) {
                const content = [
                    `Project: ${project.title}`,
                    project.description ? `Description: ${project.description}` : '',
                    project.pillar ? `Area: ${project.pillar.name}` : '',
                    `Status: ${project.status}`,
                ].filter(Boolean).join('\n');

                await this.indexItem('project', project.id, content, {
                    title: project.title,
                    pillarName: project.pillar?.name,
                    status: project.status,
                });
                indexed++;
            }

            // Index Goals
            const goals = await prisma.goal.findMany({
                where: { status: 'active' },
                include: { pillar: true }
            });
            for (const goal of goals) {
                const content = [
                    `Goal: ${goal.title}`,
                    goal.description ? `Description: ${goal.description}` : '',
                    goal.pillar ? `Area: ${goal.pillar.name}` : '',
                ].filter(Boolean).join('\n');

                await this.indexItem('goal', goal.id, content, {
                    title: goal.title,
                    pillarName: goal.pillar?.name,
                });
                indexed++;
            }

            // Index Rituals
            const rituals = await prisma.ritual.findMany({
                where: { status: 'active' },
                include: { pillar: true }
            });
            for (const ritual of rituals) {
                const content = [
                    `Ritual/Habit: ${ritual.title}`,
                    ritual.description ? `Description: ${ritual.description}` : '',
                    ritual.pillar ? `Area: ${ritual.pillar.name}` : '',
                    `Cadence: ${ritual.cadenceType}, Target: ${ritual.targetPerCycle} per cycle`,
                ].filter(Boolean).join('\n');

                await this.indexItem('ritual', ritual.id, content, {
                    title: ritual.title,
                    pillarName: ritual.pillar?.name,
                });
                indexed++;
            }

            // Index Resources (notes/library)
            const resources = await prisma.resource.findMany({
                where: { isArchived: false }
            });
            for (const resource of resources) {
                const content = [
                    `Note: ${resource.title}`,
                    resource.content ? resource.content.slice(0, 2000) : '',
                    resource.url ? `URL: ${resource.url}` : '',
                ].filter(Boolean).join('\n');

                await this.indexItem('resource', resource.id, content, {
                    title: resource.title,
                    type: resource.type,
                });
                indexed++;
            }

        } catch (err) {
            console.error('[RAG] indexAllEntities error:', err);
            errors++;
        }

        return { indexed, errors };
    }
}

export const rag = new RAGService();

// ── Private helpers ──────────────────────────────────────────────

function chunkText(text: string, maxChars = 800): string[] {
    if (!text) return [];

    const paragraphs = text.split('\n\n');
    const chunks: string[] = [];
    let current = '';

    for (const para of paragraphs) {
        if ((current + para).length > maxChars) {
            if (current) chunks.push(current.trim());
            current = para;
        } else {
            current += (current ? '\n\n' : '') + para;
        }
    }

    if (current) chunks.push(current.trim());

    return chunks.flatMap((c) => {
        if (c.length > maxChars) {
            return c.match(new RegExp(`.{1,${maxChars}}`, 'g')) || [];
        }
        return c;
    });
}
