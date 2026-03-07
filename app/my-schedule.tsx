
import { IconSymbol } from '@/components/IconSymbol';
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
import { NowNextSection } from '@/components/NowNextSection';
import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getSessionStatus } from '@/utils/timeUtils';
import { fetchAgenda, AgendaItem } from '@/utils/airtable';
import { colors } from '@/styles/commonStyles';
import { WiFiBanner } from '@/components/WiFiBanner';

interface GroupedSession {
  date: string;
  sessions: AgendaItem[];
}

const BOOKMARKS_KEY = 'potf_bookmarks';

const TRACK_COLORS: Record<string, string> = {
  'Keynote': '#FF6B6B',
  'Technical': '#4ECDC4',
  'Business': '#45B7D1',
  'Workshop': '#FFA07A',
  'Panel': '#98D8C8',
  'Networking': '#F7DC6F',
  'default': '#95A5A6',
};

export default function MyScheduleScreen() {
  const [bookmarkedSessions, setBookmarkedSessions] = useState<AgendaItem[]>([]);
  const [groupedSessions, setGroupedSessions] = useState<GroupedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const secondaryTextColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardBg = isDark ? colors.cardDark : colors.card;
  const borderColorValue = isDark ? colors.borderDark : colors.border;

  const loadData = useCallback(async () => {
    console.log('[MySchedule] Loading bookmarked sessions...');
    try {
      setLoading(true);
      const bookmarks = await loadBookmarks();
      const sessions = await loadSessions(bookmarks);
      setBookmarkedSessions(sessions);

      const grouped = sessions.reduce((acc, session) => {
        const existing = acc.find(g => g.date === session.date);
        if (existing) {
          existing.sessions.push(session);
        } else {
          acc.push({ date: session.date, sessions: [session] });
        }
        return acc;
      }, [] as GroupedSession[]);

      grouped.forEach(group => {
        group.sessions.sort((a, b) => {
          const timeA = new Date(`${a.date} ${a.start_time}`).getTime();
          const timeB = new Date(`${b.date} ${b.start_time}`).getTime();
          return timeA - timeB;
        });
      });

      grouped.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateA - dateB;
      });

      setGroupedSessions(grouped);
    } catch (error) {
      console.error('[MySchedule] Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadBookmarks = async (): Promise<Set<string>> => {
    try {
      const stored = await AsyncStorage.getItem(BOOKMARKS_KEY);
      if (stored) {
        return new Set(JSON.parse(stored));
      }
    } catch (error) {
      console.log('[MySchedule] Could not load bookmarks');
    }
    return new Set();
  };

  const loadSessions = async (bookmarks: Set<string>): Promise<AgendaItem[]> => {
    const allSessions = await fetchAgenda();
    return allSessions.filter(session => bookmarks.has(session.id));
  };

  const onRefresh = useCallback(async () => {
    console.log('[MySchedule] User triggered refresh');
    setRefreshing(true);
    await loadData();
  }, [loadData]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  };

  const formatShortDate = (dateString: string): string => {
    const date = new Date(dateString);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    return `${month} ${day}`;
  };

  const handleSessionPress = (item: AgendaItem) => {
    console.log('[MySchedule] Session pressed:', item.title);
    router.push({
      pathname: '/agenda-detail',
      params: { sessionId: item.id },
    });
  };

  const removeBookmark = async (sessionId: string) => {
    console.log('[MySchedule] Removing bookmark:', sessionId);
    try {
      const bookmarks = await loadBookmarks();
      bookmarks.delete(sessionId);
      await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(Array.from(bookmarks)));
      await loadData();
    } catch (error) {
      console.log('[MySchedule] Could not remove bookmark');
    }
  };

  const getTrackColor = (track: string | undefined): string => {
    if (!track) return TRACK_COLORS.default;
    return TRACK_COLORS[track] || TRACK_COLORS.default;
  };

  const renderSessionCard = ({ item }: { item: AgendaItem }) => {
    const trackColor = getTrackColor(item.track);
    const status = getSessionStatus(item.start_time, item.date);
    const isPast = status === 'past';
    const cardOpacity = isPast ? 0.6 : 1;

    return (
      <TouchableOpacity
        style={[
          styles.sessionCard,
          { backgroundColor: cardBg, borderColor: borderColorValue, opacity: cardOpacity },
        ]}
        onPress={() => handleSessionPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.sessionHeader}>
          <View style={styles.sessionTitleRow}>
            <View style={styles.sessionTitleContainer}>
              <Text style={[styles.sessionTime, { color: colors.primary }]}>
                {item.start_time}
              </Text>
              <Text style={[styles.sessionTitle, { color: textColor }]} numberOfLines={2}>
                {item.title}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => removeBookmark(item.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <IconSymbol
                ios_icon_name="bookmark.fill"
                android_material_icon_name="bookmark"
                size={24}
                color={colors.accent}
              />
            </TouchableOpacity>
          </View>

          {item.track && (
            <View style={[styles.trackBadge, { backgroundColor: trackColor + '20' }]}>
              <Text style={[styles.trackText, { color: trackColor }]}>{item.track}</Text>
            </View>
          )}
        </View>

        {item.speaker && (
          <View style={styles.sessionMeta}>
            <IconSymbol
              ios_icon_name="person.fill"
              android_material_icon_name="person"
              size={14}
              color={secondaryTextColor}
            />
            <Text style={[styles.metaText, { color: secondaryTextColor }]}>{item.speaker}</Text>
          </View>
        )}

        {item.location && (
          <View style={styles.sessionMeta}>
            <IconSymbol
              ios_icon_name="location.fill"
              android_material_icon_name="location-on"
              size={14}
              color={secondaryTextColor}
            />
            <Text style={[styles.metaText, { color: secondaryTextColor }]}>{item.location}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderDateSection = ({ item }: { item: GroupedSession }) => {
    const formattedDate = formatDate(item.date);
    const shortDate = formatShortDate(item.date);

    return (
      <View key={item.date} style={styles.dateSection}>
        <View style={styles.dateStickyHeader}>
          <Text style={[styles.dateHeaderText, { color: colors.primary }]}>{shortDate}</Text>
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
        <WiFiBanner networkName="UH Guest" />
        <NowNextSection sessions={bookmarkedSessions} />
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
            backgroundColor: isDark ? colors.backgroundDark : colors.background,
          },
          headerTintColor: textColor,
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]} edges={['bottom']}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: secondaryTextColor }]}>Loading your schedule...</Text>
          </View>
        ) : bookmarkedSessions.length === 0 ? (
          <View style={styles.centerContainer}>
            <IconSymbol
              ios_icon_name="bookmark"
              android_material_icon_name="bookmark-border"
              size={64}
              color={secondaryTextColor}
            />
            <Text style={[styles.emptyTitle, { color: textColor }]}>No Sessions Bookmarked</Text>
            <Text style={[styles.emptyText, { color: secondaryTextColor }]}>
              Browse the agenda and bookmark sessions you want to attend.
            </Text>
            <TouchableOpacity
              style={[styles.browseButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/agenda')}
            >
              <Text style={styles.browseButtonText}>Browse Agenda</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={groupedSessions}
            renderItem={renderDateSection}
            keyExtractor={(item) => item.date}
            ListHeaderComponent={renderHeader}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
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
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  browseButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  dateSection: {
    marginBottom: 24,
  },
  dateStickyHeader: {
    paddingVertical: 8,
    marginBottom: 12,
  },
  dateHeaderText: {
    fontSize: 18,
    fontWeight: '700',
  },
  sessionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionHeader: {
    marginBottom: 8,
  },
  sessionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  sessionTitleContainer: {
    flex: 1,
    marginRight: 8,
  },
  sessionTime: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  sessionTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  trackBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  trackText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  metaText: {
    fontSize: 14,
    marginLeft: 6,
  },
});
