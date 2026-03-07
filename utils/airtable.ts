
// Airtable data fetching utilities for Port of the Future Conference
// NOTE: Ports, Presentations, Floor Plan, Networking, Preferences, Messaging, and Attendees
// are now served by the Specular backend (see SPECULAR BACKEND API section at the bottom).
// This file retains Speakers, Activities, Exhibitors, Sponsors, and Announcements from Airtable.

// ─────────────────────────────────────────────────────────────────────────────
// AIRTABLE CACHE (Speakers, Activities, Announcements)
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
  source_used: 'airtablecache' | 'airtable';
  speakers: Speaker[];
}

/**
 * Fetch speakers from the backend proxy endpoint.
 * The backend handles caching (24h TTL), Airtable pagination, filtering (Published==true),
 * sorting (Last Name then First Name), and fallback logic.
 * Returns speakers sorted by last name, then first name.
 */
export const fetchSpeakers = (): Promise<SpeakersResponse> =>
  apiGet<SpeakersResponse>('/api/speakers');

// Activity Types (now from backend proxy)
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
  source_used: 'airtablecache' | 'airtable_api' | 'airtable' | 'error';
  activities: Activity[];
}

/**
 * Fetch activities from the backend proxy endpoint.
 * The backend handles caching (24h TTL), Airtable pagination, sorting (Date ascending), and fallback logic.
 */
export const fetchActivities = (): Promise<ActivitiesResponse> =>
  apiGet<ActivitiesResponse>('/api/activities');

// Exhibitor Types (now from backend proxy)
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
  source_used: 'airtablecache' | 'airtable_api' | 'error';
  exhibitors: Exhibitor[];
}

/**
 * Fetch exhibitors from the backend proxy endpoint.
 * The backend handles caching (24h TTL), Airtable pagination, sorting (Name A-Z), and fallback logic.
 */
export const fetchExhibitors = (): Promise<ExhibitorsResponse> =>
  apiGet<ExhibitorsResponse>('/api/exhibitors');

// Sponsor Types (now from backend proxy)
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
  source_used: 'airtablecache' | 'airtable_api' | 'error';
  sponsors: Sponsor[];
}

/**
 * Fetch sponsors from the backend proxy endpoint.
 * The backend handles caching (24h TTL), Airtable pagination, sorting (Level then Name), and fallback logic.
 * Table ID: tblgWrwRvpdcVG8sB
 */
export const fetchSponsors = async (): Promise<SponsorsResponse> => {
  console.log('[Sponsors] Fetching sponsors from backend proxy...');
  console.log('[Sponsors] Endpoint:', `${BACKEND_URL}/api/sponsors`);
  const result = await apiGet<SponsorsResponse>('/api/sponsors');
  console.log('[Sponsors] Raw response - source_used:', result.source_used);
  console.log('[Sponsors] Raw response - sponsors count:', result.sponsors?.length ?? 0);
  if (result.sponsors && result.sponsors.length > 0) {
    console.log('[Sponsors] First sponsor raw:', JSON.stringify(result.sponsors[0]));
  } else {
    console.warn('[Sponsors] WARNING: No sponsors returned from backend. source_used:', result.source_used);
  }
  // Filter out any records without a name to prevent crashes
  const validSponsors = (result.sponsors || []).filter(s => s && s.name);
  console.log('[Sponsors] Valid sponsors (with name):', validSponsors.length);
  return {
    ...result,
    sponsors: validSponsors,
  };
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

// ─── Reports & Moderation ─────────────────────────────────────────────────────

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
  console.log(`[API] DELETE /api/blocked-users/${encodeURIComponent(blocked_email)}?blocker_email=${encodeURIComponent(blocker_email)}`);
  return fetch(
    `${BACKEND_URL}/api/blocked-users/${encodeURIComponent(blocked_email)}?blocker_email=${encodeURIComponent(blocker_email)}`,
    { method: 'DELETE' }
  ).then(async (response) => {
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`DELETE /api/blocked-users/${blocked_email} failed (${response.status}): ${errorBody}`);
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
    `/api/blocked-users/check?blocker_email=${encodeURIComponent(blocker_email)}&blocked_email=${encodeURIComponent(blocked_email)}`
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

/**
 * Fetch agenda from the backend proxy endpoint.
 * The backend handles caching (6h TTL), Airtable pagination (all records, 100+), and fallback logic.
 * Returns agenda sorted by Date ascending, then Start Time ascending, then Title ascending.
 * Filters to March 23-25, 2026 sessions only.
 */
export const fetchAgenda = async (): Promise<AgendaResponse> => {
  console.log('[Agenda] Fetching all agenda sessions from backend...');

  const raw = await apiGet<AgendaResponse>('/api/agenda');

  console.log('[Agenda] Total records fetched from backend:', raw.agenda?.length ?? 0);
  console.log('[Agenda] Source used:', raw.source_used);

  // Validate speaker names — warn if any look like Airtable record IDs (recXXXXXXXXXXXXXX)
  const airtableIdPattern = /^rec[A-Za-z0-9]{14}$/;
  (raw.agenda || []).forEach((session) => {
    const names = session.SpeakerNames;
    if (Array.isArray(names)) {
      names.forEach((n) => {
        if (airtableIdPattern.test(n)) {
          console.warn(
            `[Agenda] WARNING: Session "${session.Title}" has unresolved speaker ID: ${n}`
          );
        }
      });
    } else if (typeof names === 'string' && airtableIdPattern.test(names)) {
      console.warn(
        `[Agenda] WARNING: Session "${session.Title}" has unresolved speaker ID: ${names}`
      );
    }
  });

  // Filter to March 23-25, 2026
  const filtered = (raw.agenda || []).filter((session) => {
    const d = session.Date;
    return d === '2026-03-23' || d === '2026-03-24' || d === '2026-03-25';
  });

  console.log('[Agenda] Filtered to March 23-25:', filtered.length, 'sessions');

  // Sort by Date → StartTime → Title
  const sorted = filtered.sort((a, b) => {
    const dateA = a.Date || '';
    const dateB = b.Date || '';
    if (dateA !== dateB) return dateA.localeCompare(dateB);

    const timeA = convertTimeToMinutes(a.StartTime || '');
    const timeB = convertTimeToMinutes(b.StartTime || '');
    if (timeA !== timeB) return timeA - timeB;

    return (a.Title || '').localeCompare(b.Title || '');
  });

  console.log('[Agenda] Final sorted agenda:', sorted.length, 'sessions');

  return {
    updated_at: raw.updated_at,
    source_used: raw.source_used,
    agenda: sorted,
  };
};
