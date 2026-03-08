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

interface AirtableActivityFields {
  Name?: string;
  Description?: string;
  Date?: string;
  Time?: string;
  Location?: string;
  url?: string;
  image?: AirtableImage[];
}

interface AirtableRecord {
  id: string;
  fields: AirtableActivityFields;
  createdTime: string;
}

interface AirtableResponse {
  records: AirtableRecord[];
  offset?: string;
}

export interface Activity {
  id: string;
  name?: string;
  description?: string;
  date?: string;
  time?: string;
  location?: string;
  url?: string;
  image_url?: string;
}

interface ActivitiesCache {
  data: ActivitiesResponse;
  timestamp: number;
  fetchTimestamp: number;
}

export interface ActivitiesResponse {
  updated_at: string;
  source_used: 'airtablecache' | 'airtable_api' | 'cached_stale' | 'error';
  activities: Activity[];
}

const CACHE_TTL = 86400000; // 24 hours in milliseconds
let activitiesCache: ActivitiesCache | null = null;

function mapActivity(record: AirtableRecord): Activity {
  const imageUrl =
    record.fields.image?.[0]?.thumbnails?.large?.url ||
    record.fields.image?.[0]?.url ||
    '';

  return {
    id: record.id,
    name: record.fields.Name,
    description: record.fields.Description,
    date: record.fields.Date,
    time: record.fields.Time,
    location: record.fields.Location,
    url: record.fields.url,
    image_url: imageUrl || undefined,
  };
}

function sortActivities(activities: Activity[]): Activity[] {
  return activities.sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : Infinity;
    const dateB = b.date ? new Date(b.date).getTime() : Infinity;
    return dateA - dateB;
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
  activities: Activity[] | null;
  status?: number;
  statusText?: string;
  error?: string;
}

async function fetchAllActivities(
  baseUrl: string,
  authHeaders?: Record<string, string>
): Promise<FetchResult> {
  const activities: Activity[] = [];
  let offset: string | undefined;

  try {
    do {
      const url = offset ? `${baseUrl}?offset=${offset}` : baseUrl;
      const response = await fetchFromUrl(url, authHeaders);

      if (!response) {
        return { activities: null, error: 'Network or timeout error' };
      }

      if (response.status && !response.data.records) {
        return {
          activities: null,
          status: response.status,
          statusText: response.statusText,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      if (!Array.isArray(response.data.records)) {
        return { activities: null, error: 'Invalid response format' };
      }

      const mapped = response.data.records.map(mapActivity);
      activities.push(...mapped);

      offset = response.data.offset;
    } while (offset);

    return { activities };
  } catch (error) {
    return {
      activities: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function getActivities(): Promise<ActivitiesResponse> {
  const now = Date.now();

  if (activitiesCache && now - activitiesCache.timestamp < CACHE_TTL) {
    return activitiesCache.data;
  }

  const cacheBaseUrl =
    'https://airtablecache.portofthefutureconference.com/v0/appkKjciinTlnsbkd/tblLpuL7Xff2rpdbB';
  const apiBaseUrl =
    'https://api.airtable.com/v0/appkKjciinTlnsbkd/tblLpuL7Xff2rpdbB';
  const airtablePat = process.env.AIRTABLE_PAT;

  let fetchResult = await fetchAllActivities(cacheBaseUrl);
  let sourceUsed: 'airtablecache' | 'airtable_api' | 'cached_stale' | 'error' = 'airtablecache';

  // If cache failed with 400 (branch merged), try API immediately
  if (fetchResult.activities === null && fetchResult.status === 400) {
    fetchResult = await fetchAllActivities(apiBaseUrl, airtablePat ? { Authorization: `Bearer ${airtablePat}` } : {});
    sourceUsed = 'airtable_api';
  } else if (fetchResult.activities === null) {
    // Try API fallback
    sourceUsed = 'airtable_api';
    const authHeaders = airtablePat
      ? { Authorization: `Bearer ${airtablePat}` }
      : {};
    fetchResult = await fetchAllActivities(apiBaseUrl, authHeaders);
  }

  // If both fail but we have stale cache, use it
  if (fetchResult.activities === null) {
    if (activitiesCache) {
      const staleResponse: ActivitiesResponse = {
        ...activitiesCache.data,
        source_used: 'cached_stale',
        updated_at: new Date().toISOString(),
      };
      return staleResponse;
    }

    const response: ActivitiesResponse = {
      updated_at: new Date().toISOString(),
      source_used: 'error',
      activities: [],
    };
    return response;
  }

  const sorted = sortActivities(fetchResult.activities);

  const response: ActivitiesResponse = {
    updated_at: new Date().toISOString(),
    source_used: sourceUsed,
    activities: sorted,
  };

  activitiesCache = {
    data: response,
    timestamp: now,
    fetchTimestamp: now,
  };

  return response;
}
