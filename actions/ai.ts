'use server';

import { createAIService } from '@/lib/ai/service';
import { getSettings } from '@/actions/settings';
import { rag } from '@/lib/ai/rag';

export async function testAIConnection(config?: {
    provider: string;
    model: string;
    endpoint: string;
    apiKey?: string;
}) {
    try {
        const settings = await getSettings() as any;

        const effectiveSettings = {
            ...settings,
            aiProvider: config?.provider || settings.aiProvider,
            aiModel: config?.model || settings.aiModel,
            aiEndpoint: config?.endpoint || settings.aiEndpoint,
            aiApiKey: config?.apiKey || settings.aiApiKey,
        };

        const service = createAIService(effectiveSettings);
        const isHealthy = await service.checkHealth();

        if (isHealthy) {
            try {
                const response = await service.generate('Hello');
                return { success: true, message: 'Connected! Response: ' + response.slice(0, 50) + '...' };
            } catch (e) {
                return { success: true, message: 'Connected to server, but generation failed: ' + (e as Error).message };
            }
        } else {
            return { success: false, message: 'Could not connect to AI Provider. Check your settings.' };
        }
    } catch (error) {
        return { success: false, message: (error as Error).message };
    }
}

// chatWithBrain — non-streaming fallback (used in briefings, automations, etc.)
// Includes full conversation history for multi-turn context
export async function chatWithBrain(
    message: string,
    history: { role: 'user' | 'assistant'; content: string }[]
) {
    try {
        const settings = await getSettings() as any;
        if (settings.aiProvider === 'off') {
            return { error: 'Active Intelligence is disabled. Enable it in Settings.' };
        }

        const service = createAIService(settings);

        // RAG retrieval
        const relevantChunks = await rag.retrieve(message, 5, 0.3);
        const contextText = relevantChunks.length
            ? relevantChunks.map((c) => `- ${c.content}`).join('\n\n')
            : 'No specific context found. Use your general knowledge about productivity.';

        // Format recent conversation history (last 6 messages = 3 exchanges)
        const recentHistory = history.slice(-6);
        const historyText = recentHistory.length
            ? recentHistory
                .map((m) => `${m.role === 'user' ? 'User' : 'Taliye'}: ${m.content}`)
                .join('\n')
            : '';

        const systemPrompt = buildSystemPrompt(contextText);
        const fullPrompt = historyText
            ? `${systemPrompt}\n\n[Previous conversation:]\n${historyText}\n\nUser: ${message}\nTaliye:`
            : `${systemPrompt}\n\nUser: ${message}\nTaliye:`;

        const responseText = await service.generate(fullPrompt);

        return {
            role: 'assistant' as const,
            content: responseText,
            sources: relevantChunks.map((c) => ({
                id: c.id,
                score: c.score,
                preview: c.content.slice(0, 80),
                entityType: c.entityType,
            })),
        };
    } catch (error) {
        console.error('Taliye/Brain Error:', error);
        return { error: `Brain freeze: ${(error as Error).message}` };
    }
}

// Trigger bulk RAG indexing of all user data — called from Settings page
export async function indexAllForRAG(): Promise<{ indexed: number; errors: number }> {
    return await rag.indexAllEntities();
}

// ── Shared helper ────────────────────────────────────────────────

export function buildSystemPrompt(contextText: string): string {
    return `You are Taliye (Somali for "Commander/Guide/Advisor"), an intelligent Second Brain assistant built into Sugularity — a personal Life Operating System.

Your role: Help the user manage their life by understanding their tasks, projects, goals, rituals, and notes. You are a strategic partner, not just a chatbot.

STYLE GUIDELINES:
- Be concise and direct. No filler phrases like "Great question!" or "Of course!"
- When listing things, use short bullets
- If you can act (e.g. suggest a schedule, identify risks), do so proactively
- If context is absent, say "I don't see that in your notes" but use general productivity knowledge if helpful

CONTEXT FROM SECOND BRAIN:
${contextText}`;
}
