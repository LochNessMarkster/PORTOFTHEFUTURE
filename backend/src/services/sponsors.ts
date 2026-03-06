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

interface AirtableSponsorFields {
  'Sponsor Name'?: string;
  'Sponsor Level'?: string;
  'Sponsor Bio'?: string;
  'Company URL'?: string;
  Email?: string;
  LinkedIn?: string;
  Facebook?: string;
  X?: string;
  LogoGraphic?: AirtableImage[];
}

interface AirtableRecord {
  id: string;
  fields: AirtableSponsorFields;
  createdTime: string;
}

interface AirtableResponse {
  records: AirtableRecord[];
  offset?: string;
}

export interface Sponsor {
  id: string;
  name?: string;
  level?: string;
  bio?: string;
  companyUrl?: string;
  email?: string;
  linkedIn?: string;
  facebook?: string;
  x?: string;
  logoUrl?: string;
}

interface SponsorsCache {
  data: SponsorsResponse;
  timestamp: number;
}

export interface SponsorsResponse {
  updated_at: string;
  source_used: 'airtablecache' | 'airtable_api' | 'error';
  sponsors: Sponsor[];
}

const CACHE_TTL = 86400000; // 24 hours in milliseconds
let sponsorsCache: SponsorsCache | null = null;

function mapSponsor(record: AirtableRecord): Sponsor {
  const logoUrl =
    record.fields.LogoGraphic?.[0]?.thumbnails?.large?.url ||
    record.fields.LogoGraphic?.[0]?.url ||
    '';

  return {
    id: record.id,
    name: record.fields['Sponsor Name'],
    level: record.fields['Sponsor Level'],
    bio: record.fields['Sponsor Bio'],
    companyUrl: record.fields['Company URL'],
    email: record.fields.Email,
    linkedIn: record.fields.LinkedIn,
    facebook: record.fields.Facebook,
    x: record.fields.X,
    logoUrl: logoUrl || undefined,
  };
}

function sortSponsors(sponsors: Sponsor[]): Sponsor[] {
  return sponsors.sort((a, b) => {
    const levelA = (a.level || '').toLowerCase();
    const levelB = (b.level || '').toLowerCase();

    if (levelA !== levelB) {
      return levelA.localeCompare(levelB);
    }

    const nameA = (a.name || '').toLowerCase();
    const nameB = (b.name || '').toLowerCase();
    return nameA.localeCompare(nameB);
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

async function fetchAllSponsors(
  baseUrl: string,
  authHeaders?: Record<string, string>
): Promise<Sponsor[] | null> {
  const sponsors: Sponsor[] = [];
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

      const mapped = data.records.map(mapSponsor);
      sponsors.push(...mapped);

      offset = data.offset;
    } while (offset);

    return sponsors;
  } catch (error) {
    return null;
  }
}

export async function getSponsors(): Promise<SponsorsResponse> {
  const now = Date.now();

  if (sponsorsCache && now - sponsorsCache.timestamp < CACHE_TTL) {
    return sponsorsCache.data;
  }

  const cacheBaseUrl =
    'https://airtablecache.portofthefutureconference.com/v0/appkKjciinTlnsbkd/tblgWrwRvpdcVG8Zy';
  const apiBaseUrl =
    'https://api.airtable.com/v0/appkKjciinTlnsbkd/tblgWrwRvpdcVG8Zy';
  const airtablePat = process.env.AIRTABLE_PAT;

  let sponsors: Sponsor[] | null = null;
  let sourceUsed: 'airtablecache' | 'airtable_api' | 'error' = 'airtablecache';

  sponsors = await fetchAllSponsors(cacheBaseUrl);

  if (sponsors === null) {
    sourceUsed = 'airtable_api';
    const authHeaders = airtablePat
      ? { Authorization: `Bearer ${airtablePat}` }
      : {};
    sponsors = await fetchAllSponsors(apiBaseUrl, authHeaders);
  }

  if (sponsors === null) {
    const response: SponsorsResponse = {
      updated_at: new Date().toISOString(),
      source_used: 'error',
      sponsors: [],
    };
    return response;
  }

  const sorted = sortSponsors(sponsors);

  const response: SponsorsResponse = {
    updated_at: new Date().toISOString(),
    source_used: sourceUsed,
    sponsors: sorted,
  };

  sponsorsCache = {
    data: response,
    timestamp: now,
  };

  return response;
}
