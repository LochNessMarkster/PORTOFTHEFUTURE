
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { fetchSpeakers, Speaker } from '@/utils/airtable';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
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

const SPEAKERS_CACHE_KEY = 'potf_speakers_cache';
const SPEAKERS_CACHE_TIMESTAMP_KEY = 'potf_speakers_cache_timestamp';
const CACHE_DURATION = 5 * 60 * 1000;

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

export default function SpeakersScreen() {
  const [allSpeakers, setAllSpeakers] = useState<Speaker[]>([]);
  const [filteredSpeakers, setFilteredSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const secondaryTextColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardBg = isDark ? colors.cardDark : colors.card;
  const borderColorValue = isDark ? colors.borderDark : colors.border;

  const loadSpeakers = useCallback(async () => {
    console.log('[Speakers] Loading speakers...');
    try {
      setLoading(true);

      const cachedTimestamp = await AsyncStorage.getItem(SPEAKERS_CACHE_TIMESTAMP_KEY);
      const now = Date.now();
      const isCacheValid = cachedTimestamp && (now - parseInt(cachedTimestamp)) < CACHE_DURATION;

      if (isCacheValid) {
        const cached = await AsyncStorage.getItem(SPEAKERS_CACHE_KEY);
        if (cached) {
          console.log('[Speakers] Using cached data');
          const speakers = JSON.parse(cached);
          setAllSpeakers(speakers);
          setFilteredSpeakers(speakers);
          setLoading(false);
          return;
        }
      }

      console.log('[Speakers] Fetching fresh data from API');
      const speakers = await fetchSpeakers();
      console.log('[Speakers] Loaded speakers:', speakers.length);

      await AsyncStorage.setItem(SPEAKERS_CACHE_KEY, JSON.stringify(speakers));
      await AsyncStorage.setItem(SPEAKERS_CACHE_TIMESTAMP_KEY, now.toString());

      setAllSpeakers(speakers);
      setFilteredSpeakers(speakers);
    } catch (error) {
      console.error('[Speakers] Error loading speakers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSpeakers();
  }, [loadSpeakers]);

  const onRefresh = useCallback(async () => {
    console.log('[Speakers] User triggered refresh');
    setRefreshing(true);
    await AsyncStorage.removeItem(SPEAKERS_CACHE_KEY);
    await AsyncStorage.removeItem(SPEAKERS_CACHE_TIMESTAMP_KEY);
    await loadSpeakers();
  }, [loadSpeakers]);

  useEffect(() => {
    let filtered = allSpeakers;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(speaker =>
        speaker.name.toLowerCase().includes(query) ||
        speaker.company?.toLowerCase().includes(query) ||
        speaker.title?.toLowerCase().includes(query)
      );
    }

    if (selectedLetter) {
      filtered = filtered.filter(speaker =>
        speaker.name.charAt(0).toUpperCase() === selectedLetter
      );
    }

    setFilteredSpeakers(filtered);
  }, [searchQuery, selectedLetter, allSpeakers]);

  const handleLetterPress = (letter: string) => {
    console.log('[Speakers] Letter pressed:', letter);
    if (selectedLetter === letter) {
      setSelectedLetter(null);
    } else {
      setSelectedLetter(letter);
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
  };

  const handleSpeakerPress = (speaker: Speaker) => {
    console.log('[Speakers] Speaker pressed:', speaker.name);
    router.push({
      pathname: '/speaker-detail',
      params: {
        id: speaker.id,
        name: speaker.name,
        title: speaker.title || '',
        company: speaker.company || '',
        bio: speaker.bio || '',
        email: speaker.email || '',
        phone: speaker.phone || '',
        photo_url: speaker.photo_url || '',
      },
    });
  };

  const renderSpeakerCard = ({ item }: { item: Speaker }) => {
    return (
      <TouchableOpacity
        style={[styles.speakerCard, { backgroundColor: cardBg, borderColor: borderColorValue }]}
        onPress={() => handleSpeakerPress(item)}
        activeOpacity={0.7}
      >
        {item.photo_url ? (
          <Image
            source={resolveImageSource(item.photo_url)}
            style={styles.speakerPhoto}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.speakerPhotoPlaceholder, { backgroundColor: colors.primary + '20' }]}>
            <IconSymbol
              ios_icon_name="person.fill"
              android_material_icon_name="person"
              size={32}
              color={colors.primary}
            />
          </View>
        )}
        <View style={styles.speakerInfo}>
          <Text style={[styles.speakerName, { color: textColor }]} numberOfLines={1}>
            {item.name}
          </Text>
          {item.title && (
            <Text style={[styles.speakerTitle, { color: secondaryTextColor }]} numberOfLines={1}>
              {item.title}
            </Text>
          )}
          {item.company && (
            <Text style={[styles.speakerCompany, { color: secondaryTextColor }]} numberOfLines={1}>
              {item.company}
            </Text>
          )}
        </View>
        <IconSymbol
          ios_icon_name="chevron.right"
          android_material_icon_name="chevron-right"
          size={20}
          color={secondaryTextColor}
        />
      </TouchableOpacity>
    );
  };

  const availableLetters = useMemo(() => {
    const letters = new Set<string>();
    allSpeakers.forEach(speaker => {
      const firstLetter = speaker.name.charAt(0).toUpperCase();
      if (ALPHABET.includes(firstLetter)) {
        letters.add(firstLetter);
      }
    });
    return letters;
  }, [allSpeakers]);

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
              placeholder="Search speakers..."
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

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.alphabetScroll}
          contentContainerStyle={styles.alphabetContainer}
        >
          {ALPHABET.map(letter => {
            const isAvailable = availableLetters.has(letter);
            const isSelected = selectedLetter === letter;
            return (
              <TouchableOpacity
                key={letter}
                style={[
                  styles.letterButton,
                  isSelected && { backgroundColor: colors.primary },
                  !isAvailable && styles.letterButtonDisabled,
                ]}
                onPress={() => isAvailable && handleLetterPress(letter)}
                disabled={!isAvailable}
              >
                <Text
                  style={[
                    styles.letterText,
                    { color: isSelected ? '#FFFFFF' : (isAvailable ? textColor : secondaryTextColor) },
                    !isAvailable && styles.letterTextDisabled,
                  ]}
                >
                  {letter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: secondaryTextColor }]}>Loading speakers...</Text>
          </View>
        ) : filteredSpeakers.length === 0 ? (
          <View style={styles.centerContainer}>
            <IconSymbol
              ios_icon_name="person.2"
              android_material_icon_name="group"
              size={48}
              color={secondaryTextColor}
            />
            <Text style={[styles.emptyText, { color: secondaryTextColor }]}>
              {searchQuery || selectedLetter ? 'No speakers found' : 'No speakers available'}
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={filteredSpeakers}
            renderItem={renderSpeakerCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
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
  alphabetScroll: {
    maxHeight: 50,
    marginBottom: 8,
  },
  alphabetContainer: {
    paddingHorizontal: 16,
    gap: 6,
  },
  letterButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.border + '30',
  },
  letterButtonDisabled: {
    opacity: 0.3,
  },
  letterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  letterTextDisabled: {
    opacity: 0.5,
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
  speakerCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  speakerPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  speakerPhotoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  speakerInfo: {
    flex: 1,
  },
  speakerName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2,
  },
  speakerTitle: {
    fontSize: 14,
    marginBottom: 2,
  },
  speakerCompany: {
    fontSize: 14,
  },
});
