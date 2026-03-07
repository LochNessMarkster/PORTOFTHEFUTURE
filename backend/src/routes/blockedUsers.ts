import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema/schema.js';
import type { App } from '../index.js';

export function register(app: App, fastify: FastifyInstance) {
  fastify.post(
    '/api/blocked-users',
    {
      schema: {
        description: 'Block a user',
        tags: ['blocked-users'],
        body: {
          type: 'object',
          required: ['blocker_email', 'blocked_email'],
          properties: {
            blocker_email: { type: 'string' },
            blocked_email: { type: 'string' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              created_at: { type: 'string' },
              message: { type: 'string' },
            },
          },
          400: {
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
        Body: { blocker_email: string; blocked_email: string };
      }>,
      reply: FastifyReply
    ) => {
      const { blocker_email, blocked_email } = request.body;

      if (blocker_email === blocked_email) {
        app.logger.warn({ email: blocker_email }, 'User attempted to block themselves');
        return reply.status(400).send({ error: 'Cannot block yourself' });
      }

      app.logger.info(
        { blocker_email, blocked_email },
        'Creating block relationship'
      );

      const block = await app.db
        .insert(schema.blockedUsers)
        .values({
          blockerEmail: blocker_email,
          blockedEmail: blocked_email,
        })
        .returning();

      const created = block[0];

      app.logger.info(
        { blockId: created.id, blocker_email, blocked_email },
        'User blocked successfully'
      );

      return reply.status(201).send({
        id: created.id,
        created_at: created.createdAt.toISOString(),
        message: 'User blocked successfully',
      });
    }
  );

  fastify.delete(
    '/api/blocked-users/:blocked_email',
    {
      schema: {
        description: 'Unblock a user',
        tags: ['blocked-users'],
        params: {
          type: 'object',
          required: ['blocked_email'],
          properties: {
            blocked_email: { type: 'string' },
          },
        },
        querystring: {
          type: 'object',
          required: ['blocker_email'],
          properties: {
            blocker_email: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { blocked_email: string };
        Querystring: { blocker_email: string };
      }>,
      reply: FastifyReply
    ) => {
      const { blocked_email } = request.params;
      const { blocker_email } = request.query;

      app.logger.info(
        { blocker_email, blocked_email },
        'Unblocking user'
      );

      await app.db
        .delete(schema.blockedUsers)
        .where(
          and(
            eq(schema.blockedUsers.blockerEmail, blocker_email),
            eq(schema.blockedUsers.blockedEmail, blocked_email)
          )
        );

      app.logger.info(
        { blocker_email, blocked_email },
        'User unblocked successfully'
      );

      return {
        success: true,
        message: 'User unblocked successfully',
      };
    }
  );

  fastify.get(
    '/api/blocked-users',
    {
      schema: {
        description: 'Get list of blocked users',
        tags: ['blocked-users'],
        querystring: {
          type: 'object',
          required: ['blocker_email'],
          properties: {
            blocker_email: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                blocked_email: { type: 'string' },
                created_at: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Querystring: { blocker_email: string };
      }>
    ) => {
      const { blocker_email } = request.query;

      app.logger.info(
        { blocker_email },
        'Fetching blocked users list'
      );

      const blocked = await app.db
        .select()
        .from(schema.blockedUsers)
        .where(eq(schema.blockedUsers.blockerEmail, blocker_email));

      app.logger.info(
        { blocker_email, count: blocked.length },
        'Blocked users list retrieved'
      );

      return blocked.map((b) => ({
        id: b.id,
        blocked_email: b.blockedEmail,
        created_at: b.createdAt.toISOString(),
      }));
    }
  );

  fastify.get(
    '/api/blocked-users/check',
    {
      schema: {
        description: 'Check if a user is blocked',
        tags: ['blocked-users'],
        querystring: {
          type: 'object',
          required: ['blocker_email', 'blocked_email'],
          properties: {
            blocker_email: { type: 'string' },
            blocked_email: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              is_blocked: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Querystring: { blocker_email: string; blocked_email: string };
      }>
    ) => {
      const { blocker_email, blocked_email } = request.query;

      const blocked = await app.db.query.blockedUsers.findFirst({
        where: and(
          eq(schema.blockedUsers.blockerEmail, blocker_email),
          eq(schema.blockedUsers.blockedEmail, blocked_email)
        ),
      });

      return {
        is_blocked: !!blocked,
      };
    }
  );
}
