import type { FastifyInstance } from 'fastify';
import { getExhibitors } from '../services/exhibitors.js';
import type { App } from '../index.js';

export function register(app: App, fastify: FastifyInstance) {
  fastify.get(
    '/api/exhibitors',
    {
      schema: {
        description: 'Get exhibitors from Airtable with caching',
        tags: ['exhibitors'],
        response: {
          200: {
            type: 'object',
            properties: {
              updated_at: { type: 'string', description: 'ISO timestamp' },
              source_used: {
                type: 'string',
                enum: ['airtablecache', 'airtable_api', 'error'],
              },
              exhibitors: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string' },
                    boothNumber: { type: 'string' },
                    address: { type: 'string' },
                    url: { type: 'string' },
                    linkedIn: { type: 'string' },
                    facebook: { type: 'string' },
                    x: { type: 'string' },
                    primaryContactName: { type: 'string' },
                    primaryContactTitle: { type: 'string' },
                    primaryContactEmail: { type: 'string' },
                    primaryDirectPhone: { type: 'string' },
                    adminPhoneBooth: { type: 'string' },
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
      app.logger.info('Fetching exhibitors');

      const result = await getExhibitors();
      app.logger.info(
        {
          source: result.source_used,
          count: result.exhibitors.length,
        },
        'Exhibitors fetched successfully'
      );
      return result;
    }
  );
}
