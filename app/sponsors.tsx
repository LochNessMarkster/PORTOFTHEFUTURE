
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
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
import { fetchSponsors, Sponsor } from '@/utils/airtable';

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

interface SponsorSection {
  title: string;
  data: Sponsor[];
}

export default function SponsorsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [sections, setSections] = useState<SponsorSection[]>([]);
  const [filteredSections, setFilteredSections] = useState<SponsorSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const secondaryTextColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardBg = isDark ? colors.cardDark : colors.card;
  const borderColorValue = isDark ? colors.borderDark : colors.border;

  const groupByLevel = useCallback((sponsorList: Sponsor[]): SponsorSection[] => {
    const levelMap = new Map<string, Sponsor[]>();
    
    sponsorList.forEach(sponsor => {
      const level = sponsor.level || 'Other';
      if (!levelMap.has(level)) {
        levelMap.set(level, []);
      }
      levelMap.get(level)!.push(sponsor);
    });

    const sectionsArray: SponsorSection[] = [];
    levelMap.forEach((sponsorsInLevel, level) => {
      sectionsArray.push({
        title: level,
        data: sponsorsInLevel,
      });
    });

    return sectionsArray;
  }, []);

  const loadSponsors = useCallback(async () => {
    console.log('[API] Loading sponsors from backend proxy...');
    try {
      setError(null);
      const response = await fetchSponsors();
      console.log('[API] Sponsors loaded:', response.sponsors.length, 'source:', response.source_used);
      setSponsors(response.sponsors);
      
      const grouped = groupByLevel(response.sponsors);
      setSections(grouped);
      setFilteredSections(grouped);
    } catch (err) {
      console.error('[API] Error loading sponsors:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unable to load sponsors. Pull to refresh.';
      setError(errorMessage);
      setSponsors([]);
      setSections([]);
      setFilteredSections([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [groupByLevel]);

  useEffect(() => {
    loadSponsors();
  }, [loadSponsors]);

  const onRefresh = useCallback(() => {
    console.log('Refreshing sponsors...');
    setRefreshing(true);
    loadSponsors();
  }, [loadSponsors]);

  const filterSponsors = useCallback(() => {
    if (!searchQuery.trim()) {
      setFilteredSections(sections);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = sections.map(section => ({
      title: section.title,
      data: section.data.filter(sponsor => sponsor.name.toLowerCase().includes(query)),
    })).filter(section => section.data.length > 0);

    console.log('Filtered sponsor sections:', filtered.length);
    setFilteredSections(filtered);
  }, [searchQuery, sections]);

  useEffect(() => {
    filterSponsors();
  }, [filterSponsors]);

  const handleSponsorPress = (sponsor: Sponsor) => {
    console.log('Sponsor pressed:', sponsor.name);
    router.push({
      pathname: '/sponsor-detail',
      params: {
        sponsorData: JSON.stringify(sponsor),
      },
    });
  };

  const renderSponsorCard = ({ item }: { item: Sponsor }) => {
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
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }: { section: SponsorSection }) => {
    return (
      <View style={[styles.sectionHeader, { backgroundColor: bgColor }]}>
        <Text style={[styles.sectionHeaderText, { color: textColor }]}>{section.title}</Text>
      </View>
    );
  };

  const loadingText = 'Loading sponsors...';
  const emptyText = searchQuery ? 'No sponsors found' : 'No sponsors available';

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
        ) : filteredSections.length === 0 ? (
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
          <SectionList
            sections={filteredSections}
            renderItem={renderSponsorCard}
            renderSectionHeader={renderSectionHeader}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
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
  sectionHeader: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  sectionHeaderText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  sponsorCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
    height: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
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
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
