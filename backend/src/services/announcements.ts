interface AirtableImage {
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

interface AirtableAnnouncementFields {
  Title?: string;
  Content?: string;
  Alert?: string;
  Date?: string;
  Time?: string;
  Image?: AirtableImage[];
}

interface AirtableRecord {
  id: string;
  fields: AirtableAnnouncementFields;
  createdTime: string;
}

interface AirtableResponse {
  records: AirtableRecord[];
  offset?: string;
}

export interface Announcement {
  id: string;
  Title?: string;
  Content?: string;
  Alert?: string;
  Date?: string;
  Time?: string;
  ImageUrl?: string;
}

interface AnnouncementsCache {
  data: AnnouncementsResponse;
  timestamp: number;
}

export interface AnnouncementsResponse {
  updated_at: string;
  source_used: 'airtablecache' | 'airtable_api';
  announcements: Announcement[];
}

const CACHE_TTL = 3600000; // 1 hour in milliseconds
let announcementsCache: AnnouncementsCache | null = null;

function mapAnnouncement(record: AirtableRecord): Announcement {
  const imageUrl =
    record.fields.Image?.[0]?.thumbnails?.large?.url ||
    record.fields.Image?.[0]?.url ||
    '';

  return {
    id: record.id,
    Title: record.fields.Title,
    Content: record.fields.Content,
    Alert: record.fields.Alert,
    Date: record.fields.Date,
    Time: record.fields.Time,
    ImageUrl: imageUrl || undefined,
  };
}

function sortAnnouncements(announcements: Announcement[]): Announcement[] {
  return announcements.sort((a, b) => {
    const dateA = new Date(`${a.Date || ''} ${a.Time || ''}`).getTime();
    const dateB = new Date(`${b.Date || ''} ${b.Time || ''}`).getTime();
    return dateB - dateA;
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

async function fetchAllAnnouncements(
  baseUrl: string,
  authHeaders?: Record<string, string>
): Promise<Announcement[] | null> {
  const announcements: Announcement[] = [];
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

      const mapped = data.records.map(mapAnnouncement);
      announcements.push(...mapped);

      offset = data.offset;
    } while (offset);

    return announcements;
  } catch (error) {
    return null;
  }
}

export async function getAnnouncements(): Promise<AnnouncementsResponse> {
  const now = Date.now();

  if (announcementsCache && now - announcementsCache.timestamp < CACHE_TTL) {
    return announcementsCache.data;
  }

  const cacheBaseUrl =
    'https://airtablecache.portofthefutureconference.com/v0/appkKjciinTlnsbkd/tbl1eqc3UiYaO1pSq';
  const apiBaseUrl =
    'https://api.airtable.com/v0/appkKjciinTlnsbkd/tbl1eqc3UiYaO1pSq';
  const airtablePat = process.env.AIRTABLE_PAT;

  let announcements: Announcement[] | null = null;
  let sourceUsed: 'airtablecache' | 'airtable_api' = 'airtablecache';

  announcements = await fetchAllAnnouncements(cacheBaseUrl);

  if (announcements === null) {
    sourceUsed = 'airtable_api';
    const authHeaders = airtablePat
      ? { Authorization: `Bearer ${airtablePat}` }
      : {};
    announcements = await fetchAllAnnouncements(apiBaseUrl, authHeaders);
  }

  if (announcements === null) {
    throw new Error('Failed to fetch announcements from Airtable');
  }

  const sorted = sortAnnouncements(announcements);

  const response: AnnouncementsResponse = {
    updated_at: new Date().toISOString(),
    source_used: sourceUsed,
    announcements: sorted,
  };

  announcementsCache = {
    data: response,
    timestamp: now,
  };

  return response;
}
