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
}

export interface SpeakersResponse {
  updated_at: string;
  source_used: 'airtablecache' | 'airtable_api';
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

async function fetchAllSpeakers(
  baseUrl: string,
  authHeaders?: Record<string, string>
): Promise<Speaker[] | null> {
  const speakers: Speaker[] = [];
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

      const mapped = data.records
        .filter((record) => record.fields.Published === true)
        .map(mapSpeaker);
      speakers.push(...mapped);

      offset = data.offset;
    } while (offset);

    return speakers;
  } catch (error) {
    return null;
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

  let speakers: Speaker[] | null = null;
  let sourceUsed: 'airtablecache' | 'airtable_api' = 'airtablecache';

  speakers = await fetchAllSpeakers(cacheBaseUrl);

  if (speakers === null) {
    sourceUsed = 'airtable_api';
    const authHeaders = airtablePat
      ? { Authorization: `Bearer ${airtablePat}` }
      : {};
    speakers = await fetchAllSpeakers(apiBaseUrl, authHeaders);
  }

  if (speakers === null) {
    throw new Error('Failed to fetch speakers from Airtable');
  }

  const sorted = sortSpeakers(speakers);

  const response: SpeakersResponse = {
    updated_at: new Date().toISOString(),
    source_used: sourceUsed,
    speakers: sorted,
  };

  speakersCache = {
    data: response,
    timestamp: now,
  };

  return response;
}
