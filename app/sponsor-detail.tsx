
import React from 'react';
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
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { Sponsor } from '@/utils/airtable';

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

export default function SponsorDetailScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const params = useLocalSearchParams();

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const cardBg = isDark ? colors.cardDark : colors.card;
  const borderColorValue = isDark ? colors.borderDark : colors.border;

  const sponsor: Sponsor = JSON.parse(params.sponsorData as string);

  const handleLinkPress = (url: string) => {
    console.log('Opening URL:', url);
    Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
  };

  const handleEmailPress = () => {
    if (sponsor.email) {
      const mailtoUrl = `mailto:${sponsor.email}`;
      handleLinkPress(mailtoUrl);
    }
  };

  const logoPlaceholderText = sponsor.name.charAt(0);
  const hasLevel = Boolean(sponsor.level);
  const hasBio = Boolean(sponsor.bio);
  const hasCompanyUrl = Boolean(sponsor.companyUrl);
  const hasEmail = Boolean(sponsor.email);
  const hasLinkedIn = Boolean(sponsor.linkedIn);
  const hasFacebook = Boolean(sponsor.facebook);
  const hasX = Boolean(sponsor.x);
  const hasLinks = hasCompanyUrl || hasEmail || hasLinkedIn || hasFacebook || hasX;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Sponsor Details',
          headerStyle: {
            backgroundColor: isDark ? colors.backgroundDark : colors.background,
          },
          headerTintColor: textColor,
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]} edges={['bottom']}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              {sponsor.logoUrl ? (
                <Image
                  source={resolveImageSource(sponsor.logoUrl)}
                  style={styles.logo}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Text style={[styles.logoPlaceholderText, { color: colors.primary }]}>
                    {logoPlaceholderText}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.headerSection}>
            <Text style={[styles.name, { color: textColor }]}>{sponsor.name}</Text>
            {hasLevel && (
              <View style={[styles.levelBadge, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.levelText, { color: colors.primary }]}>{sponsor.level}</Text>
              </View>
            )}
          </View>

          {hasBio && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>About</Text>
              <Text style={[styles.bio, { color: textColor }]}>{sponsor.bio}</Text>
            </View>
          )}

          {hasLinks && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>Connect</Text>

              {hasCompanyUrl && (
                <TouchableOpacity
                  style={[styles.linkButton, { backgroundColor: cardBg, borderColor: borderColorValue }]}
                  onPress={() => handleLinkPress(sponsor.companyUrl!)}
                  activeOpacity={0.7}
                >
                  <IconSymbol
                    ios_icon_name="globe"
                    android_material_icon_name="language"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={[styles.linkButtonText, { color: colors.primary }]}>Visit Website</Text>
                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="arrow-forward"
                    size={16}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              )}

              {hasEmail && (
                <TouchableOpacity
                  style={[styles.linkButton, { backgroundColor: cardBg, borderColor: borderColorValue }]}
                  onPress={handleEmailPress}
                  activeOpacity={0.7}
                >
                  <IconSymbol
                    ios_icon_name="envelope.fill"
                    android_material_icon_name="email"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={[styles.linkButtonText, { color: colors.primary }]}>Send Email</Text>
                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="arrow-forward"
                    size={16}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              )}

              {hasLinkedIn && (
                <TouchableOpacity
                  style={[styles.linkButton, { backgroundColor: cardBg, borderColor: borderColorValue }]}
                  onPress={() => handleLinkPress(sponsor.linkedIn!)}
                  activeOpacity={0.7}
                >
                  <IconSymbol
                    ios_icon_name="link"
                    android_material_icon_name="link"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={[styles.linkButtonText, { color: colors.primary }]}>LinkedIn</Text>
                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="arrow-forward"
                    size={16}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              )}

              {hasFacebook && (
                <TouchableOpacity
                  style={[styles.linkButton, { backgroundColor: cardBg, borderColor: borderColorValue }]}
                  onPress={() => handleLinkPress(sponsor.facebook!)}
                  activeOpacity={0.7}
                >
                  <IconSymbol
                    ios_icon_name="link"
                    android_material_icon_name="link"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={[styles.linkButtonText, { color: colors.primary }]}>Facebook</Text>
                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="arrow-forward"
                    size={16}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              )}

              {hasX && (
                <TouchableOpacity
                  style={[styles.linkButton, { backgroundColor: cardBg, borderColor: borderColorValue }]}
                  onPress={() => handleLinkPress(sponsor.x!)}
                  activeOpacity={0.7}
                >
                  <IconSymbol
                    ios_icon_name="link"
                    android_material_icon_name="link"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={[styles.linkButtonText, { color: colors.primary }]}>X (Twitter)</Text>
                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="arrow-forward"
                    size={16}
                    color={colors.primary}
                  />
                </TouchableOpacity>
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
  logoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    width: 200,
    height: 150,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logo: {
    width: '90%',
    height: '90%',
  },
  logoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPlaceholderText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  levelBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  levelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  bio: {
    fontSize: 15,
    lineHeight: 22,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    gap: 12,
  },
  linkButtonText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
});
