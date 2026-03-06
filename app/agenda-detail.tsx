
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

const BOOKMARKS_KEY = '@agenda_bookmarks';

// Track color mapping
const TRACK_COLORS: Record<string, string> = {
  'Port Security': '#FF5C7A',
  'Infrastructure': '#3B82F6',
  'Energy & Decarbonization': '#10B981',
  'Digital / AI': '#A855F7',
  'Emergency Management': '#F59E0B',
};

export default function AgendaDetailScreen() {
  const colorScheme = useColorScheme();
  const params = useLocalSearchParams();
  const router = useRouter();

  const [isBookmarked, setIsBookmarked] = useState(false);

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
    loadBookmarkStatus();
  }, [sessionId]);

  const loadBookmarkStatus = async () => {
    try {
      const stored = await AsyncStorage.getItem(BOOKMARKS_KEY);
      if (stored) {
        const bookmarks = JSON.parse(stored);
        setIsBookmarked(bookmarks.includes(sessionId));
      }
    } catch (err) {
      console.error('Error loading bookmark status:', err);
    }
  };

  const toggleBookmark = async () => {
    console.log('Toggling bookmark for session:', sessionId);
    try {
      const stored = await AsyncStorage.getItem(BOOKMARKS_KEY);
      let bookmarks: string[] = stored ? JSON.parse(stored) : [];
      
      if (isBookmarked) {
        bookmarks = bookmarks.filter(id => id !== sessionId);
      } else {
        bookmarks.push(sessionId);
      }
      
      await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
      setIsBookmarked(!isBookmarked);
      console.log('Bookmark toggled. New status:', !isBookmarked);
    } catch (err) {
      console.error('Error toggling bookmark:', err);
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
