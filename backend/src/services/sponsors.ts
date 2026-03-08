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
  fetchTimestamp: number;
}

export interface SponsorsResponse {
  updated_at: string;
  source_used: 'airtablecache' | 'airtable_api' | 'cached_stale' | 'error';
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

interface FetchResponse {
  data: AirtableResponse | null;
  status?: number;
  statusText?: string;
  errorMessage?: string;
}

async function fetchFromUrl(
  url: string,
  headers?: Record<string, string>,
  logger?: { info: (msg: string, obj?: any) => void; error: (msg: string, obj?: any) => void }
): Promise<FetchResponse> {
  try {
    if (logger) {
      logger.info(`Fetching sponsors from URL: ${url}`);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(timeoutId);

    if (logger) {
      logger.info(`Response status: ${response.status} ${response.statusText}`);
    }

    if (!response.ok) {
      const bodyText = await response.text();
      if (logger) {
        logger.error(`HTTP error ${response.status}`, {
          url,
          status: response.status,
          bodyPreview: bodyText.substring(0, 500),
        });
      }
      return {
        data: null,
        status: response.status,
        statusText: response.statusText,
        errorMessage: bodyText.substring(0, 500),
      };
    }

    const data = (await response.json()) as AirtableResponse;

    if (logger) {
      logger.info(`Successfully parsed response`, {
        hasRecords: Array.isArray(data.records),
        recordCount: data.records?.length || 0,
        hasOffset: !!data.offset,
      });
    }

    return { data };
  } catch (error) {
    if (logger) {
      logger.error('Fetch error', {
        error: String(error),
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        message: error instanceof Error ? error.message : 'Unknown error',
        url,
      });
    }
    return { data: null };
  }
}

interface FetchAllResult {
  sponsors: Sponsor[] | null;
  status?: number;
  statusText?: string;
  errorMessage?: string;
}

async function fetchAllSponsors(
  baseUrl: string,
  authHeaders?: Record<string, string>,
  logger?: { info: (msg: string, obj?: any) => void; error: (msg: string, obj?: any) => void }
): Promise<FetchAllResult> {
  const sponsors: Sponsor[] = [];
  let offset: string | undefined;
  let pageCount = 0;
  let totalRecords = 0;

  try {
    do {
      pageCount += 1;
      const url = offset ? `${baseUrl}?offset=${offset}` : baseUrl;

      if (logger) {
        logger.info(`Fetching sponsors page ${pageCount}${offset ? ` (offset: ${offset})` : ''}`);
      }

      const response = await fetchFromUrl(url, authHeaders, logger);

      if (!response.data) {
        if (logger) {
          logger.error(`Failed to fetch sponsors page ${pageCount}`, {
            offset,
            pagesLoaded: pageCount - 1,
            recordsLoaded: totalRecords,
            status: response.status,
            statusText: response.statusText,
            errorMessage: response.errorMessage,
          });
        }
        return {
          sponsors: null,
          status: response.status,
          statusText: response.statusText,
          errorMessage: response.errorMessage,
        };
      }

      if (!Array.isArray(response.data.records)) {
        if (logger) {
          logger.error(`Invalid response format on page ${pageCount}`, {
            hasRecords: 'records' in response.data,
            recordsType: typeof response.data.records,
          });
        }
        return { sponsors: null };
      }

      const pageRecordCount = response.data.records.length;
      totalRecords += pageRecordCount;

      if (logger) {
        logger.info(`Page ${pageCount}: received ${pageRecordCount} records`);
        if (pageRecordCount > 0) {
          logger.info(`First record on page ${pageCount}:`, {
            id: response.data.records[0].id,
            fields: JSON.stringify(response.data.records[0].fields).substring(0, 300),
          });
        }
      }

      const mapped = response.data.records.map(mapSponsor);
      sponsors.push(...mapped);

      if (logger) {
        logger.info(`Mapped ${mapped.length} sponsors from page ${pageCount}, Total so far: ${sponsors.length}`);
      }

      offset = response.data.offset;
    } while (offset);

    if (logger) {
      logger.info(`Sponsors fetch completed`, {
        pages: pageCount,
        totalRecords,
        totalMapped: sponsors.length,
      });
    }

    return { sponsors };
  } catch (error) {
    if (logger) {
      logger.error('Error fetching all sponsors', {
        error: String(error),
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        pagesLoaded: pageCount,
        recordsLoaded: totalRecords,
      });
    }
    return { sponsors: null };
  }
}

export async function getSponsors(logger?: { info: (msg: string, obj?: any) => void; error: (msg: string, obj?: any) => void }): Promise<SponsorsResponse> {
  const now = Date.now();

  if (sponsorsCache && now - sponsorsCache.timestamp < CACHE_TTL) {
    if (logger) {
      logger.info('Returning cached sponsors', {
        cacheAge: now - sponsorsCache.timestamp,
        sponsorCount: sponsorsCache.data.sponsors.length,
      });
    }
    return sponsorsCache.data;
  }

  if (logger) {
    logger.info('Fetching sponsors - cache expired or empty');
  }

  const cacheBaseUrl =
    'https://airtablecache.portofthefutureconference.com/v0/appkKjciinTlnsbkd/tblgWrwRvpdcVG8sB';
  const apiBaseUrl =
    'https://api.airtable.com/v0/appkKjciinTlnsbkd/tblgWrwRvpdcVG8sB';
  const airtablePat = process.env.AIRTABLE_PAT;

  if (logger) {
    logger.info('Attempting to fetch sponsors from cache endpoint', {
      cacheUrl: cacheBaseUrl,
    });
  }

  let fetchResult = await fetchAllSponsors(cacheBaseUrl, undefined, logger);
  let sourceUsed: 'airtablecache' | 'airtable_api' | 'cached_stale' | 'error' = 'airtablecache';

  // If cache failed with 400 (branch merged), try API immediately
  if (fetchResult.sponsors === null && fetchResult.status === 400) {
    if (logger) {
      logger.info('Cache endpoint returned 400, attempting Airtable API immediately', {
        apiUrl: apiBaseUrl,
        hasAuthToken: !!airtablePat,
        errorMessage: fetchResult.errorMessage,
      });
    }

    sourceUsed = 'airtable_api';
    const authHeaders = airtablePat
      ? { Authorization: `Bearer ${airtablePat}` }
      : {};
    fetchResult = await fetchAllSponsors(apiBaseUrl, authHeaders, logger);
  } else if (fetchResult.sponsors === null) {
    if (logger) {
      logger.info('Cache endpoint failed, attempting Airtable API', {
        apiUrl: apiBaseUrl,
        hasAuthToken: !!airtablePat,
      });
    }

    sourceUsed = 'airtable_api';
    const authHeaders = airtablePat
      ? { Authorization: `Bearer ${airtablePat}` }
      : {};
    fetchResult = await fetchAllSponsors(apiBaseUrl, authHeaders, logger);
  }

  if (fetchResult.sponsors === null) {
    if (logger) {
      logger.error('Both cache and API endpoints failed', {
        status: fetchResult.status,
        statusText: fetchResult.statusText,
        errorMessage: fetchResult.errorMessage,
      });
    }

    if (sponsorsCache) {
      if (logger) {
        logger.info('Returning stale cached sponsors as fallback', {
          cacheAge: now - sponsorsCache.timestamp,
          sponsorCount: sponsorsCache.data.sponsors.length,
        });
      }

      const staleResponse: SponsorsResponse = {
        ...sponsorsCache.data,
        source_used: 'cached_stale',
        updated_at: new Date().toISOString(),
      };
      return staleResponse;
    }

    const response: SponsorsResponse = {
      updated_at: new Date().toISOString(),
      source_used: 'error',
      sponsors: [],
    };
    return response;
  }

  if (logger) {
    logger.info(`Successfully fetched ${fetchResult.sponsors.length} sponsors`);
  }

  const sorted = sortSponsors(fetchResult.sponsors);

  if (logger) {
    logger.info(`Sponsors sorted by tier and name`, {
      finalCount: sorted.length,
    });
  }

  if (logger) {
    logger.info(`Sponsors sorted by tier and name`, {
      finalCount: sorted.length,
    });
  }

  const response: SponsorsResponse = {
    updated_at: new Date().toISOString(),
    source_used: sourceUsed,
    sponsors: sorted,
  };

  sponsorsCache = {
    data: response,
    timestamp: now,
    fetchTimestamp: now,
  };

  if (logger) {
    logger.info('Sponsors fetch and processing completed', {
      source: sourceUsed,
      count: sorted.length,
      cached: true,
    });
  }

  return response;
}
