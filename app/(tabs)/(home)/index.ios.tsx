
import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, ScrollView, useColorScheme, TouchableOpacity, Image, ActivityIndicator, ImageSourcePropType, RefreshControl } from "react-native";
import { Stack, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from 'expo-linear-gradient';
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
  section: 'primary' | 'more';
}

const navigationCards: NavigationCard[] = [
  { id: '1', title: 'Speakers', ios_icon: 'person.2.fill', android_icon: 'group', section: 'primary' },
  { id: '2', title: 'Exhibitors', ios_icon: 'building.2.fill', android_icon: 'store', section: 'primary' },
  { id: '3', title: 'Sponsors', ios_icon: 'heart.fill', android_icon: 'favorite', section: 'primary' },
  { id: '4', title: 'Activities', ios_icon: 'star.fill', android_icon: 'star', section: 'primary' },
  { id: '5', title: 'Ports', ios_icon: 'ferry.fill', android_icon: 'directions-boat', section: 'more' },
  { id: '6', title: 'Presentations', ios_icon: 'doc.text.fill', android_icon: 'description', section: 'more' },
  { id: '7', title: 'Floor Plan', ios_icon: 'map.fill', android_icon: 'map', section: 'more' },
  { id: '8', title: 'My Schedule', ios_icon: 'bookmark.fill', android_icon: 'bookmark', section: 'more' },
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
    return `${month} ${day}, ${year}`;
  };

  const getPreview = (content: string) => {
    if (!content) return '';
    const maxLength = 100;
    const preview = content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
    return preview;
  };

  const dateText = 'March 24–25, 2026';
  const locationText = 'Houston, Texas';

  const primaryCards = navigationCards.filter(card => card.section === 'primary');
  const moreCards = navigationCards.filter(card => card.section === 'more');

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: false,
        }} 
      />
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
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
          {/* Hero Section */}
          <View style={styles.heroContainer}>
            <Image
              source={resolveImageSource(require('@/assets/images/1db53cbe-3e23-4820-b100-eef2e3151600.png'))}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['rgba(0, 0, 0, 0.4)', 'rgba(0, 0, 0, 0.7)']}
              style={styles.heroGradient}
            >
              <View style={styles.heroContent}>
                <Image
                  source={resolveImageSource(require('@/assets/images/87eeaf08-35c7-4e82-adcf-c145183bd360.png'))}
                  style={styles.heroLogo}
                  resizeMode="contain"
                />
                <Text style={styles.heroDate}>{dateText}</Text>
                <Text style={styles.heroLocation}>{locationText}</Text>
              </View>
            </LinearGradient>
          </View>

          {/* Hero Action Buttons */}
          <View style={styles.heroActionsContainer}>
            <TouchableOpacity
              style={styles.heroActionButton}
              onPress={() => router.push('/agenda')}
              activeOpacity={0.8}
            >
              <Text style={styles.heroActionButtonText}>View Agenda</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.heroActionButton}
              onPress={() => router.push('/exhibitors')}
              activeOpacity={0.8}
            >
              <IconSymbol
                ios_icon_name="building.2.fill"
                android_material_icon_name="store"
                size={20}
                color={colors.text}
              />
              <Text style={styles.heroActionButtonText}>Exhibitors</Text>
            </TouchableOpacity>
          </View>

          {/* PRIMARY Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionLabel}>PRIMARY</Text>
            <View style={styles.gridContainer}>
              {primaryCards.map((card) => (
                <TouchableOpacity
                  key={card.id}
                  style={styles.navCard}
                  onPress={() => handleCardPress(card)}
                  activeOpacity={0.7}
                >
                  <IconSymbol
                    ios_icon_name={card.ios_icon}
                    android_material_icon_name={card.android_icon}
                    size={36}
                    color="#5EEBFF"
                  />
                  <Text style={styles.navCardTitle}>{card.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* MORE Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionLabel}>MORE</Text>
            <View style={styles.gridContainer}>
              {moreCards.map((card) => (
                <TouchableOpacity
                  key={card.id}
                  style={styles.navCard}
                  onPress={() => handleCardPress(card)}
                  activeOpacity={0.7}
                >
                  <IconSymbol
                    ios_icon_name={card.ios_icon}
                    android_material_icon_name={card.android_icon}
                    size={36}
                    color="#5EEBFF"
                  />
                  <Text style={styles.navCardTitle}>{card.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Announcements Section */}
          <View style={styles.announcementsSection}>
            <View style={styles.sectionHeader}>
              <IconSymbol
                ios_icon_name="megaphone.fill"
                android_material_icon_name="campaign"
                size={24}
                color="#5EEBFF"
              />
              <Text style={styles.sectionTitle}>Announcements</Text>
            </View>

            {loading && !refreshing ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
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
                  color={colors.textMuted}
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
                          color={colors.textMuted}
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
    backgroundColor: '#0D2438',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  heroContainer: {
    width: '100%',
    height: 340,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  heroLogo: {
    width: 320,
    height: 140,
    marginBottom: 20,
  },
  heroDate: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroLocation: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroActionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    gap: 12,
  },
  heroActionButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#1A5F7A',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  heroActionButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionContainer: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5EEBFF',
    marginBottom: 12,
    letterSpacing: 1.2,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  navCard: {
    width: 'calc(50% - 6px)',
    backgroundColor: '#1A3A52',
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(94, 235, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  navCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    color: '#FFFFFF',
    marginTop: 12,
  },
  announcementsSection: {
    paddingHorizontal: 16,
    marginTop: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#FFFFFF',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: colors.textMuted,
  },
  errorContainer: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: '#1A3A52',
    borderWidth: 1,
    borderColor: 'rgba(94, 235, 255, 0.2)',
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
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  retryButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: '#1A3A52',
    borderWidth: 1,
    borderColor: 'rgba(94, 235, 255, 0.2)',
  },
  emptyText: {
    fontSize: 15,
    marginTop: 12,
    color: colors.textMuted,
  },
  announcementCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    backgroundColor: '#1A3A52',
    borderWidth: 1,
    borderColor: 'rgba(94, 235, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
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
    color: '#FFFFFF',
  },
  alertChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
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
    color: colors.textMuted,
  },
  dateSeparator: {
    fontSize: 13,
    marginHorizontal: 6,
    color: colors.textMuted,
  },
  timeText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  announcementPreview: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  announcementThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
});
