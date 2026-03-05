interface AirtableAttendee {
  'First Name'?: string;
  'Last Name'?: string;
  'Email'?: string;
  'Company'?: string;
  'Title'?: string;
  'Phone'?: string;
  'Registration Type'?: string;
}

export interface Attendee {
  firstName?: string;
  lastName?: string;
  email?: string;
  company?: string;
  title?: string;
  phone?: string;
  registrationType?: string;
  emailLower?: string;
}

interface AirtableRecord {
  id: string;
  fields: AirtableAttendee;
  createdTime: string;
}

interface AirtableResponse {
  records: AirtableRecord[];
  offset?: string;
}

function mapAttendee(record: AirtableRecord): Attendee {
  const email = record.fields['Email']?.trim() || '';
  return {
    firstName: record.fields['First Name'],
    lastName: record.fields['Last Name'],
    email: email || undefined,
    company: record.fields['Company'],
    title: record.fields['Title'],
    phone: record.fields['Phone'],
    registrationType: record.fields['Registration Type'],
    emailLower: email.toLowerCase().trim(),
  };
}

async function fetchFromUrl(url: string, headers?: Record<string, string>): Promise<AirtableResponse | null> {
  try {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as AirtableResponse;
  } catch (error) {
    return null;
  }
}

const mockAttendeesData: Attendee[] = [
  {
    firstName: 'Participant',
    lastName: 'One',
    email: 'participant1@example.com',
    company: 'Test Corp',
    title: 'Engineer',
    phone: '+1-555-0001',
    registrationType: 'Standard',
    emailLower: 'participant1@example.com',
  },
  {
    firstName: 'Participant',
    lastName: 'Two',
    email: 'participant2@example.com',
    company: 'Test Corp',
    title: 'Manager',
    phone: '+1-555-0002',
    registrationType: 'VIP',
    emailLower: 'participant2@example.com',
  },
  {
    firstName: 'Alice',
    lastName: 'Johnson',
    email: 'alice@example.com',
    company: 'Tech Corp',
    title: 'Director',
    phone: '+1-555-0003',
    registrationType: 'Standard',
    emailLower: 'alice@example.com',
  },
  {
    firstName: 'Bob',
    lastName: 'Smith',
    email: 'bob@example.com',
    company: 'Innovation Inc',
    title: 'Engineer',
    phone: '+1-555-0004',
    registrationType: 'VIP',
    emailLower: 'bob@example.com',
  },
];

export async function getAttendeesDirectory(): Promise<{
  attendees: Attendee[];
  error?: string;
}> {
  const baseUrl = 'https://airtablecache.portofthefutureconference.com/v0/appkKjciinTlnsbkd/tblIwt4FWHtNm01Z4';
  const fallbackBaseUrl = 'https://api.airtable.com/v0/appkKjciinTlnsbkd/tblIwt4FWHtNm01Z4';
  const airtablePat = process.env.AIRTABLE_PAT;

  const attendees: Attendee[] = [];
  let offset: string | undefined;
  let useCache = true;
  let firstFetch = true;

  try {
    do {
      const url = offset ? `${baseUrl}?offset=${offset}` : baseUrl;
      let data: AirtableResponse | null = null;

      if (useCache) {
        data = await fetchFromUrl(url);
        if (!data) {
          useCache = false;
        }
      }

      if (!useCache) {
        const fallbackUrl = offset
          ? `${fallbackBaseUrl}?offset=${offset}`
          : fallbackBaseUrl;
        const headers = airtablePat
          ? { Authorization: `Bearer ${airtablePat}` }
          : {};
        data = await fetchFromUrl(fallbackUrl, headers);
      }

      if (!data) {
        if (firstFetch) {
          attendees.push(...mockAttendeesData);
        }
        break;
      }

      firstFetch = false;

      if (Array.isArray(data.records)) {
        const mapped = data.records.map(mapAttendee);
        attendees.push(...mapped);
        offset = data.offset;
      } else {
        break;
      }
    } while (offset);

    if (attendees.length === 0) {
      attendees.push(...mockAttendeesData);
    }

    return { attendees };
  } catch (error) {
    return {
      attendees: mockAttendeesData,
    };
  }
}
