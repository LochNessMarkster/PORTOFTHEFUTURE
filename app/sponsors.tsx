
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { fetchSponsors, Sponsor } from '@/utils/airtable';

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// Sponsor tier colors for badges
const TIER_COLORS: { [key: string]: string } = {
  'Presenting Sponsor': '#FFD700',
  'Platinum Sponsor': '#E5E4E2',
  'Gold Sponsor': '#FFBF00',
  'Silver Sponsor': '#C0C0C0',
  'Bronze Sponsor': '#CD7F32',
  'Supporting Sponsor': '#A9A9A9',
};

export default function SponsorsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [filteredSponsors, setFilteredSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const secondaryTextColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardBg = isDark ? colors.cardDark : colors.card;
  const borderColorValue = isDark ? colors.borderDark : colors.border;

  const loadSponsors = useCallback(async () => {
    console.log('[Sponsors] Loading sponsors from backend proxy...');
    try {
      setError(null);
      const response = await fetchSponsors();
      console.log('[Sponsors] Loaded:', response.sponsors.length, 'source:', response.source_used);
      setSponsors(response.sponsors);
      setFilteredSponsors(response.sponsors);
    } catch (err) {
      console.error('[Sponsors] Error loading sponsors:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unable to load sponsors. Pull to refresh.';
      setError(errorMessage);
      setSponsors([]);
      setFilteredSponsors([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSponsors();
  }, [loadSponsors]);

  const onRefresh = useCallback(() => {
    console.log('[Sponsors] Refreshing sponsors...');
    setRefreshing(true);
    loadSponsors();
  }, [loadSponsors]);

  const filterSponsors = useCallback(() => {
    let filtered = sponsors;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(sponsor => {
        const nameMatch = sponsor.name.toLowerCase().includes(query);
        const levelMatch = sponsor.level?.toLowerCase().includes(query);
        return nameMatch || levelMatch;
      });
    }

    // Filter by selected letter
    if (selectedLetter) {
      filtered = filtered.filter(sponsor => 
        sponsor.name.toUpperCase().startsWith(selectedLetter)
      );
    }

    console.log('[Sponsors] Filtered:', filtered.length, 'from', sponsors.length);
    setFilteredSponsors(filtered);
  }, [searchQuery, selectedLetter, sponsors]);

  useEffect(() => {
    filterSponsors();
  }, [filterSponsors]);

  const handleSponsorPress = (sponsor: Sponsor) => {
    console.log('[Sponsors] Sponsor pressed:', sponsor.name);
    router.push({
      pathname: '/sponsor-detail',
      params: {
        sponsorData: JSON.stringify(sponsor),
      },
    });
  };

  const handleLetterPress = (letter: string) => {
    console.log('[Sponsors] Letter pressed:', letter);
    if (selectedLetter === letter) {
      setSelectedLetter(null);
    } else {
      setSelectedLetter(letter);
    }
  };

  const availableLetters = useMemo(() => {
    const letters = new Set<string>();
    sponsors.forEach(sponsor => {
      const firstLetter = sponsor.name.charAt(0).toUpperCase();
      if (ALPHABET.includes(firstLetter)) {
        letters.add(firstLetter);
      }
    });
    return letters;
  }, [sponsors]);

  const getTierBadgeColor = (tier: string | undefined): string => {
    if (!tier) return colors.primary;
    return TIER_COLORS[tier] || colors.primary;
  };

  const renderSponsorCard = ({ item }: { item: Sponsor }) => {
    const tierLabel = item.level || 'Sponsor';
    const tierColor = getTierBadgeColor(item.level);
    const hasTier = Boolean(item.level);

    return (
      <TouchableOpacity
        style={[styles.sponsorCard, { backgroundColor: cardBg, borderColor: borderColorValue }]}
        onPress={() => handleSponsorPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.logoContainer}>
          {item.logoUrl ? (
            <Image
              source={resolveImageSource(item.logoUrl)}
              style={styles.logo}
              resizeMode="contain"
            />
          ) : (
            <View style={[styles.logoPlaceholder, { backgroundColor: colors.primary + '20' }]}>
              <IconSymbol
                ios_icon_name="heart.fill"
                android_material_icon_name="favorite"
                size={32}
                color={colors.primary}
              />
            </View>
          )}
        </View>
        <Text style={[styles.sponsorName, { color: textColor }]} numberOfLines={2}>
          {item.name}
        </Text>
        {hasTier && (
          <View style={[styles.tierBadge, { backgroundColor: tierColor + '30', borderColor: tierColor }]}>
            <Text style={[styles.tierText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              {tierLabel}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const loadingText = 'Loading sponsors...';
  const emptyText = searchQuery || selectedLetter ? 'No sponsors found' : 'No sponsors available';

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Sponsors',
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
              placeholder="Search sponsors..."
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
                      backgroundColor: isSelected ? colors.primary : cardBg,
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

        {selectedLetter && (
          <View style={styles.filterIndicator}>
            <Text style={[styles.filterText, { color: secondaryTextColor }]}>
              Showing sponsors starting with
            </Text>
            <Text style={[styles.filterLetter, { color: colors.primary }]}>
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

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
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
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={loadSponsors}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredSponsors.length === 0 ? (
          <View style={styles.centerContainer}>
            <IconSymbol
              ios_icon_name="heart.slash"
              android_material_icon_name="favorite"
              size={48}
              color={secondaryTextColor}
            />
            <Text style={[styles.emptyText, { color: secondaryTextColor }]}>
              {emptyText}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredSponsors}
            renderItem={renderSponsorCard}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.row}
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
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sponsorCard: {
    flex: 1,
    maxWidth: '48%',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  logoContainer: {
    width: '100%',
    height: 80,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  logo: {
    width: '90%',
    height: '90%',
  },
  logoPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sponsorName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 6,
    minHeight: 36,
  },
  tierBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  tierText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
