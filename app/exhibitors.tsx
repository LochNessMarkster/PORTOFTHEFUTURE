
import { IconSymbol } from '@/components/IconSymbol';
import { Stack, useRouter } from 'expo-router';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchExhibitors, Exhibitor, normalizeToArray } from '@/utils/airtable';
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

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

export default function ExhibitorsScreen() {
  const [exhibitors, setExhibitors] = useState<Exhibitor[]>([]);
  const [filteredExhibitors, setFilteredExhibitors] = useState<Exhibitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);

  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const secondaryTextColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardBg = isDark ? colors.cardDark : colors.card;
  const borderColorValue = isDark ? colors.borderDark : colors.border;

  const loadExhibitors = useCallback(async () => {
    console.log('[Exhibitors] Loading exhibitors...');
    try {
      setLoading(true);
      const response = await fetchExhibitors();
      
      console.log('[Exhibitors] Raw API response type:', typeof response);
      console.log('[Exhibitors] Is response an array?', Array.isArray(response));
      
      // Normalize the response to ensure we have an array
      let normalizedExhibitors: Exhibitor[] = [];
      
      if (Array.isArray(response)) {
        normalizedExhibitors = response;
        console.log('[Exhibitors] Response is already an array');
      } else if (response && typeof response === 'object' && 'exhibitors' in response) {
        const exhibitorsData = (response as { exhibitors: unknown }).exhibitors;
        normalizedExhibitors = normalizeToArray<Exhibitor>(exhibitorsData);
        console.log('[Exhibitors] Using response.exhibitors');
      } else if (response && typeof response === 'object' && 'data' in response) {
        const data = (response as { data: unknown }).data;
        normalizedExhibitors = normalizeToArray<Exhibitor>(data);
        console.log('[Exhibitors] Using response.data');
      } else {
        normalizedExhibitors = [];
        console.warn('[Exhibitors] Response format not recognized, using empty array');
      }
      
      console.log('[Exhibitors] Normalized exhibitors - Is array?', Array.isArray(normalizedExhibitors));
      console.log('[Exhibitors] Normalized exhibitors - Length:', normalizedExhibitors.length);
      
      setExhibitors(normalizedExhibitors);
      setFilteredExhibitors(normalizedExhibitors);
    } catch (error) {
      console.error('[Exhibitors] Error loading exhibitors:', error);
      setExhibitors([]);
      setFilteredExhibitors([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadExhibitors();
  }, [loadExhibitors]);

  const filterExhibitors = useCallback(() => {
    console.log('[Exhibitors] Filtering exhibitors. Total:', exhibitors.length);
    console.log('[Exhibitors] exhibitors is array?', Array.isArray(exhibitors));
    
    // Defensive check
    if (!Array.isArray(exhibitors)) {
      console.error('[Exhibitors] exhibitors is not an array!', typeof exhibitors);
      setFilteredExhibitors([]);
      return;
    }

    let filtered = [...exhibitors];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(exhibitor =>
        exhibitor.name.toLowerCase().includes(query) ||
        exhibitor.description?.toLowerCase().includes(query)
      );
    }

    if (selectedLetter) {
      filtered = filtered.filter(exhibitor =>
        exhibitor.name.charAt(0).toUpperCase() === selectedLetter
      );
    }

    console.log('[Exhibitors] Filtered exhibitors:', filtered.length);
    setFilteredExhibitors(filtered);
  }, [searchQuery, selectedLetter, exhibitors]);

  useEffect(() => {
    filterExhibitors();
  }, [filterExhibitors]);

  const handleExhibitorPress = (exhibitor: Exhibitor) => {
    console.log('[Exhibitors] Exhibitor pressed:', exhibitor.name);
    router.push({
      pathname: '/exhibitor-detail',
      params: {
        id: exhibitor.id,
        name: exhibitor.name,
        description: exhibitor.description || '',
        booth_number: exhibitor.booth_number || '',
        website: exhibitor.website || '',
        email: exhibitor.email || '',
        phone: exhibitor.phone || '',
        logo_url: exhibitor.logo_url || '',
      },
    });
  };

  const handleLetterPress = (letter: string) => {
    console.log('[Exhibitors] Letter pressed:', letter);
    if (selectedLetter === letter) {
      setSelectedLetter(null);
    } else {
      setSelectedLetter(letter);
    }
  };

  const availableLetters = useMemo(() => {
    console.log('[Exhibitors] Computing available letters. exhibitors:', exhibitors.length);
    console.log('[Exhibitors] exhibitors is array?', Array.isArray(exhibitors));
    
    // Defensive check
    if (!Array.isArray(exhibitors)) {
      console.error('[Exhibitors] exhibitors is not an array in useMemo!', typeof exhibitors);
      return new Set<string>();
    }

    const letters = new Set<string>();
    exhibitors.forEach(exhibitor => {
      const firstLetter = exhibitor.name.charAt(0).toUpperCase();
      if (ALPHABET.includes(firstLetter)) {
        letters.add(firstLetter);
      }
    });
    return letters;
  }, [exhibitors]);

  const renderExhibitorCard = ({ item }: { item: Exhibitor }) => {
    return (
      <TouchableOpacity
        style={[styles.exhibitorCard, { backgroundColor: cardBg, borderColor: borderColorValue }]}
        onPress={() => handleExhibitorPress(item)}
        activeOpacity={0.7}
      >
        {item.logo_url ? (
          <Image
            source={resolveImageSource(item.logo_url)}
            style={styles.exhibitorLogo}
            resizeMode="contain"
          />
        ) : (
          <View style={[styles.exhibitorLogoPlaceholder, { backgroundColor: colors.primary + '20' }]}>
            <IconSymbol
              ios_icon_name="building.2.fill"
              android_material_icon_name="business"
              size={32}
              color={colors.primary}
            />
          </View>
        )}
        <View style={styles.exhibitorInfo}>
          <Text style={[styles.exhibitorName, { color: textColor }]} numberOfLines={2}>
            {item.name}
          </Text>
          {item.booth_number && (
            <View style={styles.boothBadge}>
              <IconSymbol
                ios_icon_name="mappin.circle.fill"
                android_material_icon_name="place"
                size={14}
                color={colors.primary}
              />
              <Text style={[styles.boothText, { color: colors.primary }]}>
                Booth {item.booth_number}
              </Text>
            </View>
          )}
          {item.description && (
            <Text style={[styles.exhibitorDescription, { color: secondaryTextColor }]} numberOfLines={2}>
              {item.description}
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

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Exhibitors',
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
              placeholder="Search exhibitors..."
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
            <Text style={[styles.loadingText, { color: secondaryTextColor }]}>Loading exhibitors...</Text>
          </View>
        ) : filteredExhibitors.length === 0 ? (
          <View style={styles.centerContainer}>
            <IconSymbol
              ios_icon_name="building.2.fill"
              android_material_icon_name="business"
              size={48}
              color={secondaryTextColor}
            />
            <Text style={[styles.emptyText, { color: secondaryTextColor }]}>
              {searchQuery || selectedLetter ? 'No exhibitors found' : 'No exhibitors available'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredExhibitors}
            renderItem={renderExhibitorCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={loadExhibitors}
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
  exhibitorCard: {
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
  exhibitorLogo: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#FFFFFF',
  },
  exhibitorLogoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exhibitorInfo: {
    flex: 1,
  },
  exhibitorName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  boothBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  boothText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  exhibitorDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
});
