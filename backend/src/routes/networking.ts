import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { App } from '../index.js';
import { getAttendeesDirectory } from '../services/attendeeDirectory.js';

interface AttendeeListItem {
  email: string;
  name: string;
  company?: string;
  title?: string;
}

function buildName(firstName?: string, lastName?: string): string {
  const parts = [];
  if (firstName) parts.push(firstName);
  if (lastName) parts.push(lastName);
  return parts.join(' ') || 'Unknown';
}

function sortAttendees(attendees: AttendeeListItem[]): AttendeeListItem[] {
  return attendees.sort((a, b) => {
    const lastNameA = a.name.split(' ').pop() || '';
    const lastNameB = b.name.split(' ').pop() || '';
    if (lastNameA !== lastNameB) {
      return lastNameA.localeCompare(lastNameB);
    }
    const firstNameA = a.name.split(' ')[0] || '';
    const firstNameB = b.name.split(' ')[0] || '';
    return firstNameA.localeCompare(firstNameB);
  });
}

export function register(app: App, fastify: FastifyInstance) {
  fastify.get(
    '/api/networking/attendees',
    {
      schema: {
        description: 'List all attendees sorted by name with optional search',
        tags: ['networking'],
        querystring: {
          type: 'object',
          properties: {
            search: {
              type: 'string',
              description: 'Search by name, company, or title',
            },
          },
        },
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                email: { type: 'string' },
                name: { type: 'string' },
                company: { type: 'string' },
                title: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Querystring: { search?: string };
      }>
    ): Promise<AttendeeListItem[]> => {
      app.logger.info(
        { search: request.query.search },
        'Fetching attendees list'
      );

      const result = await getAttendeesDirectory();

      if (result.error) {
        app.logger.warn({ error: result.error }, 'Failed to fetch attendees');
        return [];
      }

      let attendees: AttendeeListItem[] = result.attendees.map((att) => ({
        email: att.email || '',
        name: buildName(att.firstName, att.lastName),
        company: att.company,
        title: att.title,
      }));

      if (request.query.search) {
        const searchLower = request.query.search.toLowerCase();
        attendees = attendees.filter(
          (att) =>
            att.name.toLowerCase().includes(searchLower) ||
            att.company?.toLowerCase().includes(searchLower) ||
            att.title?.toLowerCase().includes(searchLower)
        );
      }

      const sorted = sortAttendees(attendees);
      app.logger.info(
        { count: sorted.length, search: request.query.search },
        'Attendees fetched successfully'
      );
      return sorted;
    }
  );

  fastify.get(
    '/api/networking/attendees/:email',
    {
      schema: {
        description:
          'Get attendee details from directory',
        tags: ['networking'],
        params: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', description: 'Attendee email address' },
          },
        },
        querystring: {
          type: 'object',
          properties: {
            viewer_email: {
              type: 'string',
              description: 'Email of person viewing the profile',
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              email: { type: 'string' },
              name: { type: 'string' },
              title: { type: 'string' },
              company: { type: 'string' },
              registration_type: { type: 'string' },
            },
          },
          404: {
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
        Params: { email: string };
        Querystring: { viewer_email?: string };
      }>,
      reply: FastifyReply
    ) => {
      const { email } = request.params;

      app.logger.info(
        { email },
        'Fetching attendee detail'
      );

      const result = await getAttendeesDirectory();

      if (result.error) {
        app.logger.warn({ error: result.error }, 'Failed to fetch attendees');
        return reply.status(404).send({ error: 'Attendee not found' });
      }

      const attendee = result.attendees.find(
        (att) => att.emailLower === email.toLowerCase()
      );

      if (!attendee) {
        app.logger.warn({ email }, 'Attendee not found');
        return reply.status(404).send({ error: 'Attendee not found' });
      }

      const detail = {
        email: attendee.email,
        name: buildName(attendee.firstName, attendee.lastName),
        title: attendee.title,
        company: attendee.company,
        registration_type: attendee.registrationType,
      };

      app.logger.info(
        { email },
        'Attendee detail fetched successfully'
      );
      return detail;
    }
  );
}
