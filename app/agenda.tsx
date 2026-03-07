
import { getSessionStatus, hasSameStartTime } from '@/utils/timeUtils';
import { ConflictModal } from '@/components/ConflictModal';
import { IconSymbol } from '@/components/IconSymbol';
import { Stack, useRouter } from 'expo-router';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  useColorScheme,
  RefreshControl,
  Modal,
  ScrollView,
} from 'react-native';
import { fetchAgenda, AgendaItem } from '@/utils/airtable';
import { colors } from '@/styles/commonStyles';

interface TimeGroup {
  timeKey: string;
  displayTime: string;
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

const TRACK_OPTIONS = [
  'All Tracks',
  'Keynote',
  'Technical',
  'Business',
  'Workshop',
  'Panel',
  'Networking',
];

export default function AgendaScreen() {
  const [sessions, setSessions] = useState<AgendaItem[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<AgendaItem[]>([]);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrack, setSelectedTrack] = useState('All Tracks');
  const [showTrackDropdown, setShowTrackDropdown] = useState(false);
  const [conflictSession, setConflictSession] = useState<AgendaItem | null>(null);
  const [conflictingWith, setConflictingWith] = useState<AgendaItem | null>(null);

  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const secondaryTextColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardBg = isDark ? colors.cardDark : colors.card;
  const borderColorValue = isDark ? colors.borderDark : colors.border;

  const loadBookmarks = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(BOOKMARKS_KEY);
      if (stored) {
        setBookmarks(new Set(JSON.parse(stored)));
      }
    } catch (error) {
      console.log('[Agenda] Could not load bookmarks');
      setBookmarks(new Set());
    }
  }, []);

  const saveBookmarks = useCallback(async (bookmarks: Set<string>) => {
    try {
      await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(Array.from(bookmarks)));
    } catch (error) {
      console.log('[Agenda] Could not save bookmarks');
    }
  }, []);

  const checkForConflicts = useCallback((session: AgendaItem): AgendaItem | null => {
    for (const bookmarkedId of bookmarks) {
      const bookmarkedSession = sessions.find(s => s.id === bookmarkedId);
      if (bookmarkedSession && bookmarkedSession.id !== session.id) {
        if (hasSameStartTime(session, bookmarkedSession)) {
          return bookmarkedSession;
        }
      }
    }
    return null;
  }, [bookmarks, sessions]);

  const toggleBookmark = useCallback((sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    if (bookmarks.has(sessionId)) {
      const newBookmarks = new Set(bookmarks);
      newBookmarks.delete(sessionId);
      setBookmarks(newBookmarks);
      saveBookmarks(newBookmarks);
    } else {
      const conflict = checkForConflicts(session);
      if (conflict) {
        setConflictSession(session);
        setConflictingWith(conflict);
      } else {
        const newBookmarks = new Set(bookmarks);
        newBookmarks.add(sessionId);
        setBookmarks(newBookmarks);
        saveBookmarks(newBookmarks);
      }
    }
  }, [bookmarks, sessions, checkForConflicts, saveBookmarks]);

  const handleKeepBoth = useCallback(() => {
    if (conflictSession) {
      const newBookmarks = new Set(bookmarks);
      newBookmarks.add(conflictSession.id);
      setBookmarks(newBookmarks);
      saveBookmarks(newBookmarks);
    }
    setConflictSession(null);
    setConflictingWith(null);
  }, [conflictSession, bookmarks, saveBookmarks]);

  const handleCancel = useCallback(() => {
    setConflictSession(null);
    setConflictingWith(null);
  }, []);

  const handleReplace = useCallback(() => {
    if (conflictSession && conflictingWith) {
      const newBookmarks = new Set(bookmarks);
      newBookmarks.delete(conflictingWith.id);
      newBookmarks.add(conflictSession.id);
      setBookmarks(newBookmarks);
      saveBookmarks(newBookmarks);
    }
    setConflictSession(null);
    setConflictingWith(null);
  }, [conflictSession, conflictingWith, bookmarks, saveBookmarks]);

  const isPastSession = useCallback((sessionStartTime: string, sessionDate: string): boolean => {
    const status = getSessionStatus(sessionStartTime, sessionDate);
    return status === 'past';
  }, []);

  useEffect(() => {
    const loadData = async () => {
      console.log('[Agenda] Loading agenda data...');
      try {
        setLoading(true);
        await loadBookmarks();
        const agendaData = await fetchAgenda();
        console.log('[Agenda] Loaded sessions:', agendaData.length);
        setSessions(agendaData);
        setFilteredSessions(agendaData);
      } catch (error) {
        console.error('[Agenda] Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [loadBookmarks]);

  const onRefresh = useCallback(async () => {
    console.log('[Agenda] User triggered refresh');
    setRefreshing(true);
    try {
      const agendaData = await fetchAgenda();
      setSessions(agendaData);
      setFilteredSessions(agendaData);
    } catch (error) {
      console.error('[Agenda] Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let filtered = sessions;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(session =>
        session.title.toLowerCase().includes(query) ||
        session.description?.toLowerCase().includes(query) ||
        session.speaker?.toLowerCase().includes(query) ||
        session.location?.toLowerCase().includes(query)
      );
    }

    if (selectedTrack !== 'All Tracks') {
      filtered = filtered.filter(session => session.track === selectedTrack);
    }

    setFilteredSessions(filtered);
  }, [searchQuery, selectedTrack, sessions]);

  const handleSessionPress = (item: AgendaItem) => {
    console.log('[Agenda] Session pressed:', item.title);
    router.push({
      pathname: '/agenda-detail',
      params: { sessionId: item.id },
    });
  };

  const getTrackColor = (track: string | undefined): string => {
    if (!track) return TRACK_COLORS.default;
    return TRACK_COLORS[track] || TRACK_COLORS.default;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  };

  const timeGroups = useMemo(() => {
    const groups: Record<string, TimeGroup> = {};

    filteredSessions.forEach(session => {
      const timeKey = `${session.date}_${session.start_time}`;
      if (!groups[timeKey]) {
        groups[timeKey] = {
          timeKey,
          displayTime: session.start_time,
          sessions: [],
        };
      }
      groups[timeKey].sessions.push(session);
    });

    const sortedGroups = Object.values(groups).sort((a, b) => {
      const dateA = new Date(a.sessions[0].date + ' ' + a.displayTime);
      const dateB = new Date(b.sessions[0].date + ' ' + b.displayTime);
      return dateA.getTime() - dateB.getTime();
    });

    return sortedGroups;
  }, [filteredSessions]);

  const renderSessionCard = (item: AgendaItem) => {
    const isBookmarked = bookmarks.has(item.id);
    const trackColor = getTrackColor(item.track);
    const isPast = isPastSession(item.start_time, item.date);
    const cardOpacity = isPast ? 0.6 : 1;

    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.sessionCard,
          { backgroundColor: cardBg, borderColor: borderColorValue, opacity: cardOpacity },
        ]}
        onPress={() => handleSessionPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.sessionHeader}>
          <View style={styles.sessionTitleRow}>
            <Text style={[styles.sessionTitle, { color: textColor }]} numberOfLines={2}>
              {item.title}
            </Text>
            <TouchableOpacity
              onPress={() => toggleBookmark(item.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <IconSymbol
                ios_icon_name={isBookmarked ? 'bookmark.fill' : 'bookmark'}
                android_material_icon_name={isBookmarked ? 'bookmark' : 'bookmark-border'}
                size={24}
                color={isBookmarked ? colors.accent : secondaryTextColor}
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

        {item.description && (
          <Text style={[styles.sessionDescription, { color: secondaryTextColor }]} numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderTimeGroup = ({ item }: { item: TimeGroup }) => {
    const firstSession = item.sessions[0];
    const formattedDate = formatDate(firstSession.date);

    return (
      <View key={item.timeKey} style={styles.timeGroupContainer}>
        <View style={styles.timeHeader}>
          <Text style={[styles.timeText, { color: colors.primary }]}>{item.displayTime}</Text>
          <Text style={[styles.dateText, { color: secondaryTextColor }]}>{formattedDate}</Text>
        </View>
        {item.sessions.map(session => renderSessionCard(session))}
      </View>
    );
  };

  const renderTrackDropdown = () => {
    if (!showTrackDropdown) return null;

    return (
      <Modal
        visible={showTrackDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTrackDropdown(false)}
      >
        <TouchableOpacity
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => setShowTrackDropdown(false)}
        >
          <View style={[styles.dropdownContent, { backgroundColor: cardBg }]}>
            <ScrollView>
              {TRACK_OPTIONS.map((track) => (
                <TouchableOpacity
                  key={track}
                  style={[
                    styles.dropdownItem,
                    selectedTrack === track && { backgroundColor: colors.primary + '10' },
                  ]}
                  onPress={() => {
                    setSelectedTrack(track);
                    setShowTrackDropdown(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      { color: selectedTrack === track ? colors.primary : textColor },
                    ]}
                  >
                    {track}
                  </Text>
                  {selectedTrack === track && (
                    <IconSymbol
                      ios_icon_name="checkmark"
                      android_material_icon_name="check"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Agenda',
          headerStyle: {
            backgroundColor: isDark ? colors.backgroundDark : colors.background,
          },
          headerTintColor: textColor,
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]} edges={['bottom']}>
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: cardBg, borderColor: borderColorValue }]}>
            <IconSymbol
              ios_icon_name="magnifyingglass"
              android_material_icon_name="search"
              size={20}
              color={secondaryTextColor}
            />
            <TextInput
              style={[styles.searchInput, { color: textColor }]}
              placeholder="Search sessions..."
              placeholderTextColor={secondaryTextColor}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <IconSymbol
                  ios_icon_name="xmark.circle.fill"
                  android_material_icon_name="cancel"
                  size={20}
                  color={secondaryTextColor}
                />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.filterButton, { backgroundColor: cardBg, borderColor: borderColorValue }]}
            onPress={() => setShowTrackDropdown(true)}
          >
            <IconSymbol
              ios_icon_name="line.3.horizontal.decrease.circle"
              android_material_icon_name="filter-list"
              size={20}
              color={colors.primary}
            />
            <Text style={[styles.filterButtonText, { color: textColor }]} numberOfLines={1}>
              {selectedTrack}
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: secondaryTextColor }]}>Loading agenda...</Text>
          </View>
        ) : timeGroups.length === 0 ? (
          <View style={styles.centerContainer}>
            <IconSymbol
              ios_icon_name="calendar.badge.exclamationmark"
              android_material_icon_name="event-busy"
              size={48}
              color={secondaryTextColor}
            />
            <Text style={[styles.emptyText, { color: secondaryTextColor }]}>
              {searchQuery || selectedTrack !== 'All Tracks'
                ? 'No sessions match your filters'
                : 'No sessions available'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={timeGroups}
            renderItem={renderTimeGroup}
            keyExtractor={(item) => item.timeKey}
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

        {renderTrackDropdown()}

        <ConflictModal
          visible={!!conflictSession}
          newSession={conflictSession}
          conflictingSession={conflictingWith}
          onKeepBoth={handleKeepBoth}
          onReplace={handleReplace}
          onCancel={handleCancel}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    minWidth: 100,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
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
  emptyText: {
    fontSize: 15,
    marginTop: 12,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
  timeGroupContainer: {
    marginBottom: 24,
  },
  timeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timeText: {
    fontSize: 18,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
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
  sessionTitle: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
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
  sessionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dropdownContent: {
    borderRadius: 12,
    width: '100%',
    maxWidth: 300,
    maxHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '30',
  },
  dropdownItemText: {
    fontSize: 16,
    flex: 1,
  },
});
