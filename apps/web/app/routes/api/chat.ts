import type { ActionFunctionArgs } from 'react-router';
import {
  type UIMessage,
  FactoryAgent,
  validateUIMessages,
} from '@qwery/agent-factory-sdk';
import { generateConversationTitle } from '@qwery/agent-factory-sdk';
import { MessageRole } from '@qwery/domain/entities';
import { createRepositories } from '~/lib/repositories/repositories-factory';
import { handleDomainException } from '~/lib/utils/error-handler';

const agents = new Map<string, FactoryAgent>();
const agentLastAccess = new Map<string, number>();
const agentCreationLocks = new Map<string, Promise<FactoryAgent>>();

const AGENT_INACTIVITY_TIMEOUT = 30 * 60 * 1000;
const CLEANUP_INTERVAL = 5 * 60 * 1000;

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [slug, lastAccess] of agentLastAccess.entries()) {
      if (now - lastAccess > AGENT_INACTIVITY_TIMEOUT) {
        const agent = agents.get(slug);
        if (agent) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (agent as any).factoryActor?.stop();
          } catch (error) {
            console.warn(`Error stopping agent ${slug}:`, error);
          }
          agents.delete(slug);
          agentLastAccess.delete(slug);
          agentCreationLocks.delete(slug);
          console.log(`Cleaned up inactive agent for conversation ${slug}`);
        }
      }
    }
  }, CLEANUP_INTERVAL);
}

const repositories = await createRepositories();

async function getOrCreateAgent(
  conversationSlug: string,
  model: string = 'azure/gpt-5-mini',
): Promise<FactoryAgent> {
  let agent = agents.get(conversationSlug);
  if (agent) {
    agentLastAccess.set(conversationSlug, Date.now());
    return agent;
  }

  const existingLock = agentCreationLocks.get(conversationSlug);
  if (existingLock) {
    return existingLock;
  }

  const creationPromise = (async () => {
    try {
      const conversation =
        await repositories.conversation.findBySlug(conversationSlug);
      if (!conversation) {
        throw new Error(
          `Conversation with slug '${conversationSlug}' not found`,
        );
      }

      agent = await FactoryAgent.create({
        conversationSlug: conversationSlug,
        model: model,
        repositories: repositories,
      });

      agents.set(conversationSlug, agent);
      agentLastAccess.set(conversationSlug, Date.now());
      agentCreationLocks.delete(conversationSlug);
      console.log(
        `Agent ${agent.id} created for conversation ${conversationSlug}`,
      );
      return agent;
    } catch (error) {
      agentCreationLocks.delete(conversationSlug);
      throw error;
    }
  })();

  agentCreationLocks.set(conversationSlug, creationPromise);
  return creationPromise;
}

export async function action({ request, params }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const conversationSlug = params.slug;
  if (!conversationSlug) {
    return new Response('Conversation slug is required', { status: 400 });
  }

  const body = await request.json();
  const messages: UIMessage[] = body.messages;
  const model: string = body.model || 'azure/gpt-5-mini';

  try {
    // Check if this is the first user message and title needs to be generated
    const conversation =
      await repositories.conversation.findBySlug(conversationSlug);

    const shouldGenerateTitle =
      conversation &&
      conversation.title === 'New Conversation' &&
      (() => {
        // This will be checked after streaming completes
        return true;
      })();

    const agent = await getOrCreateAgent(conversationSlug, model);

    const streamResponse = await agent.respond({
      messages: await validateUIMessages({ messages }),
    });

    if (!streamResponse.body) {
      return new Response(null, { status: 204 });
    }

    // Extract user message for title generation
    const firstUserMessage = messages.find((msg) => msg.role === 'user');
    const userMessageText = firstUserMessage
      ? firstUserMessage.parts
          ?.filter((part) => part.type === 'text')
          .map((part) => (part as { text: string }).text)
          .join(' ')
          .trim() || ''
      : '';

    const stream = new ReadableStream({
      async start(controller) {
        const reader = streamResponse.body!.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              controller.close();

              // After stream completes, generate title if needed
              if (shouldGenerateTitle && userMessageText) {
                // Wait a bit for messages to be saved to database
                setTimeout(async () => {
                  try {
                    const existingMessages =
                      await repositories.message.findByConversationId(
                        conversation!.id,
                      );
                    const userMessages = existingMessages.filter(
                      (msg) => msg.role === MessageRole.USER,
                    );
                    const assistantMessages = existingMessages.filter(
                      (msg) => msg.role === MessageRole.ASSISTANT,
                    );

                    // Only generate if this is still the first exchange
                    if (
                      userMessages.length === 1 &&
                      assistantMessages.length === 1 &&
                      conversation!.title === 'New Conversation'
                    ) {
                      const assistantMessage = assistantMessages[0];
                      if (!assistantMessage) return;

                      // Extract text from message content (which contains UIMessage structure with parts)
                      let assistantText = '';
                      if (
                        typeof assistantMessage.content === 'object' &&
                        assistantMessage.content !== null &&
                        'parts' in assistantMessage.content &&
                        Array.isArray(assistantMessage.content.parts)
                      ) {
                        assistantText = assistantMessage.content.parts
                          .filter(
                            (part: { type?: string }) => part.type === 'text',
                          )
                          .map(
                            (part: { text?: string }) =>
                              part.text || '',
                          )
                          .join(' ')
                          .trim();
                      }

                      if (assistantText) {
                        const generatedTitle = await generateConversationTitle(
                          userMessageText,
                          assistantText,
                        );
                        if (
                          generatedTitle &&
                          generatedTitle !== 'New Conversation'
                        ) {
                          await repositories.conversation.update({
                            ...conversation!,
                            title: generatedTitle,
                            updatedBy: conversation!.createdBy,
                            updatedAt: new Date(),
                          });
                        }
                      }
                    }
                  } catch (error) {
                    console.error('Failed to generate conversation title:', error);
                  }
                }, 1000); // Wait 1 second for messages to be saved
              }

              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            controller.enqueue(new TextEncoder().encode(chunk));
          }
        } catch (error) {
          controller.error(error);
        } finally {
          reader.releaseLock();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    return handleDomainException(error);
  }
}
