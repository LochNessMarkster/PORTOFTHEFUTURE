import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, or, and, desc, sql } from 'drizzle-orm';
import * as schema from '../db/schema/schema.js';
import type { App } from '../index.js';

interface ConversationResponse {
  id: string;
  participant1_email: string;
  participant2_email: string;
  last_message?: string;
  last_message_at?: string;
  other_participant_name?: string;
  created_at: string;
}

interface MessageResponse {
  id: string;
  sender_email: string;
  content: string;
  created_at: string;
}

export function register(app: App, fastify: FastifyInstance) {
  fastify.get(
    '/api/conversations',
    {
      schema: {
        description: 'Get all conversations for a user',
        tags: ['conversations'],
        querystring: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', description: 'User email address' },
          },
        },
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                participant1_email: { type: 'string' },
                participant2_email: { type: 'string' },
                last_message: { type: 'string' },
                last_message_at: { type: 'string' },
                other_participant_name: { type: 'string' },
                created_at: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Querystring: { email: string };
      }>
    ): Promise<ConversationResponse[]> => {
      const { email } = request.query;
      app.logger.info({ email }, 'Fetching conversations');

      const conversations = await app.db
        .select()
        .from(schema.conversations)
        .where(
          or(
            eq(schema.conversations.participant1Email, email),
            eq(schema.conversations.participant2Email, email)
          )
        );

      const results: ConversationResponse[] = [];

      for (const conv of conversations) {
        const lastMessage = await app.db.query.messages.findFirst({
          where: eq(schema.messages.conversationId, conv.id),
          orderBy: desc(schema.messages.createdAt),
        });

        const otherEmail =
          conv.participant1Email === email
            ? conv.participant2Email
            : conv.participant1Email;

        results.push({
          id: conv.id,
          participant1_email: conv.participant1Email,
          participant2_email: conv.participant2Email,
          last_message: lastMessage?.content,
          last_message_at: lastMessage?.createdAt?.toISOString(),
          other_participant_name: otherEmail,
          created_at: conv.createdAt.toISOString(),
        });
      }

      app.logger.info(
        { email, count: results.length },
        'Conversations fetched successfully'
      );
      return results;
    }
  );

  fastify.post(
    '/api/conversations',
    {
      schema: {
        description: 'Create or get existing conversation',
        tags: ['conversations'],
        body: {
          type: 'object',
          required: ['participant1_email', 'participant2_email'],
          properties: {
            participant1_email: { type: 'string' },
            participant2_email: { type: 'string' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              participant1_email: { type: 'string' },
              participant2_email: { type: 'string' },
              created_at: { type: 'string' },
            },
          },
          403: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Body: {
          participant1_email: string;
          participant2_email: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      const { participant1_email, participant2_email } = request.body;
      app.logger.info(
        {
          participant1_email,
          participant2_email,
        },
        'Creating conversation'
      );

      const pref1 = await app.db.query.userPreferences.findFirst({
        where: eq(schema.userPreferences.email, participant1_email),
      });

      const pref2 = await app.db.query.userPreferences.findFirst({
        where: eq(schema.userPreferences.email, participant2_email),
      });

      const acceptMessages1 = pref1?.acceptMessages ?? true;
      const acceptMessages2 = pref2?.acceptMessages ?? true;

      if (!acceptMessages1 || !acceptMessages2) {
        app.logger.warn(
          {
            participant1_email,
            participant2_email,
            acceptMessages1,
            acceptMessages2,
          },
          'Messaging not allowed'
        );
        return reply.status(403).send({ error: 'Messaging not allowed' });
      }

      let existing = await app.db.query.conversations.findFirst({
        where: or(
          and(
            eq(schema.conversations.participant1Email, participant1_email),
            eq(schema.conversations.participant2Email, participant2_email)
          ),
          and(
            eq(schema.conversations.participant1Email, participant2_email),
            eq(schema.conversations.participant2Email, participant1_email)
          )
        ),
      });

      if (existing) {
        app.logger.info(
          {
            id: existing.id,
            participant1_email,
            participant2_email,
          },
          'Existing conversation found'
        );
        return reply.status(201).send({
          id: existing.id,
          participant1_email: existing.participant1Email,
          participant2_email: existing.participant2Email,
          created_at: existing.createdAt.toISOString(),
        });
      }

      const conversation = await app.db
        .insert(schema.conversations)
        .values({
          participant1Email: participant1_email,
          participant2Email: participant2_email,
        })
        .returning();

      const created = conversation[0];
      app.logger.info(
        {
          id: created.id,
          participant1_email,
          participant2_email,
        },
        'Conversation created successfully'
      );

      return reply.status(201).send({
        id: created.id,
        participant1_email: created.participant1Email,
        participant2_email: created.participant2Email,
        created_at: created.createdAt.toISOString(),
      });
    }
  );

  fastify.get(
    '/api/conversations/:id/messages',
    {
      schema: {
        description: 'Get all messages for a conversation',
        tags: ['conversations'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid', description: 'Conversation ID' },
          },
        },
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                sender_email: { type: 'string' },
                content: { type: 'string' },
                created_at: { type: 'string' },
              },
            },
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { id: string };
      }>,
      reply: FastifyReply
    ): Promise<MessageResponse[] | void> => {
      const { id } = request.params;
      app.logger.info({ conversationId: id }, 'Fetching messages');

      const conversation = await app.db.query.conversations.findFirst({
        where: eq(schema.conversations.id, id),
      });

      if (!conversation) {
        app.logger.warn({ conversationId: id }, 'Conversation not found');
        return reply
          .status(404)
          .send({ error: 'Conversation not found' });
      }

      const messages = await app.db
        .select()
        .from(schema.messages)
        .where(eq(schema.messages.conversationId, id))
        .orderBy(schema.messages.createdAt);

      const result: MessageResponse[] = messages.map((msg) => ({
        id: msg.id,
        sender_email: msg.senderEmail,
        content: msg.content,
        created_at: msg.createdAt.toISOString(),
      }));

      app.logger.info(
        { conversationId: id, count: result.length },
        'Messages fetched successfully'
      );
      return result;
    }
  );

  fastify.post(
    '/api/conversations/:id/messages',
    {
      schema: {
        description: 'Send a message in a conversation',
        tags: ['conversations'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid', description: 'Conversation ID' },
          },
        },
        body: {
          type: 'object',
          required: ['sender_email', 'content'],
          properties: {
            sender_email: { type: 'string' },
            content: { type: 'string' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              conversation_id: { type: 'string' },
              sender_email: { type: 'string' },
              content: { type: 'string' },
              created_at: { type: 'string' },
            },
          },
          403: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: { sender_email: string; content: string };
      }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;
      const { sender_email, content } = request.body;
      app.logger.info(
        { conversationId: id, senderEmail: sender_email },
        'Sending message'
      );

      const conversation = await app.db.query.conversations.findFirst({
        where: eq(schema.conversations.id, id),
      });

      if (!conversation) {
        app.logger.warn({ conversationId: id }, 'Conversation not found');
        return reply
          .status(404)
          .send({ error: 'Conversation not found' });
      }

      const pref1 = await app.db.query.userPreferences.findFirst({
        where: eq(
          schema.userPreferences.email,
          conversation.participant1Email
        ),
      });

      const pref2 = await app.db.query.userPreferences.findFirst({
        where: eq(
          schema.userPreferences.email,
          conversation.participant2Email
        ),
      });

      const acceptMessages1 = pref1?.acceptMessages ?? true;
      const acceptMessages2 = pref2?.acceptMessages ?? true;

      if (!acceptMessages1 || !acceptMessages2) {
        app.logger.warn(
          {
            conversationId: id,
            senderEmail: sender_email,
            acceptMessages1,
            acceptMessages2,
          },
          'Messaging not allowed'
        );
        return reply.status(403).send({ error: 'Messaging not allowed' });
      }

      const message = await app.db
        .insert(schema.messages)
        .values({
          conversationId: id,
          senderEmail: sender_email,
          content,
        })
        .returning();

      const created = message[0];
      app.logger.info(
        {
          messageId: created.id,
          conversationId: id,
          senderEmail: sender_email,
        },
        'Message sent successfully'
      );

      return reply.status(201).send({
        id: created.id,
        conversation_id: created.conversationId,
        sender_email: created.senderEmail,
        content: created.content,
        created_at: created.createdAt.toISOString(),
      });
    }
  );
}
