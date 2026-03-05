
import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

interface Attendee {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  title: string;
  phone: string;
  registrationType: string;
  displayName: string;
}

interface AuthContextType {
  user: Attendee | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Attendee | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userJson = await SecureStore.getItemAsync('potf_user');
      if (userJson) {
        setUser(JSON.parse(userJson));
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    console.log('Login attempt:', email);
    
    // Validate password
    if (password !== 'POTF2026') {
      throw new Error('Incorrect password');
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Fetch attendees from Airtable cache
    let allRecords: any[] = [];
    let offset: string | undefined = undefined;
    
    do {
      const url = offset 
        ? `https://airtablecache.portofthefutureconference.com/v0/appkKjciinTlnsbkd/tblIwt4FWHtNm01Z4?offset=${offset}`
        : 'https://airtablecache.portofthefutureconference.com/v0/appkKjciinTlnsbkd/tblIwt4FWHtNm01Z4';
      
      console.log('Fetching attendees from:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch attendees');
      }
      
      const data = await response.json();
      allRecords = [...allRecords, ...data.records];
      offset = data.offset;
      
      console.log('Fetched page with', data.records.length, 'records. Offset:', offset);
    } while (offset);

    console.log('Total attendees fetched:', allRecords.length);

    // Find matching attendee
    const attendeeRecord = allRecords.find(record => {
      const recordEmail = record.fields.Email?.toLowerCase().trim();
      return recordEmail === normalizedEmail;
    });

    if (!attendeeRecord) {
      throw new Error('Email not found');
    }

    // Map fields to attendee object
    const fields = attendeeRecord.fields;
    const firstName = fields['First Name'] || '';
    const lastName = fields['Last Name'] || '';
    const displayName = `${firstName} ${lastName}`.trim();

    const attendee: Attendee = {
      firstName,
      lastName,
      email: fields.Email || '',
      company: fields.Company || '',
      title: fields.Title || '',
      phone: fields.Phone || '',
      registrationType: fields['Registration Type'] || '',
      displayName,
    };

    console.log('Login successful for:', attendee.displayName);

    // Store user
    await SecureStore.setItemAsync('potf_user', JSON.stringify(attendee));
    setUser(attendee);
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('potf_user');
      setUser(null);
      console.log('User logged out');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
