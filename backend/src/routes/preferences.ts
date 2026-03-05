import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema/schema.js';
import type { App } from '../index.js';

interface PreferencesResponse {
  email: string;
  accept_messages: boolean;
  show_email: boolean;
  show_phone: boolean;
  show_company: boolean;
  show_title: boolean;
}

export function register(app: App, fastify: FastifyInstance) {
  fastify.get(
    '/api/preferences/:email',
    {
      schema: {
        description: 'Get user preferences by email',
        tags: ['preferences'],
        params: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', description: 'User email address' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              email: { type: 'string' },
              accept_messages: { type: 'boolean' },
              show_email: { type: 'boolean' },
              show_phone: { type: 'boolean' },
              show_company: { type: 'boolean' },
              show_title: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { email: string };
      }>
    ): Promise<PreferencesResponse> => {
      const { email } = request.params;
      app.logger.info({ email }, 'Fetching preferences');

      let preferences = await app.db.query.userPreferences.findFirst({
        where: eq(schema.userPreferences.email, email),
      });

      if (!preferences) {
        app.logger.info({ email }, 'Creating default preferences');
        const defaultPrefs = {
          email,
          acceptMessages: true,
          showEmail: false,
          showPhone: false,
          showCompany: true,
          showTitle: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        const inserted = await app.db
          .insert(schema.userPreferences)
          .values(defaultPrefs)
          .returning();
        preferences = inserted[0];
      }

      app.logger.info({ email }, 'Preferences retrieved successfully');
      return {
        email: preferences.email,
        accept_messages: preferences.acceptMessages,
        show_email: preferences.showEmail,
        show_phone: preferences.showPhone,
        show_company: preferences.showCompany,
        show_title: preferences.showTitle,
      };
    }
  );

  fastify.put(
    '/api/preferences/:email',
    {
      schema: {
        description: 'Update user preferences',
        tags: ['preferences'],
        params: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', description: 'User email address' },
          },
        },
        body: {
          type: 'object',
          properties: {
            accept_messages: { type: 'boolean' },
            show_email: { type: 'boolean' },
            show_phone: { type: 'boolean' },
            show_company: { type: 'boolean' },
            show_title: { type: 'boolean' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              email: { type: 'string' },
              accept_messages: { type: 'boolean' },
              show_email: { type: 'boolean' },
              show_phone: { type: 'boolean' },
              show_company: { type: 'boolean' },
              show_title: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { email: string };
        Body: {
          accept_messages?: boolean;
          show_email?: boolean;
          show_phone?: boolean;
          show_company?: boolean;
          show_title?: boolean;
        };
      }>
    ): Promise<PreferencesResponse> => {
      const { email } = request.params;
      app.logger.info({ email, body: request.body }, 'Updating preferences');

      const updates: Record<string, boolean | Date> = {
        updatedAt: new Date(),
      };

      if (request.body.accept_messages !== undefined) {
        updates.acceptMessages = request.body.accept_messages;
      }
      if (request.body.show_email !== undefined) {
        updates.showEmail = request.body.show_email;
      }
      if (request.body.show_phone !== undefined) {
        updates.showPhone = request.body.show_phone;
      }
      if (request.body.show_company !== undefined) {
        updates.showCompany = request.body.show_company;
      }
      if (request.body.show_title !== undefined) {
        updates.showTitle = request.body.show_title;
      }

      const updated = await app.db
        .update(schema.userPreferences)
        .set(updates as any)
        .where(eq(schema.userPreferences.email, email))
        .returning();

      if (updated.length === 0) {
        const defaultPrefs = {
          email,
          acceptMessages: request.body.accept_messages ?? true,
          showEmail: request.body.show_email ?? false,
          showPhone: request.body.show_phone ?? false,
          showCompany: request.body.show_company ?? true,
          showTitle: request.body.show_title ?? true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        const inserted = await app.db
          .insert(schema.userPreferences)
          .values(defaultPrefs)
          .returning();
        const preferences = inserted[0];

        app.logger.info({ email }, 'Preferences created and updated');
        return {
          email: preferences.email,
          accept_messages: preferences.acceptMessages,
          show_email: preferences.showEmail,
          show_phone: preferences.showPhone,
          show_company: preferences.showCompany,
          show_title: preferences.showTitle,
        };
      }

      const preferences = updated[0];
      app.logger.info({ email }, 'Preferences updated successfully');
      return {
        email: preferences.email,
        accept_messages: preferences.acceptMessages,
        show_email: preferences.showEmail,
        show_phone: preferences.showPhone,
        show_company: preferences.showCompany,
        show_title: preferences.showTitle,
      };
    }
  );
}
