import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { LanguageModel } from 'ai';

type ModelProvider = {
  resolveModel: (modelName: string) => LanguageModel;
};

export type LlamaCppModelProviderOptions = {
  baseURL?: string;
  apiKey?: string;
  defaultModel?: string;
};

export function createLlamaCppModelProvider({
  baseURL = process.env.LLAMACPP_BASE_URL || 'http://127.0.0.1:8080/v1',
  apiKey,
  defaultModel = process.env.LLAMACPP_MODEL,
}: LlamaCppModelProviderOptions = {}): ModelProvider {
  const normalizedBaseURL = baseURL.replace(/\/$/, '');
  const provider = createOpenAICompatible({
    name: 'llamacpp',
    baseURL: normalizedBaseURL,
    apiKey,
    fetch: async (input, init) => {
      try {
        return await fetch(input, init);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown network error';
        throw new Error(
          `[AgentFactory][llamacpp] Failed to reach local LLM at '${normalizedBaseURL}'. Start llama.cpp server or set LLAMACPP_BASE_URL. Original error: ${message}`,
        );
      }
    },
  });

  return {
    resolveModel: (modelName) => {
      const resolvedModelName = modelName === 'default' ? '' : modelName;
      const finalModel = resolvedModelName || defaultModel;
      if (!finalModel) {
        throw new Error(
          "[AgentFactory] Missing llama.cpp model. Provide it as 'llamacpp/<model-name>' or set LLAMACPP_MODEL.",
        );
      }
      return provider(finalModel);
    },
  };
}
