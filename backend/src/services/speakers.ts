interface AirtablePhoto {
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

interface AirtableSpeakerFields {
  'First Name'?: string;
  'Last Name'?: string;
  'Speaker Title'?: string;
  'Speaking Topic'?: string;
  'Synopsis of Speaking topic'?: string;
  Bio?: string;
  Published?: boolean;
  PublicPersonalData?: boolean;
  Photo?: AirtablePhoto[];
  Email?: string;
  Phone?: string;
  Company?: string;
}

interface AirtableRecord {
  id: string;
  fields: AirtableSpeakerFields;
  createdTime: string;
}

interface AirtableResponse {
  records: AirtableRecord[];
  offset?: string;
}

export interface Speaker {
  id: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  speakingTopic?: string;
  synopsis?: string;
  bio?: string;
  published?: boolean;
  publicPersonalData?: boolean;
  photoUrl?: string;
  email?: string;
  phone?: string;
  company?: string;
}

interface SpeakersCache {
  data: SpeakersResponse;
  timestamp: number;
  fetchTimestamp: number;
}

export interface SpeakersResponse {
  updated_at: string;
  source_used: 'airtablecache' | 'airtable_api' | 'cached_stale' | 'error';
  speakers: Speaker[];
}

const CACHE_TTL = 86400000; // 24 hours in milliseconds
let speakersCache: SpeakersCache | null = null;

function mapSpeaker(record: AirtableRecord): Speaker {
  const photoUrl =
    record.fields.Photo?.[0]?.thumbnails?.large?.url ||
    record.fields.Photo?.[0]?.url;

  return {
    id: record.id,
    firstName: record.fields['First Name'],
    lastName: record.fields['Last Name'],
    title: record.fields['Speaker Title'],
    speakingTopic: record.fields['Speaking Topic'],
    synopsis: record.fields['Synopsis of Speaking topic'],
    bio: record.fields.Bio,
    published: record.fields.Published,
    publicPersonalData: record.fields.PublicPersonalData ?? false,
    photoUrl: photoUrl || undefined,
    email: record.fields.Email,
    phone: record.fields.Phone,
    company: record.fields.Company,
  };
}

function sortSpeakers(speakers: Speaker[]): Speaker[] {
  return speakers.sort((a, b) => {
    const lastNameA = (a.lastName || '').toLowerCase();
    const lastNameB = (b.lastName || '').toLowerCase();

    if (lastNameA !== lastNameB) {
      return lastNameA.localeCompare(lastNameB);
    }

    const firstNameA = (a.firstName || '').toLowerCase();
    const firstNameB = (b.firstName || '').toLowerCase();
    return firstNameA.localeCompare(firstNameB);
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
  speakers: Speaker[] | null;
  status?: number;
  statusText?: string;
  error?: string;
}

async function fetchAllSpeakers(
  baseUrl: string,
  authHeaders?: Record<string, string>
): Promise<FetchResult> {
  const speakers: Speaker[] = [];
  let offset: string | undefined;

  try {
    do {
      const url = offset ? `${baseUrl}?offset=${offset}` : baseUrl;
      const response = await fetchFromUrl(url, authHeaders);

      if (!response) {
        return { speakers: null, error: 'Network or timeout error' };
      }

      if (response.status && !response.data.records) {
        return {
          speakers: null,
          status: response.status,
          statusText: response.statusText,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      if (!Array.isArray(response.data.records)) {
        return { speakers: null, error: 'Invalid response format' };
      }

      const mapped = response.data.records
        .filter((record) => record.fields.Published === true)
        .map(mapSpeaker);
      speakers.push(...mapped);

      offset = response.data.offset;
    } while (offset);

    return { speakers };
  } catch (error) {
    return {
      speakers: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function getSpeakers(): Promise<SpeakersResponse> {
  const now = Date.now();

  if (speakersCache && now - speakersCache.timestamp < CACHE_TTL) {
    return speakersCache.data;
  }

  const cacheBaseUrl =
    'https://airtablecache.portofthefutureconference.com/v0/appkKjciinTlnsbkd/tblNp1JZk4ARZZZlT';
  const apiBaseUrl =
    'https://api.airtable.com/v0/appkKjciinTlnsbkd/tblNp1JZk4ARZZZlT';
  const airtablePat = process.env.AIRTABLE_PAT;

  let fetchResult = await fetchAllSpeakers(cacheBaseUrl);
  let sourceUsed: 'airtablecache' | 'airtable_api' | 'cached_stale' | 'error' = 'airtablecache';

  // If cache failed with 400 (branch merged), try API immediately
  if (fetchResult.speakers === null && fetchResult.status === 400) {
    fetchResult = await fetchAllSpeakers(apiBaseUrl, airtablePat ? { Authorization: `Bearer ${airtablePat}` } : {});
    sourceUsed = 'airtable_api';
  } else if (fetchResult.speakers === null) {
    // Try API fallback
    sourceUsed = 'airtable_api';
    const authHeaders = airtablePat
      ? { Authorization: `Bearer ${airtablePat}` }
      : {};
    fetchResult = await fetchAllSpeakers(apiBaseUrl, authHeaders);
  }

  // If both fail but we have stale cache, use it
  if (fetchResult.speakers === null) {
    if (speakersCache) {
      const staleResponse: SpeakersResponse = {
        ...speakersCache.data,
        source_used: 'cached_stale',
        updated_at: new Date().toISOString(),
      };
      return staleResponse;
    }

    const response: SpeakersResponse = {
      updated_at: new Date().toISOString(),
      source_used: 'error',
      speakers: [],
    };
    return response;
  }

  const sorted = sortSpeakers(fetchResult.speakers);

  const response: SpeakersResponse = {
    updated_at: new Date().toISOString(),
    source_used: sourceUsed,
    speakers: sorted,
  };

  speakersCache = {
    data: response,
    timestamp: now,
    fetchTimestamp: now,
  };

  return response;
}
