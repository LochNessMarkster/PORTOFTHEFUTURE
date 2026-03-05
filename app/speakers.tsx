
import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { fetchSpeakers, Speaker } from '@/utils/airtable';

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

export default function SpeakersScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [filteredSpeakers, setFilteredSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const secondaryTextColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardBg = isDark ? colors.cardDark : colors.card;
  const borderColorValue = isDark ? colors.borderDark : colors.border;

  useEffect(() => {
    loadSpeakers();
  }, []);

  useEffect(() => {
    filterSpeakers();
  }, [searchQuery, speakers]);

  const loadSpeakers = async () => {
    console.log('Loading speakers...');
    try {
      setLoading(true);
      setError(null);
      const data = await fetchSpeakers();
      console.log('Speakers loaded:', data.length);
      setSpeakers(data);
      setFilteredSpeakers(data);
    } catch (err) {
      console.error('Error loading speakers:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load speakers';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filterSpeakers = () => {
    if (!searchQuery.trim()) {
      setFilteredSpeakers(speakers);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = speakers.filter(speaker => {
      const nameMatch = speaker.name_display.toLowerCase().includes(query);
      const titleMatch = speaker.title_full?.toLowerCase().includes(query);
      const topicMatch = speaker.speaking_topic?.toLowerCase().includes(query);
      return nameMatch || titleMatch || topicMatch;
    });

    console.log('Filtered speakers:', filtered.length, 'from', speakers.length);
    setFilteredSpeakers(filtered);
  };

  const handleSpeakerPress = (speaker: Speaker) => {
    console.log('Speaker pressed:', speaker.name_display);
    router.push({
      pathname: '/speaker-detail',
      params: {
        id: speaker.id,
        name_display: speaker.name_display,
        title_full: speaker.title_full || '',
        speaking_topic: speaker.speaking_topic || '',
        topic_synopsis: speaker.topic_synopsis || '',
        bio: speaker.bio || '',
        photo_url: speaker.photo_url || '',
        public_personal_data: speaker.public_personal_data ? 'true' : 'false',
        email: speaker.email || '',
        phone: speaker.phone || '',
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
        <View style={styles.photoContainer}>
          {item.photo_url ? (
            <Image
              source={resolveImageSource(item.photo_url)}
              style={styles.photo}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.photoPlaceholder, { backgroundColor: colors.primary + '20' }]}>
              <IconSymbol
                ios_icon_name="person.fill"
                android_material_icon_name="person"
                size={40}
                color={colors.primary}
              />
            </View>
          )}
        </View>
        <View style={styles.speakerInfo}>
          <Text style={[styles.speakerName, { color: textColor }]} numberOfLines={2}>
            {item.name_display}
          </Text>
          {item.title_full && (
            <Text style={[styles.speakerTitle, { color: secondaryTextColor }]} numberOfLines={2}>
              {item.title_full}
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

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: secondaryTextColor }]}>Loading speakers...</Text>
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
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
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
    paddingVertical: 12,
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
  },
  speakerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  speakerName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  speakerTitle: {
    fontSize: 14,
    lineHeight: 20,
  },
});
