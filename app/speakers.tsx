
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  ScrollView,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { fetchSpeakers, Speaker } from '@/utils/airtable';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SPEAKERS_CACHE_KEY = '@speakers_cache';
const SPEAKERS_CACHE_TIMESTAMP_KEY = '@speakers_cache_timestamp';
const CACHE_DURATION = 60 * 1000; // 60 seconds (1 minute)
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

export default function SpeakersScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const [allSpeakers, setAllSpeakers] = useState<Speaker[]>([]);
  const [filteredSpeakers, setFilteredSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const secondaryTextColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardBg = isDark ? colors.cardDark : colors.card;
  const borderColorValue = isDark ? colors.borderDark : colors.border;

  useEffect(() => {
    loadSpeakers();
  }, []);

  // Debounced search with 300ms delay
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      filterSpeakers();
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, selectedLetter, allSpeakers]);

  const loadSpeakers = async () => {
    console.log('[Speakers] Loading speakers...');
    
    try {
      // Check cache first (only if not refreshing)
      if (!refreshing) {
        const cachedData = await AsyncStorage.getItem(SPEAKERS_CACHE_KEY);
        const cachedTimestamp = await AsyncStorage.getItem(SPEAKERS_CACHE_TIMESTAMP_KEY);
        const now = Date.now();

        if (cachedData && cachedTimestamp) {
          const timestamp = parseInt(cachedTimestamp, 10);
          if (now - timestamp < CACHE_DURATION) {
            console.log('[Speakers] Using cached data (age:', Math.round((now - timestamp) / 1000), 'seconds)');
            const speakers = JSON.parse(cachedData);
            setAllSpeakers(speakers);
            setFilteredSpeakers(speakers);
            setLoading(false);
            return;
          } else {
            console.log('[Speakers] Cache expired (age:', Math.round((now - timestamp) / 1000), 'seconds)');
          }
        }
      }

      // Fetch from backend proxy (single request)
      if (!refreshing) {
        setLoading(true);
      }
      setError(null);

      console.log('[Speakers] Fetching from backend proxy...');
      const response = await fetchSpeakers();
      console.log('[Speakers] Loaded:', response.speakers.length, 'speakers from', response.source_used);
      
      // Sort by last name, then first name
      const sortedSpeakers = [...response.speakers].sort((a, b) => {
        const lastNameA = (a.lastName || '').toLowerCase();
        const lastNameB = (b.lastName || '').toLowerCase();
        if (lastNameA !== lastNameB) {
          return lastNameA.localeCompare(lastNameB);
        }
        const firstNameA = (a.firstName || '').toLowerCase();
        const firstNameB = (b.firstName || '').toLowerCase();
        return firstNameA.localeCompare(firstNameB);
      });

      setAllSpeakers(sortedSpeakers);
      setFilteredSpeakers(sortedSpeakers);

      // Cache the data
      const now = Date.now();
      await AsyncStorage.setItem(SPEAKERS_CACHE_KEY, JSON.stringify(sortedSpeakers));
      await AsyncStorage.setItem(SPEAKERS_CACHE_TIMESTAMP_KEY, now.toString());
      console.log('[Speakers] Data cached for 60 seconds');

    } catch (err) {
      console.error('[Speakers] Error loading speakers:', err);
      setError('We\'re having trouble loading speakers right now. Please try again.');
      
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

  const filterSpeakers = useCallback(() => {
    console.log('[Speakers] Filtering - query:', searchQuery, 'letter:', selectedLetter);
    
    let filtered = allSpeakers;

    // Filter by selected letter (last name)
    if (selectedLetter) {
      filtered = filtered.filter(speaker => {
        const lastName = (speaker.lastName || '').toUpperCase();
        return lastName.startsWith(selectedLetter);
      });
    }

    // Filter by search query (first name, last name, organization, job title)
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(speaker => {
        const firstNameMatch = (speaker.firstName || '').toLowerCase().includes(lowerQuery);
        const lastNameMatch = (speaker.lastName || '').toLowerCase().includes(lowerQuery);
        const organizationMatch = (speaker.company || '').toLowerCase().includes(lowerQuery);
        const titleMatch = (speaker.title || '').toLowerCase().includes(lowerQuery);
        
        return firstNameMatch || lastNameMatch || organizationMatch || titleMatch;
      });
    }

    console.log('[Speakers] Filtered:', filtered.length, 'results');
    setFilteredSpeakers(filtered);
  }, [searchQuery, selectedLetter, allSpeakers]);

  const onRefresh = () => {
    console.log('[Speakers] User initiated refresh');
    setRefreshing(true);
    loadSpeakers();
  };

  const handleLetterPress = (letter: string) => {
    console.log('[Speakers] Letter pressed:', letter);
    if (selectedLetter === letter) {
      setSelectedLetter(null);
    } else {
      setSelectedLetter(letter);
      // Scroll to top when letter is selected
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
  };

  const availableLetters = useMemo(() => {
    const letters = new Set<string>();
    allSpeakers.forEach(speaker => {
      const lastName = speaker.lastName || '';
      const firstLetter = lastName.charAt(0).toUpperCase();
      if (ALPHABET.includes(firstLetter)) {
        letters.add(firstLetter);
      }
    });
    return letters;
  }, [allSpeakers]);

  const handleSpeakerPress = (speaker: Speaker) => {
    const displayName = `${speaker.firstName || ''} ${speaker.lastName || ''}`.trim();
    console.log('[Speakers] Speaker pressed:', displayName);
    router.push({
      pathname: '/speaker-detail',
      params: {
        id: speaker.id,
        firstName: speaker.firstName || '',
        lastName: speaker.lastName || '',
        title: speaker.title || '',
        company: speaker.company || '',
        speakingTopic: speaker.speakingTopic || '',
        synopsis: speaker.synopsis || '',
        bio: speaker.bio || '',
        photoUrl: speaker.photoUrl || '',
        publicPersonalData: speaker.publicPersonalData ? 'true' : 'false',
        email: speaker.email || '',
        phone: speaker.phone || '',
      },
    });
  };

  const renderSpeakerCard = ({ item }: { item: Speaker }) => {
    const displayName = `${item.firstName || ''} ${item.lastName || ''}`.trim();
    const displayTitle = item.title || '';
    const displayOrganization = item.company || '';
    
    return (
      <TouchableOpacity
        style={[styles.speakerCard, { backgroundColor: cardBg, borderColor: borderColorValue }]}
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
            <View style={[styles.photoPlaceholder, { backgroundColor: colors.accent + '20' }]}>
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
          <Text style={[styles.speakerName, { color: textColor }]} numberOfLines={2}>
            {displayName}
          </Text>
          {displayTitle && (
            <Text style={[styles.speakerTitle, { color: secondaryTextColor }]} numberOfLines={3}>
              {displayTitle}
            </Text>
          )}
          {displayOrganization && (
            <Text style={[styles.speakerOrganization, { color: secondaryTextColor }]} numberOfLines={2}>
              {displayOrganization}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const loadingText = 'Loading speakers...';
  const emptyText = searchQuery || selectedLetter ? 'No speakers found' : 'No speakers available';

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Speakers',
          headerStyle: {
            backgroundColor: isDark ? colors.backgroundDark : colors.background,
          },
          headerTintColor: textColor,
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]} edges={['bottom']}>
        {/* Search Bar */}
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
              placeholder="Search by name, title, or organization..."
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
        </View>

        {/* Alphabet Navigation */}
        <View style={styles.alphabetContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.alphabetScroll}
          >
            {ALPHABET.map((letter) => {
              const isAvailable = availableLetters.has(letter);
              const isSelected = selectedLetter === letter;
              
              return (
                <TouchableOpacity
                  key={letter}
                  style={[
                    styles.letterButton,
                    { 
                      backgroundColor: isSelected ? colors.accent : cardBg,
                      borderColor: borderColorValue,
                      opacity: isAvailable ? 1 : 0.3,
                    }
                  ]}
                  onPress={() => handleLetterPress(letter)}
                  disabled={!isAvailable}
                  activeOpacity={0.7}
                >
                  <Text 
                    style={[
                      styles.letterText, 
                      { color: isSelected ? '#FFFFFF' : textColor }
                    ]}
                  >
                    {letter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Filter Indicator */}
        {selectedLetter && (
          <View style={styles.filterIndicator}>
            <Text style={[styles.filterText, { color: secondaryTextColor }]}>
              Showing speakers with last name starting with
            </Text>
            <Text style={[styles.filterLetter, { color: colors.accent }]}>
              {selectedLetter}
            </Text>
            <TouchableOpacity onPress={() => setSelectedLetter(null)}>
              <IconSymbol
                ios_icon_name="xmark.circle.fill"
                android_material_icon_name="cancel"
                size={20}
                color={secondaryTextColor}
              />
            </TouchableOpacity>
          </View>
        )}

        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={[styles.loadingText, { color: secondaryTextColor }]}>{loadingText}</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <IconSymbol
              ios_icon_name="exclamationmark.triangle.fill"
              android_material_icon_name="warning"
              size={48}
              color={colors.error}
            />
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.accent }]}
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
              color={secondaryTextColor}
            />
            <Text style={[styles.emptyText, { color: secondaryTextColor }]}>
              {emptyText}
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={filteredSpeakers}
            renderItem={renderSpeakerCard}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.row}
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
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
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
  alphabetContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  alphabetScroll: {
    gap: 8,
  },
  letterButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  letterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterText: {
    fontSize: 14,
  },
  filterLetter: {
    fontSize: 14,
    fontWeight: '700',
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
  errorText: {
    fontSize: 15,
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 15,
    marginTop: 12,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  speakerCard: {
    flex: 1,
    maxWidth: '48%',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 215,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 12,
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
  },
  speakerInfo: {
    alignItems: 'center',
    flex: 1,
  },
  speakerName: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 20,
  },
  speakerTitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 16,
  },
  speakerOrganization: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});
