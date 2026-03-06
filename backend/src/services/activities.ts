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
}

export interface ActivitiesResponse {
  updated_at: string;
  source_used: 'airtablecache' | 'airtable_api' | 'error';
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

async function fetchAllActivities(
  baseUrl: string,
  authHeaders?: Record<string, string>
): Promise<Activity[] | null> {
  const activities: Activity[] = [];
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

      const mapped = data.records.map(mapActivity);
      activities.push(...mapped);

      offset = data.offset;
    } while (offset);

    return activities;
  } catch (error) {
    return null;
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

  let activities: Activity[] | null = null;
  let sourceUsed: 'airtablecache' | 'airtable_api' | 'error' = 'airtablecache';

  activities = await fetchAllActivities(cacheBaseUrl);

  if (activities === null) {
    sourceUsed = 'airtable_api';
    const authHeaders = airtablePat
      ? { Authorization: `Bearer ${airtablePat}` }
      : {};
    activities = await fetchAllActivities(apiBaseUrl, authHeaders);
  }

  if (activities === null) {
    const response: ActivitiesResponse = {
      updated_at: new Date().toISOString(),
      source_used: 'error',
      activities: [],
    };
    return response;
  }

  const sorted = sortActivities(activities);

  const response: ActivitiesResponse = {
    updated_at: new Date().toISOString(),
    source_used: sourceUsed,
    activities: sorted,
  };

  activitiesCache = {
    data: response,
    timestamp: now,
  };

  return response;
}
