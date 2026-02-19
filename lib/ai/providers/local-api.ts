import { AIProvider, AIProviderConfig, AIStreamCallback } from '../types';

export class LocalAPIProvider implements AIProvider {
    id: 'local-api' = 'local-api';

    async checkStatus(config: AIProviderConfig): Promise<boolean> {
        try {
            // Try to list models as a health check
            const res = await fetch(`${config.endpoint || 'http://localhost:11434/v1'}/models`);
            return res.ok;
        } catch (e) {
            return false;
        }
    }

    async generateText(prompt: string, config: AIProviderConfig): Promise<string> {
        const endpoint = config.endpoint || 'http://localhost:11434/v1';

        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };
            if (config.apiKey && config.apiKey.length > 0) {
                headers['Authorization'] = `Bearer ${config.apiKey}`;
            }

            const res = await fetch(`${endpoint}/chat/completions`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    model: config.model,
                    messages: [{ role: 'user', content: prompt }], // Simple one-shot for now
                    temperature: config.temperature,
                    max_tokens: -1, // Let model decide or use context window limits
                    stream: false
                })
            });

            if (!res.ok) {
                throw new Error(`AI Provider Error: ${res.statusText}`);
            }

            const data = await res.json();
            return data.choices?.[0]?.message?.content || "";
        } catch (error) {
            console.error("Local AI Generation Failed:", error);
            throw error;
        }
    }

    async streamText(prompt: string, config: AIProviderConfig, onChunk: AIStreamCallback): Promise<void> {
        const endpoint = config.endpoint || 'http://localhost:11434/v1';

        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };
            if (config.apiKey && config.apiKey.length > 0) {
                headers['Authorization'] = `Bearer ${config.apiKey}`;
            }

            const res = await fetch(`${endpoint}/chat/completions`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    model: config.model,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: config.temperature,
                    stream: true
                })
            });

            if (!res.body) throw new Error("No response body");

            const reader = res.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.trim() !== '');

                for (const line of lines) {
                    if (line.includes('[DONE]')) return;

                    if (line.startsWith('data: ')) {
                        try {
                            const json = JSON.parse(line.substring(6));
                            const content = json.choices?.[0]?.delta?.content;
                            if (content) {
                                onChunk(content);
                            }
                        } catch (e) {
                            // Ignore parse errors for partial chunks
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Local AI Stream Failed:", error);
            throw error;
        }
    }

    async generateEmbedding(text: string, config: AIProviderConfig): Promise<number[]> {
        const endpoint = config.endpoint || 'http://localhost:11434/v1';

        try {
            const res = await fetch(`${endpoint}/embeddings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: config.embeddingModel || config.model, // Use specific embedding model or fall back to chat model (some support both)
                    input: text
                })
            });

            if (!res.ok) {
                throw new Error(`AI Embedding Error: ${res.statusText}`);
            }

            const data = await res.json();
            // OpenAI/Ollama format: { data: [{ embedding: [...] }] }
            return data.data?.[0]?.embedding || [];
        } catch (error) {
            console.error("Local AI Embedding Failed:", error);
            throw error;
        }
    }
}

export const localProvider = new LocalAPIProvider();
