
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
  { id: '1', title: 'Speakers', ios_icon: 'person.2.fill', android_icon: 'group' },
  { id: '2', title: 'Networking', ios_icon: 'person.3.fill', android_icon: 'people' },
  { id: '3', title: 'Sponsors', ios_icon: 'heart.fill', android_icon: 'favorite' },
  { id: '4', title: 'Activities', ios_icon: 'star.fill', android_icon: 'star' },
  { id: '5', title: 'Ports', ios_icon: 'ferry.fill', android_icon: 'directions-boat' },
  { id: '6', title: 'Presentations', ios_icon: 'doc.text.fill', android_icon: 'description' },
  { id: '7', title: 'Floor Plan', ios_icon: 'map.fill', android_icon: 'map' },
  { id: '8', title: 'My Schedule', ios_icon: 'bookmark.fill', android_icon: 'bookmark' },
];

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const router = useRouter();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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
    
    switch (card.title) {
      case 'Agenda':
        router.push('/agenda');
        break;
      case 'My Schedule':
        router.push('/my-schedule');
        break;
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
    const formattedDate = `${month} ${day}, ${year}`;
    return formattedDate;
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
            backgroundColor: colors.background,
          },
          headerTintColor: colors.primaryText,
        }} 
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
        >
          {/* Hero Section */}
          <View style={styles.heroContainer}>
            <Image
              source={resolveImageSource('https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800&q=80')}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <View style={styles.heroOverlay}>
              <View style={styles.logoContainer}>
                <Image
                  source={resolveImageSource(require('@/assets/images/fa96e143-9605-4ea1-8825-00373e4de1ac.png'))}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.heroDate}>March 24 - 25, 2026</Text>
              <Text style={styles.heroLocation}>Houston, TX</Text>
            </View>
          </View>

          {/* CTA Buttons */}
          <View style={styles.ctaContainer}>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => router.push('/agenda')}
              activeOpacity={0.8}
            >
              <Text style={styles.ctaButtonText}>View Agenda</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => router.push('/exhibitors')}
              activeOpacity={0.8}
            >
              <Text style={styles.ctaButtonText}>Exhibitors</Text>
            </TouchableOpacity>
          </View>

          {/* Navigation Cards Grid */}
          <View style={styles.gridContainer}>
            {navigationCards.map((card) => (
              <TouchableOpacity
                key={card.id}
                style={styles.navCard}
                onPress={() => handleCardPress(card)}
                activeOpacity={0.7}
              >
                <View style={styles.iconContainer}>
                  <IconSymbol
                    ios_icon_name={card.ios_icon}
                    android_material_icon_name={card.android_icon}
                    size={32}
                    color={colors.accent}
                  />
                </View>
                <Text style={styles.navCardTitle} numberOfLines={2}>
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
                color={colors.accent}
              />
              <Text style={styles.sectionTitle}>Announcements</Text>
            </View>

            {loading && !refreshing ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.accent} />
                <Text style={styles.loadingText}>Loading announcements...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <IconSymbol
                  ios_icon_name="exclamationmark.triangle.fill"
                  android_material_icon_name="warning"
                  size={32}
                  color={colors.error}
                />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={loadAnnouncements}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : announcements.length === 0 ? (
              <View style={styles.emptyContainer}>
                <IconSymbol
                  ios_icon_name="tray.fill"
                  android_material_icon_name="inbox"
                  size={48}
                  color={colors.secondaryText}
                />
                <Text style={styles.emptyText}>No announcements yet</Text>
              </View>
            ) : (
              announcements.map((announcement) => {
                const formattedDate = formatDate(announcement.Date);
                const preview = getPreview(announcement.Content);
                
                return (
                  <TouchableOpacity
                    key={announcement.id}
                    style={styles.announcementCard}
                    onPress={() => handleAnnouncementPress(announcement)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.announcementContent}>
                      <View style={styles.announcementHeader}>
                        <Text style={styles.announcementTitle} numberOfLines={2}>
                          {announcement.Title}
                        </Text>
                        {announcement.Alert && (
                          <View style={styles.alertChip}>
                            <Text style={styles.alertChipText}>
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
                          color={colors.secondaryText}
                        />
                        <Text style={styles.dateText}>
                          {formattedDate}
                        </Text>
                        {announcement.Time && (
                          <>
                            <Text style={styles.dateSeparator}>•</Text>
                            <Text style={styles.timeText}>
                              {announcement.Time}
                            </Text>
                          </>
                        )}
                      </View>

                      <Text style={styles.announcementPreview} numberOfLines={2}>
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
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  heroContainer: {
    width: '100%',
    height: 280,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(1, 42, 74, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logo: {
    width: 180,
    height: 80,
  },
  heroDate: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: 4,
  },
  heroLocation: {
    fontSize: 16,
    color: colors.secondaryText,
  },
  ctaContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
    gap: 12,
  },
  ctaButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primaryText,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  navCard: {
    width: '48%',
    height: 140,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconContainer: {
    marginBottom: 12,
  },
  navCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primaryText,
    textAlign: 'center',
  },
  announcementsSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primaryText,
    marginLeft: 8,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: colors.secondaryText,
  },
  errorContainer: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: colors.card,
  },
  errorText: {
    fontSize: 15,
    marginTop: 12,
    textAlign: 'center',
    color: colors.error,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.accent,
  },
  retryButtonText: {
    color: colors.primaryText,
    fontSize: 15,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: colors.card,
  },
  emptyText: {
    fontSize: 15,
    marginTop: 12,
    color: colors.secondaryText,
  },
  announcementCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
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
    color: colors.primaryText,
    marginBottom: 6,
  },
  alertChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
    backgroundColor: 'rgba(255, 92, 122, 0.2)',
  },
  alertChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.error,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 13,
    marginLeft: 4,
    color: colors.secondaryText,
  },
  dateSeparator: {
    fontSize: 13,
    marginHorizontal: 6,
    color: colors.secondaryText,
  },
  timeText: {
    fontSize: 13,
    color: colors.secondaryText,
  },
  announcementPreview: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.secondaryText,
  },
  announcementThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
});
