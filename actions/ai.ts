'use server';

import { createAIService } from '@/lib/ai/service';
import { getSettings } from '@/actions/settings';

export async function testAIConnection(config?: {
    provider: string;
    model: string;
    endpoint: string;
    apiKey?: string;
}) {
    try {
        // Use provided config or fall back to saved settings
        let settings = await getSettings() as any;

        // Overlay ephemeral config if testing unsaved changes
        const effectivelySettings = {
            ...settings,
            aiProvider: config?.provider || settings.aiProvider,
            aiModel: config?.model || settings.aiModel,
            aiEndpoint: config?.endpoint || settings.aiEndpoint,
            aiApiKey: config?.apiKey || settings.aiApiKey,
        };

        const service = createAIService(effectivelySettings);
        const isHealthy = await service.checkHealth();

        if (isHealthy) {
            // Try a tiny generation to be sure
            try {
                const response = await service.generate("Hello");
                return { success: true, message: "Connected! Response: " + response.slice(0, 50) + "..." };
            } catch (e) {
                return { success: true, message: "Connected to server, but generation failed: " + (e as Error).message };
            }
        } else {
            return { success: false, message: "Could not connect to AI Provider. Check if it is running." };
        }
    } catch (error) {
        return { success: false, message: (error as Error).message };
    }
}

// chatWithBrain action
export async function chatWithBrain(message: string, history: { role: 'user' | 'assistant', content: string }[]) {
    try {
        let settings = await getSettings();
        if ((settings as any).aiProvider === 'off') {
            return { error: "Active Intelligence is disabled. Enable it in Settings." };
        }
        const { rag } = await import('@/lib/ai/rag'); // Dynamic import
        const service = createAIService(settings as any); // Cast for safety due to generated types lag

        // 1. Retrieve Context (RAG)
        const relevantChunks = await rag.retrieve(message, 5, 0.4);
        const contextText = relevantChunks.map((c: any) => `- ${c.content}`).join('\n\n');

        // 2. Construct Prompt
        const systemPrompt = `You are Taliye (Somali for Commander/Guide/Advisor), an intelligent Second Brain assistant. 
        Your goal is to help the user manage their life through the Sugularity system.
        You have access to their tasks, projects, notes, and calendar via the context below. 
        
        Style: Concise, direct, and helpful. You are a strategic partner, not just a chat bot.
        When asked to create tasks, suggest specific projects or areas they belong to.
        Answer the user's question based strictly on the provided context if relevant.
        If the context doesn't have the answer, say "I don't see that in your notes," but you can use general knowledge if appropriate.
        
        CONTEXT FROM SECOND BRAIN:
        ${contextText}
        `;

        const fullPrompt = `${systemPrompt}\n\nUser: ${message}`;

        // 3. Generate (Simple one-shot for now, or append history if provider supports it)
        // For local models, we often just stuff context into the last prompt or strictly follow chat format.
        // Let's assume the provider handles 'generateText' as a completion or chat.
        // If chat, we ideally pass messages. simpler for now:
        const responseText = await service.generate(fullPrompt);

        return {
            role: 'assistant',
            content: responseText,
            sources: relevantChunks.map((c: any) => ({ id: c.id, score: c.score, preview: c.content.slice(0, 50) }))
        };

    } catch (error) {
        console.error("Taliye/Brain Error:", error);
        return { error: `Brain freeze: ${(error as Error).message}` };
    }
}
