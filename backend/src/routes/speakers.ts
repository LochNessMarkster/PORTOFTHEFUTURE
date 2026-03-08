import type { FastifyInstance, FastifyReply } from 'fastify';
import { getSpeakers } from '../services/speakers.js';
import type { App } from '../index.js';

export function register(app: App, fastify: FastifyInstance) {
  fastify.get(
    '/api/speakers',
    {
      schema: {
        description: 'Get speakers from Airtable with caching',
        tags: ['speakers'],
        response: {
          200: {
            type: 'object',
            properties: {
              updated_at: { type: 'string', description: 'ISO timestamp' },
              source_used: {
                type: 'string',
                enum: ['airtablecache', 'airtable_api'],
              },
              speakers: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    title: { type: 'string' },
                    speakingTopic: { type: 'string' },
                    synopsis: { type: 'string' },
                    bio: { type: 'string' },
                    published: { type: 'boolean' },
                    publicPersonalData: { type: 'boolean' },
                    photoUrl: { type: 'string' },
                    email: { type: 'string' },
                    phone: { type: 'string' },
                    company: { type: 'string' },
                  },
                },
              },
            },
          },
          500: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply: FastifyReply) => {
      app.logger.info('Fetching speakers');

      try {
        const result = await getSpeakers();
        app.logger.info(
          {
            source: result.source_used,
            count: result.speakers.length,
          },
          'Speakers fetched successfully'
        );
        return result;
      } catch (error) {
        app.logger.error(
          { err: error },
          'Failed to fetch speakers'
        );
        return reply.status(500).send({
          error: 'Failed to fetch speakers from Airtable',
        });
      }
    }
  );
}
