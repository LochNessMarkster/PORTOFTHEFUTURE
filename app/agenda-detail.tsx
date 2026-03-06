
import React, { useState, useEffect } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  TouchableOpacity,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchAgenda, AgendaItem } from '@/utils/airtable';
import { hasSameStartTime } from '@/utils/timeUtils';
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

export default function AgendaDetailScreen() {
  const colorScheme = useColorScheme();
  const params = useLocalSearchParams();
  const router = useRouter();

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [allSessions, setAllSessions] = useState<AgendaItem[]>([]);
  const [bookmarkedSessions, setBookmarkedSessions] = useState<Set<string>>(new Set());
  
  // Conflict modal state
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictingSession, setConflictingSession] = useState<AgendaItem | null>(null);

  const sessionId = params.id as string;
  const title = params.title as string;
  const date = params.date as string;
  const startTime = params.startTime as string;
  const endTime = params.endTime as string;
  const room = params.room as string;
  const typeTrack = params.typeTrack as string;
  const sessionDescription = params.sessionDescription as string;
  const speakerNames = params.speakerNames as string;

  useEffect(() => {
    loadData();
  }, [sessionId]);

  const loadData = async () => {
    await loadBookmarkStatus();
    await loadAllSessions();
  };

  const loadBookmarkStatus = async () => {
    try {
      const stored = await AsyncStorage.getItem(BOOKMARKS_KEY);
      if (stored) {
        const bookmarks = JSON.parse(stored);
        const bookmarksSet = new Set(bookmarks);
        setBookmarkedSessions(bookmarksSet);
        setIsBookmarked(bookmarks.includes(sessionId));
        console.log('[AgendaDetail] Loaded bookmarks:', bookmarks.length, 'sessions');
      }
    } catch (err) {
      console.error('[AgendaDetail] Error loading bookmark status:', err);
    }
  };

  const loadAllSessions = async () => {
    try {
      const data = await fetchAgenda();
      setAllSessions(data.agenda || []);
      console.log('[AgendaDetail] Loaded all sessions:', data.agenda?.length || 0);
    } catch (err) {
      console.error('[AgendaDetail] Error loading sessions:', err);
    }
  };

  const checkForConflicts = (): AgendaItem | null => {
    console.log('═══════════════════════════════════════════════════');
    console.log('[AgendaDetail] 🔍 CONFLICT CHECK STARTED');
    console.log('[AgendaDetail] Candidate session ID:', sessionId);
    console.log('[AgendaDetail] Candidate session title:', title);
    console.log('[AgendaDetail] Candidate session date:', date);
    console.log('[AgendaDetail] Candidate session start time:', startTime);
    console.log('═══════════════════════════════════════════════════');
    
    // Check if new session has required time fields
    if (!startTime) {
      console.warn('[AgendaDetail] ⚠️ Candidate session missing StartTime, cannot check conflicts');
      return null;
    }
    
    if (!date) {
      console.warn('[AgendaDetail] ⚠️ Candidate session missing Date, cannot check conflicts');
      return null;
    }
    
    // Find all bookmarked sessions
    const bookmarkedSessionsList = allSessions.filter(s => 
      bookmarkedSessions.has(s.id) && s.id !== sessionId
    );
    
    console.log('[AgendaDetail] 📚 Current saved My Schedule sessions:', bookmarkedSessionsList.length);
    
    if (bookmarkedSessionsList.length === 0) {
      console.log('[AgendaDetail] ✅ No saved sessions to check against - no conflicts possible');
      console.log('═══════════════════════════════════════════════════');
      return null;
    }
    
    // Log all saved sessions
    bookmarkedSessionsList.forEach((saved, index) => {
      console.log(`[AgendaDetail] Saved session ${index + 1}:`, {
        id: saved.id,
        title: saved.Title,
        date: saved.Date,
        startTime: saved.StartTime,
      });
    });
    
    // Check for same date + same start time conflicts
    let matchCount = 0;
    for (const existing of bookmarkedSessionsList) {
      console.log('---------------------------------------------------');
      console.log('[AgendaDetail] Comparing with existing session:', existing.Title);
      console.log('[AgendaDetail] Existing session date:', existing.Date);
      console.log('[AgendaDetail] Existing session start time:', existing.StartTime);
      
      // Skip if existing session is missing required fields
      if (!existing.StartTime || !existing.Date) {
        console.warn('[AgendaDetail] ⚠️ Existing session missing Date or StartTime, skipping');
        continue;
      }
      
      // Check for EXACT same date and start time
      const hasConflict = hasSameStartTime(
        date,
        startTime,
        existing.Date,
        existing.StartTime
      );
      
      if (hasConflict) {
        matchCount++;
        console.log('[AgendaDetail] 🚨 CONFLICT DETECTED!');
        console.log('[AgendaDetail] Number of matches with same date + start time:', matchCount);
        console.log('[AgendaDetail] Conflicting session:', existing.Title);
        console.log('[AgendaDetail] Modal trigger condition: REACHED ✅');
        console.log('═══════════════════════════════════════════════════');
        return existing;
      }
    }
    
    console.log('[AgendaDetail] ✅ No conflicts found - all sessions have different date or start time');
    console.log('[AgendaDetail] Number of matches with same date + start time:', matchCount);
    console.log('[AgendaDetail] Modal trigger condition: NOT REACHED ❌');
    console.log('═══════════════════════════════════════════════════');
    return null;
  };

  const toggleBookmark = async () => {
    console.log('═══════════════════════════════════════════════════');
    console.log('[AgendaDetail] 📌 BOOKMARK TOGGLE INITIATED');
    console.log('[AgendaDetail] Session ID:', sessionId);
    console.log('[AgendaDetail] Session title:', title);
    console.log('[AgendaDetail] Currently bookmarked?', isBookmarked);
    
    try {
      const stored = await AsyncStorage.getItem(BOOKMARKS_KEY);
      let bookmarks: string[] = stored ? JSON.parse(stored) : [];
      
      if (isBookmarked) {
        // Remove bookmark
        console.log('[AgendaDetail] ➖ Removing bookmark (no conflict check needed)');
        bookmarks = bookmarks.filter(id => id !== sessionId);
        await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
        setIsBookmarked(false);
        setBookmarkedSessions(new Set(bookmarks));
        console.log('[AgendaDetail] Bookmark removed successfully');
      } else {
        // Check for conflicts BEFORE adding
        console.log('[AgendaDetail] ➕ Adding bookmark - checking for conflicts FIRST...');
        const conflict = checkForConflicts();
        
        if (conflict) {
          console.log('[AgendaDetail] 🚨 Conflict found - showing modal BEFORE saving');
          console.log('[AgendaDetail] Save is happening: NO ❌ (waiting for user choice)');
          // Show conflict modal - DO NOT SAVE YET
          setConflictingSession(conflict);
          setShowConflictModal(true);
        } else {
          console.log('[AgendaDetail] ✅ No conflict - saving bookmark immediately');
          console.log('[AgendaDetail] Save is happening: YES ✅');
          // No conflict, add bookmark
          bookmarks.push(sessionId);
          await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
          setIsBookmarked(true);
          setBookmarkedSessions(new Set(bookmarks));
          console.log('[AgendaDetail] Bookmark added successfully');
        }
      }
    } catch (err) {
      console.error('[AgendaDetail] Error toggling bookmark:', err);
    }
    console.log('═══════════════════════════════════════════════════');
  };

  const handleKeepBoth = async () => {
    console.log('[AgendaDetail] 👥 User chose: KEEP BOTH sessions');
    try {
      const stored = await AsyncStorage.getItem(BOOKMARKS_KEY);
      let bookmarks: string[] = stored ? JSON.parse(stored) : [];
      bookmarks.push(sessionId);
      await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
      setIsBookmarked(true);
      setBookmarkedSessions(new Set(bookmarks));
      setShowConflictModal(false);
      setConflictingSession(null);
    } catch (err) {
      console.error('[AgendaDetail] Error saving bookmark:', err);
    }
  };

  const handleCancel = () => {
    console.log('[AgendaDetail] ❌ User chose: CANCEL (do not save new session)');
    setShowConflictModal(false);
    setConflictingSession(null);
  };

  const handleReplace = async () => {
    if (!conflictingSession) return;
    
    console.log('[AgendaDetail] 🔄 User chose: REPLACE existing session');
    console.log('[AgendaDetail] Removing:', conflictingSession.Title);
    console.log('[AgendaDetail] Adding:', title);
    
    try {
      const stored = await AsyncStorage.getItem(BOOKMARKS_KEY);
      let bookmarks: string[] = stored ? JSON.parse(stored) : [];
      
      // Remove conflicting session and add new one
      bookmarks = bookmarks.filter(id => id !== conflictingSession.id);
      bookmarks.push(sessionId);
      
      await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
      setIsBookmarked(true);
      setBookmarkedSessions(new Set(bookmarks));
      setShowConflictModal(false);
      setConflictingSession(null);
    } catch (err) {
      console.error('[AgendaDetail] Error replacing bookmark:', err);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const dateObj = new Date(dateString);
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const weekday = weekdays[dateObj.getDay()];
    const month = months[dateObj.getMonth()];
    const day = dateObj.getDate();
    const year = dateObj.getFullYear();
    
    return `${weekday}, ${month} ${day}, ${year}`;
  };

  const getTrackColor = (track: string): string => {
    return TRACK_COLORS[track] || colors.textSecondary;
  };

  const formattedDate = formatDate(date);
  const trackColor = getTrackColor(typeTrack);
  
  // Format time display
  const timeDisplay = endTime 
    ? `${startTime} - ${endTime}`
    : startTime;

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: true,
          title: 'Session Details',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
        }} 
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>
                {title}
              </Text>
            </View>

            {typeTrack && (
              <View style={styles.trackBadgeContainer}>
                <View style={[
                  styles.trackBadge,
                  { 
                    backgroundColor: trackColor + '20',
                    borderColor: trackColor,
                  }
                ]}>
                  <Text style={[styles.trackBadgeText, { color: trackColor }]}>
                    {typeTrack}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <IconSymbol
                  ios_icon_name="calendar"
                  android_material_icon_name="calendar-today"
                  size={20}
                  color={colors.accent}
                />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>
                    Date
                  </Text>
                  <Text style={styles.detailValue}>
                    {formattedDate}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <IconSymbol
                  ios_icon_name="clock.fill"
                  android_material_icon_name="access-time"
                  size={20}
                  color={colors.accent}
                />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>
                    Time
                  </Text>
                  <Text style={styles.detailValue}>
                    {timeDisplay}
                  </Text>
                </View>
              </View>

              {room && (
                <View style={styles.detailRow}>
                  <IconSymbol
                    ios_icon_name="location.fill"
                    android_material_icon_name="location-on"
                    size={20}
                    color={colors.accent}
                  />
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>
                      Room
                    </Text>
                    <Text style={styles.detailValue}>
                      {room}
                    </Text>
                  </View>
                </View>
              )}

              {speakerNames && (
                <View style={styles.detailRow}>
                  <IconSymbol
                    ios_icon_name="person.fill"
                    android_material_icon_name="person"
                    size={20}
                    color={colors.accent}
                  />
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>
                      Speaker(s)
                    </Text>
                    <Text style={styles.detailValue}>
                      {speakerNames}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {sessionDescription && (
              <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionLabel}>
                  Synopsis
                </Text>
                <Text style={styles.descriptionText}>
                  {sessionDescription}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.bookmarkButton,
              isBookmarked && styles.bookmarkButtonActive
            ]}
            onPress={toggleBookmark}
          >
            <IconSymbol
              ios_icon_name={isBookmarked ? "bookmark.fill" : "bookmark"}
              android_material_icon_name={isBookmarked ? "bookmark" : "bookmark-border"}
              size={20}
              color={colors.text}
            />
            <Text style={styles.bookmarkButtonText}>
              {isBookmarked ? 'Remove from My Schedule' : 'Add to My Schedule'}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Conflict Modal */}
        {conflictingSession && (
          <ConflictModal
            visible={showConflictModal}
            newSession={{
              id: sessionId,
              title: title,
              date: date,
              startTime: startTime,
              endTime: endTime || '',
              room: room || '',
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  headerRow: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 32,
  },
  trackBadgeContainer: {
    marginBottom: 20,
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
  detailsContainer: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 16,
    color: colors.text,
  },
  descriptionContainer: {
    marginTop: 8,
  },
  descriptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },
  bookmarkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    backgroundColor: colors.cardAlt,
    borderWidth: 2,
    borderColor: colors.textSecondary,
  },
  bookmarkButtonActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  bookmarkButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
