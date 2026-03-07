
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
  Linking,
} from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { fetchBackendPresentations, BackendPresentation as Presentation, normalizeToArray } from '@/utils/airtable';

export default function PresentationsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [filteredPresentations, setFilteredPresentations] = useState<Presentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const secondaryTextColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardBg = isDark ? colors.cardDark : colors.card;
  const borderColorValue = isDark ? colors.borderDark : colors.border;

  const loadPresentations = useCallback(async () => {
    console.log('[Presentations] Loading presentations from backend...');
    try {
      setLoading(true);
      setError(null);
      const response = await fetchBackendPresentations();
      
      console.log('[Presentations] Raw API response type:', typeof response);
      console.log('[Presentations] Is response an array?', Array.isArray(response));
      
      // Normalize the response to ensure we have an array
      const normalizedPresentations = normalizeToArray<Presentation>(response);
      
      console.log('[Presentations] Normalized presentations - Is array?', Array.isArray(normalizedPresentations));
      console.log('[Presentations] Normalized presentations - Length:', normalizedPresentations.length);
      
      setPresentations(normalizedPresentations);
      setFilteredPresentations(normalizedPresentations);
    } catch (err) {
      console.error('[Presentations] Error loading presentations:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load presentations';
      setError(errorMessage);
      setPresentations([]);
      setFilteredPresentations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPresentations();
  }, [loadPresentations]);

  const filterPresentations = useCallback(() => {
    console.log('[Presentations] Filtering presentations. Total:', presentations.length);
    console.log('[Presentations] presentations is array?', Array.isArray(presentations));
    
    // Defensive check
    if (!Array.isArray(presentations)) {
      console.error('[Presentations] presentations is not an array!', typeof presentations);
      setFilteredPresentations([]);
      return;
    }

    if (!searchQuery.trim()) {
      setFilteredPresentations(presentations);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = presentations.filter(presentation => {
      const titleMatch = presentation.title.toLowerCase().includes(query);
      const descriptionMatch = presentation.description?.toLowerCase().includes(query);
      return titleMatch || descriptionMatch;
    });

    console.log('[Presentations] Filtered presentations:', filtered.length);
    setFilteredPresentations(filtered);
  }, [searchQuery, presentations]);

  useEffect(() => {
    filterPresentations();
  }, [filterPresentations]);

  const handleDownloadPress = (presentation: Presentation) => {
    if (presentation.file_url) {
      console.log('[Presentations] Opening presentation file:', presentation.file_url);
      Linking.openURL(presentation.file_url).catch(err => {
        console.error('[Presentations] Failed to open file URL:', err);
      });
    }
  };

  const renderPresentationCard = ({ item }: { item: Presentation }) => {
    return (
      <View style={[styles.presentationCard, { backgroundColor: cardBg, borderColor: borderColorValue }]}>
        <View style={styles.presentationInfo}>
          <Text style={[styles.presentationTitle, { color: textColor }]} numberOfLines={2}>
            {item.title}
          </Text>
          {item.description && (
            <Text style={[styles.presentationDescription, { color: secondaryTextColor }]} numberOfLines={3}>
              {item.description}
            </Text>
          )}
        </View>
        {item.file_url && (
          <TouchableOpacity
            style={[styles.downloadButton, { backgroundColor: colors.primary }]}
            onPress={() => handleDownloadPress(item)}
            activeOpacity={0.8}
          >
            <IconSymbol
              ios_icon_name="arrow.down.circle.fill"
              android_material_icon_name="download"
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.downloadButtonText}>Download</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Presentations',
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
              placeholder="Search presentations..."
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
            <Text style={[styles.loadingText, { color: secondaryTextColor }]}>Loading presentations...</Text>
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
              onPress={loadPresentations}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredPresentations.length === 0 ? (
          <View style={styles.centerContainer}>
            <IconSymbol
              ios_icon_name="doc.text.fill"
              android_material_icon_name="description"
              size={48}
              color={secondaryTextColor}
            />
            <Text style={[styles.emptyText, { color: secondaryTextColor }]}>
              {searchQuery ? 'No presentations found' : 'No presentations available'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredPresentations}
            renderItem={renderPresentationCard}
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
  presentationCard: {
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
  presentationInfo: {
    marginBottom: 12,
  },
  presentationTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 6,
  },
  presentationDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
});
