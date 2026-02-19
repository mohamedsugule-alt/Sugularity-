import prisma from '@/lib/prisma';
import { createAIService } from './service';
import { getSettings } from '@/actions/settings';

// Simple text splitter
function chunkText(text: string, maxChars = 1000): string[] {
    if (!text) return [];

    // Split by paragraphs first
    const paragraphs = text.split('\n\n');
    const chunks: string[] = [];

    let currentChunk = '';

    for (const para of paragraphs) {
        if ((currentChunk + para).length > maxChars) {
            if (currentChunk) chunks.push(currentChunk.trim());
            currentChunk = para;
        } else {
            currentChunk += (currentChunk ? '\n\n' : '') + para;
        }
    }

    if (currentChunk) chunks.push(currentChunk.trim());

    // Handle very long paragraphs (naive split)
    return chunks.flatMap(c => {
        if (c.length > maxChars) {
            return c.match(new RegExp(`.{1,${maxChars}}`, 'g')) || [];
        }
        return c;
    });
}

// Cosine Similarity
function cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export class RAGService {

    async indexItem(entityType: string, entityId: string, content: string) {
        // RAG is currently disabled/removed from schema.
        // This is a no-op to prevent runtime errors.
        // In the future, re-enable with a proper Vector Store (e.g. pgvector or new table).
        return;
    }

    async retrieve(query: string, limit = 5, minScore = 0.5) {
        // RAG is disabled. Return empty context.
        return [];
    }
}

export const rag = new RAGService();
