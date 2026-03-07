
import React, { useState, useEffect, useCallback } from 'react';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { IconSymbol } from '@/components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchAgenda, AgendaItem } from '@/utils/airtable';
import { colors } from '@/styles/commonStyles';
import { getSessionStatus } from '@/utils/timeUtils';
import { NowNextSection } from '@/components/NowNextSection';
import { WiFiBanner } from '@/components/WiFiBanner';

const BOOKMARKS_KEY = '@agenda_bookmarks';

// Track color mapping - consistent with agenda.tsx
const TRACK_COLORS: Record<string, string> = {
  'Track 1 - Ensuring America\'s Maritime Security': '#3B82F6',
  'Track 2 - Developing Ports': '#10B981',
  'Track 3 - Intermodal Connectivity': '#A855F7',
  'Track 4 - Enhancing Ports\' Operational Efficiencies': '#14B8A6',
  'Track 5 - Port Infrastructure 4.0': '#F59E0B',
  'Track 6 - Decarbonization and Alternative Fuels': '#EF4444',
  'Track 7 - Port Energy and Sustainability': '#EAB308',
  'Track 8 - Port Security, Cybersecurity, & Emergency Management': '#6366F1',
  'Track 9 - Advances in Dredging Technology and Methods': '#EC4899',
  'Break': '#6B7280',
  'Special Event': '#F59E0B',
  'Pre-Conference / Social': '#F59E0B',
  'Keynote & Plenary': '#F59E0B',
  'Luncheon (By Invitation)': '#F59E0B',
  'Pre-Conference': '#F59E0B',
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load bookmarks and sessions on mount
  useEffect(() => {
    loadData();
  }, []);

  // Reload bookmarks when screen comes into focus (user might have added/removed bookmarks from agenda)
  useFocusEffect(
    useCallback(() => {
      console.log('[MySchedule] Screen focused - reloading bookmarks');
      loadBookmarks();
    }, [])
  );

  const loadData = async () => {
    console.log('[MySchedule] Loading data...');
    await Promise.all([loadBookmarks(), loadSessions()]);
  };

  const loadBookmarks = async () => {
    try {
      const stored = await AsyncStorage.getItem(BOOKMARKS_KEY);
      
      if (stored) {
        const parsed = JSON.parse(stored);
        
        if (Array.isArray(parsed)) {
          const bookmarks = new Set(parsed);
          setBookmarkedSessions(bookmarks);
          console.log('[MySchedule] Loaded bookmarks:', bookmarks.size, 'sessions');
        } else {
          console.log('[MySchedule] Bookmarks not an array, resetting');
          setBookmarkedSessions(new Set());
        }
      } else {
        console.log('[MySchedule] No bookmarks found');
        setBookmarkedSessions(new Set());
      }
    } catch (err: any) {
      // Gracefully handle AsyncStorage errors
      console.log('[MySchedule] Storage unavailable, using in-memory bookmarks only');
      setBookmarkedSessions(new Set());
    }
  };

  const loadSessions = async () => {
    try {
      if (!refreshing) {
        setLoading(true);
      }
      setError(null);

      const data = await fetchAgenda();
      console.log('[MySchedule] Sessions loaded:', data.agenda?.length || 0);
      
      setAllSessions(data.agenda || []);
    } catch (err) {
      console.error('[MySchedule] Error fetching sessions:', err);
      setError('Unable to load sessions. Pull to refresh.');
      setAllSessions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Filter sessions to only show bookmarked ones
  const myScheduleSessions = allSessions.filter(session => 
    bookmarkedSessions.has(session.id)
  );

  // Group sessions by date
  const groupedSessions = useCallback((): GroupedSession[] => {
    const groups: { [date: string]: AgendaItem[] } = {};

    myScheduleSessions.forEach(session => {
      const date = session.Date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(session);
    });

    // Sort sessions within each date by start time
    Object.keys(groups).forEach(date => {
      groups[date].sort((a, b) => {
        const timeA = a.StartTime || '';
        const timeB = b.StartTime || '';
        return timeA.localeCompare(timeB);
      });
    });

    // Convert to array and sort by date
    const result = Object.keys(groups)
      .sort()
      .map(date => ({
        date,
        sessions: groups[date],
      }));

    console.log('[MySchedule] Grouped into', result.length, 'dates');
    return result;
  }, [myScheduleSessions]);

  const onRefresh = () => {
    console.log('[MySchedule] User initiated refresh');
    setRefreshing(true);
    loadData();
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = months[month];
    
    return `${monthName} ${day}, ${year}`;
  };

  const formatShortDate = (dateString: string): string => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = months[month];
    
    return `${monthName} ${day}`;
  };

  const handleSessionPress = (item: AgendaItem) => {
    console.log('[MySchedule] Session pressed:', item.Title);
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
    console.log('[MySchedule] Removing bookmark:', sessionId);
    const newBookmarks = new Set(bookmarkedSessions);
    newBookmarks.delete(sessionId);
    setBookmarkedSessions(newBookmarks);
    
    try {
      const bookmarksArray = Array.from(newBookmarks);
      await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarksArray));
      console.log('[MySchedule] Bookmark removed and saved');
    } catch (err: any) {
      console.log('[MySchedule] Storage unavailable, bookmark removal will not persist');
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
    const dateDisplay = formatDate(item.Date);
    const timeDisplay = item.EndTime 
      ? `${item.StartTime} - ${item.EndTime}`
      : item.StartTime;

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
          <Text style={styles.sessionDate}>{dateDisplay}</Text>
        </View>

        <View style={styles.sessionInfo}>
          <Text style={styles.sessionTime}>{timeDisplay}</Text>
        </View>

        {item.Room && (
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionRoom}>{item.Room}</Text>
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
              <Text style={[
                styles.trackBadgeText,
                { color: trackColor }
              ]}>
                {item.TypeTrack}
              </Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderDateSection = ({ item }: { item: GroupedSession }) => {
    const shortDate = formatShortDate(item.date);
    
    return (
      <View style={styles.dateSection}>
        <View style={styles.dateSectionHeader}>
          <Text style={styles.dateSectionTitle}>{shortDate}</Text>
          <View style={styles.dateSectionDivider} />
        </View>
        {item.sessions.map((session) => (
          <View key={session.id}>
            {renderSessionCard({ item: session })}
          </View>
        ))}
      </View>
    );
  };

  const renderHeader = () => (
    <>
      <NowNextSection />
      <WiFiBanner />
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>My Schedule</Text>
        <Text style={styles.headerSubtitle}>
          {myScheduleSessions.length} {myScheduleSessions.length === 1 ? 'session' : 'sessions'} saved
        </Text>
      </View>
    </>
  );

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'My Schedule',
          headerShown: true,
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
            <Text style={styles.loadingText}>Loading your schedule...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <IconSymbol
              ios_icon_name="exclamationmark.triangle.fill"
              android_material_icon_name="warning"
              size={48}
              color={colors.error}
            />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={loadData}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : myScheduleSessions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol
              ios_icon_name="bookmark"
              android_material_icon_name="bookmark-border"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyTitle}>No sessions saved yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap the bookmark icon on any session in the Agenda to add it to your schedule
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
            data={groupedSessions()}
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
  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 15,
    marginTop: 12,
    textAlign: 'center',
    color: colors.error,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.accent,
  },
  retryButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
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
  emptySubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  browseButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.accent,
  },
  browseButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 16,
  },
  dateSection: {
    marginBottom: 24,
  },
  dateSectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  dateSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  dateSectionDivider: {
    height: 2,
    backgroundColor: colors.border,
    borderRadius: 1,
  },
  sessionCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
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
