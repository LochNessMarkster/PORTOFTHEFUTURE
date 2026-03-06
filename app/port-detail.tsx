
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  Image,
  ImageSourcePropType,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { fetchSpeakers, Speaker } from '@/utils/airtable';

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

export default function PortDetailScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const params = useLocalSearchParams();

  const name = params.name as string;
  const location = params.location as string;
  const intro = params.intro as string;
  const bio = params.bio as string;
  const url = params.url as string;
  const logoUrl = params.logo_url as string;
  const featuredImageUrl = params.featured_image_url as string;

  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loadingSpeakers, setLoadingSpeakers] = useState(true);

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const secondaryTextColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardBg = isDark ? colors.cardDark : colors.card;

  useEffect(() => {
    loadSpeakersFromPort();
  }, [name]);

  const loadSpeakersFromPort = async () => {
    console.log('[PortDetail] Loading speakers for port:', name);
    try {
      setLoadingSpeakers(true);
      const response = await fetchSpeakers();
      
      // Filter speakers by port name (check company field or bio)
      const portSpeakers = response.speakers.filter(speaker => {
        const companyMatch = (speaker.company || '').toLowerCase().includes(name.toLowerCase());
        const bioMatch = (speaker.bio || '').toLowerCase().includes(name.toLowerCase());
        return companyMatch || bioMatch;
      });

      console.log('[PortDetail] Found speakers from this port:', portSpeakers.length);
      setSpeakers(portSpeakers);
    } catch (err) {
      console.error('[PortDetail] Error loading speakers:', err);
    } finally {
      setLoadingSpeakers(false);
    }
  };

  const handleUrlPress = () => {
    if (url) {
      console.log('[PortDetail] Opening port URL:', url);
      Linking.openURL(url).catch(err => {
        console.error('[PortDetail] Failed to open URL:', err);
      });
    }
  };

  const formatBioWithParagraphs = (text: string) => {
    if (!text) return [];
    const paragraphs = text.split('\n').filter(p => p.trim().length > 0);
    return paragraphs;
  };

  const bioParagraphs = formatBioWithParagraphs(bio);

  const renderSpeakerCard = (speaker: Speaker) => {
    const speakerName = `${speaker.firstName} ${speaker.lastName}`.trim();
    const speakerTitle = speaker.title || '';
    const speakerCompany = speaker.company || '';

    return (
      <View key={speaker.id} style={[styles.speakerCard, { backgroundColor: cardBg }]}>
        <View style={styles.speakerPhotoContainer}>
          {speaker.photoUrl ? (
            <Image
              source={resolveImageSource(speaker.photoUrl)}
              style={styles.speakerPhoto}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.speakerPhotoPlaceholder, { backgroundColor: colors.primary + '20' }]}>
              <IconSymbol
                ios_icon_name="person.fill"
                android_material_icon_name="person"
                size={24}
                color={colors.primary}
              />
            </View>
          )}
        </View>
        <View style={styles.speakerInfo}>
          <Text style={[styles.speakerName, { color: textColor }]} numberOfLines={1}>
            {speakerName}
          </Text>
          {speakerTitle && (
            <Text style={[styles.speakerTitle, { color: secondaryTextColor }]} numberOfLines={1}>
              {speakerTitle}
            </Text>
          )}
          {speakerCompany && (
            <Text style={[styles.speakerCompany, { color: secondaryTextColor }]} numberOfLines={1}>
              {speakerCompany}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: name,
          headerStyle: {
            backgroundColor: isDark ? colors.backgroundDark : colors.background,
          },
          headerTintColor: textColor,
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]} edges={['bottom']}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Featured Image */}
          {featuredImageUrl && (
            <View style={styles.featuredImageContainer}>
              <Image
                source={resolveImageSource(featuredImageUrl)}
                style={styles.featuredImage}
                resizeMode="cover"
              />
            </View>
          )}

          {/* Logo and Name */}
          <View style={[styles.headerSection, { backgroundColor: cardBg }]}>
            {logoUrl && (
              <View style={styles.logoContainer}>
                <Image
                  source={resolveImageSource(logoUrl)}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
            )}
            <Text style={[styles.portName, { color: textColor }]}>{name}</Text>
            
            {location && (
              <View style={styles.locationRow}>
                <IconSymbol
                  ios_icon_name="location.fill"
                  android_material_icon_name="place"
                  size={18}
                  color={colors.primary}
                />
                <Text style={[styles.locationText, { color: textColor }]}>{location}</Text>
              </View>
            )}
          </View>

          {/* Intro */}
          {intro && (
            <View style={[styles.section, { backgroundColor: cardBg }]}>
              <Text style={[styles.intro, { color: textColor }]}>{intro}</Text>
            </View>
          )}

          {/* Full Description */}
          {bioParagraphs.length > 0 && (
            <View style={[styles.section, { backgroundColor: cardBg }]}>
              <View style={styles.sectionHeader}>
                <IconSymbol
                  ios_icon_name="info.circle.fill"
                  android_material_icon_name="info"
                  size={20}
                  color={colors.primary}
                />
                <Text style={[styles.sectionTitle, { color: textColor }]}>About</Text>
              </View>
              {bioParagraphs.map((paragraph, index) => (
                <Text key={index} style={[styles.bioParagraph, { color: secondaryTextColor }]}>
                  {paragraph}
                </Text>
              ))}
            </View>
          )}

          {/* Visit Website Button */}
          {url && (
            <TouchableOpacity
              style={[styles.urlButton, { backgroundColor: colors.primary }]}
              onPress={handleUrlPress}
              activeOpacity={0.8}
            >
              <IconSymbol
                ios_icon_name="safari.fill"
                android_material_icon_name="language"
                size={20}
                color="#FFFFFF"
              />
              <Text style={styles.urlButtonText}>Visit Website</Text>
            </TouchableOpacity>
          )}

          {/* Speakers from this Port */}
          {loadingSpeakers ? (
            <View style={[styles.section, { backgroundColor: cardBg }]}>
              <View style={styles.sectionHeader}>
                <IconSymbol
                  ios_icon_name="person.2.fill"
                  android_material_icon_name="group"
                  size={20}
                  color={colors.primary}
                />
                <Text style={[styles.sectionTitle, { color: textColor }]}>Speakers</Text>
              </View>
              <ActivityIndicator size="small" color={colors.primary} style={styles.speakersLoader} />
            </View>
          ) : speakers.length > 0 ? (
            <View style={[styles.section, { backgroundColor: cardBg }]}>
              <View style={styles.sectionHeader}>
                <IconSymbol
                  ios_icon_name="person.2.fill"
                  android_material_icon_name="group"
                  size={20}
                  color={colors.primary}
                />
                <Text style={[styles.sectionTitle, { color: textColor }]}>
                  Speakers ({speakers.length})
                </Text>
              </View>
              {speakers.map(renderSpeakerCard)}
            </View>
          ) : null}
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
  featuredImageContainer: {
    width: '100%',
    height: 250,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  headerSection: {
    padding: 20,
    alignItems: 'center',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoContainer: {
    width: 120,
    height: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: '90%',
    height: '90%',
  },
  portName: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationText: {
    fontSize: 16,
    marginLeft: 6,
    fontWeight: '500',
  },
  section: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  intro: {
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  bioParagraph: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  urlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  urlButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 8,
  },
  speakersLoader: {
    marginVertical: 12,
  },
  speakerCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  speakerPhotoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    marginRight: 12,
  },
  speakerPhoto: {
    width: '100%',
    height: '100%',
  },
  speakerPhotoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  speakerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  speakerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  speakerTitle: {
    fontSize: 14,
    marginBottom: 2,
  },
  speakerCompany: {
    fontSize: 13,
  },
});
