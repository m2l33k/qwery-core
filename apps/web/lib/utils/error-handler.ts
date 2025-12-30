import { DomainException } from '@qwery/domain/exceptions';

export function handleDomainException(error: unknown): Response {
  if (error instanceof DomainException) {
    const status =
      error.code >= 2000 && error.code < 3000
        ? 404
        : error.code >= 400 && error.code < 500
          ? error.code
          : 500;
    return Response.json(
      {
        error: error.message,
        code: error.code,
        data: error.data,
      },
      { status },
    );
  }
  const errorMessage =
    error instanceof Error ? error.message : 'Internal server error';

  if (
    errorMessage.includes('[AgentFactory][local-llm]') ||
    errorMessage.includes("[AgentFactory][llamacpp] Failed to reach local LLM")
  ) {
    return Response.json(
      {
        error: errorMessage,
        code: 'LOCAL_LLM_UNAVAILABLE',
      },
      { status: 503 },
    );
  }

  return Response.json({ error: errorMessage }, { status: 500 });
}
