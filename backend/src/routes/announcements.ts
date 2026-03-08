import type { FastifyInstance, FastifyReply } from 'fastify';
import { getAnnouncements } from '../services/announcements.js';
import type { App } from '../index.js';

export function register(app: App, fastify: FastifyInstance) {
  fastify.get(
    '/api/announcements',
    {
      schema: {
        description: 'Get announcements from Airtable with caching',
        tags: ['announcements'],
        response: {
          200: {
            type: 'object',
            properties: {
              updated_at: { type: 'string', description: 'ISO timestamp' },
              source_used: {
                type: 'string',
                enum: ['airtablecache', 'airtable_api'],
              },
              announcements: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    Title: { type: 'string' },
                    Content: { type: 'string' },
                    Alert: { type: 'string' },
                    Date: { type: 'string' },
                    Time: { type: 'string' },
                    ImageUrl: { type: 'string' },
                  },
                },
              },
            },
          },
          502: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply: FastifyReply) => {
      app.logger.info('Fetching announcements');

      try {
        const result = await getAnnouncements();
        app.logger.info(
          {
            source: result.source_used,
            count: result.announcements.length,
          },
          'Announcements fetched successfully'
        );
        return result;
      } catch (error) {
        app.logger.error(
          { err: error },
          'Failed to fetch announcements'
        );
        return reply.status(502).send({
          error: 'Failed to fetch announcements from Airtable',
        });
      }
    }
  );
}
