import type { FastifyInstance, FastifyReply } from 'fastify';
import { getAgenda } from '../services/agenda.js';
import type { App } from '../index.js';

export function register(app: App, fastify: FastifyInstance) {
  fastify.get(
    '/api/agenda',
    {
      schema: {
        description: 'Get agenda from Airtable with caching',
        tags: ['agenda'],
        response: {
          200: {
            type: 'object',
            properties: {
              updated_at: { type: 'string', description: 'ISO timestamp' },
              source_used: {
                type: 'string',
                enum: ['airtablecache', 'airtable_api'],
              },
              agenda: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    Title: { type: 'string' },
                    Date: { type: 'string' },
                    StartTime: { type: 'string' },
                    Room: { type: 'string' },
                    TypeTrack: { type: 'string' },
                    SessionDescription: { type: 'string' },
                    SpeakerNames: { type: 'string' },
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
      app.logger.info('Fetching agenda');

      try {
        const result = await getAgenda();
        app.logger.info(
          {
            source: result.source_used,
            count: result.agenda.length,
          },
          'Agenda fetched successfully'
        );
        return result;
      } catch (error) {
        app.logger.error(
          { err: error },
          'Failed to fetch agenda'
        );
        return reply.status(502).send({
          error: 'Failed to fetch agenda from Airtable',
        });
      }
    }
  );
}
