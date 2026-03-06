
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/IconSymbol";
import { useAuth } from "@/contexts/AuthContext";
import { StyleSheet, View, Text, ScrollView, useColorScheme, TouchableOpacity, Image, ActivityIndicator, ImageSourcePropType, RefreshControl, ImageBackground } from "react-native";
import React, { useState, useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { fetchAnnouncements, type AnnouncementItem } from "@/utils/airtable";
import { colors } from "@/styles/commonStyles";
import { LinearGradient } from 'expo-linear-gradient';

type Announcement = AnnouncementItem;

interface NavigationCard {
  id: string;
  title: string;
  ios_icon: string;
  android_icon: string;
  route?: string;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroImageBackground: {
    width: '100%',
    height: 320,
  },
  heroGradientOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  conferenceLogo: {
    width: 200,
    height: 80,
    marginBottom: 20,
  },
  heroDateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroLocationText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  heroButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 16,
  },
  heroButton: {
    flex: 1,
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '700',
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingBottom: 100,
    gap: 12,
  },
  navigationCard: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
  },
  cardIconContainer: {
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryText,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.secondaryText,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    textAlign: 'center',
  },
});

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const navigationCards: NavigationCard[] = [
    { id: '1', title: 'Agenda', ios_icon: 'calendar', android_icon: 'calendar-today', route: 'agenda' },
    { id: '2', title: 'Speakers', ios_icon: 'person.2', android_icon: 'group', route: 'speakers' },
    { id: '3', title: 'Exhibitors', ios_icon: 'building.2', android_icon: 'store', route: 'exhibitors' },
    { id: '4', title: 'Sponsors', ios_icon: 'star', android_icon: 'star', route: 'sponsors' },
    { id: '5', title: 'Networking', ios_icon: 'person.3', android_icon: 'group', route: 'networking' },
    { id: '6', title: 'Floor Plan', ios_icon: 'map', android_icon: 'map', route: 'floor-plan' },
  ];

  useEffect(() => {
    console.log('HomeScreen mounted, loading announcements');
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching announcements...');
      const response = await fetchAnnouncements();
      console.log('Announcements fetched:', response.announcements.length);
      setAnnouncements(response.announcements);
    } catch (err) {
      console.error('Error loading announcements:', err);
      setError('Unable to load announcements. Pull to refresh.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    console.log('User initiated refresh');
    setRefreshing(true);
    await loadAnnouncements();
    setRefreshing(false);
  };

  const handleCardPress = (card: NavigationCard) => {
    console.log('User tapped navigation card:', card.title);
    if (card.route) {
      router.push(`/${card.route}` as any);
    }
  };

  const handleAnnouncementPress = (announcement: Announcement) => {
    console.log('User tapped announcement:', announcement.Title);
    router.push({
      pathname: '/announcement-detail',
      params: {
        id: announcement.id,
        title: announcement.Title,
        description: announcement.Description,
        date: announcement.Date || '',
      },
    } as any);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const getPreview = (content: string) => {
    if (!content) return '';
    const maxLength = 100;
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  if (loading && announcements.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const dateText = 'March 24 - 25, 2026';
  const locationText = 'Houston, TX';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={styles.container}
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
        <ImageBackground
          source={require('@/assets/images/af914b52-8d81-44ca-937e-bc2b6ab12a17.jpeg')}
          style={styles.heroImageBackground}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['rgba(100, 100, 100, 0.5)', 'rgba(80, 80, 80, 0.6)']}
            style={styles.heroGradientOverlay}
          >
            <Image
              source={require('@/assets/images/545403cf-6c4d-48e9-98ae-e14a8cd4602d.png')}
              style={styles.conferenceLogo}
              resizeMode="contain"
            />
            <Text style={styles.heroDateText}>{dateText}</Text>
            <Text style={styles.heroLocationText}>{locationText}</Text>
          </LinearGradient>
        </ImageBackground>

        <View style={styles.heroButtonContainer}>
          <TouchableOpacity
            style={styles.heroButton}
            onPress={() => handleCardPress({ id: 'agenda', title: 'Agenda', ios_icon: 'calendar', android_icon: 'calendar-today', route: 'agenda' })}
          >
            <Text style={styles.heroButtonText}>View Agenda</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.heroButton}
            onPress={() => handleCardPress({ id: 'exhibitors', title: 'Exhibitors', ios_icon: 'building.2', android_icon: 'store', route: 'exhibitors' })}
          >
            <Text style={styles.heroButtonText}>Exhibitors</Text>
          </TouchableOpacity>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.cardGrid}>
          {navigationCards.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={styles.navigationCard}
              onPress={() => handleCardPress(card)}
            >
              <View style={styles.cardIconContainer}>
                <IconSymbol
                  ios_icon_name={card.ios_icon}
                  android_material_icon_name={card.android_icon}
                  size={36}
                  color="#5EEBFF"
                />
              </View>
              <Text style={styles.cardLabel}>{card.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
