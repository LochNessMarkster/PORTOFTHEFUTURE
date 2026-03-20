import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { App } from '../index.js';

interface AirtableRecord {
  id: string;
  fields: {
    'Title'?: string;
    'Date'?: string;
    'Start Time'?: string;
    'End Time'?: string;
    'Room'?: string;
    'Type/Track'?: string;
    'Session Description'?: string;
    'Speaker Names'?: string | string[];
  };
  createdTime: string;
}

interface AirtableResponse {
  records: AirtableRecord[];
  offset?: string;
}

interface SessionResponse {
  id: string;
  title: string;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  room: string | null;
  typeTrack: string | null;
  sessionDescription: string | null;
  speakerNames: string | string[] | null;
}

const AIRTABLE_BASE_URL =
  'https://airtablecache.portofthefutureconference.com/v0/appkKjciinTlnsbkd/tblHaxjP8sWviBQjD';

async function fetchAllSessionRecords(): Promise<AirtableRecord[]> {
  let allRecords: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const url = offset
      ? `${AIRTABLE_BASE_URL}?offset=${encodeURIComponent(offset)}`
      : AIRTABLE_BASE_URL;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(url, { signal: controller.signal });

      if (!response.ok) {
        return allRecords;
      }

      const data = (await response.json()) as AirtableResponse;

      if (!Array.isArray(data.records)) {
        return allRecords;
      }

      allRecords = allRecords.concat(data.records);
      offset = data.offset;
    } catch (error) {
      return allRecords;
    } finally {
      clearTimeout(timeoutId);
    }
  } while (offset);

  return allRecords;
}

function speakerNameMatches(
  speakerNames: string | string[] | undefined,
  searchName: string
): boolean {
  if (!speakerNames) {
    return false;
  }

  const searchLower = searchName.toLowerCase();

  if (Array.isArray(speakerNames)) {
    return speakerNames.some((name) =>
      name.toLowerCase().includes(searchLower)
    );
  }

  return speakerNames.toLowerCase().includes(searchLower);
}

function sortSessions(sessions: SessionResponse[]): SessionResponse[] {
  return sessions.sort((a, b) => {
    // Sort by date ascending
    const dateA = a.date ? new Date(a.date).getTime() : Infinity;
    const dateB = b.date ? new Date(b.date).getTime() : Infinity;

    if (dateA !== dateB) {
      return dateA - dateB;
    }

    // Then sort by start time ascending
    const timeA = a.startTime ? a.startTime : 'ZZZ';
    const timeB = b.startTime ? b.startTime : 'ZZZ';

    return timeA.localeCompare(timeB);
  });
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
          required: ['speakerName'],
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
                title: { type: 'string' },
                date: { type: ['string', 'null'] },
                startTime: { type: ['string', 'null'] },
                endTime: { type: ['string', 'null'] },
                room: { type: ['string', 'null'] },
                typeTrack: { type: ['string', 'null'] },
                sessionDescription: { type: ['string', 'null'] },
                speakerNames: { type: ['string', 'array', 'null'] },
              },
            },
          },
          400: {
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
        Querystring: { speakerName?: string };
      }>,
      reply: FastifyReply
    ) => {
      const { speakerName } = request.query;

      // Validate required parameter
      if (!speakerName || !speakerName.trim()) {
        app.logger.warn(
          { speakerName },
          'Missing or empty speakerName parameter'
        );
        return reply.status(400).send({ error: 'speakerName parameter is required' });
      }

      app.logger.info(
        { speakerName },
        'Fetching sessions by speaker'
      );

      const records = await fetchAllSessionRecords();

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
          title: record.fields['Title'] || '',
          date: record.fields['Date'] || null,
          startTime: record.fields['Start Time'] || null,
          endTime: record.fields['End Time'] || null,
          room: record.fields['Room'] || null,
          typeTrack: record.fields['Type/Track'] || null,
          sessionDescription: record.fields['Session Description'] || null,
          speakerNames: record.fields['Speaker Names'] || null,
        }));

      const sorted = sortSessions(matchingSessions);

      app.logger.info(
        { speakerName, count: sorted.length },
        'Sessions by speaker fetched successfully'
      );

      return sorted;
    }
  );
}
