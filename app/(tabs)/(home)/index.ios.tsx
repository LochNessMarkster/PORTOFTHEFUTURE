
import React, { useState, useEffect } from "react";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { StyleSheet, View, Text, ScrollView, useColorScheme, TouchableOpacity, Image, ActivityIndicator, ImageSourcePropType, RefreshControl, Dimensions, Animated } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { Stack, useRouter } from "expo-router";
import { fetchAnnouncements, type AnnouncementItem } from "@/utils/airtable";
import { NowNextSection } from "@/components/NowNextSection";
import { SafeAreaView } from "react-native-safe-area-context";
import { MessagingNoticeModal } from "@/components/MessagingNoticeModal";

type Announcement = AnnouncementItem;

interface NavigationCard {
  id: string;
  title: string;
  ios_icon: string;
  android_icon: string;
  route?: string;
}

const CONFERENCE_DATES = "March 23-25, 2026";
const CONFERENCE_LOCATION = "Honolulu, Hawaii";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  heroSection: {
    position: 'relative',
    height: 280,
    marginBottom: 24,
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
    backgroundColor: 'rgba(128, 128, 128, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  heroLogo: {
    width: 200,
    height: 90,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  heroLocation: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  nowNextContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  navigationSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  navigationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  navCard: {
    width: '48%',
    height: 110,
    backgroundColor: colors.card,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  navCardContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  navIconContainer: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  navLabelContainer: {
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  announcementsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  viewAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
  announcementCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  announcementTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginRight: 8,
  },
  newBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  newBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  announcementPreview: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  announcementDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

function AnimatedNavCard({ card, onPress }: { card: NavigationCard; onPress: () => void }) {
  const scaleAnim = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.navCard}
    >
      <Animated.View style={[styles.navCardContent, { transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.navIconContainer}>
          <IconSymbol
            ios_icon_name={card.ios_icon}
            android_material_icon_name={card.android_icon}
            size={34}
            color={colors.accent}
          />
        </View>
        <View style={styles.navLabelContainer}>
          <Text style={styles.navLabel} numberOfLines={1} ellipsizeMode="tail">
            {card.title}
          </Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const { user, isFirstLogin, markMessagingNoticeShown } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showMessagingNotice, setShowMessagingNotice] = useState(false);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  useEffect(() => {
    // Show messaging notice modal if this is the first login
    if (isFirstLogin) {
      console.log('[Home] First login detected, showing messaging notice');
      setShowMessagingNotice(true);
    }
  }, [isFirstLogin]);

  const loadAnnouncements = async () => {
    console.log('[Home] Loading announcements');
    try {
      if (!refreshing) {
        setLoading(true);
      }

      const data = await fetchAnnouncements();
      console.log('[Home] Received announcements:', data.announcements?.length || 0);

      const validAnnouncements = (data.announcements || []).filter(
        (a: Announcement) => a && a.Title && a.Content
      );

      const sortedAnnouncements = validAnnouncements.sort((a: Announcement, b: Announcement) => {
        const dateA = a.Date || '';
        const dateB = b.Date || '';
        return dateB.localeCompare(dateA);
      });

      setAnnouncements(sortedAnnouncements.slice(0, 3));
    } catch (err) {
      console.error('[Home] Error loading announcements:', err);
      setAnnouncements([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    console.log('[Home] User initiated refresh');
    setRefreshing(true);
    loadAnnouncements();
  };

  const handleCardPress = (card: NavigationCard) => {
    console.log('[Home] Navigation card pressed:', card.title);
    if (card.route) {
      router.push(card.route as any);
    }
  };

  const handleMySchedulePress = () => {
    console.log('[Home] My Schedule card pressed');
    router.push('/my-schedule');
  };

  const handleAnnouncementPress = (announcement: Announcement) => {
    console.log('[Home] Announcement pressed:', announcement.Title);
    router.push({
      pathname: '/announcement-detail',
      params: {
        id: announcement.id,
        title: announcement.Title || '',
        content: announcement.Content || '',
        date: announcement.Date || '',
      },
    });
  };

  const handleMessagingNoticeClose = () => {
    console.log('[Home] User closed messaging notice');
    setShowMessagingNotice(false);
    markMessagingNoticeShown();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  };

  const getPreview = (content: string) => {
    const maxLength = 120;
    const plainText = content.replace(/<[^>]*>/g, '');
    const preview = plainText.length > maxLength 
      ? plainText.substring(0, maxLength) + '...'
      : plainText;
    return preview;
  };

  const navigationCards: NavigationCard[] = [
    { id: '1', title: 'Agenda', ios_icon: 'calendar', android_icon: 'calendar-today', route: '/agenda' },
    { id: '2', title: 'My Schedule', ios_icon: 'bookmark.fill', android_icon: 'bookmark', route: '/my-schedule' },
    { id: '3', title: 'Speakers', ios_icon: 'person.fill', android_icon: 'person', route: '/speakers' },
    { id: '4', title: 'Exhibitors', ios_icon: 'storefront.fill', android_icon: 'store', route: '/exhibitors' },
    { id: '5', title: 'Sponsors', ios_icon: 'hand.wave.fill', android_icon: 'handshake', route: '/sponsors' },
    { id: '6', title: 'Networking', ios_icon: 'person.2.fill', android_icon: 'group', route: '/networking' },
    { id: '7', title: 'Floor Plan', ios_icon: 'map.fill', android_icon: 'map', route: '/floor-plan' },
    { id: '8', title: 'Activities', ios_icon: 'star.fill', android_icon: 'star', route: '/activities' },
  ];

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: false,
        }} 
      />
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
        >
          <View style={styles.heroSection}>
            <Image
              source={resolveImageSource(require('@/assets/images/af914b52-8d81-44ca-937e-bc2b6ab12a17.jpeg'))}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <View style={styles.heroOverlay}>
              <Image
                source={resolveImageSource(require('@/assets/images/aa480f69-108c-45e4-b072-9476cc4eee41.jpeg'))}
                style={styles.heroLogo}
                resizeMode="contain"
              />
              <Text style={styles.heroTitle}>Port of the Future</Text>
              <Text style={styles.heroSubtitle}>{CONFERENCE_DATES}</Text>
              <Text style={styles.heroLocation}>{CONFERENCE_LOCATION}</Text>
            </View>
          </View>

          <View style={styles.nowNextContainer}>
            <NowNextSection />
          </View>

          <View style={styles.navigationSection}>
            <View style={styles.navigationGrid}>
              {navigationCards.map((card) => (
                <AnimatedNavCard
                  key={card.id}
                  card={card}
                  onPress={() => handleCardPress(card)}
                />
              ))}
            </View>
          </View>

          <View style={styles.announcementsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Announcements</Text>
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => router.push('/(tabs)/more')}
              >
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {loading && !refreshing ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.accent} />
                <Text style={styles.loadingText}>Loading announcements...</Text>
              </View>
            ) : announcements.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No announcements available</Text>
              </View>
            ) : (
              announcements.map((announcement) => {
                const dateDisplay = formatDate(announcement.Date);
                const previewText = getPreview(announcement.Content);

                return (
                  <TouchableOpacity
                    key={announcement.id}
                    style={styles.announcementCard}
                    onPress={() => handleAnnouncementPress(announcement)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.announcementHeader}>
                      <Text style={styles.announcementTitle} numberOfLines={2}>
                        {announcement.Title}
                      </Text>
                    </View>
                    <Text style={styles.announcementPreview} numberOfLines={3}>
                      {previewText}
                    </Text>
                    <Text style={styles.announcementDate}>
                      {dateDisplay}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </ScrollView>

        <MessagingNoticeModal
          visible={showMessagingNotice}
          onClose={handleMessagingNoticeClose}
        />
      </SafeAreaView>
    </>
  );
}
