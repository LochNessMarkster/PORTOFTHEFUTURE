
import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { BACKEND_URL, Attendee } from '@/utils/airtable';

// Cross-platform storage helpers (SecureStore doesn't work on web - use localStorage instead)
const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(key, value);
      } catch {
        // ignore
      }
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  deleteItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem(key);
      } catch {
        // ignore
      }
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

interface AuthContextType {
  user: Attendee | null;
  isLoading: boolean;
  isFirstLogin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  markMessagingNoticeShown: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MESSAGING_NOTICE_KEY = 'potf_messaging_notice_shown';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Attendee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userJson = await storage.getItem('potf_user');
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
    console.log('[API] Login attempt:', email);

    try {
      // Call the backend /api/login endpoint which handles Airtable lookup and caching
      console.log('[API] POST /api/login');
      const response = await fetch(`${BACKEND_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Backend returns { error: string } on 401
        throw new Error(data.error || 'Login failed. Please check your credentials.');
      }

      if (!data.success || !data.attendee) {
        throw new Error('Login failed. Please try again.');
      }

      const foundAttendee = data.attendee;

      // Compute display name
      const displayName = `${foundAttendee.firstName} ${foundAttendee.lastName}`.trim();

      const attendee: Attendee = {
        ...foundAttendee,
        emailLower: (foundAttendee.email || '').toLowerCase(),
        displayName,
      };

      console.log('[API] Login successful for:', attendee.displayName);

      // Store user
      await storage.setItem('potf_user', JSON.stringify(attendee));
      setUser(attendee);

      // Check if this is the first time the user is logging in (messaging notice not shown)
      const hasShownNotice = await storage.getItem(MESSAGING_NOTICE_KEY);
      console.log('[Auth] Messaging notice shown before:', hasShownNotice);
      
      if (!hasShownNotice) {
        console.log('[Auth] First login detected - will show messaging notice');
        setIsFirstLogin(true);
      } else {
        setIsFirstLogin(false);
      }
    } catch (error) {
      console.error('[API] Login error:', error);
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
    console.log('[API] User logged out');
    try {
      await storage.deleteItem('potf_user');
    } catch (error) {
      console.error('Error clearing stored user:', error);
    }
  };

  const markMessagingNoticeShown = async () => {
    console.log('[Auth] Marking messaging notice as shown');
    try {
      await storage.setItem(MESSAGING_NOTICE_KEY, 'true');
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
