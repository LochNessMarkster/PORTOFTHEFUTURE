interface AirtableAgendaFields {
  Title?: string;
  Date?: string;
  'Start Time'?: string;
  Room?: string;
  'Type/Track'?: string;
  'Session Description'?: string;
  'Speaker Names'?: string;
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

function mapAgendaItem(record: AirtableRecord): AgendaItem {
  return {
    id: record.id,
    Title: record.fields.Title,
    Date: record.fields.Date,
    StartTime: record.fields['Start Time'],
    Room: record.fields.Room,
    TypeTrack: record.fields['Type/Track'],
    SessionDescription: record.fields['Session Description'],
    SpeakerNames: record.fields['Speaker Names'],
  };
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

    return timeAMinutes - timeBMinutes;
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
  authHeaders?: Record<string, string>
): Promise<AgendaItem[] | null> {
  const agenda: AgendaItem[] = [];
  let offset: string | undefined;

  try {
    do {
      const url = offset ? `${baseUrl}?offset=${offset}` : baseUrl;
      const data = await fetchFromUrl(url, authHeaders);

      if (!data) {
        return null;
      }

      if (!Array.isArray(data.records)) {
        return null;
      }

      const mapped = data.records.map(mapAgendaItem);
      agenda.push(...mapped);

      offset = data.offset;
    } while (offset);

    return agenda;
  } catch (error) {
    return null;
  }
}

export async function getAgenda(): Promise<AgendaResponse> {
  const now = Date.now();

  if (agendaCache && now - agendaCache.timestamp < CACHE_TTL) {
    return agendaCache.data;
  }

  const cacheBaseUrl =
    'https://airtablecache.portofthefutureconference.com/v0/appkKjciinTlnsbkd/tblhUTXC3XHVGssO4';
  const apiBaseUrl =
    'https://api.airtable.com/v0/appkKjciinTlnsbkd/tblhUTXC3XHVGssO4';
  const airtablePat = process.env.AIRTABLE_PAT;

  let agenda: AgendaItem[] | null = null;
  let sourceUsed: 'airtablecache' | 'airtable_api' = 'airtablecache';

  agenda = await fetchAllAgenda(cacheBaseUrl);

  if (agenda === null) {
    sourceUsed = 'airtable_api';
    const authHeaders = airtablePat
      ? { Authorization: `Bearer ${airtablePat}` }
      : {};
    agenda = await fetchAllAgenda(apiBaseUrl, authHeaders);
  }

  if (agenda === null) {
    throw new Error('Failed to fetch agenda from Airtable');
  }

  const sorted = sortAgenda(agenda);

  const response: AgendaResponse = {
    updated_at: new Date().toISOString(),
    source_used: sourceUsed,
    agenda: sorted,
  };

  agendaCache = {
    data: response,
    timestamp: now,
  };

  return response;
}
