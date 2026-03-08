import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema/schema.js';
import type { App } from '../index.js';

export function register(app: App, fastify: FastifyInstance) {
  fastify.post(
    '/api/reports',
    {
      schema: {
        description: 'Submit a user report',
        tags: ['reports'],
        body: {
          type: 'object',
          required: ['reporting_user_email', 'reported_user_email', 'reason'],
          properties: {
            reporting_user_email: { type: 'string' },
            reported_user_email: { type: 'string' },
            reason: {
              type: 'string',
              enum: ['Harassment', 'Spam', 'Inappropriate Content', 'Impersonation', 'Other'],
            },
            notes: { type: 'string' },
            conversation_id: { type: 'string', format: 'uuid' },
            message_id: { type: 'string', format: 'uuid' },
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
        },
      },
    },
    async (
      request: FastifyRequest<{
        Body: {
          reporting_user_email: string;
          reported_user_email: string;
          reason: string;
          notes?: string;
          conversation_id?: string;
          message_id?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      const {
        reporting_user_email,
        reported_user_email,
        reason,
        notes,
        conversation_id,
        message_id,
      } = request.body;

      app.logger.info(
        {
          reporting_user_email,
          reported_user_email,
          reason,
        },
        'Creating user report'
      );

      const report = await app.db
        .insert(schema.userReports)
        .values({
          reportingUserEmail: reporting_user_email,
          reportedUserEmail: reported_user_email,
          reason,
          notes,
          conversationId: conversation_id as any,
          messageId: message_id as any,
        })
        .returning();

      const created = report[0];

      app.logger.info(
        {
          reportId: created.id,
          reporting_user_email,
          reported_user_email,
        },
        'User report created successfully'
      );

      return reply.status(201).send({
        id: created.id,
        created_at: created.createdAt.toISOString(),
        message: 'Report submitted successfully',
      });
    }
  );

  fastify.get(
    '/api/reports',
    {
      schema: {
        description: 'Get all reports (admin only)',
        tags: ['reports'],
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                reporting_user_email: { type: 'string' },
                reported_user_email: { type: 'string' },
                reason: { type: 'string' },
                notes: { type: 'string' },
                conversation_id: { type: 'string' },
                message_id: { type: 'string' },
                created_at: { type: 'string' },
                status: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async (request) => {
      app.logger.info('Fetching all reports');

      const reports = await app.db.select().from(schema.userReports);

      app.logger.info({ count: reports.length }, 'Reports retrieved successfully');

      return reports.map((report) => ({
        id: report.id,
        reporting_user_email: report.reportingUserEmail,
        reported_user_email: report.reportedUserEmail,
        reason: report.reason,
        notes: report.notes,
        conversation_id: report.conversationId,
        message_id: report.messageId,
        created_at: report.createdAt.toISOString(),
        status: report.status,
      }));
    }
  );
}
