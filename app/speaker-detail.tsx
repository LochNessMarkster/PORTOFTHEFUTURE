
import React from 'react';
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
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

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

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const secondaryTextColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardBg = isDark ? colors.cardDark : colors.card;

  const name = params.name_display as string;
  const title = params.title_full as string;
  const topic = params.speaking_topic as string;
  const synopsis = params.topic_synopsis as string;
  const bio = params.bio as string;
  const photoUrl = params.photo_url as string;
  const publicPersonalData = params.public_personal_data === 'true';
  const email = params.email as string;
  const phone = params.phone as string;

  const handleEmailPress = () => {
    if (email) {
      console.log('Opening email:', email);
      Linking.openURL(`mailto:${email}`);
    }
  };

  const handlePhonePress = () => {
    if (phone) {
      console.log('Opening phone:', phone);
      Linking.openURL(`tel:${phone}`);
    }
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
              <View style={[styles.photoPlaceholder, { backgroundColor: colors.primary + '20' }]}>
                <IconSymbol
                  ios_icon_name="person.fill"
                  android_material_icon_name="person"
                  size={80}
                  color={colors.primary}
                />
              </View>
            )}
          </View>

          {/* Name and Title */}
          <View style={styles.headerSection}>
            <Text style={[styles.name, { color: textColor }]}>{name}</Text>
            {title && (
              <Text style={[styles.title, { color: secondaryTextColor }]}>{title}</Text>
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
                    color={colors.primary}
                  />
                  <Text style={[styles.contactText, { color: colors.primary }]}>{email}</Text>
                </TouchableOpacity>
              )}
              {phone && (
                <TouchableOpacity style={styles.contactRow} onPress={handlePhonePress}>
                  <IconSymbol
                    ios_icon_name="phone.fill"
                    android_material_icon_name="phone"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={[styles.contactText, { color: colors.primary }]}>{phone}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Speaking Topic */}
          {topic && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <IconSymbol
                  ios_icon_name="mic.fill"
                  android_material_icon_name="mic"
                  size={20}
                  color={colors.primary}
                />
                <Text style={[styles.sectionTitle, { color: textColor }]}>Speaking Topic</Text>
              </View>
              <Text style={[styles.sectionContent, { color: textColor }]}>{topic}</Text>
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
                  color={colors.primary}
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
                  color={colors.primary}
                />
                <Text style={[styles.sectionTitle, { color: textColor }]}>Biography</Text>
              </View>
              <Text style={[styles.sectionContent, { color: textColor }]}>{bio}</Text>
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
  title: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
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
});
