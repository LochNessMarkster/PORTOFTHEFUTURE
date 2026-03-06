import type { FastifyInstance } from 'fastify';
import { getActivities } from '../services/activities.js';
import type { App } from '../index.js';

export function register(app: App, fastify: FastifyInstance) {
  fastify.get(
    '/api/activities',
    {
      schema: {
        description: 'Get activities from Airtable with caching',
        tags: ['activities'],
        response: {
          200: {
            type: 'object',
            properties: {
              updated_at: { type: 'string', description: 'ISO timestamp' },
              source_used: {
                type: 'string',
                enum: ['airtablecache', 'airtable_api', 'error'],
              },
              activities: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string' },
                    date: { type: 'string' },
                    time: { type: 'string' },
                    location: { type: 'string' },
                    url: { type: 'string' },
                    image_url: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request) => {
      app.logger.info('Fetching activities');

      const result = await getActivities();
      app.logger.info(
        {
          source: result.source_used,
          count: result.activities.length,
        },
        'Activities fetched successfully'
      );
      return result;
    }
  );
}
