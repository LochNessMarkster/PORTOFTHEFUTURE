
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
  const [bookmarkedSessions, setBookmarkedSessions] = useState<Set<string>>(new Set());
  const [groupedSessions, setGroupedSessions] = useState<GroupedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Reload bookmarks when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('[My Schedule] Screen focused, reloading bookmarks');
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
    try {
      const stored = await AsyncStorage.getItem(BOOKMARKS_KEY);
      if (stored) {
        const bookmarks = JSON.parse(stored);
        setBookmarkedSessions(new Set(bookmarks));
        console.log('[My Schedule] Loaded bookmarks:', bookmarks.length);
      } else {
        setBookmarkedSessions(new Set());
      }
    } catch (err) {
      console.error('[My Schedule] Error loading bookmarks:', err);
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
    
    // Filter sessions that are bookmarked
    const bookmarked = allSessions.filter(session => 
      bookmarkedSessions.has(session.id)
    );

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
    console.log('[My Schedule] Removing bookmark:', sessionId);
    try {
      const stored = await AsyncStorage.getItem(BOOKMARKS_KEY);
      let bookmarks: string[] = stored ? JSON.parse(stored) : [];
      bookmarks = bookmarks.filter(id => id !== sessionId);
      await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
      setBookmarkedSessions(new Set(bookmarks));
    } catch (err) {
      console.error('[My Schedule] Error removing bookmark:', err);
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
        {item.sessions.map((session, index) => (
          <View key={session.id}>
            {renderSessionCard({ item: session })}
          </View>
        ))}
      </View>
    );
  };

  const renderHeader = () => {
    return (
      <>
        {/* Wi-Fi Banner - Only on My Schedule screen */}
        <WiFiBanner />
        
        {/* Now/Next Section */}
        {groupedSessions.length > 0 && <NowNextSection />}
      </>
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
