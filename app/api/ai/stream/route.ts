import { NextRequest, NextResponse } from 'next/server';
import { createAIService } from '@/lib/ai/service';
import { rag } from '@/lib/ai/rag';
import { getSettings } from '@/actions/settings';
import { buildSystemPrompt } from '@/actions/ai';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { message, history } = await req.json() as {
            message: string;
            history: { role: 'user' | 'assistant'; content: string }[];
        };

        if (!message?.trim()) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        const settings = await getSettings() as any;

        if (settings.aiProvider === 'off') {
            return new Response(
                `data: ${JSON.stringify({ type: 'error', message: 'Active Intelligence is disabled. Enable it in Settings.' })}\n\ndata: [DONE]\n\n`,
                {
                    headers: {
                        'Content-Type': 'text/event-stream',
                        'Cache-Control': 'no-cache',
                        'Connection': 'keep-alive',
                    },
                }
            );
        }

        // 1. RAG — retrieve relevant knowledge
        const relevantChunks = await rag.retrieve(message, 5, 0.3);
        const contextText = relevantChunks.length
            ? relevantChunks.map((c) => `- ${c.content}`).join('\n\n')
            : 'No specific context found in notes. Use general productivity knowledge.';

        // 2. Build multi-turn prompt
        const recentHistory = (history || []).slice(-6); // last 3 exchanges
        const historyText = recentHistory.length
            ? recentHistory
                .map((m) => `${m.role === 'user' ? 'User' : 'Taliye'}: ${m.content}`)
                .join('\n')
            : '';

        const systemPrompt = buildSystemPrompt(contextText);
        const fullPrompt = historyText
            ? `${systemPrompt}\n\n[Previous conversation:]\n${historyText}\n\nUser: ${message}\nTaliye:`
            : `${systemPrompt}\n\nUser: ${message}\nTaliye:`;

        // 3. Create readable stream
        const encoder = new TextEncoder();
        const service = createAIService(settings);

        const sources = relevantChunks.map((c) => ({
            id: c.id,
            score: c.score,
            preview: c.content.slice(0, 80).replace(/\n/g, ' '),
            entityType: c.entityType,
        }));

        const readable = new ReadableStream({
            async start(controller) {
                try {
                    // First event: send sources metadata
                    controller.enqueue(
                        encoder.encode(
                            `data: ${JSON.stringify({ type: 'sources', sources })}\n\n`
                        )
                    );

                    // Stream text tokens
                    await service.stream(fullPrompt, (chunk) => {
                        controller.enqueue(
                            encoder.encode(
                                `data: ${JSON.stringify({ type: 'token', token: chunk })}\n\n`
                            )
                        );
                    });

                    // Done signal
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                    controller.close();
                } catch (err) {
                    const msg = err instanceof Error ? err.message : 'Unknown error';
                    controller.enqueue(
                        encoder.encode(
                            `data: ${JSON.stringify({ type: 'error', message: msg })}\n\n`
                        )
                    );
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                    controller.close();
                }
            },
        });

        return new Response(readable, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no', // disable nginx buffering
            },
        });
    } catch (err) {
        console.error('[/api/ai/stream] Error:', err);
        return NextResponse.json(
            { error: 'Failed to process request' },
            { status: 500 }
        );
    }
}
