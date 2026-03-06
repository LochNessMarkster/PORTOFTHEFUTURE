import type { FastifyInstance } from 'fastify';
import { getSponsors } from '../services/sponsors.js';
import type { App } from '../index.js';

export function register(app: App, fastify: FastifyInstance) {
  fastify.get(
    '/api/sponsors',
    {
      schema: {
        description: 'Get sponsors from Airtable with caching',
        tags: ['sponsors'],
        response: {
          200: {
            type: 'object',
            properties: {
              updated_at: { type: 'string', description: 'ISO timestamp' },
              source_used: {
                type: 'string',
                enum: ['airtablecache', 'airtable_api', 'error'],
              },
              sponsors: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    level: { type: 'string' },
                    bio: { type: 'string' },
                    companyUrl: { type: 'string' },
                    email: { type: 'string' },
                    linkedIn: { type: 'string' },
                    facebook: { type: 'string' },
                    x: { type: 'string' },
                    logoUrl: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request) => {
      app.logger.info('Fetching sponsors');

      const result = await getSponsors();
      app.logger.info(
        {
          source: result.source_used,
          count: result.sponsors.length,
        },
        'Sponsors fetched successfully'
      );
      return result;
    }
  );
}
