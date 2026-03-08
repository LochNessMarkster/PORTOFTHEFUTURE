// Airtable data fetching utilities for Port of the Future Conference
// NOTE: Public conference data now uses Airtable cache directly for stability.
// Messaging, conversations, reports, blocked users, and preferences still use backend API.

// ─────────────────────────────────────────────────────────────────────────────
// AIRTABLE CACHE BASE
// ─────────────────────────────────────────────────────────────────────────────

const AIRTABLE_BASE_URL =
  'https://airtablecache.portofthefutureconference.com/v0/appkKjciinTlnsbkd';

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
  console.log('[Airtable] Fetching paginated data from table:', tableId);

  let allRecords: AirtableRecord<T>[] = [];
  let offset: string | undefined = undefined;

  do {
    const url = offset
      ? `${AIRTABLE_BASE_URL}/${tableId}?offset=${offset}`
      : `${AIRTABLE_BASE_URL}/${tableId}`;

    console.log('[Airtable] Fetching page:', url);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch data from Airtable: ${response.status} ${response.statusText}`
      );
    }

    const data: AirtableResponse<T> = await response.json();
    console.log('[Airtable] Received page with', data.records?.length || 0, 'records');

    allRecords = allRecords.concat(data.records || []);
    offset = data.offset;
  } while (offset);

  console.log('[Airtable] Total records fetched:', allRecords.length);
  return allRecords;
}

// ─────────────────────────────────────────────────────────────────────────────
// RAW FIELD TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface RawSpeakerFields {
  'First Name'?: string;
  'Last Name'?: string;
  'Title'?: string;
  'Speaking Topic'?: string;
  'Synopsis'?: string;
  'Bio'?: string;
  'Published'?: boolean;
  'Public Personal Data'?: boolean;
  'Photo'?: { url: string; thumbnails?: { large?: { url: string } } }[];
  'Email'?: string;
  'Phone'?: string;
  'Company'?: string;
}

interface RawActivityFields {
  'Activity Name'?: string;
  'Name'?: string;
  'Title'?: string;
  'Description'?: string;
  'Date'?: string;
  'Time'?: string;
  'Location'?: string;
  'URL'?: string;
  'Image'?: { url: string; thumbnails?: { large?: { url: string } } }[];
  'image'?: { url: string; thumbnails?: { large?: { url: string } } }[];
}

interface RawExhibitorFields {
  'Name'?: string;
  'Company Name'?: string;
  'Description'?: string;
  'Booth Number'?: string;
  'Address'?: string;
  'URL'?: string;
  'LinkedIn'?: string;
  'Facebook'?: string;
  'X'?: string;
  'Primary Contact Name'?: string;
  'Primary Contact Title'?: string;
  'Primary Contact Email'?: string;
  'Primary Direct Phone'?: string;
  'Admin Phone (Booth)'?: string;
  'Admin Phone Booth'?: string;
  'Logo Url'?: { url: string; thumbnails?: { large?: { url: string } } }[];
  'Logo'?: { url: string; thumbnails?: { large?: { url: string } } }[];
}

interface RawSponsorFields {
  'Sponsor Name'?: string;
  'Company Name'?: string;
  'Name'?: string;
  'Sponsor Level'?: string;
  'Level'?: string;
  'Tier'?: string;
  'Sponsor Bio'?: string;
  'Bio'?: string;
  'Description'?: string;
  'Company URL'?: string;
  'URL'?: string;
  'Email'?: string;
  'LinkedIn'?: string;
  'Facebook'?: string;
  'X'?: string;
  'LogoGraphic'?: { url: string; thumbnails?: { large?: { url: string } } }[];
  'Logo Url'?: { url: string; thumbnails?: { large?: { url: string } } }[];
  'Logo'?: { url: string; thumbnails?: { large?: { url: string } } }[];
}

interface RawAnnouncementFields {
  'Title'?: string;
  'Content'?: string;
  'Alert'?: string;
  'Date'?: string;
  'Time'?: string;
  'Image'?: { url: string; thumbnails?: { large?: { url: string } } }[];
}

interface RawAgendaFields {
  'Title'?: string;
  'Date'?: string;
  'Start Time'?: string;
  'End Time'?: string;
  'Room'?: string;
  'Type/Track'?: string;
  'Session Description'?: string;
  'Speaker Names'?: string | string[];
}

interface RawAttendeeFields {
  'First Name'?: string;
  'Last Name'?: string;
  'Email'?: string;
  'Company Name'?: string;
  'Company'?: string;
  'Job Title'?: string;
  'Title'?: string;
  'Phone'?: string;
  'Registration Type'?: string;
}

interface RawPortFields {
  'Port Name'?: string;
  'Name'?: string;
  'Intro'?: string;
  'Port Bio'?: string;
  'Bio'?: string;
  'Port URL'?: string;
  'URL'?: string;
  'Logo graphic'?: { url: string; thumbnails?: { large?: { url: string } } }[];
  'Logo Graphic'?: { url: string; thumbnails?: { large?: { url: string } } }[];
  'Featured Port Graphic'?: { url: string; thumbnails?: { large?: { url: string } } }[];
  'Featured Port Graphic '?: { url: string; thumbnails?: { large?: { url: string } } }[];
}

// ─────────────────────────────────────────────────────────────────────────────
// SPEAKERS
// ─────────────────────────────────────────────────────────────────────────────

export interface Speaker {
  id: string;
  firstName: string;
  lastName: string;
  title?: string;
  speakingTopic?: string;
  synopsis?: string;
  bio?: string;
  published: boolean;
  publicPersonalData: boolean;
  photoUrl?: string;
  email?: string;
  phone?: string;
  company?: string;
}

export interface SpeakersResponse {
  updated_at: string;
  source_used: 'airtablecache' | 'airtable' | 'airtable_api' | 'cached_stale' | 'error';
  speakers: Speaker[];
}

export const fetchSpeakers = async (): Promise<SpeakersResponse> => {
  const rawRecords = await fetchPaginatedAirtableData<RawSpeakerFields>('tblNp1JZk4ARZZZlT');

  const speakers: Speaker[] = rawRecords
    .filter((record) => record.fields['Published'] === true)
    .map((record) => {
      const f = record.fields;
      const photo = f['Photo']?.[0];

      return {
        id: record.id,
        firstName: f['First Name'] || '',
        lastName: f['Last Name'] || '',
        title: f['Title'],
        speakingTopic: f['Speaking Topic'],
        synopsis: f['Synopsis'],
        bio: f['Bio'],
        published: !!f['Published'],
        publicPersonalData: !!f['Public Personal Data'],
        photoUrl: photo?.thumbnails?.large?.url || photo?.url,
        email: f['Email'],
        phone: f['Phone'],
        company: f['Company'],
      };
    })
    .sort((a, b) => {
      const last = (a.lastName || '').localeCompare(b.lastName || '');
      if (last !== 0) return last;
      return (a.firstName || '').localeCompare(b.firstName || '');
    });

  return {
    updated_at: new Date().toISOString(),
    source_used: 'airtablecache',
    speakers,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVITIES
// ─────────────────────────────────────────────────────────────────────────────

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

export interface ActivitiesResponse {
  updated_at: string;
  source_used: 'airtablecache' | 'airtable_api' | 'airtable' | 'cached_stale' | 'error';
  activities: Activity[];
}

export const fetchActivities = async (): Promise<ActivitiesResponse> => {
  console.log('[Activities] Loading activities from Airtable cache...');
  const rawRecords = await fetchPaginatedAirtableData<RawActivityFields>('tblLpuL7Xff2rpdbB');

  const activities: Activity[] = rawRecords
    .map((record) => {
      const f = record.fields as RawActivityFields & Record<string, any>;
      const image = f['Image']?.[0] || f['image']?.[0];

      return {
        id: record.id,
        name: f['Activity Name'] || f['Name'] || f['Title'] || '',
        description: f['Description'],
        date: f['Date'],
        time: f['Time'],
        location: f['Location'],
        url: f['URL'],
        image_url: image?.thumbnails?.large?.url || image?.url || '',
      };
    })
    .filter((a) => a.name)
    .sort((a, b) =>
      `${a.date || ''} ${a.time || ''}`.localeCompare(`${b.date || ''} ${b.time || ''}`)
    );

  console.log('[Activities] Final mapped activities:', activities.length);

  return {
    updated_at: new Date().toISOString(),
    source_used: 'airtablecache',
    activities,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// EXHIBITORS
// ─────────────────────────────────────────────────────────────────────────────

export interface Exhibitor {
  id: string;
  name: string;
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
  logoUrl: string;
}

export interface ExhibitorsResponse {
  updated_at: string;
  source_used: 'airtablecache' | 'airtable_api' | 'cached_stale' | 'error';
  exhibitors: Exhibitor[];
}

export const fetchExhibitors = async (): Promise<ExhibitorsResponse> => {
  console.log('[Exhibitors] Loading exhibitors from Airtable cache...');
  const rawRecords = await fetchPaginatedAirtableData<RawExhibitorFields>('tblzex4bjwEZh1021');

  const exhibitors: Exhibitor[] = rawRecords
    .map((record) => {
      const f = record.fields as RawExhibitorFields & Record<string, any>;
      const logo = f['Logo Url']?.[0] || f['Logo']?.[0];

      return {
        id: record.id,
        name: f['Name'] || f['Company Name'] || '',
        description: f['Description'],
        boothNumber: f['Booth Number'],
        address: f['Address'],
        url: f['URL'],
        linkedIn: f['LinkedIn'],
        facebook: f['Facebook'],
        x: f['X'],
        primaryContactName: f['Primary Contact Name'],
        primaryContactTitle: f['Primary Contact Title'],
        primaryContactEmail: f['Primary Contact Email'],
        primaryDirectPhone: f['Primary Direct Phone'],
        adminPhoneBooth: f['Admin Phone (Booth)'] || f['Admin Phone Booth'],
        logoUrl: logo?.thumbnails?.large?.url || logo?.url || '',
      };
    })
    .filter((e) => e.name)
    .sort((a, b) => a.name.localeCompare(b.name));

  console.log('[Exhibitors] Final mapped exhibitors:', exhibitors.length);

  return {
    updated_at: new Date().toISOString(),
    source_used: 'airtablecache',
    exhibitors,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// SPONSORS
// ─────────────────────────────────────────────────────────────────────────────

export interface Sponsor {
  id: string;
  name: string;
  level?: string;
  bio?: string;
  companyUrl?: string;
  email?: string;
  linkedIn?: string;
  facebook?: string;
  x?: string;
  logoUrl?: string;
}

export interface SponsorsResponse {
  updated_at: string;
  source_used: 'airtablecache' | 'airtable_api' | 'cached_stale' | 'error';
  sponsors: Sponsor[];
}

export const fetchSponsors = async (): Promise<SponsorsResponse> => {
  console.log('[Sponsors] Loading sponsors from Airtable cache...');
  const rawRecords = await fetchPaginatedAirtableData<RawSponsorFields>('tblgWrwRvpdcVG8sB');

  const sponsors: Sponsor[] = rawRecords
    .map((record) => {
      const f = record.fields as RawSponsorFields & Record<string, any>;
      const logo = f['LogoGraphic']?.[0] || f['Logo Url']?.[0] || f['Logo']?.[0];

      return {
        id: record.id,
        name: f['Sponsor Name'] || f['Company Name'] || f['Name'] || '',
        level: f['Sponsor Level'] || f['Level'] || f['Tier'] || '',
        bio: f['Sponsor Bio'] || f['Bio'] || f['Description'] || '',
        companyUrl: f['Company URL'] || f['URL'] || '',
        email: f['Email'],
        linkedIn: f['LinkedIn'],
        facebook: f['Facebook'],
        x: f['X'],
        logoUrl: logo?.thumbnails?.large?.url || logo?.url || '',
      };
    })
    .filter((s) => s.name)
    .sort((a, b) => `${a.level || ''} ${a.name}`.localeCompare(`${b.level || ''} ${b.name}`));

  console.log('[Sponsors] Final mapped sponsors:', sponsors.length);

  return {
    updated_at: new Date().toISOString(),
    source_used: 'airtablecache',
    sponsors,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// PORTS
// ─────────────────────────────────────────────────────────────────────────────

export interface Port {
  id: string;
  name: string;
  intro?: string;
  bio?: string;
  url?: string;
  logo_url?: string;
  featured_image_url?: string;
}

export const mapAirtablePort = (record: AirtableRecord<RawPortFields>): Port => {
  const fields = record.fields as RawPortFields & Record<string, any>;
  const logo = fields['Logo graphic']?.[0] || fields['Logo Graphic']?.[0];
  const featuredImage =
    fields['Featured Port Graphic']?.[0] || fields['Featured Port Graphic ']?.[0];

  return {
    id: record.id,
    name: fields['Port Name'] || fields['Name'] || '',
    intro: fields['Intro'],
    bio: fields['Port Bio'] || fields['Bio'],
    url: fields['Port URL'] || fields['URL'],
    logo_url: logo?.thumbnails?.large?.url || logo?.url,
    featured_image_url: featuredImage?.thumbnails?.large?.url || featuredImage?.url,
  };
};

export const fetchPorts = async (): Promise<Port[]> => {
  console.log('[Ports] Fetching ports...');
  const rawRecords = await fetchPaginatedAirtableData<RawPortFields>('tblrXosiVXKhJHYLu');
  const ports = rawRecords.map(mapAirtablePort).filter((p) => p.name);

  ports.sort((a, b) => a.name.localeCompare(b.name));

  console.log('[Ports] Ports sorted:', ports.length);
  return ports;
};

// ─────────────────────────────────────────────────────────────────────────────
// PRESENTATIONS
// ─────────────────────────────────────────────────────────────────────────────

export interface RawPresentationFields {
  'Presentation Title'?: string;
  'Description'?: string;
  'File URL'?: string;
  'Presentation File'?: { url: string }[];
  'Published'?: boolean;
}

export interface Presentation {
  id: string;
  title: string;
  description?: string;
  file_url?: string;
}

export const mapAirtablePresentation = (
  record: AirtableRecord<RawPresentationFields>
): Presentation => {
  const fields = record.fields;
  const attachment = fields['Presentation File']?.[0];

  return {
    id: record.id,
    title: fields['Presentation Title'] || '',
    description: fields['Description'] || '',
    file_url: fields['File URL'] || attachment?.url || '',
  };
};

export const fetchPresentations = async (): Promise<Presentation[]> => {
  console.log('[Presentations] Fetching presentations...');

  const rawRecords =
    await fetchPaginatedAirtableData<RawPresentationFields>('tblm5YCpC7ZwRSYWy');

  const presentations = rawRecords
    .filter((record) => {
      const hasTitle = !!record.fields['Presentation Title']?.trim();
      const isPublished = record.fields['Published'] !== false;
      return hasTitle && isPublished;
    })
    .map(mapAirtablePresentation)
    .sort((a, b) => a.title.localeCompare(b.title));

  console.log('[Presentations] Presentations sorted:', presentations.length);
  return presentations;
};

// ─────────────────────────────────────────────────────────────────────────────
// ATTENDEES DIRECTORY
// ─────────────────────────────────────────────────────────────────────────────

export interface Attendee {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  title: string;
  phone: string;
  registrationType: string;
  emailLower: string;
  displayName: string;
}

export const fetchAttendeesDirectory = async (): Promise<Attendee[]> => {
  const rawRecords = await fetchPaginatedAirtableData<RawAttendeeFields>('tblIwt4FWHtNm01Z4');

  return rawRecords
    .map((record) => {
      const f = record.fields as RawAttendeeFields & Record<string, any>;
      const firstName = f['First Name'] || '';
      const lastName = f['Last Name'] || '';
      const email = f['Email'] || '';

      return {
        firstName,
        lastName,
        email,
        company: f['Company Name'] || f['Company'] || '',
        title: f['Job Title'] || f['Title'] || '',
        phone: f['Phone'] || '',
        registrationType: f['Registration Type'] || '',
        emailLower: email.toLowerCase(),
        displayName: `${firstName} ${lastName}`.trim(),
      };
    })
    .filter((a) => a.email);
};

// ─────────────────────────────────────────────────────────────────────────────
// BACKEND API (kept for messaging / preferences / moderation features)
// ─────────────────────────────────────────────────────────────────────────────

import Constants from 'expo-constants';

export const BACKEND_URL: string =
  (Constants.expoConfig?.extra?.backendUrl as string) ||
  'https://bx6j3d44584xqpqwnmp8vpuneqcrrymr.app.specular.dev';

async function apiGet<T>(path: string): Promise<T> {
  console.log(`[API] GET ${BACKEND_URL}${path}`);
  const response = await fetch(`${BACKEND_URL}${path}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`GET ${path} failed (${response.status}): ${errorBody}`);
  }

  return response.json() as Promise<T>;
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  console.log(`[API] POST ${BACKEND_URL}${path}`);
  const response = await fetch(`${BACKEND_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`POST ${path} failed (${response.status}): ${errorBody}`);
  }

  return response.json() as Promise<T>;
}

async function apiPut<T>(path: string, body: unknown): Promise<T> {
  console.log(`[API] PUT ${BACKEND_URL}${path}`);
  const response = await fetch(`${BACKEND_URL}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`PUT ${path} failed (${response.status}): ${errorBody}`);
  }

  return response.json() as Promise<T>;
}

// ─────────────────────────────────────────────────────────────────────────────
// ANNOUNCEMENTS
// ─────────────────────────────────────────────────────────────────────────────

export interface AnnouncementItem {
  id: string;
  Title: string;
  Content: string;
  Alert?: string;
  Date: string;
  Time?: string;
  ImageUrl?: string;
}

export interface AnnouncementsResponse {
  updated_at: string;
  source_used: 'airtablecache' | 'airtable_api' | 'cached_stale' | 'error';
  announcements: AnnouncementItem[];
}

export const fetchAnnouncements = async (): Promise<AnnouncementsResponse> => {
  const rawRecords = await fetchPaginatedAirtableData<RawAnnouncementFields>('tbl1eqc3UiYaO1pSq');

  const announcements: AnnouncementItem[] = rawRecords
    .map((record) => {
      const f = record.fields;
      const image = f['Image']?.[0];

      return {
        id: record.id,
        Title: f['Title'] || '',
        Content: f['Content'] || '',
        Alert: f['Alert'],
        Date: f['Date'] || '',
        Time: f['Time'],
        ImageUrl: image?.thumbnails?.large?.url || image?.url,
      };
    })
    .filter((a) => a.Title)
    .sort((a, b) =>
      `${b.Date || ''} ${b.Time || ''}`.localeCompare(`${a.Date || ''} ${a.Time || ''}`)
    );

  return {
    updated_at: new Date().toISOString(),
    source_used: 'airtablecache',
    announcements,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// AGENDA
// ─────────────────────────────────────────────────────────────────────────────

export interface AgendaItem {
  id: string;
  Title: string;
  Date: string;
  StartTime: string;
  EndTime?: string;
  Room?: string;
  TypeTrack?: string;
  SessionDescription?: string;
  SpeakerNames?: string | string[];
}

export interface AgendaResponse {
  updated_at: string;
  source_used: 'airtablecache' | 'airtable_api';
  agenda: AgendaItem[];
}

function convertTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;

  const trimmed = timeStr.trim();
  const match = trimmed.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return 0;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
}

export const fetchAgenda = async (): Promise<AgendaResponse> => {
  console.log('[Agenda] Fetching all agenda sessions from Airtable cache...');

  const rawRecords = await fetchPaginatedAirtableData<RawAgendaFields>('tblhUTXC3XHVGssO4');

  const agenda: AgendaItem[] = rawRecords
    .map((record) => {
      const f = record.fields;

      return {
        id: record.id,
        Title: f['Title'] || '',
        Date: f['Date'] || '',
        StartTime: f['Start Time'] || '',
        EndTime: f['End Time'],
        Room: f['Room'],
        TypeTrack: f['Type/Track'],
        SessionDescription: f['Session Description'],
        SpeakerNames: f['Speaker Names'],
      };
    })
    .filter(
      (session) =>
        session.Title &&
        (session.Date === '2026-03-23' ||
          session.Date === '2026-03-24' ||
          session.Date === '2026-03-25')
    )
    .sort((a, b) => {
      const dateA = a.Date || '';
      const dateB = b.Date || '';
      if (dateA !== dateB) return dateA.localeCompare(dateB);

      const timeA = convertTimeToMinutes(a.StartTime || '');
      const timeB = convertTimeToMinutes(b.StartTime || '');
      if (timeA !== timeB) return timeA - timeB;

      return (a.Title || '').localeCompare(b.Title || '');
    });

  console.log('[Agenda] Final sorted agenda:', agenda.length, 'sessions');

  return {
    updated_at: new Date().toISOString(),
    source_used: 'airtablecache',
    agenda,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// BACKEND TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface BackendPort {
  id: string;
  name: string;
  intro?: string;
  bio?: string;
  url?: string;
  logo_url?: string;
  featured_image_url?: string;
}

export interface BackendPresentation {
  id: string;
  title: string;
  description?: string;
  file_url?: string;
}

export interface FloorPlan {
  image_url: string;
  venue_notes: string;
}

export interface UserPreferences {
  email: string;
  accept_messages: boolean;
  show_email: boolean;
  show_phone: boolean;
  show_company: boolean;
  show_title: boolean;
}

export interface NetworkingAttendee {
  email: string;
  name: string;
  company?: string;
  title?: string;
}

export interface AttendeeDetail {
  email: string;
  name: string;
  title?: string;
  company?: string;
  registration_type?: string;
}

export interface Conversation {
  id: string;
  participant1_email: string;
  participant2_email: string;
  last_message?: string;
  last_message_at?: string;
  other_participant_name?: string;
  created_at: string;
}

export interface ConversationMessage {
  id: string;
  conversation_id?: string;
  sender_email: string;
  content: string;
  created_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// BACKEND FUNCTIONS STILL USING SPECULAR / BACKEND API
// ─────────────────────────────────────────────────────────────────────────────

export const fetchBackendPorts = (search?: string): Promise<BackendPort[]> =>
  apiGet<BackendPort[]>(
    search ? `/api/ports?search=${encodeURIComponent(search)}` : '/api/ports'
  );

export const fetchBackendPortById = (id: string): Promise<BackendPort> =>
  apiGet<BackendPort>(`/api/ports/${encodeURIComponent(id)}`);

export const fetchBackendPresentations = (search?: string): Promise<BackendPresentation[]> =>
  apiGet<BackendPresentation[]>(
    search ? `/api/presentations?search=${encodeURIComponent(search)}` : '/api/presentations'
  );

export const fetchFloorPlan = (): Promise<FloorPlan> => apiGet<FloorPlan>('/api/floor-plan');

export const fetchPreferences = (email: string): Promise<UserPreferences> =>
  apiGet<UserPreferences>(`/api/preferences/${encodeURIComponent(email)}`);

export const updatePreferences = (
  email: string,
  prefs: Partial<Omit<UserPreferences, 'email'>>
): Promise<UserPreferences> =>
  apiPut<UserPreferences>(`/api/preferences/${encodeURIComponent(email)}`, prefs);

export const fetchNetworkingAttendees = (search?: string): Promise<NetworkingAttendee[]> =>
  apiGet<NetworkingAttendee[]>(
    search
      ? `/api/networking/attendees?search=${encodeURIComponent(search)}`
      : '/api/networking/attendees'
  );

export const fetchAttendeeDetail = (
  email: string,
  viewerEmail?: string
): Promise<AttendeeDetail> =>
  apiGet<AttendeeDetail>(
    viewerEmail
      ? `/api/networking/attendees/${encodeURIComponent(
          email
        )}?viewer_email=${encodeURIComponent(viewerEmail)}`
      : `/api/networking/attendees/${encodeURIComponent(email)}`
  );

export const fetchConversations = (email: string): Promise<Conversation[]> =>
  apiGet<Conversation[]>(`/api/conversations?email=${encodeURIComponent(email)}`);

export const createOrGetConversation = (
  participant1_email: string,
  participant2_email: string
): Promise<{
  id: string;
  participant1_email: string;
  participant2_email: string;
  created_at: string;
}> => apiPost('/api/conversations', { participant1_email, participant2_email });

export const fetchMessages = (conversationId: string): Promise<ConversationMessage[]> =>
  apiGet<ConversationMessage[]>(
    `/api/conversations/${encodeURIComponent(conversationId)}/messages`
  );

export const sendMessage = (
  conversationId: string,
  sender_email: string,
  content: string
): Promise<ConversationMessage> =>
  apiPost<ConversationMessage>(
    `/api/conversations/${encodeURIComponent(conversationId)}/messages`,
    { sender_email, content }
  );

export const deleteConversation = async (
  conversationId: string
): Promise<{ success: boolean; message: string }> => {
  console.log(`[API] DELETE /api/conversations/${conversationId}`);

  const response = await fetch(
    `${BACKEND_URL}/api/conversations/${encodeURIComponent(conversationId)}`,
    { method: 'DELETE', headers: { 'Content-Type': 'application/json' } }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `DELETE /api/conversations/${conversationId} failed (${response.status}): ${errorBody}`
    );
  }

  return response.json() as Promise<{ success: boolean; message: string }>;
};

// ─────────────────────────────────────────────────────────────────────────────
// REPORTS & MODERATION
// ─────────────────────────────────────────────────────────────────────────────

export interface UserReport {
  id: string;
  reporting_user_email: string;
  reported_user_email: string;
  reason: string;
  notes?: string;
  conversation_id?: string;
  message_id?: string;
  created_at: string;
  status: string;
}

export interface BlockedUser {
  id: string;
  blocked_email: string;
  created_at: string;
}

export const submitReport = (
  reporting_user_email: string,
  reported_user_email: string,
  reason: string,
  notes?: string,
  conversation_id?: string,
  message_id?: string
): Promise<{ id: string; created_at: string; message: string }> =>
  apiPost('/api/reports', {
    reporting_user_email,
    reported_user_email,
    reason,
    notes,
    conversation_id,
    message_id,
  });

export const blockUser = (
  blocker_email: string,
  blocked_email: string
): Promise<{ id: string; created_at: string; message: string }> =>
  apiPost('/api/blocked-users', { blocker_email, blocked_email });

export const unblockUser = (
  blocker_email: string,
  blocked_email: string
): Promise<{ success: boolean; message: string }> => {
  console.log(
    `[API] DELETE /api/blocked-users/${encodeURIComponent(
      blocked_email
    )}?blocker_email=${encodeURIComponent(blocker_email)}`
  );

  return fetch(
    `${BACKEND_URL}/api/blocked-users/${encodeURIComponent(
      blocked_email
    )}?blocker_email=${encodeURIComponent(blocker_email)}`,
    { method: 'DELETE' }
  ).then(async (response) => {
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `DELETE /api/blocked-users/${blocked_email} failed (${response.status}): ${errorBody}`
      );
    }
    return response.json();
  });
};

export const fetchBlockedUsers = (blocker_email: string): Promise<BlockedUser[]> =>
  apiGet<BlockedUser[]>(`/api/blocked-users?blocker_email=${encodeURIComponent(blocker_email)}`);

export const checkIfBlocked = (
  blocker_email: string,
  blocked_email: string
): Promise<{ is_blocked: boolean }> =>
  apiGet<{ is_blocked: boolean }>(
    `/api/blocked-users/check?blocker_email=${encodeURIComponent(
      blocker_email
    )}&blocked_email=${encodeURIComponent(blocked_email)}`
  );