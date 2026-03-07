
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
import { fetchAgenda, AgendaItem, normalizeToArray } from '@/utils/airtable';
import { colors } from '@/styles/commonStyles';

interface TimeGroup {
  timeKey: string;
  displayTime: string;
  sessions: AgendaItem[];
}

const BOOKMARKS_KEY = 'potf_bookmarked_sessions';

const TRACK_COLORS: Record<string, string> = {
  'Keynote': '#FF6B6B',
  'Panel': '#4ECDC4',
  'Workshop': '#45B7D1',
  'Networking': '#FFA07A',
  'Break': '#95E1D3',
  'default': colors.primary,
};

const TRACK_OPTIONS = [
  'All Tracks',
  'Keynote',
  'Panel',
  'Workshop',
  'Networking',
  'Break',
];

export default function AgendaScreen() {
  const [sessions, setSessions] = useState<AgendaItem[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrack, setSelectedTrack] = useState('All Tracks');
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [bookmarkedSessions, setBookmarkedSessions] = useState<Set<string>>(new Set());

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
        const bookmarks = JSON.parse(stored);
        setBookmarkedSessions(new Set(bookmarks));
        console.log('[Agenda] Loaded bookmarks:', bookmarks.length);
      }
    } catch (error) {
      console.error('[Agenda] Error loading bookmarks:', error);
    }
  }, []);

  const loadAgenda = useCallback(async () => {
    console.log('[Agenda] Loading agenda...');
    try {
      setLoading(true);
      const response = await fetchAgenda();
      
      console.log('[Agenda] Raw API response:', JSON.stringify(response).substring(0, 200));
      console.log('[Agenda] Response type:', typeof response);
      console.log('[Agenda] Is response an array?', Array.isArray(response));
      
      // Normalize the response to ensure we have an array
      let normalizedSessions: AgendaItem[] = [];
      
      if (Array.isArray(response)) {
        normalizedSessions = response;
        console.log('[Agenda] Response is already an array');
      } else if (response && typeof response === 'object' && 'agenda' in response) {
        const agendaData = (response as { agenda: unknown }).agenda;
        normalizedSessions = normalizeToArray<AgendaItem>(agendaData);
        console.log('[Agenda] Using response.agenda');
      } else if (response && typeof response === 'object' && 'data' in response) {
        const data = (response as { data: unknown }).data;
        normalizedSessions = normalizeToArray<AgendaItem>(data);
        console.log('[Agenda] Using response.data');
      } else {
        normalizedSessions = [];
        console.warn('[Agenda] Response format not recognized, using empty array');
      }
      
      console.log('[Agenda] Normalized sessions - Is array?', Array.isArray(normalizedSessions));
      console.log('[Agenda] Normalized sessions - Length:', normalizedSessions.length);
      
      if (normalizedSessions.length > 0) {
        console.log('[Agenda] First session:', JSON.stringify(normalizedSessions[0]));
      }
      
      setSessions(normalizedSessions);
      setFilteredSessions(normalizedSessions);
    } catch (error) {
      console.error('[Agenda] Error loading agenda:', error);
      setSessions([]);
      setFilteredSessions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadBookmarks();
    loadAgenda();
  }, [loadBookmarks, loadAgenda]);

  const filterAndGroupSessions = useCallback(() => {
    console.log('[Agenda] Filtering sessions. Total sessions:', sessions.length);
    console.log('[Agenda] Sessions is array?', Array.isArray(sessions));
    
    // Defensive check: ensure sessions is an array
    if (!Array.isArray(sessions)) {
      console.error('[Agenda] sessions is not an array!', typeof sessions);
      setFilteredSessions([]);
      return;
    }

    let filtered = [...sessions];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(session =>
        session.Title?.toLowerCase().includes(query) ||
        session.SessionDescription?.toLowerCase().includes(query) ||
        session.Room?.toLowerCase().includes(query)
      );
    }

    if (selectedTrack !== 'All Tracks') {
      filtered = filtered.filter(session => session.TypeTrack === selectedTrack);
    }

    console.log('[Agenda] Filtered sessions:', filtered.length);
    setFilteredSessions(filtered);
  }, [searchQuery, selectedTrack, sessions]);

  useEffect(() => {
    filterAndGroupSessions();
  }, [filterAndGroupSessions]);

  const timeGroups = useMemo(() => {
    console.log('[Agenda] Building time groups. Filtered sessions:', filteredSessions.length);
    console.log('[Agenda] Filtered sessions is array?', Array.isArray(filteredSessions));
    
    // Defensive check
    if (!Array.isArray(filteredSessions)) {
      console.error('[Agenda] filteredSessions is not an array!', typeof filteredSessions);
      return [];
    }

    const groups: Record<string, TimeGroup> = {};

    filteredSessions.forEach(session => {
      const timeKey = `${session.Date}_${session.StartTime}`;
      if (!groups[timeKey]) {
        groups[timeKey] = {
          timeKey,
          displayTime: session.StartTime || '',
          sessions: [],
        };
      }
      groups[timeKey].sessions.push(session);
    });

    const groupArray = Object.values(groups);
    console.log('[Agenda] Time groups created:', groupArray.length);
    return groupArray;
  }, [filteredSessions]);

  const handleSessionPress = (item: AgendaItem) => {
    console.log('[Agenda] Session pressed:', item.Title);
    router.push({
      pathname: '/agenda-detail',
      params: {
        sessionId: item.id,
      },
    });
  };

  const getTrackColor = (track: string | undefined): string => {
    if (!track) return TRACK_COLORS.default;
    return TRACK_COLORS[track] || TRACK_COLORS.default;
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  };

  const renderSessionCard = (item: AgendaItem) => {
    const trackColor = getTrackColor(item.TypeTrack);
    const isBookmarked = bookmarkedSessions.has(item.id);
    const status = getSessionStatus(item.Date, item.StartTime, item.EndTime);
    const isPast = status === 'past';

    const sessionTitle = item.Title || 'Untitled Session';
    const sessionRoom = item.Room || '';
    const sessionTrack = item.TypeTrack || '';
    const sessionTime = item.StartTime || '';

    return (
      <TouchableOpacity
        style={[
          styles.sessionCard,
          { backgroundColor: cardBg, borderColor: borderColorValue },
          isPast && styles.pastSession,
        ]}
        onPress={() => handleSessionPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.sessionHeader}>
          <View style={[styles.trackBadge, { backgroundColor: trackColor + '20' }]}>
            <Text style={[styles.trackText, { color: trackColor }]}>
              {sessionTrack}
            </Text>
          </View>
          {isBookmarked && (
            <IconSymbol
              ios_icon_name="bookmark.fill"
              android_material_icon_name="bookmark"
              size={20}
              color={colors.primary}
            />
          )}
          {isPast && (
            <View style={[styles.completedBadge, { backgroundColor: secondaryTextColor + '20' }]}>
              <Text style={[styles.completedText, { color: secondaryTextColor }]}>
                Completed
              </Text>
            </View>
          )}
        </View>

        <Text
          style={[
            styles.sessionTitle,
            { color: textColor },
            isPast && { color: secondaryTextColor },
          ]}
          numberOfLines={2}
        >
          {sessionTitle}
        </Text>

        <View style={styles.sessionMeta}>
          <View style={styles.metaRow}>
            <IconSymbol
              ios_icon_name="clock"
              android_material_icon_name="access-time"
              size={14}
              color={secondaryTextColor}
            />
            <Text style={[styles.metaText, { color: secondaryTextColor }]}>
              {sessionTime}
            </Text>
          </View>
          {sessionRoom && (
            <View style={styles.metaRow}>
              <IconSymbol
                ios_icon_name="location.fill"
                android_material_icon_name="place"
                size={14}
                color={secondaryTextColor}
              />
              <Text style={[styles.metaText, { color: secondaryTextColor }]}>
                {sessionRoom}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderTimeGroup = ({ item }: { item: TimeGroup }) => {
    const displayTime = item.displayTime;
    const sessionsInGroup = item.sessions;

    return (
      <View style={styles.timeGroupContainer}>
        <View style={[styles.timeHeader, { backgroundColor: isDark ? colors.cardDark : colors.card }]}>
          <Text style={[styles.timeHeaderText, { color: textColor }]}>
            {displayTime}
          </Text>
        </View>
        {sessionsInGroup.map((session, index) => (
          <View key={`${session.id}-${index}`}>
            {renderSessionCard(session)}
          </View>
        ))}
      </View>
    );
  };

  const renderTrackDropdown = () => {
    return (
      <Modal
        visible={showTrackModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTrackModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTrackModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>
              Select Track
            </Text>
            <ScrollView style={styles.trackList}>
              {TRACK_OPTIONS.map((track) => {
                const isSelected = selectedTrack === track;
                return (
                  <TouchableOpacity
                    key={track}
                    style={[
                      styles.trackOption,
                      isSelected && { backgroundColor: colors.primary + '20' },
                    ]}
                    onPress={() => {
                      setSelectedTrack(track);
                      setShowTrackModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.trackOptionText,
                        { color: isSelected ? colors.primary : textColor },
                      ]}
                    >
                      {track}
                    </Text>
                    {isSelected && (
                      <IconSymbol
                        ios_icon_name="checkmark"
                        android_material_icon_name="check"
                        size={20}
                        color={colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
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
            onPress={() => setShowTrackModal(true)}
          >
            <IconSymbol
              ios_icon_name="line.3.horizontal.decrease.circle"
              android_material_icon_name="filter-list"
              size={20}
              color={textColor}
            />
            <Text style={[styles.filterButtonText, { color: textColor }]}>
              {selectedTrack}
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: secondaryTextColor }]}>
              Loading agenda...
            </Text>
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
                onRefresh={() => {
                  setRefreshing(true);
                  loadAgenda();
                }}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
          />
        )}

        {renderTrackDropdown()}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  searchBar: {
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
    justifyContent: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    gap: 8,
  },
  filterButtonText: {
    fontSize: 15,
    fontWeight: '600',
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  timeHeaderText: {
    fontSize: 16,
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
  pastSession: {
    opacity: 0.6,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  trackBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  trackText: {
    fontSize: 12,
    fontWeight: '600',
  },
  completedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  completedText: {
    fontSize: 11,
    fontWeight: '600',
  },
  sessionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 8,
  },
  sessionMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxHeight: '60%',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  trackList: {
    maxHeight: 300,
  },
  trackOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  trackOptionText: {
    fontSize: 16,
  },
});
