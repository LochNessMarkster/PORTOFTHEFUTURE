interface AirtableAgendaFields {
  Title?: string;
  Date?: string;
  'Start Time'?: string;
  'End Time'?: string;
  Room?: string;
  'Type/Track'?: string;
  'Session Description'?: string;
  'Speaker Names'?: string | string[];
}

interface AirtableRecord {
  id: string;
  fields: AirtableAgendaFields;
  createdTime: string;
}

interface AirtableResponse {
  records: AirtableRecord[];
  offset?: string;
}

export interface AgendaItem {
  id: string;
  Title?: string;
  Date?: string;
  StartTime?: string;
  EndTime?: string;
  Room?: string;
  TypeTrack?: string;
  SessionDescription?: string;
  SpeakerNames?: string;
}

interface AgendaCache {
  data: AgendaResponse;
  timestamp: number;
}

export interface AgendaResponse {
  updated_at: string;
  source_used: 'airtablecache' | 'airtable_api';
  agenda: AgendaItem[];
}

const CACHE_TTL = 21600000; // 6 hours in milliseconds
let agendaCache: AgendaCache | null = null;

function convertTimeToMinutes(timeStr: string): number {
  const trimmed = timeStr.trim();
  const match = trimmed.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return 0;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
}

function resolveSpeakerNames(speakerData: string | string[] | undefined): string | undefined {
  if (!speakerData) {
    return undefined;
  }

  let speakerNames: string;

  if (Array.isArray(speakerData)) {
    speakerNames = speakerData.join(', ');
  } else {
    speakerNames = speakerData;
  }

  if (!speakerNames || speakerNames.trim() === '') {
    return undefined;
  }

  const isRecordId = /^rec[A-Za-z0-9]{14}$/.test(speakerNames.trim());
  if (isRecordId) {
    return undefined;
  }

  return speakerNames;
}

function mapAgendaItem(record: AirtableRecord): AgendaItem {
  return {
    id: record.id,
    Title: record.fields.Title,
    Date: record.fields.Date,
    StartTime: record.fields['Start Time'],
    EndTime: record.fields['End Time'],
    Room: record.fields.Room,
    TypeTrack: record.fields['Type/Track'],
    SessionDescription: record.fields['Session Description'],
    SpeakerNames: resolveSpeakerNames(record.fields['Speaker Names']),
  };
}

function filterAgendaByDateRange(agenda: AgendaItem[]): AgendaItem[] {
  const startDate = new Date('2026-03-23');
  const endDate = new Date('2026-03-25');
  endDate.setHours(23, 59, 59, 999);

  return agenda.filter((item) => {
    if (!item.Date) return false;
    const itemDate = new Date(item.Date);
    return itemDate >= startDate && itemDate <= endDate;
  });
}

function sortAgenda(agenda: AgendaItem[]): AgendaItem[] {
  return agenda.sort((a, b) => {
    const dateA = a.Date || '';
    const dateB = b.Date || '';

    if (dateA !== dateB) {
      return dateA.localeCompare(dateB);
    }

    const timeAMinutes = convertTimeToMinutes(a.StartTime || '');
    const timeBMinutes = convertTimeToMinutes(b.StartTime || '');

    if (timeAMinutes !== timeBMinutes) {
      return timeAMinutes - timeBMinutes;
    }

    const titleA = (a.Title || '').toLowerCase();
    const titleB = (b.Title || '').toLowerCase();
    return titleA.localeCompare(titleB);
  });
}

async function fetchFromUrl(
  url: string,
  headers?: Record<string, string>
): Promise<AirtableResponse | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }
    return (await response.json()) as AirtableResponse;
  } catch (error) {
    return null;
  }
}

async function fetchAllAgenda(
  baseUrl: string,
  authHeaders?: Record<string, string>,
  logger?: { info: (msg: string, obj?: any) => void; error: (msg: string, obj?: any) => void }
): Promise<AgendaItem[] | null> {
  const agenda: AgendaItem[] = [];
  let offset: string | undefined;
  let pageCount = 0;
  let totalRecords = 0;

  try {
    do {
      pageCount += 1;
      const url = offset ? `${baseUrl}?offset=${offset}` : baseUrl;

      if (logger) {
        logger.info(`Fetching agenda page ${pageCount}${offset ? ` with offset: ${offset}` : ''}`);
      }

      const data = await fetchFromUrl(url, authHeaders);

      if (!data) {
        if (logger) {
          logger.error(`Failed to fetch agenda page ${pageCount}`, {
            offset,
            pagesLoaded: pageCount - 1,
            recordsLoaded: totalRecords,
          });
        }
        return null;
      }

      if (!Array.isArray(data.records)) {
        if (logger) {
          logger.error(`Invalid response format on page ${pageCount}`, {
            hasRecords: 'records' in data,
          });
        }
        return null;
      }

      const pageRecordCount = data.records.length;
      totalRecords += pageRecordCount;

      const mapped = data.records.map(mapAgendaItem);
      agenda.push(...mapped);

      if (logger) {
        logger.info(`Page ${pageCount} fetched: ${pageRecordCount} records, Total so far: ${totalRecords}`);
      }

      offset = data.offset;
    } while (offset);

    if (logger) {
      logger.info(`Agenda fetch completed: ${pageCount} pages, ${totalRecords} total records`);
    }

    return agenda;
  } catch (error) {
    if (logger) {
      logger.error('Error fetching agenda', { error: String(error) });
    }
    return null;
  }
}

export async function getAgenda(logger?: { info: (msg: string, obj?: any) => void; error: (msg: string, obj?: any) => void }): Promise<AgendaResponse> {
  const now = Date.now();

  if (agendaCache && now - agendaCache.timestamp < CACHE_TTL) {
    if (logger) {
      logger.info('Returning cached agenda', {
        cacheAge: now - agendaCache.timestamp,
        sessionCount: agendaCache.data.agenda.length,
      });
    }
    return agendaCache.data;
  }

  const cacheBaseUrl =
    'https://airtablecache.portofthefutureconference.com/v0/appkKjciinTlnsbkd/tblhUTXC3XHVGssO4';
  const apiBaseUrl =
    'https://api.airtable.com/v0/appkKjciinTlnsbkd/tblhUTXC3XHVGssO4';
  const airtablePat = process.env.AIRTABLE_PAT;

  let agenda: AgendaItem[] | null = null;
  let sourceUsed: 'airtablecache' | 'airtable_api' = 'airtablecache';

  if (logger) {
    logger.info('Fetching agenda from cache endpoint');
  }

  agenda = await fetchAllAgenda(cacheBaseUrl, undefined, logger);

  if (agenda === null) {
    if (logger) {
      logger.info('Cache endpoint failed, trying Airtable API');
    }
    sourceUsed = 'airtable_api';
    const authHeaders = airtablePat
      ? { Authorization: `Bearer ${airtablePat}` }
      : {};
    agenda = await fetchAllAgenda(apiBaseUrl, authHeaders, logger);
  }

  if (agenda === null) {
    throw new Error('Failed to fetch agenda from Airtable');
  }

  if (logger) {
    logger.info(`Total records fetched: ${agenda.length}`);
  }

  const filtered = filterAgendaByDateRange(agenda);

  if (logger) {
    logger.info(`Filtered to March 23-25, 2026: ${filtered.length} sessions`);
  }

  const sorted = sortAgenda(filtered);

  const response: AgendaResponse = {
    updated_at: new Date().toISOString(),
    source_used: sourceUsed,
    agenda: sorted,
  };

  agendaCache = {
    data: response,
    timestamp: now,
  };

  if (logger) {
    logger.info('Agenda fetch and processing completed', {
      source: sourceUsed,
      totalRecords: agenda.length,
      filteredRecords: sorted.length,
    });
  }

  return response;
}
