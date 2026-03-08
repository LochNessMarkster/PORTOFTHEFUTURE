
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
  RefreshControl,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchAgenda, AgendaItem } from '@/utils/airtable';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSessionStatus } from '@/utils/timeUtils';
import { NowNextSection } from '@/components/NowNextSection';
import { WiFiBanner } from '@/components/WiFiBanner';

const BOOKMARKS_KEY = '@agenda_bookmarks';

// Track color mapping - consistent across the app
const TRACK_COLORS: Record<string, string> = {
  // 9 Conference Tracks
  'Track 1 - Ensuring America\'s Maritime Security': '#3B82F6', // Blue
  'Track 2 - Developing Ports': '#10B981', // Green
  'Track 3 - Intermodal Connectivity': '#A855F7', // Purple
  'Track 4 - Enhancing Ports\' Operational Efficiencies': '#14B8A6', // Teal
  'Track 5 - Port Infrastructure 4.0': '#F59E0B', // Orange
  'Track 6 - Decarbonization and Alternative Fuels': '#EF4444', // Red
  'Track 7 - Port Energy and Sustainability': '#EAB308', // Yellow
  'Track 8 - Port Security, Cybersecurity, & Emergency Management': '#6366F1', // Indigo
  'Track 9 - Advances in Dredging Technology and Methods': '#EC4899', // Pink
  
  // Breaks
  'Break': '#6B7280', // Gray
  
  // Events
  'Special Event': '#F59E0B', // Gold
  'Pre-Conference / Social': '#F59E0B', // Gold
  'Keynote & Plenary': '#F59E0B', // Gold
  'Luncheon (By Invitation)': '#F59E0B', // Gold
  'Pre-Conference': '#F59E0B', // Gold
};

interface GroupedSession {
  date: string;
  sessions: AgendaItem[];
}

export default function MyScheduleScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  const [allSessions, setAllSessions] = useState<AgendaItem[]>([]);
  const [bookmarkedSessions, setBookmarkedSessions] = useState<string[]>([]);
  const [groupedSessions, setGroupedSessions] = useState<GroupedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);

  // Reload bookmarks when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('[My Schedule] 🔄 Screen focused, reloading bookmarks...');
      loadBookmarks();
    }, [])
  );

  useEffect(() => {
    loadAgenda();
  }, []);

  useEffect(() => {
    groupByDate();
  }, [allSessions, bookmarkedSessions]);

  const loadBookmarks = async () => {
    console.log('[My Schedule] 🔍 Attempting to load bookmarks...');
    console.log('[My Schedule] AsyncStorage import:', AsyncStorage);
    console.log('[My Schedule] AsyncStorage defined:', !!AsyncStorage);
    console.log('[My Schedule] Bookmark storage key:', BOOKMARKS_KEY);
    
    try {
      // Check if AsyncStorage is available
      if (!AsyncStorage) {
        const errorMsg = 'AsyncStorage is null or undefined';
        console.error('[My Schedule] ❌', errorMsg);
        setStorageError(errorMsg);
        setBookmarkedSessions([]);
        return;
      }

      console.log('[My Schedule] ✅ AsyncStorage is available, attempting getItem...');
      const stored = await AsyncStorage.getItem(BOOKMARKS_KEY);
      console.log('[My Schedule] Raw stored value:', stored);
      
      if (!stored) {
        console.log('[My Schedule] ✅ No stored bookmarks found. Returning empty array.');
        setBookmarkedSessions([]);
        setStorageError(null);
        return;
      }

      let parsedBookmarks: unknown;
      try {
        parsedBookmarks = JSON.parse(stored);
        console.log('[My Schedule] Parsed bookmarks (type):', typeof parsedBookmarks);
        console.log('[My Schedule] Parsed bookmarks (value):', parsedBookmarks);
      } catch (parseError: any) {
        console.error('[My Schedule] ❌ Failed to parse stored bookmarks JSON:', parseError?.message || parseError);
        setBookmarkedSessions([]);
        setStorageError('Failed to parse bookmark data');
        return;
      }

      // Safe implementation rule: if parsed value is not an array, use []
      if (!Array.isArray(parsedBookmarks)) {
        console.error('[My Schedule] ❌ Stored bookmarks are not an array (type:', typeof parsedBookmarks, '). Falling back to empty array.');
        setBookmarkedSessions([]);
        setStorageError('Invalid bookmark data format');
        // Fix the corrupted storage
        try {
          await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify([]));
          console.log('[My Schedule] ✅ Reset corrupted storage to empty array');
        } catch (resetError) {
          console.error('[My Schedule] ❌ Failed to reset storage:', resetError);
        }
        return;
      }

      console.log('[My Schedule] Parsed bookmarks array:', parsedBookmarks);
      console.log('[My Schedule] ✅ Loaded', parsedBookmarks.length, 'bookmarked session IDs.');
      setBookmarkedSessions(parsedBookmarks as string[]);
      setStorageError(null);
    } catch (error: any) {
      // Defensive error handling: log the storage error, fall back to empty array
      const errorName = error?.name || 'UnknownError';
      const errorMessage = error?.message || 'No message';
      const fullError = `${errorName} - ${errorMessage}`;
      
      console.error('[My Schedule] ❌ AsyncStorage error loading bookmarks:', fullError);
      console.error('[My Schedule] Full error object:', error);
      
      setStorageError(fullError);
      setBookmarkedSessions([]);
    }
  };

  const loadAgenda = useCallback(async () => {
    console.log('[My Schedule] Fetching agenda...');
    try {
      if (!refreshing) {
        setLoading(true);
      }

      const data = await fetchAgenda();
      console.log('[My Schedule] Received agenda:', data.agenda?.length || 0, 'sessions');

      // Filter to only March 23-25, 2026
      const filteredSessions = (data.agenda || []).filter(session => {
        const date = session.Date;
        return date === '2026-03-23' || date === '2026-03-24' || date === '2026-03-25';
      });

      setAllSessions(filteredSessions);
      console.log('[My Schedule] Total sessions:', filteredSessions.length);
    } catch (err) {
      console.error('[My Schedule] Error fetching agenda:', err);
      setAllSessions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  const groupByDate = () => {
    console.log('[My Schedule] Grouping sessions by date');
    console.log('[My Schedule] Total sessions:', allSessions.length);
    console.log('[My Schedule] Bookmarked session IDs:', bookmarkedSessions);
    
    // Safe implementation: ensure bookmarkedSessions is an array before filtering
    if (!Array.isArray(bookmarkedSessions)) {
      console.error('[My Schedule] ❌ bookmarkedSessions is not an array, cannot filter');
      setGroupedSessions([]);
      return;
    }

    // Filter sessions that are bookmarked
    const bookmarked = allSessions.filter(session => {
      const isBookmarked = bookmarkedSessions.includes(session.id);
      if (isBookmarked) {
        console.log('[My Schedule] Found bookmarked session:', session.Title, '(ID:', session.id, ')');
      }
      return isBookmarked;
    });

    console.log('[My Schedule] Bookmarked sessions:', bookmarked.length);

    // Group by date
    const dateMap = new Map<string, AgendaItem[]>();
    bookmarked.forEach(session => {
      const date = session.Date || '';
      if (!dateMap.has(date)) {
        dateMap.set(date, []);
      }
      dateMap.get(date)!.push(session);
    });

    // Sort sessions within each date by start time
    dateMap.forEach((sessions, date) => {
      sessions.sort((a, b) => {
        const timeA = a.StartTime || '';
        const timeB = b.StartTime || '';
        return timeA.localeCompare(timeB);
      });
    });

    // Convert to array and sort by date
    const grouped: GroupedSession[] = Array.from(dateMap.entries())
      .map(([date, sessions]) => ({ date, sessions }))
      .sort((a, b) => a.date.localeCompare(b.date));

    console.log('[My Schedule] Grouped into', grouped.length, 'dates');
    setGroupedSessions(grouped);
  };

  const onRefresh = () => {
    console.log('[My Schedule] User initiated refresh');
    setRefreshing(true);
    loadBookmarks();
    loadAgenda();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    // Parse YYYY-MM-DD directly without timezone conversion
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
    const day = parseInt(parts[2], 10);
    
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    // Create date in local timezone
    const date = new Date(year, month, day);
    const weekday = weekdays[date.getDay()];
    const monthName = months[month];
    
    return `${weekday}, ${monthName} ${day}, ${year}`;
  };

  const formatShortDate = (dateString: string): string => {
    if (!dateString) return '';
    // Parse YYYY-MM-DD directly without timezone conversion
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
    const day = parseInt(parts[2], 10);
    
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = months[month];
    
    return `${monthName} ${day}, ${year}`;
  };

  const handleSessionPress = (item: AgendaItem) => {
    console.log('[My Schedule] Session pressed:', item.Title);
    router.push({
      pathname: '/agenda-detail',
      params: {
        id: item.id,
        title: item.Title || '',
        date: item.Date || '',
        startTime: item.StartTime || '',
        endTime: item.EndTime || '',
        room: item.Room || '',
        typeTrack: item.TypeTrack || '',
        sessionDescription: item.SessionDescription || '',
        speakerNames: Array.isArray(item.SpeakerNames) 
          ? item.SpeakerNames.join(', ') 
          : item.SpeakerNames || '',
      },
    });
  };

  const removeBookmark = async (sessionId: string) => {
    console.log('[My Schedule] 🗑️ Removing bookmark:', sessionId);
    
    try {
      // Check if AsyncStorage is available
      if (!AsyncStorage) {
        console.error('[My Schedule] ❌ AsyncStorage is null. Cannot remove bookmark.');
        return;
      }

      const stored = await AsyncStorage.getItem(BOOKMARKS_KEY);
      let bookmarks: string[] = [];
      
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            bookmarks = parsed;
          } else {
            console.error('[My Schedule] ❌ Stored bookmarks are not an array');
            bookmarks = [];
          }
        } catch (parseError) {
          console.error('[My Schedule] ❌ Failed to parse bookmarks:', parseError);
          bookmarks = [];
        }
      }
      
      console.log('[My Schedule] Current bookmarks before removal:', bookmarks);
      
      bookmarks = bookmarks.filter(id => id !== sessionId);
      console.log('[My Schedule] New bookmarks array after removal:', bookmarks);
      
      const jsonString = JSON.stringify(bookmarks);
      console.log('[My Schedule] JSON string to save:', jsonString);
      
      await AsyncStorage.setItem(BOOKMARKS_KEY, jsonString);
      console.log('[My Schedule] ✅ AsyncStorage.setItem completed');
      
      // Immediate verification
      const verification = await AsyncStorage.getItem(BOOKMARKS_KEY);
      console.log('[My Schedule] 🔍 Verification read:', verification);
      
      if (verification === jsonString) {
        console.log('[My Schedule] ✅ VERIFICATION PASSED - Data saved correctly!');
      } else {
        console.error('[My Schedule] ❌ VERIFICATION FAILED - Saved data does not match!');
      }
      
      setBookmarkedSessions(bookmarks);
      console.log('[My Schedule] ✅ Bookmark removed successfully');
    } catch (err: any) {
      console.error('[My Schedule] ❌ Failed to remove bookmark:', err?.name, err?.message);
      console.error('[My Schedule] Full error:', err);
    }
  };

  const getTrackColor = (track: string | undefined): string => {
    if (!track) return colors.textSecondary;
    return TRACK_COLORS[track] || colors.textSecondary;
  };

  const renderSessionCard = ({ item }: { item: AgendaItem }) => {
    const speakerDisplay = Array.isArray(item.SpeakerNames)
      ? item.SpeakerNames.join(', ')
      : item.SpeakerNames || '';
    
    const trackColor = getTrackColor(item.TypeTrack);

    // Format date and time display
    const dateDisplay = formatShortDate(item.Date);
    const timeDisplay = item.EndTime 
      ? `${item.StartTime} - ${item.EndTime}`
      : item.StartTime;

    // Get session status (now/next)
    const status = item.EndTime ? getSessionStatus(item.Date, item.StartTime, item.EndTime) : null;

    return (
      <TouchableOpacity
        style={styles.sessionCard}
        onPress={() => handleSessionPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            {status && (
              <View style={[
                styles.statusBadge,
                status === 'now' ? styles.nowBadge : styles.nextBadge
              ]}>
                <Text style={styles.statusBadgeText}>
                  {status === 'now' ? 'NOW' : 'NEXT'}
                </Text>
              </View>
            )}
            <Text style={styles.sessionTitle} numberOfLines={2}>
              {item.Title}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removeBookmark(item.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <IconSymbol
              ios_icon_name="xmark.circle.fill"
              android_material_icon_name="cancel"
              size={24}
              color={colors.error}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.sessionInfo}>
          <Text style={styles.sessionDate}>
            {dateDisplay}
          </Text>
        </View>

        <View style={styles.sessionInfo}>
          <Text style={styles.sessionTime}>
            {timeDisplay}
          </Text>
        </View>

        {item.Room && (
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionRoom}>
              {item.Room}
            </Text>
          </View>
        )}

        {speakerDisplay && (
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionSpeakers} numberOfLines={1}>
              {speakerDisplay}
            </Text>
          </View>
        )}

        {item.TypeTrack && (
          <View style={styles.trackBadgeContainer}>
            <View style={[
              styles.trackBadge,
              { 
                backgroundColor: trackColor + '20',
                borderColor: trackColor,
              }
            ]}>
              <Text style={[styles.trackBadgeText, { color: trackColor }]}>
                {item.TypeTrack}
              </Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderDateSection = ({ item }: { item: GroupedSession }) => {
    const formattedDate = formatDate(item.date);
    
    return (
      <View style={styles.dateSection}>
        <View style={styles.dateSectionHeader}>
          <Text style={styles.dateSectionTitle}>
            {formattedDate}
          </Text>
        </View>
        {item.sessions.map((session) => (
          <React.Fragment key={session.id}>
            {renderSessionCard({ item: session })}
          </React.Fragment>
        ))}
      </View>
    );
  };

  const renderHeader = () => {
    return (
      <View>
        <WiFiBanner />
        {storageError && (
          <View style={styles.errorBanner}>
            <IconSymbol
              ios_icon_name="exclamationmark.triangle.fill"
              android_material_icon_name="warning"
              size={20}
              color={colors.error}
            />
            <Text style={styles.errorBannerText}>
              Storage error: {storageError}
            </Text>
          </View>
        )}
        {groupedSessions.length > 0 && <NowNextSection />}
      </View>
    );
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: true,
          title: 'My Schedule',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
        }} 
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.loadingText}>
              Loading your schedule...
            </Text>
          </View>
        ) : groupedSessions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol
              ios_icon_name="bookmark"
              android_material_icon_name="bookmark-border"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyTitle}>
              No Sessions Saved
            </Text>
            <Text style={styles.emptyText}>
              Tap the bookmark icon on any session in the Agenda to add it to your schedule.
            </Text>
            {storageError && (
              <View style={styles.emptyErrorContainer}>
                <Text style={styles.emptyErrorText}>
                  Note: There was a storage error. Your bookmarks may not persist.
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => router.push('/agenda')}
            >
              <Text style={styles.browseButtonText}>Browse Agenda</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={groupedSessions}
            keyExtractor={(item) => item.date}
            renderItem={renderDateSection}
            ListHeaderComponent={renderHeader}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.accent}
                colors={[colors.accent]}
              />
            }
          />
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyErrorContainer: {
    backgroundColor: colors.error + '20',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  emptyErrorText: {
    fontSize: 13,
    textAlign: 'center',
    color: colors.error,
  },
  browseButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error + '20',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorBannerText: {
    fontSize: 13,
    color: colors.error,
    marginLeft: 8,
    flex: 1,
  },
  dateSection: {
    marginBottom: 24,
  },
  dateSectionHeader: {
    marginBottom: 12,
  },
  dateSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  sessionCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 6,
  },
  nowBadge: {
    backgroundColor: '#10B981',
  },
  nextBadge: {
    backgroundColor: colors.accent,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 24,
  },
  removeButton: {
    padding: 4,
  },
  sessionInfo: {
    marginBottom: 6,
  },
  sessionDate: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  sessionTime: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.accent,
  },
  sessionRoom: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  sessionSpeakers: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  trackBadgeContainer: {
    marginTop: 8,
  },
  trackBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  trackBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
