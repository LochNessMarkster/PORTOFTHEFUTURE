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
  fetchTimestamp: number;
}

export interface AnnouncementsResponse {
  updated_at: string;
  source_used: 'airtablecache' | 'airtable_api' | 'cached_stale' | 'error';
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
): Promise<{ data: AirtableResponse; status: number; statusText: string } | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return { data: {} as AirtableResponse, status: response.status, statusText: response.statusText };
    }
    const data = (await response.json()) as AirtableResponse;
    return { data, status: response.status, statusText: response.statusText };
  } catch (error) {
    return null;
  }
}

interface FetchResult {
  announcements: Announcement[] | null;
  status?: number;
  statusText?: string;
  error?: string;
}

async function fetchAllAnnouncements(
  baseUrl: string,
  authHeaders?: Record<string, string>
): Promise<FetchResult> {
  const announcements: Announcement[] = [];
  let offset: string | undefined;

  try {
    do {
      const url = offset ? `${baseUrl}?offset=${offset}` : baseUrl;
      const response = await fetchFromUrl(url, authHeaders);

      if (!response) {
        return { announcements: null, error: 'Network or timeout error' };
      }

      if (response.status && !response.data.records) {
        return {
          announcements: null,
          status: response.status,
          statusText: response.statusText,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      if (!Array.isArray(response.data.records)) {
        return { announcements: null, error: 'Invalid response format' };
      }

      const mapped = response.data.records.map(mapAnnouncement);
      announcements.push(...mapped);

      offset = response.data.offset;
    } while (offset);

    return { announcements };
  } catch (error) {
    return {
      announcements: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
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

  let fetchResult = await fetchAllAnnouncements(cacheBaseUrl);
  let sourceUsed: 'airtablecache' | 'airtable_api' | 'cached_stale' | 'error' = 'airtablecache';

  // If cache failed with 400 (branch merged), try API immediately
  if (fetchResult.announcements === null && fetchResult.status === 400) {
    fetchResult = await fetchAllAnnouncements(apiBaseUrl, airtablePat ? { Authorization: `Bearer ${airtablePat}` } : {});
    sourceUsed = 'airtable_api';
  } else if (fetchResult.announcements === null) {
    // Try API fallback
    sourceUsed = 'airtable_api';
    const authHeaders = airtablePat
      ? { Authorization: `Bearer ${airtablePat}` }
      : {};
    fetchResult = await fetchAllAnnouncements(apiBaseUrl, authHeaders);
  }

  // If both fail but we have stale cache, use it
  if (fetchResult.announcements === null) {
    if (announcementsCache) {
      const staleResponse: AnnouncementsResponse = {
        ...announcementsCache.data,
        source_used: 'cached_stale',
        updated_at: new Date().toISOString(),
      };
      return staleResponse;
    }

    const response: AnnouncementsResponse = {
      updated_at: new Date().toISOString(),
      source_used: 'error',
      announcements: [],
    };
    return response;
  }

  const sorted = sortAnnouncements(fetchResult.announcements);

  const response: AnnouncementsResponse = {
    updated_at: new Date().toISOString(),
    source_used: sourceUsed,
    announcements: sorted,
  };

  announcementsCache = {
    data: response,
    timestamp: now,
    fetchTimestamp: now,
  };

  return response;
}
