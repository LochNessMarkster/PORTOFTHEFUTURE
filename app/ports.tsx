
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
import { fetchBackendPorts, BackendPort as Port } from '@/utils/airtable';

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

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const secondaryTextColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardBg = isDark ? colors.cardDark : colors.card;
  const borderColorValue = isDark ? colors.borderDark : colors.border;

  useEffect(() => {
    loadPorts();
  }, []);

  useEffect(() => {
    filterPorts();
  }, [searchQuery, ports]);

  const loadPorts = async () => {
    console.log('[API] Loading ports from backend...');
    try {
      setLoading(true);
      setError(null);
      const data = await fetchBackendPorts();
      console.log('[API] Ports loaded:', data.length);
      setPorts(data);
      setFilteredPorts(data);
    } catch (err) {
      console.error('[API] Error loading ports:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load ports';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filterPorts = () => {
    if (!searchQuery.trim()) {
      setFilteredPorts(ports);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = ports.filter(port => {
      const nameMatch = port.name.toLowerCase().includes(query);
      const introMatch = port.intro?.toLowerCase().includes(query);
      return nameMatch || introMatch;
    });

    console.log('Filtered ports:', filtered.length, 'from', ports.length);
    setFilteredPorts(filtered);
  };

  const handlePortPress = (port: Port) => {
    console.log('Port pressed:', port.name);
    router.push({
      pathname: '/port-detail',
      params: {
        id: port.id,
        name: port.name,
        intro: port.intro || '',
        bio: port.bio || '',
        url: port.url || '',
        logo_url: port.logo_url || '',
        featured_image_url: port.featured_image_url || '',
      },
    });
  };

  const renderPortCard = ({ item }: { item: Port }) => {
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
          {item.intro && (
            <Text style={[styles.portIntro, { color: secondaryTextColor }]} numberOfLines={2}>
              {item.intro}
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
              placeholder="Search ports..."
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
    marginBottom: 4,
  },
  portIntro: {
    fontSize: 14,
    lineHeight: 20,
  },
});
