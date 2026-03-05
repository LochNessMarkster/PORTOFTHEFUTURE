import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { App } from '../index.js';

interface AirtableAttachment {
  id?: string;
  url?: string;
  filename?: string;
  size?: number;
  type?: string;
  thumbnails?: {
    small?: { url?: string; width?: number; height?: number };
    large?: { url?: string; width?: number; height?: number };
  };
}

interface AirtableRecord {
  id: string;
  fields: {
    'Port Name'?: string;
    'Intro'?: string;
    'Port Bio'?: string;
    'Port URL'?: string;
    'Logo graphic'?: AirtableAttachment[];
    'Featured Port Graphic'?: AirtableAttachment[];
  };
  createdTime: string;
}

interface PortResponse {
  id: string;
  name: string;
  intro?: string;
  bio?: string;
  url?: string;
  logo_url?: string;
  featured_image_url?: string;
}

async function fetchAirtableData(): Promise<PortResponse[]> {
  try {
    const response = await fetch(
      'https://airtablecache.portofthefutureconference.com/v0/appkKjciinTlnsbkd/tblrXosiVXKhJHYLu'
    );
    const data = (await response.json()) as { records: AirtableRecord[] };

    return data.records
      .map((record) => ({
        id: record.id,
        name: record.fields['Port Name'] || '',
        intro: record.fields['Intro'],
        bio: record.fields['Port Bio'],
        url: record.fields['Port URL'],
        logo_url:
          record.fields['Logo graphic']?.[0]?.thumbnails?.large?.url ||
          record.fields['Logo graphic']?.[0]?.url,
        featured_image_url:
          record.fields['Featured Port Graphic']?.[0]?.thumbnails?.large?.url ||
          record.fields['Featured Port Graphic']?.[0]?.url,
      }))
      .filter((port) => port.name)
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    return [];
  }
}

export function register(app: App, fastify: FastifyInstance) {
  fastify.get(
    '/api/ports',
    {
      schema: {
        description: 'Get all ports with optional search',
        tags: ['ports'],
        querystring: {
          type: 'object',
          properties: {
            search: { type: 'string', description: 'Search by port name' },
          },
        },
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                intro: { type: 'string' },
                bio: { type: 'string' },
                url: { type: 'string' },
                logo_url: { type: 'string' },
                featured_image_url: { type: 'string' },
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
    ) => {
      app.logger.info(
        { search: request.query.search },
        'Fetching ports'
      );
      const ports = await fetchAirtableData();

      if (request.query.search) {
        const search = request.query.search.toLowerCase();
        const filtered = ports.filter((port) =>
          port.name.toLowerCase().includes(search)
        );
        app.logger.info(
          { search: request.query.search, count: filtered.length },
          'Ports search completed'
        );
        return filtered;
      }

      app.logger.info({ count: ports.length }, 'Ports fetched successfully');
      return ports;
    }
  );

  fastify.get(
    '/api/ports/:id',
    {
      schema: {
        description: 'Get port details by ID',
        tags: ['ports'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'Port ID' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              intro: { type: 'string' },
              bio: { type: 'string' },
              url: { type: 'string' },
              logo_url: { type: 'string' },
              featured_image_url: { type: 'string' },
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
        Params: { id: string };
      }>,
      reply: FastifyReply
    ) => {
      app.logger.info({ id: request.params.id }, 'Fetching port detail');
      const ports = await fetchAirtableData();
      const port = ports.find((p) => p.id === request.params.id);

      if (!port) {
        app.logger.warn(
          { id: request.params.id },
          'Port not found'
        );
        return reply
          .status(404)
          .send({ error: 'Port not found' });
      }

      app.logger.info(
        { id: request.params.id, name: port.name },
        'Port detail fetched successfully'
      );
      return port;
    }
  );
}
