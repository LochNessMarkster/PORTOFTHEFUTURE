
import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, ScrollView, useColorScheme, TouchableOpacity, Image, ActivityIndicator, ImageSourcePropType, RefreshControl } from "react-native";
import { Stack, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { fetchAnnouncements, type AnnouncementItem } from "@/utils/airtable";

// Helper to resolve image sources (handles both local require() and remote URLs)
function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

type Announcement = AnnouncementItem;

interface NavigationCard {
  id: string;
  title: string;
  ios_icon: string;
  android_icon: string;
  route?: string;
}

const navigationCards: NavigationCard[] = [
  { id: '1', title: 'Agenda', ios_icon: 'calendar', android_icon: 'calendar-today' },
  { id: '2', title: 'Activities', ios_icon: 'star.fill', android_icon: 'star' },
  { id: '3', title: 'Speakers', ios_icon: 'person.2.fill', android_icon: 'group' },
  { id: '4', title: 'Floor Plan', ios_icon: 'map.fill', android_icon: 'map' },
  { id: '5', title: 'Exhibitors', ios_icon: 'building.2.fill', android_icon: 'store' },
  { id: '6', title: 'Sponsors', ios_icon: 'heart.fill', android_icon: 'favorite' },
  { id: '7', title: 'Ports', ios_icon: 'ferry.fill', android_icon: 'directions-boat' },
  { id: '8', title: 'Networking', ios_icon: 'person.3.fill', android_icon: 'people' },
  { id: '9', title: 'Presentations', ios_icon: 'doc.text.fill', android_icon: 'description' },
  { id: '10', title: 'My Schedule', ios_icon: 'bookmark.fill', android_icon: 'bookmark' },
];

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useAuth();
  const router = useRouter();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const secondaryTextColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardBg = isDark ? colors.cardDark : colors.card;
  const borderColorValue = isDark ? colors.borderDark : colors.border;

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    console.log('[API] Fetching announcements from backend proxy...');
    try {
      if (!refreshing) {
        setLoading(true);
      }
      setError(null);

      const data = await fetchAnnouncements();
      console.log('[API] Received announcements from backend:', data.announcements?.length || 0, 'records');
      console.log('[API] Source used:', data.source_used);
      console.log('[API] Updated at:', data.updated_at);

      setAnnouncements(data.announcements || []);
    } catch (err) {
      console.error('[API] Error fetching announcements:', err);
      setError('Announcements unavailable. Pull to refresh.');
      setAnnouncements([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    console.log('[API] User initiated refresh');
    setRefreshing(true);
    loadAnnouncements();
  };

  const handleCardPress = (card: NavigationCard) => {
    console.log('Navigation card pressed:', card.title);
    
    // Navigate to the appropriate screen based on card title
    switch (card.title) {
      case 'Speakers':
        router.push('/speakers');
        break;
      case 'Activities':
        router.push('/activities');
        break;
      case 'Exhibitors':
        router.push('/exhibitors');
        break;
      case 'Sponsors':
        router.push('/sponsors');
        break;
      case 'Ports':
        router.push('/ports');
        break;
      case 'Floor Plan':
        router.push('/floor-plan');
        break;
      case 'Networking':
        router.push('/networking');
        break;
      case 'Presentations':
        router.push('/presentations');
        break;
      default:
        console.log('Navigation not yet implemented for:', card.title);
        break;
    }
  };

  const handleAnnouncementPress = (announcement: Announcement) => {
    console.log('Announcement pressed:', announcement.Title);
    router.push({
      pathname: '/announcement-detail',
      params: {
        id: announcement.id,
        title: announcement.Title,
        content: announcement.Content,
        alert_tag: announcement.Alert || '',
        date: announcement.Date,
        time_display: announcement.Time || '',
        image_url: announcement.ImageUrl || '',
      },
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  };

  const getPreview = (content: string) => {
    if (!content) return '';
    const maxLength = 100;
    const preview = content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
    return preview;
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: true,
          title: 'Home',
          headerStyle: {
            backgroundColor: isDark ? colors.backgroundDark : colors.background,
          },
          headerTintColor: textColor,
        }} 
      />
      <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]} edges={['bottom']}>
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {/* Hero Image */}
          <View style={styles.heroContainer}>
            <Image
              source={resolveImageSource('https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800&q=80')}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <View style={styles.heroOverlay}>
              <Text style={styles.heroTitle}>Port of the Future</Text>
              <Text style={styles.heroSubtitle}>Conference 2026</Text>
            </View>
          </View>

          {/* Navigation Cards Grid */}
          <View style={styles.gridContainer}>
            {navigationCards.map((card) => (
              <TouchableOpacity
                key={card.id}
                style={[styles.navCard, { backgroundColor: cardBg, borderColor: borderColorValue }]}
                onPress={() => handleCardPress(card)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconCircle, { backgroundColor: colors.primary + '20' }]}>
                  <IconSymbol
                    ios_icon_name={card.ios_icon}
                    android_material_icon_name={card.android_icon}
                    size={28}
                    color={colors.primary}
                  />
                </View>
                <Text style={[styles.navCardTitle, { color: textColor }]} numberOfLines={2}>
                  {card.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Announcements Section */}
          <View style={styles.announcementsSection}>
            <View style={styles.sectionHeader}>
              <IconSymbol
                ios_icon_name="megaphone.fill"
                android_material_icon_name="campaign"
                size={24}
                color={colors.primary}
              />
              <Text style={[styles.sectionTitle, { color: textColor }]}>Announcements</Text>
            </View>

            {loading && !refreshing ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: secondaryTextColor }]}>Loading announcements...</Text>
              </View>
            ) : error ? (
              <View style={[styles.errorContainer, { backgroundColor: cardBg }]}>
                <IconSymbol
                  ios_icon_name="exclamationmark.triangle.fill"
                  android_material_icon_name="warning"
                  size={32}
                  color={colors.error}
                />
                <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                <TouchableOpacity
                  style={[styles.retryButton, { backgroundColor: colors.primary }]}
                  onPress={loadAnnouncements}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : announcements.length === 0 ? (
              <View style={[styles.emptyContainer, { backgroundColor: cardBg }]}>
                <IconSymbol
                  ios_icon_name="tray.fill"
                  android_material_icon_name="inbox"
                  size={48}
                  color={secondaryTextColor}
                />
                <Text style={[styles.emptyText, { color: secondaryTextColor }]}>No announcements yet</Text>
              </View>
            ) : (
              announcements.map((announcement) => {
                const formattedDate = formatDate(announcement.Date);
                const preview = getPreview(announcement.Content);
                
                return (
                  <TouchableOpacity
                    key={announcement.id}
                    style={[styles.announcementCard, { backgroundColor: cardBg, borderColor: borderColorValue }]}
                    onPress={() => handleAnnouncementPress(announcement)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.announcementContent}>
                      <View style={styles.announcementHeader}>
                        <Text style={[styles.announcementTitle, { color: textColor }]} numberOfLines={2}>
                          {announcement.Title}
                        </Text>
                        {announcement.Alert && (
                          <View style={[styles.alertChip, { backgroundColor: colors.error + '20' }]}>
                            <Text style={[styles.alertChipText, { color: colors.error }]}>
                              {announcement.Alert}
                            </Text>
                          </View>
                        )}
                      </View>
                      
                      <View style={styles.dateTimeRow}>
                        <IconSymbol
                          ios_icon_name="calendar"
                          android_material_icon_name="calendar-today"
                          size={14}
                          color={secondaryTextColor}
                        />
                        <Text style={[styles.dateText, { color: secondaryTextColor }]}>
                          {formattedDate}
                        </Text>
                        {announcement.Time && (
                          <>
                            <Text style={[styles.dateSeparator, { color: secondaryTextColor }]}>•</Text>
                            <Text style={[styles.timeText, { color: secondaryTextColor }]}>
                              {announcement.Time}
                            </Text>
                          </>
                        )}
                      </View>

                      <Text style={[styles.announcementPreview, { color: secondaryTextColor }]} numberOfLines={2}>
                        {preview}
                      </Text>
                    </View>

                    {announcement.ImageUrl && (
                      <Image
                        source={resolveImageSource(announcement.ImageUrl)}
                        style={styles.announcementThumbnail}
                        resizeMode="cover"
                      />
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  heroContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 4,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  navCard: {
    width: '18%',
    aspectRatio: 1,
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  navCardTitle: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  announcementsSection: {
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
  },
  errorContainer: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
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
  emptyContainer: {
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    marginTop: 12,
  },
  announcementCard: {
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
  announcementContent: {
    flex: 1,
    marginRight: 12,
  },
  announcementHeader: {
    marginBottom: 8,
  },
  announcementTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 6,
  },
  alertChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
  },
  alertChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 13,
    marginLeft: 4,
  },
  dateSeparator: {
    fontSize: 13,
    marginHorizontal: 6,
  },
  timeText: {
    fontSize: 13,
  },
  announcementPreview: {
    fontSize: 14,
    lineHeight: 20,
  },
  announcementThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
});
