import { LanguageModel } from 'ai';

type ModelProvider = {
  resolveModel: (modelName: string) => LanguageModel;
};

const localLlmHealthChecks = new Map<string, Promise<void>>();

function parseModelName(modelString: string): {
  providerId: string;
  modelName: string;
} {
  if (!modelString || typeof modelString !== 'string') {
    throw new Error(
      `[AgentFactory] Invalid model: modelString must be a non-empty string, got '${modelString}'`,
    );
  }
  const parts = modelString.split('/');
  if (parts.length !== 2) {
    throw new Error(
      `[AgentFactory] Invalid model format: expected 'provider/model', got '${modelString}'`,
    );
  }
  return { providerId: parts[0]!, modelName: parts[1]! };
}

function getEnv(key: string): string | undefined {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
}

export function getDefaultModelString(): string {
  return getEnv('QWERY_DEFAULT_MODEL') ?? 'llamacpp/default';
}

function normalizeBaseURL(baseURL: string): string {
  return baseURL.replace(/\/$/, '');
}

async function ensureOpenAICompatibleServerAvailable(
  providerId: string,
  baseURL: string,
): Promise<void> {
  const normalizedBaseURL = normalizeBaseURL(baseURL);
  const cacheKey = `${providerId}:${normalizedBaseURL}`;
  const existing = localLlmHealthChecks.get(cacheKey);
  if (existing) return existing;

  const checkPromise = (async () => {
    if (typeof fetch !== 'function') {
      return;
    }

    const url = `${normalizedBaseURL}/models`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    try {
      const res = await fetch(url, { method: 'GET', signal: controller.signal });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`.trim());
      }
    } catch (error) {
      const details =
        error instanceof Error ? error.message : 'Unknown network error';
      throw new Error(
        `[AgentFactory][local-llm] Local LLM is not reachable at '${normalizedBaseURL}'. Start llama.cpp (llama-server) or set LOCAL_LLM_BASE_URL/LLAMACPP_BASE_URL. Details: ${details}`,
      );
    } finally {
      clearTimeout(timeout);
    }
  })();

  localLlmHealthChecks.set(cacheKey, checkPromise);
  try {
    await checkPromise;
  } catch (error) {
    localLlmHealthChecks.delete(cacheKey);
    throw error;
  }
}

async function createProvider(
  providerId: string,
  modelName: string,
): Promise<ModelProvider> {
  switch (providerId) {
    case 'ollama': {
      const { createOllamaModelProvider } = await import(
        './models/ollama-model.provider'
      );
      return createOllamaModelProvider({
        baseUrl: getEnv('OLLAMA_BASE_URL'),
        defaultModel: getEnv('OLLAMA_MODEL') ?? modelName,
      });
    }
    case 'llamacpp':
    case 'llama.cpp':
    case 'llama-cpp':
    case 'local': {
      const { createLlamaCppModelProvider } = await import(
        './models/llamacpp-model.provider'
      );
      const baseURL =
        getEnv('LOCAL_LLM_BASE_URL') ??
        getEnv('LLAMACPP_BASE_URL') ??
        'http://127.0.0.1:8080/v1';
      await ensureOpenAICompatibleServerAvailable(providerId, baseURL);
      return createLlamaCppModelProvider({
        baseURL: baseURL,
        apiKey: getEnv('LLAMACPP_API_KEY') ?? getEnv('LOCAL_LLM_API_KEY'),
        defaultModel: getEnv('LOCAL_LLM_MODEL') ?? getEnv('LLAMACPP_MODEL'),
      });
    }
    case 'browser': {
      const { createBuiltInModelProvider } = await import(
        './models/built-in-model.provider'
      );
      return createBuiltInModelProvider({});
    }
    case 'transformer-browser':
    case 'transformer': {
      const { createTransformerJSModelProvider } = await import(
        './models/transformerjs-model.provider'
      );
      return createTransformerJSModelProvider({
        defaultModel: getEnv('TRANSFORMER_MODEL') ?? modelName,
      });
    }
    case 'webllm': {
      const { createWebLLMModelProvider } = await import(
        './models/webllm-model.provider'
      );
      return createWebLLMModelProvider({
        defaultModel: getEnv('WEBLLM_MODEL') ?? modelName,
      });
    }
    default:
      throw new Error(
        `[AgentFactory] Unsupported provider '${providerId}'. Available providers: llama.cpp, llamacpp, llama-cpp, local, ollama, browser, transformer-browser, transformer, webllm.`,
      );
  }
}

export async function resolveModel(
  modelString: string | undefined,
): Promise<LanguageModel> {
  if (!modelString) {
    throw new Error(
      '[AgentFactory] Model string is required but was undefined or empty',
    );
  }
  const { providerId, modelName } = parseModelName(modelString);
  const provider = await createProvider(providerId, modelName);
  return provider.resolveModel(modelName);
}
