
import React, { useState, useEffect, useCallback } from 'react';
import { Stack, useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { fetchAgenda, AgendaItem } from '@/utils/airtable';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  useColorScheme,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AgendaSection {
  title: string;
  data: AgendaItem[];
}

// Track color mapping for different colored badges
const TRACK_COLORS: { [key: string]: { bg: string; text: string } } = {
  'Keynote': { bg: '#FF6B6B', text: '#FFFFFF' },
  'Panel': { bg: '#4ECDC4', text: '#FFFFFF' },
  'Workshop': { bg: '#FFE66D', text: '#2C3E50' },
  'Breakout': { bg: '#95E1D3', text: '#2C3E50' },
  'Networking': { bg: '#C7CEEA', text: '#2C3E50' },
  'General Session': { bg: '#FF8B94', text: '#FFFFFF' },
  'Technical': { bg: '#6C5CE7', text: '#FFFFFF' },
  'Business': { bg: '#00B894', text: '#FFFFFF' },
  'Innovation': { bg: '#FDCB6E', text: '#2C3E50' },
  'default': { bg: 'rgba(25, 181, 216, 0.2)', text: colors.accent },
};

export default function AgendaScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  const [allAgenda, setAllAgenda] = useState<AgendaItem[]>([]);
  const [filteredSections, setFilteredSections] = useState<AgendaSection[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // New state for filters
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [availableTracks, setAvailableTracks] = useState<string[]>([]);

  const loadAgenda = useCallback(async () => {
    console.log('[API] Fetching agenda from backend proxy...');
    try {
      if (!refreshing) {
        setLoading(true);
      }
      setError(null);

      const data = await fetchAgenda();
      console.log('[API] Received agenda from backend:', data.agenda?.length || 0, 'records');
      console.log('[API] Source used:', data.source_used);
      console.log('[API] Updated at:', data.updated_at);

      setAllAgenda(data.agenda || []);
      
      // Extract unique dates and tracks
      const dates = Array.from(new Set(data.agenda.map(item => item.Date).filter(Boolean)));
      const tracks = Array.from(new Set(data.agenda.map(item => item.TypeTrack).filter(Boolean)));
      
      setAvailableDates(dates.sort());
      setAvailableTracks(tracks.sort());
    } catch (err) {
      console.error('[API] Error fetching agenda:', err);
      setError('Agenda unavailable. Pull to refresh.');
      setAllAgenda([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    loadAgenda();
  }, []);

  const filterAgenda = useCallback(() => {
    console.log('Filtering agenda with query:', searchQuery, 'date:', selectedDate, 'track:', selectedTrack);
    
    let filtered = allAgenda;
    
    // Filter by selected date
    if (selectedDate) {
      filtered = filtered.filter(item => item.Date === selectedDate);
    }
    
    // Filter by selected track
    if (selectedTrack) {
      filtered = filtered.filter(item => item.TypeTrack === selectedTrack);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => {
        const titleMatch = item.Title?.toLowerCase().includes(query);
        const roomMatch = item.Room?.toLowerCase().includes(query);
        const typeMatch = item.TypeTrack?.toLowerCase().includes(query);
        const descMatch = item.SessionDescription?.toLowerCase().includes(query);
        const speakerMatch = Array.isArray(item.SpeakerNames)
          ? item.SpeakerNames.some(s => s.toLowerCase().includes(query))
          : item.SpeakerNames?.toLowerCase().includes(query);
        
        return titleMatch || roomMatch || typeMatch || descMatch || speakerMatch;
      });
    }

    const sections: AgendaSection[] = [];
    const dateMap = new Map<string, AgendaItem[]>();

    filtered.forEach(item => {
      const dateKey = item.Date;
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, []);
      }
      dateMap.get(dateKey)!.push(item);
    });

    dateMap.forEach((items, date) => {
      const formattedDate = formatDate(date);
      sections.push({
        title: formattedDate,
        data: items,
      });
    });

    console.log('Filtered sections:', sections.length);
    setFilteredSections(sections);
  }, [allAgenda, searchQuery, selectedDate, selectedTrack]);

  useEffect(() => {
    filterAgenda();
  }, [filterAgenda]);

  const onRefresh = () => {
    console.log('[API] User initiated refresh');
    setRefreshing(true);
    loadAgenda();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const weekday = weekdays[date.getDay()];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    const formattedDate = `${weekday}, ${month} ${day}, ${year}`;
    
    return formattedDate;
  };

  const formatDateShort = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const formattedDate = `${month} ${day}`;
    return formattedDate;
  };

  const getTrackColors = (track: string | undefined) => {
    if (!track) return TRACK_COLORS.default;
    
    // Check for exact match first
    if (TRACK_COLORS[track]) {
      return TRACK_COLORS[track];
    }
    
    // Check for partial match (case-insensitive)
    const trackLower = track.toLowerCase();
    for (const key in TRACK_COLORS) {
      if (key !== 'default' && trackLower.includes(key.toLowerCase())) {
        return TRACK_COLORS[key];
      }
    }
    
    return TRACK_COLORS.default;
  };

  const handleAgendaItemPress = (item: AgendaItem) => {
    console.log('Agenda item pressed:', item.Title);
    router.push({
      pathname: '/agenda-detail',
      params: {
        id: item.id,
        title: item.Title,
        date: item.Date,
        startTime: item.StartTime,
        room: item.Room || '',
        typeTrack: item.TypeTrack || '',
        sessionDescription: item.SessionDescription || '',
        speakerNames: Array.isArray(item.SpeakerNames) 
          ? item.SpeakerNames.join(', ') 
          : item.SpeakerNames || '',
      },
    });
  };

  const renderAgendaItem = ({ item }: { item: AgendaItem }) => {
    const speakerDisplay = Array.isArray(item.SpeakerNames)
      ? item.SpeakerNames.join(', ')
      : item.SpeakerNames || '';
    
    const trackColors = getTrackColors(item.TypeTrack);

    return (
      <TouchableOpacity
        style={styles.agendaCard}
        onPress={() => handleAgendaItemPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.agendaContent}>
          <Text style={styles.agendaTitle} numberOfLines={2}>
            {item.Title}
          </Text>
          
          <View style={styles.timeContainer}>
            <IconSymbol
              ios_icon_name="clock.fill"
              android_material_icon_name="access-time"
              size={14}
              color={colors.textSecondary}
            />
            <Text style={styles.timeText}>
              {item.StartTime}
            </Text>
          </View>
          
          {item.Room && (
            <View style={styles.infoRow}>
              <IconSymbol
                ios_icon_name="location.fill"
                android_material_icon_name="location-on"
                size={14}
                color={colors.textSecondary}
              />
              <Text style={styles.infoText}>
                {item.Room}
              </Text>
            </View>
          )}
          
          {speakerDisplay && (
            <View style={styles.infoRow}>
              <IconSymbol
                ios_icon_name="person.fill"
                android_material_icon_name="person"
                size={14}
                color={colors.textSecondary}
              />
              <Text style={styles.infoText} numberOfLines={1}>
                {speakerDisplay}
              </Text>
            </View>
          )}
          
          {item.TypeTrack && (
            <View style={[styles.typeChip, { backgroundColor: trackColors.bg }]}>
              <Text style={[styles.typeChipText, { color: trackColors.text }]}>
                {item.TypeTrack}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }: { section: AgendaSection }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>
        {section.title}
      </Text>
    </View>
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
              placeholder="Search agenda..."
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

        {/* Date Selector */}
        {availableDates.length > 0 && (
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Date</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScrollContent}
            >
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedDate === null && styles.filterChipActive
                ]}
                onPress={() => setSelectedDate(null)}
              >
                <Text style={[
                  styles.filterChipText,
                  selectedDate === null && styles.filterChipTextActive
                ]}>
                  All Dates
                </Text>
              </TouchableOpacity>
              {availableDates.map((date) => {
                const isSelected = selectedDate === date;
                const dateLabel = formatDateShort(date);
                return (
                  <TouchableOpacity
                    key={date}
                    style={[
                      styles.filterChip,
                      isSelected && styles.filterChipActive
                    ]}
                    onPress={() => setSelectedDate(date)}
                  >
                    <Text style={[
                      styles.filterChipText,
                      isSelected && styles.filterChipTextActive
                    ]}>
                      {dateLabel}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Track/Type Filter */}
        {availableTracks.length > 0 && (
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Track</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScrollContent}
            >
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedTrack === null && styles.filterChipActive
                ]}
                onPress={() => setSelectedTrack(null)}
              >
                <Text style={[
                  styles.filterChipText,
                  selectedTrack === null && styles.filterChipTextActive
                ]}>
                  All Tracks
                </Text>
              </TouchableOpacity>
              {availableTracks.map((track) => {
                const isSelected = selectedTrack === track;
                const trackColors = getTrackColors(track);
                return (
                  <TouchableOpacity
                    key={track}
                    style={[
                      styles.filterChip,
                      isSelected && { backgroundColor: trackColors.bg }
                    ]}
                    onPress={() => setSelectedTrack(track)}
                  >
                    <Text style={[
                      styles.filterChipText,
                      isSelected && { color: trackColors.text }
                    ]}>
                      {track}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

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
        ) : filteredSections.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol
              ios_icon_name="calendar"
              android_material_icon_name="calendar-today"
              size={48}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>
              {searchQuery || selectedDate || selectedTrack ? 'No agenda items found' : 'No agenda items yet'}
            </Text>
          </View>
        ) : (
          <SectionList
            sections={filteredSections}
            keyExtractor={(item) => item.id}
            renderItem={renderAgendaItem}
            renderSectionHeader={renderSectionHeader}
            contentContainerStyle={styles.listContent}
            stickySectionHeadersEnabled={true}
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
  filterSection: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.cardAlt,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: colors.accent,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.text,
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
  sectionHeader: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: colors.background,
  },
  sectionHeaderText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  agendaCard: {
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
  agendaContent: {
    flex: 1,
  },
  agendaTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: colors.text,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  infoText: {
    fontSize: 13,
    marginLeft: 6,
    flex: 1,
    color: colors.textSecondary,
  },
  typeChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
