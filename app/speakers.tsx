
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  useColorScheme,
  Image,
  ImageSourcePropType,
  RefreshControl,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { fetchSpeakers, Speaker } from '@/utils/airtable';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SPEAKERS_CACHE_KEY = '@speakers_cache';
const SPEAKERS_CACHE_TIMESTAMP_KEY = '@speakers_cache_timestamp';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

export default function SpeakersScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  const [allSpeakers, setAllSpeakers] = useState<Speaker[]>([]);
  const [filteredSpeakers, setFilteredSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadSpeakers();
  }, []);

  // Debounced search with 300ms delay
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      filterSpeakers(searchQuery);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, allSpeakers]);

  const loadSpeakers = async () => {
    console.log('[Speakers] Loading speakers...');
    
    try {
      // Check cache first
      const cachedData = await AsyncStorage.getItem(SPEAKERS_CACHE_KEY);
      const cachedTimestamp = await AsyncStorage.getItem(SPEAKERS_CACHE_TIMESTAMP_KEY);
      const now = Date.now();

      if (cachedData && cachedTimestamp && !refreshing) {
        const timestamp = parseInt(cachedTimestamp, 10);
        if (now - timestamp < CACHE_DURATION) {
          console.log('[Speakers] Using cached data');
          const speakers = JSON.parse(cachedData);
          setAllSpeakers(speakers);
          setFilteredSpeakers(speakers);
          setLoading(false);
          return;
        }
      }

      // Fetch from API
      if (!refreshing) {
        setLoading(true);
      }
      setError(null);

      const response = await fetchSpeakers();
      console.log('[Speakers] Loaded:', response.speakers.length, 'from', response.source_used);
      
      setAllSpeakers(response.speakers);
      setFilteredSpeakers(response.speakers);

      // Cache the data
      await AsyncStorage.setItem(SPEAKERS_CACHE_KEY, JSON.stringify(response.speakers));
      await AsyncStorage.setItem(SPEAKERS_CACHE_TIMESTAMP_KEY, now.toString());
      console.log('[Speakers] Data cached');

    } catch (err) {
      console.error('[Speakers] Error loading speakers:', err);
      setError('We\'re having trouble loading speakers right now. Please try again in a moment.');
      
      // Try to use stale cache as fallback
      const cachedData = await AsyncStorage.getItem(SPEAKERS_CACHE_KEY);
      if (cachedData) {
        console.log('[Speakers] Using stale cache as fallback');
        const speakers = JSON.parse(cachedData);
        setAllSpeakers(speakers);
        setFilteredSpeakers(speakers);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterSpeakers = (query: string) => {
    console.log('[Speakers] Filtering with query:', query);
    
    if (!query.trim()) {
      setFilteredSpeakers(allSpeakers);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = allSpeakers.filter(speaker => {
      const fullName = `${speaker.firstName} ${speaker.lastName}`.toLowerCase();
      const nameMatch = fullName.includes(lowerQuery);
      const titleMatch = speaker.title?.toLowerCase().includes(lowerQuery);
      const topicMatch = speaker.speakingTopic?.toLowerCase().includes(lowerQuery);
      const companyMatch = speaker.company?.toLowerCase().includes(lowerQuery);
      
      return nameMatch || titleMatch || topicMatch || companyMatch;
    });

    console.log('[Speakers] Filtered:', filtered.length, 'results');
    setFilteredSpeakers(filtered);
  };

  const onRefresh = () => {
    console.log('[Speakers] User initiated refresh');
    setRefreshing(true);
    loadSpeakers();
  };

  const handleSpeakerPress = (speaker: Speaker) => {
    const displayName = `${speaker.firstName} ${speaker.lastName}`.trim();
    console.log('[Speakers] Speaker pressed:', displayName);
    router.push({
      pathname: '/speaker-detail',
      params: {
        id: speaker.id,
        name_display: displayName,
        title_full: speaker.title || '',
        speaking_topic: speaker.speakingTopic || '',
        topic_synopsis: speaker.synopsis || '',
        bio: speaker.bio || '',
        photo_url: speaker.photoUrl || '',
        public_personal_data: speaker.publicPersonalData ? 'true' : 'false',
        email: speaker.email || '',
        phone: speaker.phone || '',
        company: speaker.company || '',
      },
    });
  };

  const renderSpeakerCard = ({ item }: { item: Speaker }) => {
    const displayName = `${item.firstName} ${item.lastName}`.trim();
    
    return (
      <TouchableOpacity
        style={styles.speakerCard}
        onPress={() => handleSpeakerPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.photoContainer}>
          {item.photoUrl ? (
            <Image
              source={resolveImageSource(item.photoUrl)}
              style={styles.photo}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.photoPlaceholder}>
              <IconSymbol
                ios_icon_name="person.fill"
                android_material_icon_name="person"
                size={40}
                color={colors.accent}
              />
            </View>
          )}
        </View>
        <View style={styles.speakerInfo}>
          <Text style={styles.speakerName} numberOfLines={2}>
            {displayName}
          </Text>
          {item.title && (
            <Text style={styles.speakerTitle} numberOfLines={2}>
              {item.title}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Speakers',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <IconSymbol
              ios_icon_name="magnifyingglass"
              android_material_icon_name="search"
              size={20}
              color={colors.textSecondary}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search speakers..."
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

        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.loadingText}>Loading speakers...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <IconSymbol
              ios_icon_name="exclamationmark.triangle.fill"
              android_material_icon_name="warning"
              size={48}
              color={colors.error}
            />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={loadSpeakers}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredSpeakers.length === 0 ? (
          <View style={styles.centerContainer}>
            <IconSymbol
              ios_icon_name="person.2.slash"
              android_material_icon_name="person-off"
              size={48}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No speakers found' : 'No speakers available'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredSpeakers}
            renderItem={renderSpeakerCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
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
  },
  searchBar: {
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
  centerContainer: {
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
  errorText: {
    fontSize: 15,
    marginTop: 12,
    textAlign: 'center',
    color: colors.error,
    lineHeight: 22,
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
  emptyText: {
    fontSize: 15,
    marginTop: 12,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  listContent: {
    padding: 16,
  },
  speakerCard: {
    flexDirection: 'row',
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
  photoContainer: {
    marginRight: 16,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  photoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(25, 181, 216, 0.2)',
  },
  speakerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  speakerName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: colors.text,
  },
  speakerTitle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
});
