
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Attendee } from '@/utils/airtable';

interface AuthContextType {
  user: Attendee | null;
  isLoading: boolean;
  isFirstLogin: boolean;
  login: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  markMessagingNoticeShown: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MESSAGING_NOTICE_KEY = 'potf_messaging_notice_shown';
const USER_KEY = 'potf_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Attendee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userJson = await AsyncStorage.getItem(USER_KEY);
      if (userJson) {
        setUser(JSON.parse(userJson));
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string) => {
    console.log('[Auth] Login attempt for email:', email);

    try {
      const normalizedEmail = email.toLowerCase().trim();
      
      // Fetch from the new Airtable cache endpoint
      const airtableCacheUrl = 'https://airtablecache.portofthefutureconference.com/v0/appkKjciinTlnsbkd/tblqe1kPM95Cp4Srn';
      
      console.log('[Auth] Fetching from Airtable cache:', airtableCacheUrl);
      const response = await fetch(airtableCacheUrl);
      
      if (!response.ok) {
        throw new Error('Failed to connect to registration database. Please try again.');
      }

      const data = await response.json();
      console.log('[Auth] Received records:', data.records?.length || 0);

      // Find matching email (case-insensitive)
      const foundRecord = data.records?.find((record: any) => 
        record.fields['Email']?.toLowerCase().trim() === normalizedEmail
      );

      if (!foundRecord) {
        throw new Error('Email not found. Please use your registration email.');
      }

      // Map the Airtable fields to our Attendee interface
      const fields = foundRecord.fields;
      const firstName = (fields['First Name'] || '').trim();
      const lastName = (fields['Last Name'] || '').trim();
      const displayName = `${firstName} ${lastName}`.trim();

      const attendee: Attendee = {
        firstName,
        lastName,
        email: (fields['Email'] || '').trim(),
        company: fields['Company'],
        title: fields['Title'],
        phone: fields['Phone'],
        registrationType: fields['Registration Type'],
        emailLower: normalizedEmail,
        displayName,
      };

      console.log('[Auth] Login successful for:', attendee.displayName);

      // Store user locally
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(attendee));
      setUser(attendee);

      // Check if this is the first time the user is logging in (messaging notice not shown)
      const hasShownNotice = await AsyncStorage.getItem(MESSAGING_NOTICE_KEY);
      console.log('[Auth] Messaging notice shown before:', hasShownNotice);
      
      if (!hasShownNotice) {
        console.log('[Auth] First login detected - will show messaging notice');
        setIsFirstLogin(true);
      } else {
        setIsFirstLogin(false);
      }
    } catch (error) {
      console.error('[Auth] Login error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to login. Please check your connection and try again.');
    }
  };

  const logout = async () => {
    // Clear local state immediately (don't wait for storage)
    setUser(null);
    setIsFirstLogin(false);
    console.log('[Auth] User logged out');
    try {
      await AsyncStorage.removeItem(USER_KEY);
    } catch (error) {
      console.error('Error clearing stored user:', error);
    }
  };

  const markMessagingNoticeShown = async () => {
    console.log('[Auth] Marking messaging notice as shown');
    try {
      await AsyncStorage.setItem(MESSAGING_NOTICE_KEY, 'true');
      setIsFirstLogin(false);
    } catch (error) {
      console.error('[Auth] Error marking messaging notice as shown:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isFirstLogin, login, logout, markMessagingNoticeShown }}>
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
