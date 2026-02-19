import { AIProvider, AIProviderConfig, AIStreamCallback } from '../types';

/**
 * Gemini AI Provider
 * Uses Google's OpenAI-compatible REST endpoint so we don't need extra SDKs.
 * Endpoint: https://generativelanguage.googleapis.com/v1beta/openai
 */
export class GeminiProvider implements AIProvider {
    id: 'gemini' = 'gemini';

    private getEndpoint(config: AIProviderConfig): string {
        return config.endpoint || 'https://generativelanguage.googleapis.com/v1beta/openai';
    }

    private getModel(config: AIProviderConfig): string {
        return config.model || 'gemini-2.0-flash';
    }

    async checkStatus(config: AIProviderConfig): Promise<boolean> {
        try {
            const endpoint = this.getEndpoint(config);
            const res = await fetch(`${endpoint}/models`, {
                headers: {
                    'Authorization': `Bearer ${config.apiKey}`,
                },
            });
            return res.ok;
        } catch {
            return false;
        }
    }

    async generateText(prompt: string, config: AIProviderConfig): Promise<string> {
        const endpoint = this.getEndpoint(config);
        const model = this.getModel(config);

        const res = await fetch(`${endpoint}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify({
                model,
                messages: [{ role: 'user', content: prompt }],
                temperature: config.temperature ?? 0.7,
            }),
        });

        if (!res.ok) {
            const errorBody = await res.text();
            throw new Error(`Gemini API Error (${res.status}): ${errorBody}`);
        }

        const data = await res.json();
        return data.choices?.[0]?.message?.content || '';
    }

    async streamText(prompt: string, config: AIProviderConfig, onChunk: AIStreamCallback): Promise<void> {
        const endpoint = this.getEndpoint(config);
        const model = this.getModel(config);

        const res = await fetch(`${endpoint}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify({
                model,
                messages: [{ role: 'user', content: prompt }],
                temperature: config.temperature ?? 0.7,
                stream: true,
            }),
        });

        if (!res.body) throw new Error('No response body from Gemini');

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter((line) => line.trim() !== '');

            for (const line of lines) {
                if (line.includes('[DONE]')) return;
                if (line.startsWith('data: ')) {
                    try {
                        const json = JSON.parse(line.substring(6));
                        const content = json.choices?.[0]?.delta?.content;
                        if (content) onChunk(content);
                    } catch {
                        // Ignore partial chunk parse errors
                    }
                }
            }
        }
    }

    async generateEmbedding(text: string, config: AIProviderConfig): Promise<number[]> {
        const endpoint = this.getEndpoint(config);

        const res = await fetch(`${endpoint}/embeddings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify({
                model: config.embeddingModel || 'text-embedding-004',
                input: text,
            }),
        });

        if (!res.ok) {
            throw new Error(`Gemini Embedding Error: ${res.statusText}`);
        }

        const data = await res.json();
        return data.data?.[0]?.embedding || [];
    }
}

export const geminiProvider = new GeminiProvider();
