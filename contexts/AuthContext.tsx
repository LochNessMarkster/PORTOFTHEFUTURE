
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
    console.log('[API] User logged out');
    try {
      await storage.deleteItem('potf_user');
    } catch (error) {
      console.error('Error clearing stored user:', error);
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
