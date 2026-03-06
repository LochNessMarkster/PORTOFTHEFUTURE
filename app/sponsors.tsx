
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
import { fetchSponsors, Sponsor, BACKEND_URL } from '@/utils/airtable';

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// Sponsor tier order for sorting
const SPONSOR_TIER_ORDER = [
  'Presenting',
  'Platinum',
  'Gold',
  'Silver',
  'Bronze',
  'Other / Supporting',
];

// Sponsor tier colors for badges
const TIER_COLORS: { [key: string]: string } = {
  'Presenting': '#FFD700',
  'Platinum': '#E5E4E2',
  'Gold': '#FFBF00',
  'Silver': '#C0C0C0',
  'Bronze': '#CD7F32',
  'Other / Supporting': '#A9A9A9',
};

interface SponsorSection {
  title: string;
  data: Sponsor[];
}

export default function SponsorsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
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
    console.log('[Sponsors] ========================================');
    console.log('[Sponsors] Loading sponsors from backend proxy...');
    console.log('[Sponsors] Backend URL:', BACKEND_URL);
    console.log('[Sponsors] Full endpoint:', `${BACKEND_URL}/api/sponsors`);
    console.log('[Sponsors] ========================================');
    
    try {
      setError(null);
      const response = await fetchSponsors();
      
      console.log('[Sponsors] ========================================');
      console.log('[Sponsors] RESPONSE RECEIVED');
      console.log('[Sponsors] ========================================');
      console.log('[Sponsors] Full response:', JSON.stringify(response, null, 2));
      console.log('[Sponsors] Response keys:', Object.keys(response));
      console.log('[Sponsors] Source used:', response.source_used);
      console.log('[Sponsors] Updated at:', response.updated_at);
      console.log('[Sponsors] Sponsors array length:', response.sponsors?.length ?? 0);
      console.log('[Sponsors] Sponsors array type:', Array.isArray(response.sponsors) ? 'Array' : typeof response.sponsors);
      
      if (response.sponsors && response.sponsors.length > 0) {
        console.log('[Sponsors] ========================================');
        console.log('[Sponsors] FIRST SPONSOR DETAILS');
        console.log('[Sponsors] ========================================');
        console.log('[Sponsors] First sponsor:', JSON.stringify(response.sponsors[0], null, 2));
        console.log('[Sponsors] First sponsor keys:', Object.keys(response.sponsors[0]));
        console.log('[Sponsors] First sponsor name:', response.sponsors[0].name);
        console.log('[Sponsors] First sponsor level:', response.sponsors[0].level);
        console.log('[Sponsors] First sponsor logoUrl:', response.sponsors[0].logoUrl);
      } else {
        console.warn('[Sponsors] ========================================');
        console.warn('[Sponsors] WARNING: No sponsors returned from backend');
        console.warn('[Sponsors] Response structure:', JSON.stringify(response, null, 2));
        console.warn('[Sponsors] ========================================');
      }
      
      console.log('[Sponsors] Setting sponsors state with', response.sponsors?.length ?? 0, 'sponsors');
      setSponsors(response.sponsors || []);
      
      console.log('[Sponsors] ========================================');
      console.log('[Sponsors] LOAD COMPLETE');
      console.log('[Sponsors] ========================================');
    } catch (err) {
      console.error('[Sponsors] ========================================');
      console.error('[Sponsors] ERROR LOADING SPONSORS');
      console.error('[Sponsors] ========================================');
      console.error('[Sponsors] Error object:', err);
      console.error('[Sponsors] Error type:', typeof err);
      console.error('[Sponsors] Error message:', err instanceof Error ? err.message : String(err));
      console.error('[Sponsors] Error stack:', err instanceof Error ? err.stack : 'No stack trace');
      console.error('[Sponsors] ========================================');
      
      const errorMessage = err instanceof Error ? err.message : 'Unable to load sponsors';
      setError(errorMessage);
      setSponsors([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSponsors();
  }, [loadSponsors]);

  const onRefresh = useCallback(() => {
    console.log('[Sponsors] User triggered refresh');
    setRefreshing(true);
    loadSponsors();
  }, [loadSponsors]);

  // Normalize tier names to match SPONSOR_TIER_ORDER
  const normalizeTier = (tier: string | undefined): string => {
    if (!tier) return 'Other / Supporting';
    
    const lowerTier = tier.toLowerCase();
    
    if (lowerTier.includes('presenting')) return 'Presenting';
    if (lowerTier.includes('platinum')) return 'Platinum';
    if (lowerTier.includes('gold')) return 'Gold';
    if (lowerTier.includes('silver')) return 'Silver';
    if (lowerTier.includes('bronze')) return 'Bronze';
    
    return 'Other / Supporting';
  };

  // Sort sponsors by tier first, then alphabetically by name
  const sortedSponsors = useMemo(() => {
    const sorted = [...sponsors].sort((a, b) => {
      const tierA = normalizeTier(a.level);
      const tierB = normalizeTier(b.level);
      
      const tierIndexA = SPONSOR_TIER_ORDER.indexOf(tierA);
      const tierIndexB = SPONSOR_TIER_ORDER.indexOf(tierB);
      
      if (tierIndexA !== tierIndexB) {
        return tierIndexA - tierIndexB;
      }
      
      return (a.name || '').localeCompare(b.name || '');
    });
    
    console.log('[Sponsors] Sorted sponsors:', sorted.length);
    return sorted;
  }, [sponsors]);

  // Filter sponsors by search query and selected letter
  const filteredSponsors = useMemo(() => {
    let filtered = sortedSponsors;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(sponsor => {
        const nameMatch = (sponsor.name || '').toLowerCase().includes(query);
        const tierMatch = (sponsor.level || '').toLowerCase().includes(query);
        return nameMatch || tierMatch;
      });
    }

    // Filter by selected letter
    if (selectedLetter) {
      filtered = filtered.filter(sponsor => 
        (sponsor.name || '').toUpperCase().startsWith(selectedLetter)
      );
    }

    console.log('[Sponsors] Filtered:', filtered.length, 'from', sortedSponsors.length);
    return filtered;
  }, [sortedSponsors, searchQuery, selectedLetter]);

  // Group sponsors by tier for section list
  const groupedSponsors = useMemo(() => {
    const groups: { [key: string]: Sponsor[] } = {};
    
    SPONSOR_TIER_ORDER.forEach(tier => {
      groups[tier] = [];
    });
    
    filteredSponsors.forEach(sponsor => {
      const tier = normalizeTier(sponsor.level);
      if (groups[tier]) {
        groups[tier].push(sponsor);
      } else {
        groups['Other / Supporting'].push(sponsor);
      }
    });
    
    const sections: SponsorSection[] = SPONSOR_TIER_ORDER
      .filter(tier => groups[tier].length > 0)
      .map(tier => ({
        title: tier,
        data: groups[tier],
      }));
    
    console.log('[Sponsors] Grouped into', sections.length, 'sections');
    return sections;
  }, [filteredSponsors]);

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
      const firstLetter = (sponsor.name || '').charAt(0).toUpperCase();
      if (ALPHABET.includes(firstLetter)) {
        letters.add(firstLetter);
      }
    });
    return letters;
  }, [sponsors]);

  const getTierBadgeColor = (tier: string | undefined): string => {
    const normalizedTier = normalizeTier(tier);
    return TIER_COLORS[normalizedTier] || colors.primary;
  };

  const renderSponsorCard = (item: Sponsor) => {
    const normalizedTier = normalizeTier(item.level);
    const tierColor = getTierBadgeColor(item.level);

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
        <View style={[styles.tierBadge, { backgroundColor: tierColor + '30', borderColor: tierColor }]}>
          <Text style={[styles.tierText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            {normalizedTier}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = (section: SponsorSection) => {
    const tierColor = TIER_COLORS[section.title] || colors.primary;
    
    return (
      <View style={[styles.sectionHeader, { backgroundColor: bgColor }]}>
        <View style={[styles.sectionHeaderBadge, { backgroundColor: tierColor + '20', borderColor: tierColor }]}>
          <Text style={[styles.sectionHeaderText, { color: textColor }]}>
            {section.title}
          </Text>
          <Text style={[styles.sectionHeaderCount, { color: secondaryTextColor }]}>
            {section.data.length}
          </Text>
        </View>
      </View>
    );
  };

  const renderSection = (section: SponsorSection) => {
    return (
      <View key={section.title}>
        {renderSectionHeader(section)}
        <FlatList
          data={section.data}
          renderItem={({ item }) => renderSponsorCard(item)}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          scrollEnabled={false}
        />
      </View>
    );
  };

  const loadingText = 'Loading sponsors...';
  const emptyMessage = 'No sponsors available right now.';
  const errorMessage = "We're having trouble loading sponsors right now. Please try again in a moment.";

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
            <Text style={[styles.errorText, { color: textColor }]}>{errorMessage}</Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={loadSponsors}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : groupedSponsors.length === 0 ? (
          <View style={styles.centerContainer}>
            <IconSymbol
              ios_icon_name="heart.slash"
              android_material_icon_name="favorite"
              size={48}
              color={secondaryTextColor}
            />
            <Text style={[styles.emptyText, { color: secondaryTextColor }]}>
              {emptyMessage}
            </Text>
          </View>
        ) : (
          <ScrollView
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
          >
            {groupedSponsors.map(section => renderSection(section))}
          </ScrollView>
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
    marginBottom: 8,
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
  sectionHeader: {
    paddingVertical: 12,
    marginBottom: 8,
  },
  sectionHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionHeaderCount: {
    fontSize: 14,
    fontWeight: '600',
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
