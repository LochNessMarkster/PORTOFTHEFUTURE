
// Airtable data fetching utilities for Port of the Future Conference
// NOTE: Ports, Presentations, Floor Plan, Networking, Preferences, Messaging, and Attendees
// are now served by the Specular backend (see SPECULAR BACKEND API section at the bottom).
// This file retains Speakers, Activities, Exhibitors, Sponsors, and Announcements from Airtable.

// ─────────────────────────────────────────────────────────────────────────────
// AIRTABLE CACHE (Speakers, Activities, Exhibitors, Sponsors, Announcements)
// ─────────────────────────────────────────────────────────────────────────────

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

// Port Types
export interface RawPortFields {
  'Port Name': string;
  'Intro'?: string;
  'Port Bio'?: string;
  'Port URL'?: string;
  'Logo graphic'?: { url: string; thumbnails?: { large: { url: string } } }[];
  'Featured Port Graphic'?: { url: string; thumbnails?: { large: { url: string } } }[];
}

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
  const fields = record.fields;
  const logo = fields['Logo graphic']?.[0];
  const featuredImage = fields['Featured Port Graphic']?.[0];

  return {
    id: record.id,
    name: fields['Port Name'] || '',
    intro: fields.Intro,
    bio: fields['Port Bio'],
    url: fields['Port URL'],
    logo_url: logo?.thumbnails?.large?.url || logo?.url,
    featured_image_url: featuredImage?.thumbnails?.large?.url || featuredImage?.url,
  };
};

export const fetchPorts = async (): Promise<Port[]> => {
  console.log('Fetching ports...');
  const rawRecords = await fetchPaginatedAirtableData<RawPortFields>('tblrXosiVXKhJHYLu');
  const ports = rawRecords.map(mapAirtablePort);

  // Sort A-Z by name
  ports.sort((a, b) => a.name.localeCompare(b.name));

  console.log('Ports sorted:', ports.length);
  return ports;
};

// Presentation Types
export interface RawPresentationFields {
  'Presentation Title'?: string;
  'Description'?: string;
  'File URL'?: string;
  'Published'?: boolean;
}

export interface Presentation {
  id: string;
  title: string;
  description?: string;
  file_url?: string;
}

export const mapAirtablePresentation = (record: AirtableRecord<RawPresentationFields>): Presentation => {
  const fields = record.fields;

  return {
    id: record.id,
    title: fields['Presentation Title'] || '',
    description: fields.Description,
    file_url: fields['File URL'],
  };
};

export const fetchPresentations = async (): Promise<Presentation[]> => {
  console.log('Fetching presentations...');
  const rawRecords = await fetchPaginatedAirtableData<RawPresentationFields>('tblm5YCpC7ZwRSYWy');
  
  // Filter: only show records where Presentation Title exists AND Published == true
  const publishedRecords = rawRecords.filter(
    record => record.fields['Presentation Title'] && record.fields.Published === true
  );
  console.log('Published presentations:', publishedRecords.length);
  
  const presentations = publishedRecords.map(mapAirtablePresentation);

  // Sort A-Z by title
  presentations.sort((a, b) => a.title.localeCompare(b.title));

  console.log('Presentations sorted:', presentations.length);
  return presentations;
};

// Attendee Types (for Login and Networking)
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

// ─────────────────────────────────────────────────────────────────────────────
// SPECULAR BACKEND API
// All endpoints below use the deployed backend at the URL in app.json extra.backendUrl
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

// ─── Backend Types ────────────────────────────────────────────────────────────

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

// ─── Backend API Functions ────────────────────────────────────────────────────

/**
 * Fetch attendees directory from backend proxy (replaces direct Airtable calls)
 * This endpoint handles Airtable pagination, caching, and CORS issues.
 * The backend returns { attendees: [...], error?: string }
 */
export const fetchAttendeesDirectory = async (): Promise<Attendee[]> => {
  console.log('[API] Fetching attendees directory from backend proxy');
  const result = await apiGet<{ attendees: Attendee[]; error?: string }>('/api/attendees-directory');
  if (result.error) {
    console.warn('[API] Attendees directory returned error:', result.error);
  }
  return result.attendees || [];
};

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

export const fetchFloorPlan = (): Promise<FloorPlan> =>
  apiGet<FloorPlan>('/api/floor-plan');

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
      ? `/api/networking/attendees/${encodeURIComponent(email)}?viewer_email=${encodeURIComponent(viewerEmail)}`
      : `/api/networking/attendees/${encodeURIComponent(email)}`
  );

export const fetchConversations = (email: string): Promise<Conversation[]> =>
  apiGet<Conversation[]>(`/api/conversations?email=${encodeURIComponent(email)}`);

export const createOrGetConversation = (
  participant1_email: string,
  participant2_email: string
): Promise<{ id: string; participant1_email: string; participant2_email: string; created_at: string }> =>
  apiPost('/api/conversations', { participant1_email, participant2_email });

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

// ─── Announcements ────────────────────────────────────────────────────────────

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
  source_used: 'airtablecache' | 'airtable_api';
  announcements: AnnouncementItem[];
}

/**
 * Fetch announcements from the backend proxy endpoint.
 * The backend handles caching (1h TTL), Airtable pagination, and fallback logic.
 * Returns announcements sorted newest-first.
 */
export const fetchAnnouncements = (): Promise<AnnouncementsResponse> =>
  apiGet<AnnouncementsResponse>('/api/announcements');

// ─── Agenda ───────────────────────────────────────────────────────────────────

export interface AgendaItem {
  id: string;
  Title: string;
  Date: string;
  StartTime: string;
  Room?: string;
  TypeTrack?: string;
  SessionDescription?: string;
  SpeakerNames?: string | string[];
}

export interface AgendaResponse {
  updated_at: string;
  source_used: 'airtablecache' | 'airtable';
  agenda: AgendaItem[];
}

/**
 * Fetch agenda from the backend proxy endpoint.
 * The backend handles caching (6h TTL), Airtable pagination, and fallback logic.
 * Returns agenda sorted by Date ascending, then Start Time ascending.
 */
export const fetchAgenda = (): Promise<AgendaResponse> =>
  apiGet<AgendaResponse>('/api/agenda');
