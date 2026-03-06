
import React, { useState, useEffect, useCallback } from 'react';
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
  const router = useRouter();

  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [filteredSpeakers, setFilteredSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadSpeakers = useCallback(async () => {
    console.log('Loading speakers from backend proxy...');
    try {
      setLoading(true);
      setError(null);
      const response = await fetchSpeakers();
      console.log('Speakers loaded:', response.speakers.length, 'from', response.source_used);
      setSpeakers(response.speakers);
      setFilteredSpeakers(response.speakers);
    } catch (err) {
      console.error('Error loading speakers:', err);
      const errorMessage = err instanceof Error ? err.message : 'Speakers unavailable. Pull to refresh.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSpeakers();
  }, [loadSpeakers]);

  const filterSpeakers = useCallback(() => {
    if (!searchQuery.trim()) {
      setFilteredSpeakers(speakers);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = speakers.filter(speaker => {
      const fullName = `${speaker.firstName} ${speaker.lastName}`.toLowerCase();
      const nameMatch = fullName.includes(query);
      const titleMatch = speaker.title?.toLowerCase().includes(query);
      const topicMatch = speaker.speakingTopic?.toLowerCase().includes(query);
      return nameMatch || titleMatch || topicMatch;
    });

    console.log('Filtered speakers:', filtered.length, 'from', speakers.length);
    setFilteredSpeakers(filtered);
  }, [searchQuery, speakers]);

  useEffect(() => {
    filterSpeakers();
  }, [filterSpeakers]);

  const handleSpeakerPress = (speaker: Speaker) => {
    const displayName = `${speaker.firstName} ${speaker.lastName}`.trim();
    console.log('Speaker pressed:', displayName);
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

        {loading ? (
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
