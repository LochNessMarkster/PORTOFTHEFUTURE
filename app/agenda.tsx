
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Stack, useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { fetchAgenda, AgendaItem } from '@/utils/airtable';
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
import { IconSymbol } from '@/components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BOOKMARKS_KEY = '@agenda_bookmarks';

// Track color mapping
const TRACK_COLORS: Record<string, string> = {
  'Port Security': '#FF5C7A',
  'Infrastructure': '#3B82F6',
  'Energy & Decarbonization': '#10B981',
  'Digital / AI': '#A855F7',
  'Emergency Management': '#F59E0B',
};

export default function AgendaScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  const [allSessions, setAllSessions] = useState<AgendaItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Day selector state - default to March 24
  const [selectedDay, setSelectedDay] = useState<'2026-03-23' | '2026-03-24' | '2026-03-25'>('2026-03-24');
  
  // Track filter state
  const [selectedTrack, setSelectedTrack] = useState<string>('All Tracks');
  const [showTrackDropdown, setShowTrackDropdown] = useState(false);
  
  // Bookmarks state
  const [bookmarkedSessions, setBookmarkedSessions] = useState<Set<string>>(new Set());

  // Cache timestamp
  const [cacheTimestamp, setCacheTimestamp] = useState<number>(0);
  const CACHE_DURATION = 60000; // 60 seconds

  // Load bookmarks from storage
  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    try {
      const stored = await AsyncStorage.getItem(BOOKMARKS_KEY);
      if (stored) {
        const bookmarks = JSON.parse(stored);
        setBookmarkedSessions(new Set(bookmarks));
        console.log('Loaded bookmarks:', bookmarks.length);
      }
    } catch (err) {
      console.error('Error loading bookmarks:', err);
    }
  };

  const saveBookmarks = async (bookmarks: Set<string>) => {
    try {
      await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(Array.from(bookmarks)));
      console.log('Saved bookmarks:', bookmarks.size);
    } catch (err) {
      console.error('Error saving bookmarks:', err);
    }
  };

  const toggleBookmark = (sessionId: string) => {
    console.log('Toggling bookmark for session:', sessionId);
    setBookmarkedSessions(prev => {
      const newBookmarks = new Set(prev);
      if (newBookmarks.has(sessionId)) {
        newBookmarks.delete(sessionId);
      } else {
        newBookmarks.add(sessionId);
      }
      saveBookmarks(newBookmarks);
      return newBookmarks;
    });
  };

  const loadAgenda = useCallback(async () => {
    console.log('[Agenda] Fetching agenda from backend...');
    
    // Check cache
    const now = Date.now();
    if (!refreshing && cacheTimestamp && (now - cacheTimestamp < CACHE_DURATION) && allSessions.length > 0) {
      console.log('[Agenda] Using cached data');
      return;
    }
    
    try {
      if (!refreshing) {
        setLoading(true);
      }
      setError(null);

      const data = await fetchAgenda();
      console.log('[Agenda] Received agenda:', data.agenda?.length || 0, 'sessions');
      console.log('[Agenda] Source:', data.source_used);

      // Filter to only March 23-25, 2026
      const filteredSessions = (data.agenda || []).filter(session => {
        const date = session.Date;
        return date === '2026-03-23' || date === '2026-03-24' || date === '2026-03-25';
      });

      console.log('[Agenda] Filtered to March 23-25:', filteredSessions.length, 'sessions');
      setAllSessions(filteredSessions);
      setCacheTimestamp(now);
    } catch (err) {
      console.error('[Agenda] Error fetching agenda:', err);
      setError('Unable to load agenda. Pull to refresh.');
      setAllSessions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing, cacheTimestamp, allSessions.length]);

  useEffect(() => {
    loadAgenda();
  }, []);

  // Get available tracks for the selected day
  const availableTracks = useMemo(() => {
    const tracksForDay = new Set<string>();
    allSessions.forEach(session => {
      if (session.Date === selectedDay && session.TypeTrack) {
        tracksForDay.add(session.TypeTrack);
      }
    });
    return ['All Tracks', ...Array.from(tracksForDay).sort()];
  }, [allSessions, selectedDay]);

  // Filter sessions by day, track, and search
  const filteredSessions = useMemo(() => {
    console.log('Filtering sessions - Day:', selectedDay, 'Track:', selectedTrack, 'Search:', searchQuery);
    
    let filtered = allSessions;
    
    // Filter by selected day
    filtered = filtered.filter(session => session.Date === selectedDay);
    
    // Filter by track
    if (selectedTrack !== 'All Tracks') {
      filtered = filtered.filter(session => session.TypeTrack === selectedTrack);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(session => {
        const titleMatch = session.Title?.toLowerCase().includes(query);
        const roomMatch = session.Room?.toLowerCase().includes(query);
        const typeMatch = session.TypeTrack?.toLowerCase().includes(query);
        const descMatch = session.SessionDescription?.toLowerCase().includes(query);
        const speakerMatch = Array.isArray(session.SpeakerNames)
          ? session.SpeakerNames.some(s => s.toLowerCase().includes(query))
          : session.SpeakerNames?.toLowerCase().includes(query);
        
        return titleMatch || roomMatch || typeMatch || descMatch || speakerMatch;
      });
    }

    // Sort by start time
    filtered.sort((a, b) => {
      const timeA = a.StartTime || '';
      const timeB = b.StartTime || '';
      return timeA.localeCompare(timeB);
    });

    console.log('Filtered sessions:', filtered.length);
    return filtered;
  }, [allSessions, selectedDay, selectedTrack, searchQuery]);

  const onRefresh = () => {
    console.log('[Agenda] User initiated refresh');
    setRefreshing(true);
    setCacheTimestamp(0); // Clear cache
    loadAgenda();
  };

  const handleSessionPress = (item: AgendaItem) => {
    console.log('Session pressed:', item.Title);
    router.push({
      pathname: '/agenda-detail',
      params: {
        id: item.id,
        title: item.Title || '',
        date: item.Date || '',
        startTime: item.StartTime || '',
        room: item.Room || '',
        typeTrack: item.TypeTrack || '',
        sessionDescription: item.SessionDescription || '',
        speakerNames: Array.isArray(item.SpeakerNames) 
          ? item.SpeakerNames.join(', ') 
          : item.SpeakerNames || '',
      },
    });
  };

  const getTrackColor = (track: string | undefined): string => {
    if (!track) return colors.textSecondary;
    return TRACK_COLORS[track] || colors.textSecondary;
  };

  const renderSessionCard = ({ item }: { item: AgendaItem }) => {
    const speakerDisplay = Array.isArray(item.SpeakerNames)
      ? item.SpeakerNames.join(', ')
      : item.SpeakerNames || '';
    
    const isBookmarked = bookmarkedSessions.has(item.id);
    const trackColor = getTrackColor(item.TypeTrack);
    const isSelectedTrack = selectedTrack !== 'All Tracks' && item.TypeTrack === selectedTrack;

    return (
      <TouchableOpacity
        style={styles.sessionCard}
        onPress={() => handleSessionPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.sessionTitle} numberOfLines={2}>
              {item.Title}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.bookmarkButton}
            onPress={() => toggleBookmark(item.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <IconSymbol
              ios_icon_name={isBookmarked ? "bookmark.fill" : "bookmark"}
              android_material_icon_name={isBookmarked ? "bookmark" : "bookmark-border"}
              size={24}
              color={isBookmarked ? colors.accent : colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.sessionInfo}>
          <Text style={styles.sessionTime}>
            {item.StartTime}
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
                backgroundColor: isSelectedTrack ? colors.accent : trackColor + '20',
                borderColor: isSelectedTrack ? colors.accent : trackColor,
              }
            ]}>
              <Text style={[
                styles.trackBadgeText,
                { color: isSelectedTrack ? colors.text : trackColor }
              ]}>
                {item.TypeTrack}
              </Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderTrackDropdown = () => (
    <Modal
      visible={showTrackDropdown}
      transparent
      animationType="fade"
      onRequestClose={() => setShowTrackDropdown(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowTrackDropdown(false)}
      >
        <View style={styles.dropdownContainer}>
          <View style={styles.dropdownHeader}>
            <Text style={styles.dropdownTitle}>Filter by Track / Type</Text>
            <TouchableOpacity onPress={() => setShowTrackDropdown(false)}>
              <IconSymbol
                ios_icon_name="xmark.circle.fill"
                android_material_icon_name="cancel"
                size={24}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.dropdownScroll}>
            {availableTracks.map((track, index) => {
              const isSelected = track === selectedTrack;
              const trackColor = getTrackColor(track === 'All Tracks' ? undefined : track);
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dropdownItem,
                    isSelected && styles.dropdownItemSelected
                  ]}
                  onPress={() => {
                    console.log('Selected track:', track);
                    setSelectedTrack(track);
                    setShowTrackDropdown(false);
                  }}
                >
                  <View style={styles.dropdownItemContent}>
                    {track !== 'All Tracks' && (
                      <View
                        style={[
                          styles.trackColorIndicator,
                          { backgroundColor: trackColor }
                        ]}
                      />
                    )}
                    <Text style={[
                      styles.dropdownItemText,
                      isSelected && styles.dropdownItemTextSelected
                    ]}>
                      {track}
                    </Text>
                  </View>
                  {isSelected && (
                    <IconSymbol
                      ios_icon_name="checkmark"
                      android_material_icon_name="check"
                      size={20}
                      color={colors.accent}
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

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: true,
          title: 'Agenda',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
        }} 
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <IconSymbol
              ios_icon_name="magnifyingglass"
              android_material_icon_name="search"
              size={20}
              color={colors.textSecondary}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search sessions..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <IconSymbol
                  ios_icon_name="xmark.circle.fill"
                  android_material_icon_name="cancel"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Day Selector */}
        <View style={styles.daySelectorContainer}>
          <TouchableOpacity
            style={[
              styles.dayButton,
              selectedDay === '2026-03-23' && styles.dayButtonSelected
            ]}
            onPress={() => {
              console.log('Selected day: March 23');
              setSelectedDay('2026-03-23');
              setSelectedTrack('All Tracks'); // Reset track filter when changing day
            }}
          >
            <Text style={[
              styles.dayButtonText,
              selectedDay === '2026-03-23' && styles.dayButtonTextSelected
            ]}>
              March 23
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.dayButton,
              selectedDay === '2026-03-24' && styles.dayButtonSelected
            ]}
            onPress={() => {
              console.log('Selected day: March 24');
              setSelectedDay('2026-03-24');
              setSelectedTrack('All Tracks');
            }}
          >
            <Text style={[
              styles.dayButtonText,
              selectedDay === '2026-03-24' && styles.dayButtonTextSelected
            ]}>
              March 24
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.dayButton,
              selectedDay === '2026-03-25' && styles.dayButtonSelected
            ]}
            onPress={() => {
              console.log('Selected day: March 25');
              setSelectedDay('2026-03-25');
              setSelectedTrack('All Tracks');
            }}
          >
            <Text style={[
              styles.dayButtonText,
              selectedDay === '2026-03-25' && styles.dayButtonTextSelected
            ]}>
              March 25
            </Text>
          </TouchableOpacity>
        </View>

        {/* Track Filter Dropdown */}
        <View style={styles.trackFilterContainer}>
          <TouchableOpacity
            style={styles.trackFilterButton}
            onPress={() => setShowTrackDropdown(true)}
          >
            <Text style={styles.trackFilterLabel}>Filter by Track / Type</Text>
            <View style={styles.trackFilterValueContainer}>
              <Text style={styles.trackFilterValue} numberOfLines={1}>
                {selectedTrack}
              </Text>
              <IconSymbol
                ios_icon_name="chevron.down"
                android_material_icon_name="arrow-drop-down"
                size={20}
                color={colors.textSecondary}
              />
            </View>
          </TouchableOpacity>
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.loadingText}>
              Loading agenda...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <IconSymbol
              ios_icon_name="exclamationmark.triangle.fill"
              android_material_icon_name="warning"
              size={48}
              color={colors.error}
            />
            <Text style={styles.errorText}>
              {error}
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={loadAgenda}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredSessions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol
              ios_icon_name="calendar"
              android_material_icon_name="calendar-today"
              size={48}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No sessions found' : 'No sessions for this day'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredSessions}
            keyExtractor={(item) => item.id}
            renderItem={renderSessionCard}
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

        {renderTrackDropdown()}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardAlt,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: colors.text,
  },
  daySelectorContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dayButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonSelected: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.textSecondary,
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  dayButtonTextSelected: {
    color: colors.text,
  },
  trackFilterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  trackFilterButton: {
    backgroundColor: colors.cardAlt,
    borderRadius: 12,
    padding: 12,
  },
  trackFilterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  trackFilterValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trackFilterValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
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
    padding: 24,
  },
  emptyText: {
    fontSize: 15,
    marginTop: 12,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  listContent: {
    padding: 16,
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
  sessionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 24,
  },
  bookmarkButton: {
    padding: 4,
  },
  sessionInfo: {
    marginBottom: 6,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    width: '85%',
    maxHeight: '70%',
    overflow: 'hidden',
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  dropdownScroll: {
    maxHeight: 400,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownItemSelected: {
    backgroundColor: colors.cardAlt,
  },
  dropdownItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  trackColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  dropdownItemText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  dropdownItemTextSelected: {
    fontWeight: '600',
  },
});
