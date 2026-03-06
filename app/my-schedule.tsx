
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
  ActivityIndicator,
  useColorScheme,
  RefreshControl,
} from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AgendaSection {
  title: string;
  data: AgendaItem[];
}

export default function MyScheduleScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const [allAgenda, setAllAgenda] = useState<AgendaItem[]>([]);
  const [sections, setSections] = useState<AgendaSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const secondaryTextColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardBg = isDark ? colors.cardDark : colors.card;
  const borderColorValue = isDark ? colors.borderDark : colors.border;

  const loadAgenda = useCallback(async () => {
    console.log('[API] Fetching agenda from backend proxy for My Schedule...');
    try {
      if (!refreshing) {
        setLoading(true);
      }
      setError(null);

      const data = await fetchAgenda();
      console.log('[API] Received agenda from backend:', data.agenda?.length || 0, 'records');
      console.log('[API] Source used:', data.source_used);
      console.log('[API] Updated at:', data.updated_at);

      // TODO: Filter by saved/bookmarked items from user preferences
      // For now, showing all agenda items
      setAllAgenda(data.agenda || []);
    } catch (err) {
      console.error('[API] Error fetching agenda:', err);
      setError('Schedule unavailable. Pull to refresh.');
      setAllAgenda([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    loadAgenda();
  }, []);

  const groupByDate = useCallback(() => {
    console.log('Grouping agenda by date');
    
    // Group by date
    const dateSections: AgendaSection[] = [];
    const dateMap = new Map<string, AgendaItem[]>();

    allAgenda.forEach(item => {
      const dateKey = item.Date;
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, []);
      }
      dateMap.get(dateKey)!.push(item);
    });

    dateMap.forEach((items, date) => {
      const formattedDate = formatDate(date);
      dateSections.push({
        title: formattedDate,
        data: items,
      });
    });

    console.log('Grouped sections:', dateSections.length);
    setSections(dateSections);
  }, [allAgenda]);

  useEffect(() => {
    groupByDate();
  }, [groupByDate]);

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
    
    return `${weekday}, ${month} ${day}, ${year}`;
  };

  const handleAgendaItemPress = (item: AgendaItem) => {
    console.log('Schedule item pressed:', item.Title);
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

    return (
      <TouchableOpacity
        style={[styles.agendaCard, { backgroundColor: cardBg, borderColor: borderColorValue }]}
        onPress={() => handleAgendaItemPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.timeContainer}>
          <Text style={[styles.timeText, { color: colors.primary }]}>
            {item.StartTime}
          </Text>
        </View>
        
        <View style={styles.agendaContent}>
          <Text style={[styles.agendaTitle, { color: textColor }]} numberOfLines={2}>
            {item.Title}
          </Text>
          
          {item.TypeTrack && (
            <View style={[styles.typeChip, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.typeChipText, { color: colors.primary }]}>
                {item.TypeTrack}
              </Text>
            </View>
          )}
          
          {item.Room && (
            <View style={styles.infoRow}>
              <IconSymbol
                ios_icon_name="location.fill"
                android_material_icon_name="location-on"
                size={14}
                color={secondaryTextColor}
              />
              <Text style={[styles.infoText, { color: secondaryTextColor }]}>
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
                color={secondaryTextColor}
              />
              <Text style={[styles.infoText, { color: secondaryTextColor }]} numberOfLines={1}>
                {speakerDisplay}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.bookmarkContainer}>
          <IconSymbol
            ios_icon_name="bookmark.fill"
            android_material_icon_name="bookmark"
            size={24}
            color={colors.primary}
          />
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }: { section: AgendaSection }) => (
    <View style={[styles.sectionHeader, { backgroundColor: bgColor }]}>
      <Text style={[styles.sectionHeaderText, { color: textColor }]}>
        {section.title}
      </Text>
    </View>
  );

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
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: secondaryTextColor }]}>
              Loading your schedule...
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
            <Text style={[styles.errorText, { color: colors.error }]}>
              {error}
            </Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={loadAgenda}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : sections.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol
              ios_icon_name="bookmark"
              android_material_icon_name="bookmark-border"
              size={64}
              color={secondaryTextColor}
            />
            <Text style={[styles.emptyTitle, { color: textColor }]}>
              No Saved Sessions
            </Text>
            <Text style={[styles.emptyText, { color: secondaryTextColor }]}>
              Browse the agenda and bookmark sessions you want to attend
            </Text>
            <TouchableOpacity
              style={[styles.browseButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/agenda')}
            >
              <Text style={styles.browseButtonText}>Browse Agenda</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            renderItem={renderAgendaItem}
            renderSectionHeader={renderSectionHeader}
            contentContainerStyle={styles.listContent}
            stickySectionHeadersEnabled={true}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
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
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
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
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
  },
  browseButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  sectionHeader: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  sectionHeaderText: {
    fontSize: 18,
    fontWeight: '700',
  },
  agendaCard: {
    flexDirection: 'row',
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
  timeContainer: {
    marginRight: 16,
    paddingTop: 2,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  agendaContent: {
    flex: 1,
  },
  agendaTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  typeChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '600',
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
  },
  bookmarkContainer: {
    marginLeft: 12,
    justifyContent: 'center',
  },
});
