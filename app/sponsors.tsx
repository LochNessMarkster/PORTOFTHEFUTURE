
import { fetchSponsors, Sponsor, BACKEND_URL } from '@/utils/airtable';
import { Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

interface SponsorSection {
  title: string;
  data: Sponsor[];
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const SPONSOR_TIER_ORDER = ['Platinum', 'Gold', 'Silver', 'Bronze', 'Supporter'];

const TIER_COLORS: Record<string, string> = {
  'Platinum': '#E5E4E2',
  'Gold': '#FFD700',
  'Silver': '#C0C0C0',
  'Bronze': '#CD7F32',
  'Supporter': '#4A90E2',
  'default': '#95A5A6',
};

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

export default function SponsorsScreen() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [filteredSponsors, setFilteredSponsors] = useState<Sponsor[]>([]);
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

  const loadSponsors = useCallback(async () => {
    console.log('[Sponsors] Loading sponsors...');
    try {
      setLoading(true);
      const data = await fetchSponsors();
      console.log('[Sponsors] Loaded sponsors:', data.length);
      setSponsors(data);
      setFilteredSponsors(data);
    } catch (error) {
      console.error('[Sponsors] Error loading sponsors:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSponsors();
  }, [loadSponsors]);

  const normalizeTier = (tier: string | undefined): string => {
    if (!tier) return 'Supporter';
    const normalized = tier.trim();
    if (SPONSOR_TIER_ORDER.includes(normalized)) return normalized;
    return 'Supporter';
  };

  useEffect(() => {
    let filtered = sponsors;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(sponsor =>
        sponsor.name.toLowerCase().includes(query) ||
        sponsor.description?.toLowerCase().includes(query)
      );
    }

    if (selectedLetter) {
      filtered = filtered.filter(sponsor =>
        sponsor.name.charAt(0).toUpperCase() === selectedLetter
      );
    }

    setFilteredSponsors(filtered);
  }, [searchQuery, selectedLetter, sponsors]);

  const handleSponsorPress = (sponsor: Sponsor) => {
    console.log('[Sponsors] Sponsor pressed:', sponsor.name);
    router.push({
      pathname: '/sponsor-detail',
      params: {
        id: sponsor.id,
        name: sponsor.name,
        tier: sponsor.tier || '',
        description: sponsor.description || '',
        website: sponsor.website || '',
        logo_url: sponsor.logo_url || '',
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

  const getTierBadgeColor = (tier: string | undefined): string => {
    const normalized = normalizeTier(tier);
    return TIER_COLORS[normalized] || TIER_COLORS.default;
  };

  const sponsorSections = useMemo((): SponsorSection[] => {
    const sections: SponsorSection[] = [];

    SPONSOR_TIER_ORDER.forEach(tier => {
      const tierSponsors = filteredSponsors.filter(s => normalizeTier(s.tier) === tier);
      if (tierSponsors.length > 0) {
        sections.push({
          title: `${tier} Sponsors`,
          data: tierSponsors.sort((a, b) => a.name.localeCompare(b.name)),
        });
      }
    });

    return sections;
  }, [filteredSponsors]);

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

  const renderSponsorCard = (item: Sponsor) => {
    const tierColor = getTierBadgeColor(item.tier);

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.sponsorCard, { backgroundColor: cardBg, borderColor: borderColorValue }]}
        onPress={() => handleSponsorPress(item)}
        activeOpacity={0.7}
      >
        {item.logo_url ? (
          <Image
            source={resolveImageSource(item.logo_url)}
            style={styles.sponsorLogo}
            resizeMode="contain"
          />
        ) : (
          <View style={[styles.sponsorLogoPlaceholder, { backgroundColor: colors.primary + '20' }]}>
            <IconSymbol
              ios_icon_name="star.fill"
              android_material_icon_name="star"
              size={32}
              color={colors.primary}
            />
          </View>
        )}
        <View style={styles.sponsorInfo}>
          <Text style={[styles.sponsorName, { color: textColor }]} numberOfLines={2}>
            {item.name}
          </Text>
          {item.tier && (
            <View style={[styles.tierBadge, { backgroundColor: tierColor + '20' }]}>
              <Text style={[styles.tierText, { color: tierColor }]}>
                {normalizeTier(item.tier)}
              </Text>
            </View>
          )}
          {item.description && (
            <Text style={[styles.sponsorDescription, { color: secondaryTextColor }]} numberOfLines={2}>
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

  const renderSectionHeader = (section: SponsorSection) => {
    return (
      <View key={`header-${section.title}`} style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>
          {section.title}
        </Text>
      </View>
    );
  };

  const renderSection = (section: SponsorSection) => {
    return (
      <View key={section.title}>
        {renderSectionHeader(section)}
        {section.data.map(sponsor => renderSponsorCard(sponsor))}
      </View>
    );
  };

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
            <Text style={[styles.loadingText, { color: secondaryTextColor }]}>Loading sponsors...</Text>
          </View>
        ) : filteredSponsors.length === 0 ? (
          <View style={styles.centerContainer}>
            <IconSymbol
              ios_icon_name="star.fill"
              android_material_icon_name="star"
              size={48}
              color={secondaryTextColor}
            />
            <Text style={[styles.emptyText, { color: secondaryTextColor }]}>
              {searchQuery || selectedLetter ? 'No sponsors found' : 'No sponsors available'}
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={loadSponsors}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
          >
            {sponsorSections.map(section => renderSection(section))}
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
  scrollView: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  sectionHeader: {
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  sponsorCard: {
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
  sponsorLogo: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#FFFFFF',
  },
  sponsorLogoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sponsorInfo: {
    flex: 1,
  },
  sponsorName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  tierBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  tierText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sponsorDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
});
