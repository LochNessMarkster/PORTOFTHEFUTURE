
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
import { getSessionStatus, sessionsOverlap } from '@/utils/timeUtils';
import { ConflictModal } from '@/components/ConflictModal';

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

// Predefined track/type options
const TRACK_OPTIONS = [
  'All Tracks',
  'Track 1 - Ensuring America\'s Maritime Security',
  'Track 2 - Developing Ports',
  'Track 3 - Intermodal Connectivity',
  'Track 4 - Enhancing Ports\' Operational Efficiencies',
  'Track 5 - Port Infrastructure 4.0',
  'Track 6 - Decarbonization and Alternative Fuels',
  'Track 7 - Port Energy and Sustainability',
  'Track 8 - Port Security, Cybersecurity, & Emergency Management',
  'Track 9 - Advances in Dredging Technology and Methods',
  'Special Event',
  'Pre-Conference / Social',
  'Keynote & Plenary',
  'Break',
  'Luncheon (By Invitation)',
  'Pre-Conference',
];

export default function AgendaScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  const [allSessions, setAllSessions] = useState<AgendaItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Day selector state - default to 'All'
  const [selectedDay, setSelectedDay] = useState<'All' | '2026-03-23' | '2026-03-24' | '2026-03-25'>('All');
  
  // Track filter state
  const [selectedTrack, setSelectedTrack] = useState<string>('All Tracks');
  const [showTrackDropdown, setShowTrackDropdown] = useState(false);
  
  // Bookmarks state
  const [bookmarkedSessions, setBookmarkedSessions] = useState<Set<string>>(new Set());

  // Conflict modal state
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [pendingSession, setPendingSession] = useState<AgendaItem | null>(null);
  const [conflictingSession, setConflictingSession] = useState<AgendaItem | null>(null);

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

  const checkForConflicts = (session: AgendaItem): AgendaItem | null => {
    if (!session.EndTime) return null;
    
    // Find all bookmarked sessions
    const bookmarkedSessionsList = allSessions.filter(s => 
      bookmarkedSessions.has(s.id) && s.id !== session.id
    );
    
    // Check for overlaps
    for (const existing of bookmarkedSessionsList) {
      if (!existing.EndTime) continue;
      
      if (sessionsOverlap(
        session.Date,
        session.StartTime,
        session.EndTime,
        existing.Date,
        existing.StartTime,
        existing.EndTime
      )) {
        console.log('Conflict detected:', session.Title, 'overlaps with', existing.Title);
        return existing;
      }
    }
    
    return null;
  };

  const toggleBookmark = (sessionId: string) => {
    console.log('Toggling bookmark for session:', sessionId);
    
    const session = allSessions.find(s => s.id === sessionId);
    if (!session) return;
    
    // If already bookmarked, just remove it
    if (bookmarkedSessions.has(sessionId)) {
      const newBookmarks = new Set(bookmarkedSessions);
      newBookmarks.delete(sessionId);
      setBookmarkedSessions(newBookmarks);
      saveBookmarks(newBookmarks);
      return;
    }
    
    // Check for conflicts
    const conflict = checkForConflicts(session);
    
    if (conflict) {
      // Show conflict modal
      setPendingSession(session);
      setConflictingSession(conflict);
      setShowConflictModal(true);
    } else {
      // No conflict, add bookmark
      const newBookmarks = new Set(bookmarkedSessions);
      newBookmarks.add(sessionId);
      setBookmarkedSessions(newBookmarks);
      saveBookmarks(newBookmarks);
    }
  };

  const handleKeepBoth = () => {
    if (!pendingSession) return;
    
    console.log('User chose to keep both sessions');
    const newBookmarks = new Set(bookmarkedSessions);
    newBookmarks.add(pendingSession.id);
    setBookmarkedSessions(newBookmarks);
    saveBookmarks(newBookmarks);
    
    setShowConflictModal(false);
    setPendingSession(null);
    setConflictingSession(null);
  };

  const handleCancel = () => {
    console.log('User cancelled bookmark');
    setShowConflictModal(false);
    setPendingSession(null);
    setConflictingSession(null);
  };

  const handleReplace = () => {
    if (!pendingSession || !conflictingSession) return;
    
    console.log('User chose to replace existing session');
    const newBookmarks = new Set(bookmarkedSessions);
    newBookmarks.delete(conflictingSession.id);
    newBookmarks.add(pendingSession.id);
    setBookmarkedSessions(newBookmarks);
    saveBookmarks(newBookmarks);
    
    setShowConflictModal(false);
    setPendingSession(null);
    setConflictingSession(null);
  };

  const loadAgenda = useCallback(async () => {
    console.log('[Agenda] Loading agenda...');
    
    // Check cache
    const now = Date.now();
    if (!refreshing && cacheTimestamp && (now - cacheTimestamp < CACHE_DURATION) && allSessions.length > 0) {
      console.log('[Agenda] Using cached data, sessions:', allSessions.length);
      return;
    }
    
    try {
      if (!refreshing) {
        setLoading(true);
      }
      setError(null);

      // fetchAgenda handles: pagination (all 100+ records), date filtering (Mar 23-25),
      // speaker name validation, and sorting (Date → StartTime → Title)
      const data = await fetchAgenda();

      console.log('[Agenda] Sessions loaded:', data.agenda?.length || 0);
      console.log('[Agenda] Source:', data.source_used);
      console.log('[Agenda] Updated at:', data.updated_at);
      
      // Log sample session to verify field mapping
      if (data.agenda && data.agenda.length > 0) {
        const sample = data.agenda[0];
        console.log('[Agenda] Sample session field mapping:', {
          id: sample.id,
          Title: sample.Title,
          Date: sample.Date,
          StartTime: sample.StartTime,
          EndTime: sample.EndTime,
          Room: sample.Room,
          TypeTrack: sample.TypeTrack,
          SpeakerNames: sample.SpeakerNames,
          hasDescription: !!sample.SessionDescription,
        });
      }
      
      setAllSessions(data.agenda || []);
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

  // Filter sessions by day, track, and search
  // Note: allSessions is already sorted by Date → StartTime → Title from fetchAgenda()
  const filteredSessions = useMemo(() => {
    console.log('[Agenda] Filtering - Day:', selectedDay, 'Track:', selectedTrack, 'Search:', searchQuery);
    
    let filtered = allSessions;
    
    // Filter by selected day (if not 'All')
    if (selectedDay !== 'All') {
      filtered = filtered.filter(session => session.Date === selectedDay);
    }
    
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

    // Order is preserved from fetchAgenda() sort: Date → StartTime → Title
    console.log('[Agenda] Filtered sessions for display:', filtered.length);
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

  const getTrackColor = (track: string | undefined): string => {
    if (!track) return colors.textSecondary;
    return TRACK_COLORS[track] || colors.textSecondary;
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  };

  const renderSessionCard = ({ item }: { item: AgendaItem }) => {
    const speakerDisplay = Array.isArray(item.SpeakerNames)
      ? item.SpeakerNames.join(', ')
      : item.SpeakerNames || '';
    
    const isBookmarked = bookmarkedSessions.has(item.id);
    const trackColor = getTrackColor(item.TypeTrack);
    const isSelectedTrack = selectedTrack !== 'All Tracks' && item.TypeTrack === selectedTrack;

    // Format date and time display
    const dateDisplay = formatDate(item.Date);
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
            {TRACK_OPTIONS.map((track, index) => {
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
                  {track !== 'All Tracks' ? (
                    <View style={[
                      styles.dropdownTrackBadge,
                      { 
                        backgroundColor: trackColor + '20',
                        borderColor: trackColor,
                      }
                    ]}>
                      <Text style={[
                        styles.dropdownTrackBadgeText,
                        { color: trackColor }
                      ]}>
                        {track}
                      </Text>
                    </View>
                  ) : (
                    <Text style={[
                      styles.dropdownItemText,
                      isSelected && styles.dropdownItemTextSelected
                    ]}>
                      {track}
                    </Text>
                  )}
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
              selectedDay === 'All' && styles.dayButtonSelected
            ]}
            onPress={() => {
              console.log('Selected day: All');
              setSelectedDay('All');
            }}
          >
            <Text style={[
              styles.dayButtonText,
              selectedDay === 'All' && styles.dayButtonTextSelected
            ]}>
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.dayButton,
              selectedDay === '2026-03-23' && styles.dayButtonSelected
            ]}
            onPress={() => {
              console.log('Selected day: March 23');
              setSelectedDay('2026-03-23');
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
              {searchQuery ? 'No sessions found' : 'No sessions match the selected filters'}
            </Text>
            {!searchQuery && (
              <Text style={styles.emptySubtext}>
                Total sessions loaded: {allSessions.length}
              </Text>
            )}
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

        {/* Conflict Modal */}
        {pendingSession && conflictingSession && (
          <ConflictModal
            visible={showConflictModal}
            newSession={{
              id: pendingSession.id,
              title: pendingSession.Title,
              date: pendingSession.Date,
              startTime: pendingSession.StartTime,
              endTime: pendingSession.EndTime || '',
              room: pendingSession.Room || '',
            }}
            existingSession={{
              id: conflictingSession.id,
              title: conflictingSession.Title,
              date: conflictingSession.Date,
              startTime: conflictingSession.StartTime,
              endTime: conflictingSession.EndTime || '',
              room: conflictingSession.Room || '',
            }}
            onKeepBoth={handleKeepBoth}
            onCancel={handleCancel}
            onReplace={handleReplace}
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
    paddingHorizontal: 8,
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
  emptySubtext: {
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
    color: colors.textMuted,
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
  bookmarkButton: {
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
  dropdownTrackBadge: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  dropdownTrackBadgeText: {
    fontSize: 14,
    fontWeight: '700',
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
