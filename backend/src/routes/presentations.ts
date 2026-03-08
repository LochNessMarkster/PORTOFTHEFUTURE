import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { App } from '../index.js';

interface AirtableRecord {
  id: string;
  fields: {
    'Presentation Title'?: string;
    'Description'?: string;
    'File URL'?: string;
    'Published'?: boolean;
  };
  createdTime: string;
}

interface PresentationResponse {
  id: string;
  title: string;
  description?: string;
  file_url?: string;
}

const mockPresentations: PresentationResponse[] = [
  {
    id: 'rec_pres_001',
    title: 'The Future of Ports',
    description: 'Exploring emerging technologies in port operations',
    file_url: 'https://example.com/presentations/future-of-ports.pdf',
  },
  {
    id: 'rec_pres_002',
    title: 'Digital Transformation in Logistics',
    description: 'How digital tools are revolutionizing supply chain management',
    file_url: 'https://example.com/presentations/digital-transformation.pdf',
  },
];

async function fetchPresentations(): Promise<PresentationResponse[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const response = await fetch(
      'https://airtablecache.portofthefutureconference.com/v0/appkKjciinTlnsbkd/tblm5YCpC7ZwRSYWy',
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);
    const data = (await response.json()) as { records: AirtableRecord[] };

    const presentations = data.records
      .filter(
        (record) =>
          record.fields['Presentation Title'] && record.fields['Published']
      )
      .map((record) => ({
        id: record.id,
        title: record.fields['Presentation Title'] || '',
        description: record.fields['Description'],
        file_url: record.fields['File URL'],
      }))
      .sort((a, b) => a.title.localeCompare(b.title));

    return presentations.length > 0 ? presentations : mockPresentations;
  } catch (error) {
    return mockPresentations;
  }
}

export function register(app: App, fastify: FastifyInstance) {
  fastify.get(
    '/api/presentations',
    {
      schema: {
        description: 'Get all presentations with optional search',
        tags: ['presentations'],
        querystring: {
          type: 'object',
          properties: {
            search: { type: 'string', description: 'Search by title' },
          },
        },
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string' },
                file_url: { type: 'string' },
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
        'Fetching presentations'
      );
      const presentations = await fetchPresentations();

      if (request.query.search) {
        const search = request.query.search.toLowerCase();
        const filtered = presentations.filter((p) =>
          p.title.toLowerCase().includes(search)
        );
        app.logger.info(
          { search: request.query.search, count: filtered.length },
          'Presentations search completed'
        );
        return filtered;
      }

      app.logger.info(
        { count: presentations.length },
        'Presentations fetched successfully'
      );
      return presentations;
    }
  );

  fastify.get(
    '/api/presentations/:id',
    {
      schema: {
        description: 'Get presentation details and download link',
        tags: ['presentations'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'Presentation ID' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              file_url: { type: 'string' },
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
      app.logger.info(
        { id: request.params.id },
        'Fetching presentation detail'
      );
      const presentations = await fetchPresentations();
      const presentation = presentations.find((p) => p.id === request.params.id);

      if (!presentation) {
        app.logger.warn(
          { id: request.params.id },
          'Presentation not found'
        );
        return reply
          .status(404)
          .send({ error: 'Presentation not found' });
      }

      app.logger.info(
        { id: request.params.id, title: presentation.title },
        'Presentation detail fetched successfully'
      );
      return presentation;
    }
  );
}
