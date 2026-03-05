import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema/schema.js';
import type { App } from '../index.js';

interface AttendeeDetail {
  email: string;
  name: string;
  title?: string;
  company?: string;
  registration_type?: string;
}

interface AttendeeListItem {
  email: string;
  name: string;
  company?: string;
  title?: string;
}

const mockAttendees: AttendeeDetail[] = [
  {
    email: 'participant1@example.com',
    name: 'Alice Johnson',
    title: 'Director',
    company: 'Tech Corp',
    registration_type: 'Standard',
  },
  {
    email: 'participant2@example.com',
    name: 'Bob Smith',
    title: 'Engineer',
    company: 'Innovation Inc',
    registration_type: 'VIP',
  },
  {
    email: 'charlie@example.com',
    name: 'Charlie Brown',
    title: 'Manager',
    company: 'Future Systems',
    registration_type: 'Standard',
  },
  {
    email: 'diana@example.com',
    name: 'Diana Prince',
    title: 'CEO',
    company: 'Global Ventures',
    registration_type: 'Sponsor',
  },
];

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

      let attendees: AttendeeListItem[] = mockAttendees.map((att) => ({
        email: att.email,
        name: att.name,
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
          'Get attendee details, respecting visibility toggles',
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
      const { viewer_email } = request.query;

      app.logger.info(
        { email, viewer_email },
        'Fetching attendee detail'
      );

      const attendee = mockAttendees.find((att) => att.email === email);

      if (!attendee) {
        app.logger.warn({ email }, 'Attendee not found');
        return reply.status(404).send({ error: 'Attendee not found' });
      }

      let preferences = await app.db.query.userPreferences.findFirst({
        where: eq(schema.userPreferences.email, email),
      });

      if (!preferences) {
        preferences = {
          email,
          acceptMessages: true,
          showEmail: false,
          showPhone: false,
          showCompany: true,
          showTitle: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      const detail: any = {
        email: attendee.email,
        name: attendee.name,
      };

      if (preferences.showTitle) {
        detail.title = attendee.title;
      }

      if (preferences.showCompany) {
        detail.company = attendee.company;
      }

      detail.registration_type = attendee.registration_type;

      app.logger.info(
        { email, viewer_email },
        'Attendee detail fetched successfully'
      );
      return detail;
    }
  );
}
