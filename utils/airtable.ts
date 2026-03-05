
// Airtable data fetching utilities for Port of the Future Conference

const AIRTABLE_BASE_URL = 'https://airtablecache.portofthefutureconference.com/v0/appkKjciinTlnsbkd';

interface AirtableRecord<T> {
  id: string;
  createdTime: string;
  fields: T;
}

interface AirtableResponse<T> {
  records: AirtableRecord<T>[];
  offset?: string;
}

/**
 * Fetch all pages from an Airtable table, handling pagination
 */
export async function fetchPaginatedAirtableData<T>(
  tableId: string
): Promise<AirtableRecord<T>[]> {
  console.log('Fetching paginated data from table:', tableId);
  let allRecords: AirtableRecord<T>[] = [];
  let offset: string | undefined = undefined;

  do {
    const url = offset 
      ? `${AIRTABLE_BASE_URL}/${tableId}?offset=${offset}`
      : `${AIRTABLE_BASE_URL}/${tableId}`;
    
    console.log('Fetching page:', url);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch data from Airtable: ${response.status} ${response.statusText}`);
    }

    const data: AirtableResponse<T> = await response.json();
    console.log('Received page with', data.records?.length || 0, 'records');
    
    allRecords = allRecords.concat(data.records || []);
    offset = data.offset;
  } while (offset);

  console.log('Total records fetched:', allRecords.length);
  return allRecords;
}

// Speaker Types
export interface RawSpeakerFields {
  'First Name': string;
  'Last Name': string;
  'Speaker Title'?: string;
  'Speaking Topic'?: string;
  'Synopsis of Speaking topic'?: string;
  'Bio'?: string;
  'Photo'?: { url: string; thumbnails?: { large: { url: string } } }[];
  'PublicPersonalData'?: boolean;
  'Email'?: string;
  'Phone'?: string;
  'Published'?: boolean;
}

export interface Speaker {
  id: string;
  name_display: string;
  first_name: string;
  last_name: string;
  title_full?: string;
  speaking_topic?: string;
  topic_synopsis?: string;
  bio?: string;
  photo_url?: string;
  public_personal_data: boolean;
  email?: string;
  phone?: string;
}

export const mapAirtableSpeaker = (record: AirtableRecord<RawSpeakerFields>): Speaker => {
  const fields = record.fields;
  const photo = fields.Photo?.[0];
  const publicPersonalData = fields.PublicPersonalData ?? false;
  const firstName = fields['First Name'] || '';
  const lastName = fields['Last Name'] || '';

  return {
    id: record.id,
    first_name: firstName,
    last_name: lastName,
    name_display: `${firstName} ${lastName}`.trim(),
    title_full: fields['Speaker Title'],
    speaking_topic: fields['Speaking Topic'],
    topic_synopsis: fields['Synopsis of Speaking topic'],
    bio: fields.Bio,
    photo_url: photo?.thumbnails?.large?.url || photo?.url,
    public_personal_data: publicPersonalData,
    email: publicPersonalData ? fields.Email : undefined,
    phone: publicPersonalData ? fields.Phone : undefined,
  };
};

export const fetchSpeakers = async (): Promise<Speaker[]> => {
  console.log('Fetching speakers...');
  const rawRecords = await fetchPaginatedAirtableData<RawSpeakerFields>('tblNp1JZk4ARZZZlT');
  
  // Filter for published speakers
  const publishedRecords = rawRecords.filter(record => record.fields.Published === true);
  console.log('Published speakers:', publishedRecords.length);
  
  const speakers = publishedRecords.map(mapAirtableSpeaker);

  // Sort by Last Name A-Z, then First Name A-Z
  speakers.sort((a, b) => {
    const lastNameCompare = a.last_name.localeCompare(b.last_name);
    if (lastNameCompare !== 0) return lastNameCompare;
    return a.first_name.localeCompare(b.first_name);
  });

  console.log('Speakers sorted:', speakers.length);
  return speakers;
};

// Activity Types
export interface RawActivityFields {
  'Name': string;
  'Description'?: string;
  'Date'?: string;
  'Time'?: string;
  'Location'?: string;
  'url'?: string;
  'image'?: { url: string; thumbnails?: { large: { url: string } } }[];
}

export interface Activity {
  id: string;
  name: string;
  description?: string;
  date?: string;
  time?: string;
  location?: string;
  url?: string;
  image_url?: string;
}

export const mapAirtableActivity = (record: AirtableRecord<RawActivityFields>): Activity => {
  const fields = record.fields;
  const image = fields.image?.[0];

  return {
    id: record.id,
    name: fields.Name || '',
    description: fields.Description,
    date: fields.Date,
    time: fields.Time,
    location: fields.Location,
    url: fields.url,
    image_url: image?.thumbnails?.large?.url || image?.url,
  };
};

export const fetchActivities = async (): Promise<Activity[]> => {
  console.log('Fetching activities...');
  const rawRecords = await fetchPaginatedAirtableData<RawActivityFields>('tblLpuL7Xff2rpdbB');
  const activities = rawRecords.map(mapAirtableActivity);

  // Sort by date/time ascending
  activities.sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateA - dateB;
  });

  console.log('Activities sorted:', activities.length);
  return activities;
};

// Exhibitor Types
export interface RawExhibitorFields {
  'Name': string;
  'Description'?: string;
  'Logo Url'?: { url: string; thumbnails?: { large: { url: string } } }[];
}

export interface Exhibitor {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
}

export const mapAirtableExhibitor = (record: AirtableRecord<RawExhibitorFields>): Exhibitor => {
  const fields = record.fields;
  const logo = fields['Logo Url']?.[0];

  return {
    id: record.id,
    name: fields.Name || '',
    description: fields.Description,
    logo_url: logo?.thumbnails?.large?.url || logo?.url,
  };
};

export const fetchExhibitors = async (): Promise<Exhibitor[]> => {
  console.log('Fetching exhibitors...');
  const rawRecords = await fetchPaginatedAirtableData<RawExhibitorFields>('tblzex4bjwEZh1021');
  const exhibitors = rawRecords.map(mapAirtableExhibitor);

  // Sort A-Z by name
  exhibitors.sort((a, b) => a.name.localeCompare(b.name));

  console.log('Exhibitors sorted:', exhibitors.length);
  return exhibitors;
};

// Sponsor Types
export interface RawSponsorFields {
  'Sponsor Name': string;
  'Sponsor Level': string;
  'Sponsor Bio'?: string;
  'LogoGraphic'?: { url: string; thumbnails?: { large: { url: string } } }[];
}

export interface Sponsor {
  id: string;
  name: string;
  level: string;
  bio?: string;
  logo_url?: string;
}

export const mapAirtableSponsor = (record: AirtableRecord<RawSponsorFields>): Sponsor => {
  const fields = record.fields;
  const logo = fields.LogoGraphic?.[0];

  return {
    id: record.id,
    name: fields['Sponsor Name'] || '',
    level: fields['Sponsor Level'] || '',
    bio: fields['Sponsor Bio'],
    logo_url: logo?.thumbnails?.large?.url || logo?.url,
  };
};

export const fetchSponsors = async (): Promise<Sponsor[]> => {
  console.log('Fetching sponsors...');
  const rawRecords = await fetchPaginatedAirtableData<RawSponsorFields>('tblgWrwRvpdcVG8');
  const sponsors = rawRecords.map(mapAirtableSponsor);

  // Sort by level, then alphabetically within level
  sponsors.sort((a, b) => {
    const levelCompare = a.level.localeCompare(b.level);
    if (levelCompare !== 0) return levelCompare;
    return a.name.localeCompare(b.name);
  });

  console.log('Sponsors sorted:', sponsors.length);
  return sponsors;
};
