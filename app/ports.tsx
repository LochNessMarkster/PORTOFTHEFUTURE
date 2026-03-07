
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
  RefreshControl,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { fetchBackendPorts, BackendPort as Port, normalizeToArray } from '@/utils/airtable';

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

export default function PortsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const [ports, setPorts] = useState<Port[]>([]);
  const [filteredPorts, setFilteredPorts] = useState<Port[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const secondaryTextColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardBg = isDark ? colors.cardDark : colors.card;
  const borderColorValue = isDark ? colors.borderDark : colors.border;

  const loadPorts = useCallback(async () => {
    console.log('[Ports] Loading ports from backend...');
    try {
      setLoading(true);
      setError(null);
      const response = await fetchBackendPorts();
      
      console.log('[Ports] Raw API response type:', typeof response);
      console.log('[Ports] Is response an array?', Array.isArray(response));
      
      // Normalize the response to ensure we have an array
      const normalizedPorts = normalizeToArray<Port>(response);
      
      console.log('[Ports] Normalized ports - Is array?', Array.isArray(normalizedPorts));
      console.log('[Ports] Normalized ports - Length:', normalizedPorts.length);
      
      setPorts(normalizedPorts);
      setFilteredPorts(normalizedPorts);
    } catch (err) {
      console.error('[Ports] Error loading ports:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load ports';
      setError(errorMessage);
      setPorts([]);
      setFilteredPorts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPorts();
  }, [loadPorts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPorts();
    setRefreshing(false);
  }, [loadPorts]);

  const extractLocation = (port: Port): string => {
    const intro = port.intro || '';
    const name = port.name || '';
    
    const cityMatch = name.match(/Port of ([^,]+)/i) || name.match(/([^,]+) Port/i);
    if (cityMatch && cityMatch[1]) {
      return cityMatch[1].trim();
    }
    
    const firstSentence = intro.split(/[.!?]/)[0];
    if (firstSentence && firstSentence.length < 50) {
      return firstSentence.trim();
    }
    
    return '';
  };

  const filterPorts = useCallback(() => {
    console.log('[Ports] Filtering ports. Total:', ports.length);
    console.log('[Ports] ports is array?', Array.isArray(ports));
    
    // Defensive check
    if (!Array.isArray(ports)) {
      console.error('[Ports] ports is not an array!', typeof ports);
      setFilteredPorts([]);
      return;
    }

    let filtered = [...ports];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(port => {
        const nameMatch = port.name.toLowerCase().includes(query);
        const locationMatch = extractLocation(port).toLowerCase().includes(query);
        const introMatch = (port.intro || '').toLowerCase().includes(query);
        return nameMatch || locationMatch || introMatch;
      });
    }

    console.log('[Ports] Filtered ports:', filtered.length);
    setFilteredPorts(filtered);
  }, [searchQuery, ports]);

  useEffect(() => {
    filterPorts();
  }, [filterPorts]);

  const handlePortPress = (port: Port) => {
    console.log('[Ports] Port pressed:', port.name);
    const location = extractLocation(port);
    router.push({
      pathname: '/port-detail',
      params: {
        id: port.id,
        name: port.name,
        location: location,
        intro: port.intro || '',
        bio: port.bio || '',
        url: port.url || '',
        logo_url: port.logo_url || '',
        featured_image_url: port.featured_image_url || '',
      },
    });
  };

  const getPreview = (text: string | undefined): string => {
    if (!text) return '';
    if (text.length <= 80) return text;
    return text.substring(0, 77) + '...';
  };

  const renderPortCard = ({ item }: { item: Port }) => {
    const location = extractLocation(item);
    const preview = getPreview(item.intro);

    return (
      <TouchableOpacity
        style={[styles.portCard, { backgroundColor: cardBg, borderColor: borderColorValue }]}
        onPress={() => handlePortPress(item)}
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
                ios_icon_name="ferry.fill"
                android_material_icon_name="directions-boat"
                size={32}
                color={colors.primary}
              />
            </View>
          )}
        </View>

        <View style={styles.portInfo}>
          <Text style={[styles.portName, { color: textColor }]} numberOfLines={2}>
            {item.name}
          </Text>
          
          {location && (
            <View style={styles.locationRow}>
              <IconSymbol
                ios_icon_name="location.fill"
                android_material_icon_name="place"
                size={14}
                color={secondaryTextColor}
              />
              <Text style={[styles.locationText, { color: secondaryTextColor }]} numberOfLines={1}>
                {location}
              </Text>
            </View>
          )}

          {preview && (
            <Text style={[styles.portPreview, { color: secondaryTextColor }]} numberOfLines={2}>
              {preview}
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
          title: 'Ports',
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
              placeholder="Search by name or location..."
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
            <Text style={[styles.loadingText, { color: secondaryTextColor }]}>Loading ports...</Text>
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
              onPress={loadPorts}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredPorts.length === 0 ? (
          <View style={styles.centerContainer}>
            <IconSymbol
              ios_icon_name="ferry.fill"
              android_material_icon_name="directions-boat"
              size={48}
              color={secondaryTextColor}
            />
            <Text style={[styles.emptyText, { color: secondaryTextColor }]}>
              {searchQuery ? 'No ports found' : 'No ports available'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredPorts}
            renderItem={renderPortCard}
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
    paddingBottom: 12,
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
  portCard: {
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
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
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
  portInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  portName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  locationText: {
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '500',
  },
  portPreview: {
    fontSize: 14,
    lineHeight: 20,
  },
});
