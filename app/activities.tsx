
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
import { fetchActivities, Activity } from '@/utils/airtable';

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

export default function ActivitiesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const secondaryTextColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardBg = isDark ? colors.cardDark : colors.card;
  const borderColorValue = isDark ? colors.borderDark : colors.border;

  useEffect(() => {
    loadActivities();
  }, []);

  useEffect(() => {
    filterActivities();
  }, [searchQuery, activities]);

  const loadActivities = async () => {
    console.log('Loading activities...');
    try {
      setLoading(true);
      setError(null);
      const data = await fetchActivities();
      console.log('Activities loaded:', data.length);
      setActivities(data);
      setFilteredActivities(data);
    } catch (err) {
      console.error('Error loading activities:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load activities';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filterActivities = () => {
    if (!searchQuery.trim()) {
      setFilteredActivities(activities);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = activities.filter(activity => {
      const nameMatch = activity.name.toLowerCase().includes(query);
      const descMatch = activity.description?.toLowerCase().includes(query);
      const locationMatch = activity.location?.toLowerCase().includes(query);
      return nameMatch || descMatch || locationMatch;
    });

    console.log('Filtered activities:', filtered.length, 'from', activities.length);
    setFilteredActivities(filtered);
  };

  const handleActivityPress = (activity: Activity) => {
    console.log('Activity pressed:', activity.name);
    router.push({
      pathname: '/activity-detail',
      params: {
        id: activity.id,
        name: activity.name,
        description: activity.description || '',
        date: activity.date || '',
        time: activity.time || '',
        location: activity.location || '',
        url: activity.url || '',
        image_url: activity.image_url || '',
      },
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    return `${month} ${day}`;
  };

  const renderActivityCard = ({ item }: { item: Activity }) => {
    const formattedDate = formatDate(item.date || '');

    return (
      <TouchableOpacity
        style={[styles.activityCard, { backgroundColor: cardBg, borderColor: borderColorValue }]}
        onPress={() => handleActivityPress(item)}
        activeOpacity={0.7}
      >
        {item.image_url && (
          <Image
            source={resolveImageSource(item.image_url)}
            style={styles.activityImage}
            resizeMode="cover"
          />
        )}
        <View style={styles.activityContent}>
          <Text style={[styles.activityName, { color: textColor }]} numberOfLines={2}>
            {item.name}
          </Text>
          {item.description && (
            <Text style={[styles.activityDescription, { color: secondaryTextColor }]} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          <View style={styles.activityMeta}>
            {item.date && (
              <View style={styles.metaRow}>
                <IconSymbol
                  ios_icon_name="calendar"
                  android_material_icon_name="calendar-today"
                  size={14}
                  color={secondaryTextColor}
                />
                <Text style={[styles.metaText, { color: secondaryTextColor }]}>
                  {formattedDate}
                </Text>
                {item.time && (
                  <>
                    <Text style={[styles.metaSeparator, { color: secondaryTextColor }]}>•</Text>
                    <Text style={[styles.metaText, { color: secondaryTextColor }]}>
                      {item.time}
                    </Text>
                  </>
                )}
              </View>
            )}
            {item.location && (
              <View style={styles.metaRow}>
                <IconSymbol
                  ios_icon_name="location.fill"
                  android_material_icon_name="location-on"
                  size={14}
                  color={secondaryTextColor}
                />
                <Text style={[styles.metaText, { color: secondaryTextColor }]} numberOfLines={1}>
                  {item.location}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Activities',
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
              placeholder="Search activities..."
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
            <Text style={[styles.loadingText, { color: secondaryTextColor }]}>Loading activities...</Text>
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
              onPress={loadActivities}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredActivities.length === 0 ? (
          <View style={styles.centerContainer}>
            <IconSymbol
              ios_icon_name="calendar.badge.exclamationmark"
              android_material_icon_name="event-busy"
              size={48}
              color={secondaryTextColor}
            />
            <Text style={[styles.emptyText, { color: secondaryTextColor }]}>
              {searchQuery ? 'No activities found' : 'No activities available'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredActivities}
            renderItem={renderActivityCard}
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
  activityCard: {
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  activityImage: {
    width: '100%',
    height: 180,
  },
  activityContent: {
    padding: 16,
  },
  activityName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  activityDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  activityMeta: {
    gap: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 13,
    marginLeft: 4,
  },
  metaSeparator: {
    fontSize: 13,
    marginHorizontal: 6,
  },
});
