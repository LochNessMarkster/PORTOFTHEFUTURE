import type { FastifyInstance, FastifyRequest } from 'fastify';
import { getAttendeesDirectory } from '../services/attendeeDirectory.js';
import type { App } from '../index.js';

export function register(app: App, fastify: FastifyInstance) {
  fastify.post(
    '/api/login',
    {
      schema: {
        description: 'Login with email and password',
        tags: ['auth'],
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', description: 'Attendee email' },
            password: { type: 'string', description: 'Password (POTF2026)' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              attendee: {
                type: 'object',
                properties: {
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  email: { type: 'string' },
                  company: { type: 'string' },
                  title: { type: 'string' },
                  phone: { type: 'string' },
                  registrationType: { type: 'string' },
                },
              },
            },
          },
          401: {
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
        Body: { email: string; password: string };
      }>,
      reply
    ) => {
      const { email, password } = request.body;

      app.logger.info({ email }, 'Login attempt');

      if (password !== 'POTF2026') {
        app.logger.warn({ email }, 'Invalid password');
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      const result = await getAttendeesDirectory();

      if (result.error) {
        app.logger.error(
          { error: result.error },
          'Failed to fetch attendees for login'
        );
        return reply
          .status(401)
          .send({ error: 'Unable to validate attendee' });
      }

      const attendee = result.attendees.find(
        (att) => att.emailLower === email.toLowerCase()
      );

      if (!attendee) {
        app.logger.warn({ email }, 'Attendee not found');
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      app.logger.info(
        { email, firstName: attendee.firstName, lastName: attendee.lastName },
        'Login successful'
      );

      return {
        success: true,
        attendee: {
          firstName: attendee.firstName,
          lastName: attendee.lastName,
          email: attendee.email,
          company: attendee.company,
          title: attendee.title,
          phone: attendee.phone,
          registrationType: attendee.registrationType,
        },
      };
    }
  );
}
