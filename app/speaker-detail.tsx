
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  Image,
  ImageSourcePropType,
  Linking,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

const API_BASE_URL = 'https://njmpxm8a52cjnjaq9huyy39kwmavs4hc.app.specular.dev';

interface Session {
  id: string;
  title: string;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  room: string | null;
  typeTrack: string | null;
  sessionDescription: string | null;
  speakerNames: string | string[] | null;
}

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

export default function SpeakerDetailScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const params = useLocalSearchParams();
  const router = useRouter();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const secondaryTextColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardBg = isDark ? colors.cardDark : colors.card;

  const firstName = params.firstName as string;
  const lastName = params.lastName as string;
  const speakerTitle = params.speakerTitle as string;
  const speakingTopic = params.speakingTopic as string;
  const synopsis = params.synopsis as string;
  const bio = params.bio as string;
  const photoUrl = params.photoUrl as string;
  const publicPersonalData = params.publicPersonalData === 'true';
  const email = params.email as string;
  const phone = params.phone as string;

  const fullName = `${firstName} ${lastName}`.trim();

  useEffect(() => {
    loadSpeakerSessions();
  }, []);

  const loadSpeakerSessions = async () => {
    console.log('[SpeakerDetail] Loading sessions for:', fullName);
    try {
      setLoadingSessions(true);
      const encoded = encodeURIComponent(fullName);
      const response = await fetch(`${API_BASE_URL}/api/sessions/by-speaker?speakerName=${encoded}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch sessions: ${response.status}`);
      }
      const data: Session[] = await response.json();
      console.log('[SpeakerDetail] Found', data.length, 'sessions');
      setSessions(data);
    } catch (err) {
      console.error('[SpeakerDetail] Error loading sessions:', err);
      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleEmailPress = () => {
    if (email) {
      console.log('[SpeakerDetail] Opening email:', email);
      Linking.openURL(`mailto:${email}`);
    }
  };

  const handlePhonePress = () => {
    if (phone) {
      console.log('[SpeakerDetail] Opening phone:', phone);
      Linking.openURL(`tel:${phone}`);
    }
  };

  const handleSessionPress = (session: Session) => {
    console.log('[SpeakerDetail] Session pressed:', session.title, '| id:', session.id);
    router.push({
      pathname: '/agenda-detail',
      params: {
        id: session.id,
        title: session.title,
        date: session.date || '',
        startTime: session.startTime || '',
        endTime: session.endTime || '',
        room: session.room || '',
        typeTrack: session.typeTrack || '',
        sessionDescription: session.sessionDescription || '',
        speakerNames: Array.isArray(session.speakerNames)
          ? session.speakerNames.join(', ')
          : session.speakerNames || '',
      },
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderSessionCard = (session: Session) => {
    const dateDisplay = session.date ? formatDate(session.date) : '';
    const timeDisplay = session.endTime
      ? `${session.startTime} - ${session.endTime}`
      : session.startTime || '';
    const roomDisplay = session.room || '';

    return (
      <TouchableOpacity
        key={session.id}
        style={[styles.sessionCard, { backgroundColor: cardBg }]}
        onPress={() => handleSessionPress(session)}
        activeOpacity={0.7}
      >
        <Text style={[styles.sessionTitle, { color: textColor }]} numberOfLines={2}>
          {session.title}
        </Text>
        <View style={styles.sessionMeta}>
          {dateDisplay ? (
            <View style={styles.sessionMetaRow}>
              <IconSymbol
                ios_icon_name="calendar"
                android_material_icon_name="calendar-today"
                size={14}
                color={secondaryTextColor}
              />
              <Text style={[styles.sessionMetaText, { color: secondaryTextColor }]}>
                {dateDisplay}
              </Text>
            </View>
          ) : null}
          {timeDisplay ? (
            <View style={styles.sessionMetaRow}>
              <IconSymbol
                ios_icon_name="clock"
                android_material_icon_name="access-time"
                size={14}
                color={secondaryTextColor}
              />
              <Text style={[styles.sessionMetaText, { color: secondaryTextColor }]}>
                {timeDisplay}
              </Text>
            </View>
          ) : null}
          {roomDisplay ? (
            <View style={styles.sessionMetaRow}>
              <IconSymbol
                ios_icon_name="location.fill"
                android_material_icon_name="location-on"
                size={14}
                color={secondaryTextColor}
              />
              <Text style={[styles.sessionMetaText, { color: secondaryTextColor }]}>
                {roomDisplay}
              </Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Speaker Details',
          headerStyle: {
            backgroundColor: isDark ? colors.backgroundDark : colors.background,
          },
          headerTintColor: textColor,
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]} edges={['bottom']}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Photo */}
          <View style={styles.photoSection}>
            {photoUrl ? (
              <Image
                source={resolveImageSource(photoUrl)}
                style={styles.photo}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.photoPlaceholder, { backgroundColor: colors.accent + '20' }]}>
                <IconSymbol
                  ios_icon_name="person.fill"
                  android_material_icon_name="person"
                  size={80}
                  color={colors.accent}
                />
              </View>
            )}
          </View>

          {/* Name and Title */}
          <View style={styles.headerSection}>
            <Text style={[styles.name, { color: textColor }]}>{fullName}</Text>
            {speakerTitle && (
              <Text style={[styles.speakerTitle, { color: secondaryTextColor }]}>{speakerTitle}</Text>
            )}
          </View>

          {/* Contact Info (if public) */}
          {publicPersonalData && (email || phone) && (
            <View style={[styles.contactSection, { backgroundColor: cardBg }]}>
              {email && (
                <TouchableOpacity style={styles.contactRow} onPress={handleEmailPress}>
                  <IconSymbol
                    ios_icon_name="envelope.fill"
                    android_material_icon_name="email"
                    size={20}
                    color={colors.accent}
                  />
                  <Text style={[styles.contactText, { color: colors.accent }]}>{email}</Text>
                </TouchableOpacity>
              )}
              {phone && (
                <TouchableOpacity style={styles.contactRow} onPress={handlePhonePress}>
                  <IconSymbol
                    ios_icon_name="phone.fill"
                    android_material_icon_name="phone"
                    size={20}
                    color={colors.accent}
                  />
                  <Text style={[styles.contactText, { color: colors.accent }]}>{phone}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Speaking Topic */}
          {speakingTopic && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <IconSymbol
                  ios_icon_name="mic.fill"
                  android_material_icon_name="mic"
                  size={20}
                  color={colors.accent}
                />
                <Text style={[styles.sectionTitle, { color: textColor }]}>Speaking Topic</Text>
              </View>
              <Text style={[styles.sectionContent, { color: textColor }]}>{speakingTopic}</Text>
            </View>
          )}

          {/* Topic Synopsis */}
          {synopsis && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <IconSymbol
                  ios_icon_name="doc.text.fill"
                  android_material_icon_name="description"
                  size={20}
                  color={colors.accent}
                />
                <Text style={[styles.sectionTitle, { color: textColor }]}>Synopsis</Text>
              </View>
              <Text style={[styles.sectionContent, { color: textColor }]}>{synopsis}</Text>
            </View>
          )}

          {/* Bio */}
          {bio && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <IconSymbol
                  ios_icon_name="person.text.rectangle.fill"
                  android_material_icon_name="badge"
                  size={20}
                  color={colors.accent}
                />
                <Text style={[styles.sectionTitle, { color: textColor }]}>Biography</Text>
              </View>
              <Text style={[styles.sectionContent, { color: textColor }]}>{bio}</Text>
            </View>
          )}

          {/* Sessions — shown while loading or when sessions exist */}
          {(loadingSessions || sessions.length > 0) && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <IconSymbol
                  ios_icon_name="calendar.badge.clock"
                  android_material_icon_name="event"
                  size={20}
                  color={colors.accent}
                />
                <Text style={[styles.sectionTitle, { color: textColor }]}>Sessions</Text>
              </View>
              {loadingSessions ? (
                <View style={styles.sessionsLoading}>
                  <ActivityIndicator size="small" color={colors.accent} />
                  <Text style={[styles.sessionsLoadingText, { color: secondaryTextColor }]}>
                    Loading sessions...
                  </Text>
                </View>
              ) : (
                <View style={styles.sessionsList}>
                  {sessions.map(renderSessionCard)}
                </View>
              )}
            </View>
          )}
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
    padding: 16,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  photo: {
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  photoPlaceholder: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  speakerTitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 4,
  },
  contactSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  contactText: {
    fontSize: 15,
    marginLeft: 12,
  },
  section: {
    marginBottom: 24,
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
  sectionContent: {
    fontSize: 15,
    lineHeight: 22,
  },
  sessionsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  sessionsLoadingText: {
    marginLeft: 12,
    fontSize: 15,
  },
  noSessions: {
    fontSize: 15,
    fontStyle: 'italic',
  },
  sessionsList: {
    gap: 12,
  },
  sessionCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  sessionMeta: {
    gap: 6,
  },
  sessionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sessionMetaText: {
    fontSize: 14,
  },
});
