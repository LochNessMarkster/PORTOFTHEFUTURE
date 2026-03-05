
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
import { fetchExhibitors, Exhibitor } from '@/utils/airtable';

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

export default function ExhibitorsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const [exhibitors, setExhibitors] = useState<Exhibitor[]>([]);
  const [filteredExhibitors, setFilteredExhibitors] = useState<Exhibitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const secondaryTextColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardBg = isDark ? colors.cardDark : colors.card;
  const borderColorValue = isDark ? colors.borderDark : colors.border;

  useEffect(() => {
    loadExhibitors();
  }, []);

  useEffect(() => {
    filterExhibitors();
  }, [searchQuery, exhibitors]);

  const loadExhibitors = async () => {
    console.log('Loading exhibitors...');
    try {
      setLoading(true);
      setError(null);
      const data = await fetchExhibitors();
      console.log('Exhibitors loaded:', data.length);
      setExhibitors(data);
      setFilteredExhibitors(data);
    } catch (err) {
      console.error('Error loading exhibitors:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load exhibitors';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filterExhibitors = () => {
    if (!searchQuery.trim()) {
      setFilteredExhibitors(exhibitors);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = exhibitors.filter(exhibitor => {
      const nameMatch = exhibitor.name.toLowerCase().includes(query);
      return nameMatch;
    });

    console.log('Filtered exhibitors:', filtered.length, 'from', exhibitors.length);
    setFilteredExhibitors(filtered);
  };

  const handleExhibitorPress = (exhibitor: Exhibitor) => {
    console.log('Exhibitor pressed:', exhibitor.name);
    router.push({
      pathname: '/exhibitor-detail',
      params: {
        id: exhibitor.id,
        name: exhibitor.name,
        description: exhibitor.description || '',
        logo_url: exhibitor.logo_url || '',
      },
    });
  };

  const renderExhibitorCard = ({ item }: { item: Exhibitor }) => {
    return (
      <TouchableOpacity
        style={[styles.exhibitorCard, { backgroundColor: cardBg, borderColor: borderColorValue }]}
        onPress={() => handleExhibitorPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.logoContainer}>
          {item.logo_url ? (
            <Image
              source={resolveImageSource(item.logo_url)}
              style={styles.logo}
              resizeMode="contain"
            />
          ) : (
            <View style={[styles.logoPlaceholder, { backgroundColor: colors.primary + '20' }]}>
              <IconSymbol
                ios_icon_name="building.2.fill"
                android_material_icon_name="store"
                size={32}
                color={colors.primary}
              />
            </View>
          )}
        </View>
        <Text style={[styles.exhibitorName, { color: textColor }]} numberOfLines={2}>
          {item.name}
        </Text>
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

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: secondaryTextColor }]}>Loading exhibitors...</Text>
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
              onPress={loadExhibitors}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredExhibitors.length === 0 ? (
          <View style={styles.centerContainer}>
            <IconSymbol
              ios_icon_name="building.2.slash"
              android_material_icon_name="store"
              size={48}
              color={secondaryTextColor}
            />
            <Text style={[styles.emptyText, { color: secondaryTextColor }]}>
              {searchQuery ? 'No exhibitors found' : 'No exhibitors available'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredExhibitors}
            renderItem={renderExhibitorCard}
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
  exhibitorCard: {
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
  exhibitorName: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
