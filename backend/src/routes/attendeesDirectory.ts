import type { FastifyInstance } from 'fastify';
import { getAttendeesDirectory, type Attendee } from '../services/attendeeDirectory.js';
import type { App } from '../index.js';

export function register(app: App, fastify: FastifyInstance) {
  fastify.get(
    '/api/attendees-directory',
    {
      schema: {
        description: 'Get attendees directory from Airtable',
        tags: ['attendees'],
        response: {
          200: {
            type: 'object',
            properties: {
              attendees: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    email: { type: 'string' },
                    company: { type: 'string' },
                    title: { type: 'string' },
                    phone: { type: 'string' },
                    registrationType: { type: 'string' },
                    emailLower: { type: 'string' },
                  },
                },
              },
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async () => {
      app.logger.info('Fetching attendees directory');

      const result = await getAttendeesDirectory();

      if (result.error) {
        app.logger.warn({ error: result.error }, 'Attendees directory fetch failed');
        return {
          attendees: [],
          error: result.error,
        };
      }

      app.logger.info(
        { count: result.attendees.length },
        'Attendees directory fetched successfully'
      );
      return {
        attendees: result.attendees,
      };
    }
  );
}
