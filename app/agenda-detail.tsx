
import React, { useState, useEffect } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  TouchableOpacity,
} from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchAgenda, AgendaItem } from '@/utils/airtable';
import { colors } from '@/styles/commonStyles';
import { hasSameStartTime } from '@/utils/timeUtils';
import { ConflictModal } from '@/components/ConflictModal';

const BOOKMARKS_KEY = '@agenda_bookmarks';

// Track color mapping
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

export default function AgendaDetailScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const params = useLocalSearchParams();

  const sessionId = params.id as string;
  const title = params.title as string;
  const date = params.date as string;
  const startTime = params.startTime as string;
  const endTime = params.endTime as string;
  const room = params.room as string;
  const typeTrack = params.typeTrack as string;
  const sessionDescription = params.sessionDescription as string;
  const speakerNames = params.speakerNames as string;

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [allSessions, setAllSessions] = useState<AgendaItem[]>([]);
  const [bookmarkedSessions, setBookmarkedSessions] = useState<Set<string>>(new Set());

  // Conflict modal state
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictingSession, setConflictingSession] = useState<AgendaItem | null>(null);

  useEffect(() => {
    if (sessionId) {
      loadData();
    }
  }, [sessionId]);

  const loadData = async () => {
    await Promise.all([
      loadBookmarkStatus(),
      loadAllSessions(),
    ]);
  };

  const loadBookmarkStatus = async () => {
    try {
      const stored = await AsyncStorage.getItem(BOOKMARKS_KEY);
      
      if (stored) {
        const parsed = JSON.parse(stored);
        
        if (Array.isArray(parsed)) {
          const bookmarks = new Set(parsed);
          setBookmarkedSessions(bookmarks);
          setIsBookmarked(bookmarks.has(sessionId));
          console.log('[AgendaDetail] Bookmark status loaded:', bookmarks.has(sessionId));
        } else {
          setBookmarkedSessions(new Set());
          setIsBookmarked(false);
        }
      } else {
        setBookmarkedSessions(new Set());
        setIsBookmarked(false);
      }
    } catch (err: any) {
      console.log('[AgendaDetail] Storage unavailable, using in-memory bookmarks only');
      setBookmarkedSessions(new Set());
      setIsBookmarked(false);
    }
  };

  const loadAllSessions = async () => {
    try {
      const data = await fetchAgenda();
      setAllSessions(data.agenda || []);
      console.log('[AgendaDetail] All sessions loaded:', data.agenda?.length || 0);
    } catch (err) {
      console.error('[AgendaDetail] Error loading sessions:', err);
      setAllSessions([]);
    }
  };

  const checkForConflicts = (): AgendaItem | null => {
    console.log('[AgendaDetail] Checking for conflicts...');
    
    if (!startTime || !date) {
      console.log('[AgendaDetail] Missing date or start time, cannot check conflicts');
      return null;
    }
    
    const bookmarkedSessionsList = allSessions.filter(s => 
      bookmarkedSessions.has(s.id) && s.id !== sessionId
    );
    
    console.log('[AgendaDetail] Checking against', bookmarkedSessionsList.length, 'bookmarked sessions');
    
    for (const existing of bookmarkedSessionsList) {
      if (!existing.StartTime || !existing.Date) {
        continue;
      }
      
      const hasConflict = hasSameStartTime(
        date,
        startTime,
        existing.Date,
        existing.StartTime
      );
      
      if (hasConflict) {
        console.log('[AgendaDetail] Conflict found with:', existing.Title);
        return existing;
      }
    }
    
    console.log('[AgendaDetail] No conflicts found');
    return null;
  };

  const toggleBookmark = async () => {
    console.log('[AgendaDetail] Toggle bookmark for session:', sessionId);
    
    if (isBookmarked) {
      console.log('[AgendaDetail] Removing bookmark');
      const newBookmarks = new Set(bookmarkedSessions);
      newBookmarks.delete(sessionId);
      setBookmarkedSessions(newBookmarks);
      setIsBookmarked(false);
      
      try {
        const bookmarksArray = Array.from(newBookmarks);
        await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarksArray));
        console.log('[AgendaDetail] Bookmark removed and saved');
      } catch (err: any) {
        console.log('[AgendaDetail] Storage unavailable, bookmark removal will not persist');
      }
      return;
    }
    
    console.log('[AgendaDetail] Adding bookmark - checking for conflicts...');
    const conflict = checkForConflicts();
    
    if (conflict) {
      console.log('[AgendaDetail] Conflict detected - showing modal');
      setConflictingSession(conflict);
      setShowConflictModal(true);
    } else {
      console.log('[AgendaDetail] No conflict - adding bookmark');
      const newBookmarks = new Set(bookmarkedSessions);
      newBookmarks.add(sessionId);
      setBookmarkedSessions(newBookmarks);
      setIsBookmarked(true);
      
      try {
        const bookmarksArray = Array.from(newBookmarks);
        await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarksArray));
        console.log('[AgendaDetail] Bookmark added and saved');
      } catch (err: any) {
        console.log('[AgendaDetail] Storage unavailable, bookmark will not persist');
      }
    }
  };

  const handleKeepBoth = async () => {
    console.log('[AgendaDetail] User chose: KEEP BOTH');
    const newBookmarks = new Set(bookmarkedSessions);
    newBookmarks.add(sessionId);
    setBookmarkedSessions(newBookmarks);
    setIsBookmarked(true);
    
    try {
      const bookmarksArray = Array.from(newBookmarks);
      await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarksArray));
    } catch (err: any) {
      console.log('[AgendaDetail] Storage unavailable, bookmark will not persist');
    }
    
    setShowConflictModal(false);
    setConflictingSession(null);
  };

  const handleCancel = () => {
    console.log('[AgendaDetail] User chose: CANCEL');
    setShowConflictModal(false);
    setConflictingSession(null);
  };

  const handleReplace = async () => {
    if (!conflictingSession) return;
    
    console.log('[AgendaDetail] User chose: REPLACE');
    const newBookmarks = new Set(bookmarkedSessions);
    newBookmarks.delete(conflictingSession.id);
    newBookmarks.add(sessionId);
    setBookmarkedSessions(newBookmarks);
    setIsBookmarked(true);
    
    try {
      const bookmarksArray = Array.from(newBookmarks);
      await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarksArray));
    } catch (err: any) {
      console.log('[AgendaDetail] Storage unavailable, bookmark will not persist');
    }
    
    setShowConflictModal(false);
    setConflictingSession(null);
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

  const getTrackColor = (track: string): string => {
    return TRACK_COLORS[track] || colors.textSecondary;
  };

  const dateDisplay = formatDate(date);
  const timeDisplay = endTime ? `${startTime} - ${endTime}` : startTime;
  const trackColor = getTrackColor(typeTrack);

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Session Details',
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerRight: () => (
            <TouchableOpacity
              onPress={toggleBookmark}
              style={styles.headerButton}
            >
              <IconSymbol
                ios_icon_name={isBookmarked ? "bookmark.fill" : "bookmark"}
                android_material_icon_name={isBookmarked ? "bookmark" : "bookmark-border"}
                size={24}
                color={isBookmarked ? colors.accent : colors.text}
              />
            </TouchableOpacity>
          ),
        }} 
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>

            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <IconSymbol
                  ios_icon_name="calendar"
                  android_material_icon_name="calendar-today"
                  size={20}
                  color={colors.accent}
                />
                <Text style={styles.infoText}>{dateDisplay}</Text>
              </View>

              <View style={styles.infoRow}>
                <IconSymbol
                  ios_icon_name="clock"
                  android_material_icon_name="schedule"
                  size={20}
                  color={colors.accent}
                />
                <Text style={styles.infoText}>{timeDisplay}</Text>
              </View>

              {room && (
                <View style={styles.infoRow}>
                  <IconSymbol
                    ios_icon_name="location.fill"
                    android_material_icon_name="place"
                    size={20}
                    color={colors.accent}
                  />
                  <Text style={styles.infoText}>{room}</Text>
                </View>
              )}
            </View>

            {typeTrack && (
              <View style={styles.trackContainer}>
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
                    {typeTrack}
                  </Text>
                </View>
              </View>
            )}

            {speakerNames && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Speakers</Text>
                <Text style={styles.sectionContent}>{speakerNames}</Text>
              </View>
            )}

            {sessionDescription && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.sectionContent}>{sessionDescription}</Text>
              </View>
            )}
          </View>
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
              endTime: endTime,
              room: room,
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
    paddingBottom: 24,
  },
  headerButton: {
    padding: 8,
    marginRight: 8,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 20,
    lineHeight: 36,
  },
  infoSection: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
    fontWeight: '600',
  },
  trackContainer: {
    marginBottom: 24,
  },
  trackBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  trackBadgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
});
