import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { App } from '../index.js';

interface AirtableAttachment {
  url: string;
}

interface AirtableRecord {
  id: string;
  fields: {
    'Presentation Title'?: string;
    'Description'?: string;
    'File URL'?: string;
    'Presentation File'?: AirtableAttachment[];
    'Published'?: boolean;
  };
  createdTime: string;
}

interface AirtableResponse {
  records: AirtableRecord[];
  offset?: string;
}

interface PresentationResponse {
  id: string;
  title: string;
  description?: string;
  file_url?: string;
}

const AIRTABLE_URL =
  'https://airtablecache.portofthefutureconference.com/v0/appkKjciinTlnsbkd/tblm5YCpC7ZwRSYWy';

async function fetchAllPresentationRecords(): Promise<AirtableRecord[]> {
  let allRecords: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const url = offset ? `${AIRTABLE_URL}?offset=${encodeURIComponent(offset)}` : AIRTABLE_URL;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(url, { signal: controller.signal });

      if (!response.ok) {
        throw new Error(`Airtable fetch failed: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as AirtableResponse;
      allRecords = allRecords.concat(data.records || []);
      offset = data.offset;
    } finally {
      clearTimeout(timeoutId);
    }
  } while (offset);

  return allRecords;
}

async function fetchPresentations(): Promise<PresentationResponse[]> {
  const records = await fetchAllPresentationRecords();

  return records
    .filter((record) => {
      const hasTitle = !!record.fields['Presentation Title']?.trim();
      const isPublished = record.fields['Published'] !== false;
      return hasTitle && isPublished;
    })
    .map((record) => ({
      id: record.id,
      title: record.fields['Presentation Title'] || '',
      description: record.fields['Description'] || '',
      file_url:
        record.fields['File URL'] ||
        record.fields['Presentation File']?.[0]?.url ||
        '',
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
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
            search: { type: 'string', description: 'Search by title or description' },
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
      app.logger.info({ search: request.query.search }, 'Fetching presentations');

      const presentations = await fetchPresentations();

      if (request.query.search?.trim()) {
        const search = request.query.search.toLowerCase().trim();

        const filtered = presentations.filter(
          (p) =>
            p.title.toLowerCase().includes(search) ||
            p.description?.toLowerCase().includes(search)
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
      app.logger.info({ id: request.params.id }, 'Fetching presentation detail');

      const presentations = await fetchPresentations();
      const presentation = presentations.find((p) => p.id === request.params.id);

      if (!presentation) {
        app.logger.warn({ id: request.params.id }, 'Presentation not found');
        return reply.status(404).send({ error: 'Presentation not found' });
      }

      app.logger.info(
        { id: request.params.id, title: presentation.title },
        'Presentation detail fetched successfully'
      );

      return presentation;
    }
  );
}