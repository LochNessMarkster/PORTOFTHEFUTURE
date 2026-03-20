import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { App } from '../index.js';

interface AirtableRecord {
  id: string;
  fields: {
    'Title'?: string;
    'Date'?: string;
    'Start Time'?: string;
    'End Time'?: string;
    'Location'?: string;
    'Description'?: string;
    'Speaker Names'?: string;
  };
  createdTime: string;
}

interface AirtableResponse {
  records: AirtableRecord[];
  offset?: string;
}

interface SessionResponse {
  id: string;
  Title?: string;
  Date?: string;
  'Start Time'?: string;
  'End Time'?: string;
  Location?: string;
  Description?: string;
  'Speaker Names'?: string;
}

const TABLE_ID = 'tblHaxjP8sWviBQjD';

function buildAirtableUrl(baseId: string, tableId: string, offset?: string): string {
  const url = `https://api.airtable.com/v0/${baseId}/${tableId}`;
  if (offset) {
    return `${url}?offset=${encodeURIComponent(offset)}`;
  }
  return url;
}

async function fetchAllSessionRecords(
  baseId: string,
  apiKey: string
): Promise<AirtableRecord[]> {
  let allRecords: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const url = buildAirtableUrl(baseId, TABLE_ID, offset);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        break;
      }

      const data = (await response.json()) as AirtableResponse;

      if (!Array.isArray(data.records)) {
        break;
      }

      allRecords = allRecords.concat(data.records);
      offset = data.offset;
    } catch (error) {
      break;
    } finally {
      clearTimeout(timeoutId);
    }
  } while (offset);

  return allRecords;
}

function speakerNameMatches(
  speakerNames: string | undefined,
  searchName: string
): boolean {
  if (!speakerNames) {
    return false;
  }

  const searchLower = searchName.toLowerCase().trim();
  const names = speakerNames
    .split(',')
    .map((name) => name.trim().toLowerCase());

  return names.some((name) => name.includes(searchLower));
}

export function register(app: App, fastify: FastifyInstance) {
  fastify.get(
    '/api/sessions/by-speaker',
    {
      schema: {
        description: 'Get sessions filtered by speaker name',
        tags: ['sessions'],
        querystring: {
          type: 'object',
          properties: {
            speakerName: {
              type: 'string',
              description: 'Speaker name to search for (substring match)',
            },
          },
        },
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                Title: { type: 'string' },
                Date: { type: 'string' },
                'Start Time': { type: 'string' },
                'End Time': { type: 'string' },
                Location: { type: 'string' },
                Description: { type: 'string' },
                'Speaker Names': { type: 'string' },
              },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Querystring: { speakerName?: string };
      }>
    ) => {
      const { speakerName } = request.query;

      app.logger.info(
        { speakerName },
        'Fetching sessions by speaker'
      );

      // If speakerName is not provided, return empty array
      if (!speakerName || !speakerName.trim()) {
        app.logger.info(
          { speakerName },
          'No speaker name provided, returning empty array'
        );
        return [];
      }

      const baseId = process.env.AIRTABLE_BASE_ID;
      const apiKey = process.env.AIRTABLE_API_KEY;

      if (!baseId || !apiKey) {
        app.logger.error(
          {},
          'Missing AIRTABLE_BASE_ID or AIRTABLE_API_KEY environment variables'
        );
        return [];
      }

      const records = await fetchAllSessionRecords(baseId, apiKey);

      // Filter records by speaker name
      const matchingSessions: SessionResponse[] = records
        .filter((record) =>
          speakerNameMatches(
            record.fields['Speaker Names'],
            speakerName.trim()
          )
        )
        .map((record) => ({
          id: record.id,
          Title: record.fields['Title'],
          Date: record.fields['Date'],
          'Start Time': record.fields['Start Time'],
          'End Time': record.fields['End Time'],
          Location: record.fields['Location'],
          Description: record.fields['Description'],
          'Speaker Names': record.fields['Speaker Names'],
        }));

      app.logger.info(
        { speakerName, count: matchingSessions.length },
        'Sessions by speaker fetched successfully'
      );

      return matchingSessions;
    }
  );
}
