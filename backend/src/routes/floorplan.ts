import type { FastifyInstance } from 'fastify';
import type { App } from '../index.js';

export function register(app: App, fastify: FastifyInstance) {
  fastify.get(
    '/api/floor-plan',
    {
      schema: {
        description: 'Get floor plan image and venue information',
        tags: ['floor-plan'],
        response: {
          200: {
            type: 'object',
            properties: {
              image_url: { type: 'string', description: 'URL to floor plan image' },
              venue_notes: {
                type: 'string',
                description: 'Venue information and notes',
              },
            },
          },
        },
      },
    },
    async () => {
      app.logger.info('Fetching floor plan');

      const floorPlanData = {
        image_url:
          'https://example.com/floor-plan.png',
        venue_notes:
          'Conference venue information and accessibility notes.',
      };

      app.logger.info('Floor plan fetched successfully');
      return floorPlanData;
    }
  );
}
