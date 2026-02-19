import { AIProvider, AIProviderConfig, AIStreamCallback } from './types';
import { localProvider } from './providers/local-api';
import { geminiProvider } from './providers/gemini';
// We'll import webProvider dynamically or later to avoid SSR issues if it uses browser APIs

const providers: Record<string, AIProvider> = {
    'local-api': localProvider,
    'gemini': geminiProvider,
    // 'web-llm': webProvider (instantiated on client side usually)
};

export class AIService {
    private config: AIProviderConfig;

    constructor(config: AIProviderConfig) {
        this.config = config;
    }

    private getProvider(): AIProvider {
        const provider = providers[this.config.id];
        if (!provider) {
            throw new Error(`Provider ${this.config.id} not implemented yet.`);
        }
        return provider;
    }

    async generate(prompt: string): Promise<string> {
        const provider = this.getProvider();
        return await provider.generateText(prompt, this.config);
    }

    async stream(prompt: string, onChunk: AIStreamCallback): Promise<void> {
        const provider = this.getProvider();
        return await provider.streamText(prompt, this.config, onChunk);
    }

    async generateEmbedding(text: string): Promise<number[]> {
        const provider = this.getProvider();
        if (!provider.generateEmbedding) {
            throw new Error(`Provider ${this.config.id} does not support embeddings.`);
        }
        return await provider.generateEmbedding(text, this.config);
    }

    async checkHealth(): Promise<boolean> {
        const provider = this.getProvider();
        return await provider.checkStatus(this.config);
    }
}

// Helper to create service from user settings
export function createAIService(settings: any): AIService {
    return new AIService({
        id: settings.aiProvider || 'gemini',
        model: settings.aiModel || 'gemini-2.0-flash',
        endpoint: settings.aiEndpoint,
        apiKey: settings.aiApiKey,
        contextWindow: settings.aiContextWindow || 4096,
        temperature: settings.aiTemperature || 0.7
    });
}
