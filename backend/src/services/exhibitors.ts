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

interface AirtableExhibitorFields {
  Name?: string;
  Description?: string;
  'Booth Number'?: string;
  Address?: string;
  URL?: string;
  LinkedIn?: string;
  Facebook?: string;
  X?: string;
  'Primary Contact Name'?: string;
  'Primary Contact Title'?: string;
  'Primary Contact Email'?: string;
  'Primary Direct Phone'?: string;
  'Admin Phone (Booth)'?: string;
  'Logo Url'?: AirtableImage[];
}

interface AirtableRecord {
  id: string;
  fields: AirtableExhibitorFields;
  createdTime: string;
}

interface AirtableResponse {
  records: AirtableRecord[];
  offset?: string;
}

export interface Exhibitor {
  id: string;
  name?: string;
  description?: string;
  boothNumber?: string;
  address?: string;
  url?: string;
  linkedIn?: string;
  facebook?: string;
  x?: string;
  primaryContactName?: string;
  primaryContactTitle?: string;
  primaryContactEmail?: string;
  primaryDirectPhone?: string;
  adminPhoneBooth?: string;
  logoUrl?: string;
}

interface ExhibitorsCache {
  data: ExhibitorsResponse;
  timestamp: number;
}

export interface ExhibitorsResponse {
  updated_at: string;
  source_used: 'airtablecache' | 'airtable_api' | 'error';
  exhibitors: Exhibitor[];
}

const CACHE_TTL = 86400000; // 24 hours in milliseconds
let exhibitorsCache: ExhibitorsCache | null = null;

function mapExhibitor(record: AirtableRecord): Exhibitor {
  const logoUrl =
    record.fields['Logo Url']?.[0]?.thumbnails?.large?.url ||
    record.fields['Logo Url']?.[0]?.url ||
    '';

  return {
    id: record.id,
    name: record.fields.Name,
    description: record.fields.Description,
    boothNumber: record.fields['Booth Number'],
    address: record.fields.Address,
    url: record.fields.URL,
    linkedIn: record.fields.LinkedIn,
    facebook: record.fields.Facebook,
    x: record.fields.X,
    primaryContactName: record.fields['Primary Contact Name'],
    primaryContactTitle: record.fields['Primary Contact Title'],
    primaryContactEmail: record.fields['Primary Contact Email'],
    primaryDirectPhone: record.fields['Primary Direct Phone'],
    adminPhoneBooth: record.fields['Admin Phone (Booth)'],
    logoUrl: logoUrl || undefined,
  };
}

function sortExhibitors(exhibitors: Exhibitor[]): Exhibitor[] {
  return exhibitors.sort((a, b) => {
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

async function fetchAllExhibitors(
  baseUrl: string,
  authHeaders?: Record<string, string>
): Promise<Exhibitor[] | null> {
  const exhibitors: Exhibitor[] = [];
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

      const mapped = data.records.map(mapExhibitor);
      exhibitors.push(...mapped);

      offset = data.offset;
    } while (offset);

    return exhibitors;
  } catch (error) {
    return null;
  }
}

export async function getExhibitors(): Promise<ExhibitorsResponse> {
  const now = Date.now();

  if (exhibitorsCache && now - exhibitorsCache.timestamp < CACHE_TTL) {
    return exhibitorsCache.data;
  }

  const cacheBaseUrl =
    'https://airtablecache.portofthefutureconference.com/v0/appkKjciinTlnsbkd/tblzex4bjwEZh1021';
  const apiBaseUrl =
    'https://api.airtable.com/v0/appkKjciinTlnsbkd/tblzex4bjwEZh1021';
  const airtablePat = process.env.AIRTABLE_PAT;

  let exhibitors: Exhibitor[] | null = null;
  let sourceUsed: 'airtablecache' | 'airtable_api' | 'error' = 'airtablecache';

  exhibitors = await fetchAllExhibitors(cacheBaseUrl);

  if (exhibitors === null) {
    sourceUsed = 'airtable_api';
    const authHeaders = airtablePat
      ? { Authorization: `Bearer ${airtablePat}` }
      : {};
    exhibitors = await fetchAllExhibitors(apiBaseUrl, authHeaders);
  }

  if (exhibitors === null) {
    const response: ExhibitorsResponse = {
      updated_at: new Date().toISOString(),
      source_used: 'error',
      exhibitors: [],
    };
    return response;
  }

  const sorted = sortExhibitors(exhibitors);

  const response: ExhibitorsResponse = {
    updated_at: new Date().toISOString(),
    source_used: sourceUsed,
    exhibitors: sorted,
  };

  exhibitorsCache = {
    data: response,
    timestamp: now,
  };

  return response;
}
