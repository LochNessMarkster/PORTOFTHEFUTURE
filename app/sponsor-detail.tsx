import React, { useEffect, useMemo, useState } from 'react';
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

interface Session {
  id: string;
  Title?: string;
  Date?: string | null;
  'Start Time'?: string | null;
  'End Time'?: string | null;
  'Room'?: string | null;
  'Type/Track'?: string | null;
  'Session Description'?: string | null;
  'Speaker Names'?: string | null;
  'Speaker(s)'?: string[] | null;
}

interface AirtableSessionRecord {
  id: string;
  fields: Record<string, unknown>;
}

interface AirtableSessionsResponse {
  records?: AirtableSessionRecord[];
  offset?: string;
}

function resolveImageSource(
  source: string | number | ImageSourcePropType | undefined
): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

function normalizeParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] ?? '';
  return param ?? '';
}

function normalizeText(value: unknown): string {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function splitSpeakerNames(value: unknown): string[] {
  return String(value ?? '')
    .split(',')
    .map((name) => normalizeText(name))
    .filter(Boolean);
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

  const speakerId = normalizeParam(params.id as string | string[] | undefined);
  const firstName = normalizeParam(params.firstName as string | string[] | undefined);
  const lastName = normalizeParam(params.lastName as string | string[] | undefined);
  const speakerTitle = normalizeParam(params.speakerTitle as string | string[] | undefined);
  const speakingTopic = normalizeParam(params.speakingTopic as string | string[] | undefined);
  const synopsis = normalizeParam(params.synopsis as string | string[] | undefined);
  const bio = normalizeParam(params.bio as string | string[] | undefined);
  const photoUrl = normalizeParam(params.photoUrl as string | string[] | undefined);
  const email = normalizeParam(params.email as string | string[] | undefined);
  const phone = normalizeParam(params.phone as string | string[] | undefined);
  const publicPersonalData =
    normalizeParam(params.publicPersonalData as string | string[] | undefined) === 'true';

  const fullName = useMemo(() => {
    return [firstName, lastName].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  }, [firstName, lastName]);

  useEffect(() => {
    loadSpeakerSessions();
  }, [speakerId, fullName]);

  const loadSpeakerSessions = async () => {
    try {
      setLoadingSessions(true);

      let allRecords: AirtableSessionRecord[] = [];
      let offset: string | undefined;

      do {
        const url = new URL(
          'https://airtablecache.portofthefutureconference.com/v0/appkKjciinTlnsbkd/tblHaxjP8sWviBQjD'
        );
        if (offset) {
          url.searchParams.set('offset', offset);
        }

        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error(`Failed to fetch sessions: ${response.status}`);
        }

        const data: AirtableSessionsResponse = await response.json();
        const records = Array.isArray(data.records) ? data.records : [];
        allRecords = allRecords.concat(records);
        offset = data.offset;
      } while (offset);

      const allSessions: Session[] = allRecords.map((record) => ({
        id: record.id,
        ...(record.fields as Omit<Session, 'id'>),
      }));

      const normalizedFullName = normalizeText(fullName);

      const filtered = allSessions.filter((session) => {
        const linkedSpeakerIds = Array.isArray(session['Speaker(s)'])
          ? session['Speaker(s)']!.map((id) => String(id))
          : [];

        if (speakerId && linkedSpeakerIds.includes(speakerId)) {
          return true;
        }

        const names = splitSpeakerNames(session['Speaker Names']);
        if (normalizedFullName && names.includes(normalizedFullName)) {
          return true;
        }

        const rawSpeakerNames = normalizeText(session['Speaker Names']);
        if (normalizedFullName && rawSpeakerNames.includes(normalizedFullName)) {
          return true;
        }

        return false;
      });

      setSessions(filtered);
    } catch (err) {
      console.error('[SpeakerDetail] Error loading sessions:', err);
      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleEmailPress = () => {
    if (email) {
      Linking.openURL(`mailto:${email}`);
    }
  };

  const handlePhonePress = () => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const handleSessionPress = (session: Session) => {
    router.push({
      pathname: '/agenda-detail',
      params: {
        id: session.id,
        title: session.Title || '',
        date: session.Date || '',
        startTime: session['Start Time'] || '',
        endTime: session['End Time'] || '',
        room: session['Room'] || '',
        typeTrack: session['Type/Track'] || '',
        sessionDescription: session['Session Description'] || '',
        speakerNames: session['Speaker Names'] || '',
      },
    });
  };

  const renderSessionBullet = (session: Session) => {
    return (
      <TouchableOpacity
        key={session.id}
        style={styles.sessionBullet}
        onPress={() => handleSessionPress(session)}
        activeOpacity={0.7}
      >
        <Text style={[styles.sessionBulletDot, { color: colors.accent }]}>{'\u2022'}</Text>
        <Text style={[styles.sessionBulletTitle, { color: colors.accent }]}>
          {session.Title || 'Untitled Session'}
        </Text>
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
          <View style={styles.photoSection}>
            {photoUrl ? (
              <Image source={resolveImageSource(photoUrl)} style={styles.photo} resizeMode="cover" />
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

          <View style={styles.headerSection}>
            <Text style={[styles.name, { color: textColor }]}>{fullName}</Text>
            {speakerTitle ? (
              <Text style={[styles.speakerTitle, { color: secondaryTextColor }]}>
                {speakerTitle}
              </Text>
            ) : null}
          </View>

          {publicPersonalData && (email || phone) ? (
            <View style={[styles.contactSection, { backgroundColor: cardBg }]}>
              {email ? (
                <TouchableOpacity style={styles.contactRow} onPress={handleEmailPress}>
                  <IconSymbol
                    ios_icon_name="envelope.fill"
                    android_material_icon_name="email"
                    size={20}
                    color={colors.accent}
                  />
                  <Text style={[styles.contactText, { color: colors.accent }]}>{email}</Text>
                </TouchableOpacity>
              ) : null}

              {phone ? (
                <TouchableOpacity style={styles.contactRow} onPress={handlePhonePress}>
                  <IconSymbol
                    ios_icon_name="phone.fill"
                    android_material_icon_name="phone"
                    size={20}
                    color={colors.accent}
                  />
                  <Text style={[styles.contactText, { color: colors.accent }]}>{phone}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          {speakingTopic ? (
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
          ) : null}

          {synopsis ? (
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
          ) : null}

          {bio ? (
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
          ) : null}

          {(loadingSessions || sessions.length > 0) ? (
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
                <View style={styles.sessionsList}>{sessions.map(renderSessionBullet)}</View>
              )}
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
  sessionsList: {
    gap: 8,
  },
  sessionBullet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  sessionBulletDot: {
    fontSize: 16,
    lineHeight: 22,
  },
  sessionBulletTitle: {
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
    textDecorationLine: 'underline',
  },
});