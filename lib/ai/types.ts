export type AIProviderId = 'local-api' | 'web-llm' | 'openai' | 'gemini';

export interface AIProviderConfig {
    id: AIProviderId;
    model: string;
    endpoint?: string;      // For local-api
    apiKey?: string;        // For openai (optional future proofing)
    contextWindow: number;
    temperature: number;
    embeddingModel?: string; // e.g. 'nomic-embed-text'
}

export type AIStreamCallback = (chunk: string) => void;

export interface AIProvider {
    id: AIProviderId;

    // Core generation
    generateText(prompt: string, config: AIProviderConfig): Promise<string>;
    streamText(prompt: string, config: AIProviderConfig, onChunk: AIStreamCallback): Promise<void>;

    // RAG support
    generateEmbedding(text: string, config: AIProviderConfig): Promise<number[]>;

    // Status check (e.g. is Ollama running?)
    checkStatus(config: AIProviderConfig): Promise<boolean>;

    // Model listing (optional, if provider supports it)
    getModels?(config: AIProviderConfig): Promise<string[]>;
}

export interface AIRsponse {
    text: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
    };
}
