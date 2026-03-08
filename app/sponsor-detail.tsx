
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

// Sponsor tier colors
const TIER_COLORS: { [key: string]: string } = {
  'Presenting': '#FFD700',
  'Platinum': '#E5E4E2',
  'Gold': '#FFBF00',
  'Silver': '#C0C0C0',
  'Bronze': '#CD7F32',
  'Other / Supporting': '#A9A9A9',
};

export default function SponsorDetailScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const params = useLocalSearchParams();

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const secondaryTextColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardBg = isDark ? colors.cardDark : colors.card;
  const borderColorValue = isDark ? colors.borderDark : colors.border;

  const sponsor: Sponsor = JSON.parse(params.sponsorData as string);

  const handleLinkPress = (url: string) => {
    console.log('[SponsorDetail] Opening URL:', url);
    Linking.openURL(url).catch(err => console.error('[SponsorDetail] Failed to open URL:', err));
  };

  const handleEmailPress = () => {
    if (sponsor.email) {
      const mailtoUrl = `mailto:${sponsor.email}`;
      handleLinkPress(mailtoUrl);
    }
  };

  // Normalize tier name
  const normalizeTier = (tier: string | undefined): string => {
    if (!tier) return 'Other / Supporting';
    
    const lowerTier = tier.toLowerCase();
    
    if (lowerTier.includes('presenting')) return 'Presenting';
    if (lowerTier.includes('platinum')) return 'Platinum';
    if (lowerTier.includes('gold')) return 'Gold';
    if (lowerTier.includes('silver')) return 'Silver';
    if (lowerTier.includes('bronze')) return 'Bronze';
    
    return 'Other / Supporting';
  };

  const normalizedTier = normalizeTier(sponsor.level);
  const tierColor = TIER_COLORS[normalizedTier] || colors.primary;
  const logoPlaceholderText = sponsor.name.charAt(0);
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
          {/* Logo Section */}
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

          {/* Header Section - Name and Tier */}
          <View style={styles.headerSection}>
            <Text style={[styles.name, { color: textColor }]}>{sponsor.name}</Text>
            <View style={[styles.tierBadge, { backgroundColor: tierColor + '20', borderColor: tierColor }]}>
              <Text style={[styles.tierText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                {normalizedTier}
              </Text>
            </View>
          </View>

          {/* Description Section */}
          {hasBio && (
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <IconSymbol
                  ios_icon_name="info.circle.fill"
                  android_material_icon_name="info"
                  size={20}
                  color={colors.primary}
                />
                <Text style={[styles.sectionTitle, { color: textColor }]}>Description</Text>
              </View>
              <Text style={[styles.bio, { color: textColor }]}>{sponsor.bio}</Text>
            </View>
          )}

          {/* Contact & Links Section */}
          {hasLinks && (
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <IconSymbol
                  ios_icon_name="link.circle.fill"
                  android_material_icon_name="link"
                  size={20}
                  color={colors.primary}
                />
                <Text style={[styles.sectionTitle, { color: textColor }]}>Connect</Text>
              </View>

              {hasCompanyUrl && (
                <TouchableOpacity
                  style={[styles.linkButton, { backgroundColor: cardBg, borderColor: borderColorValue }]}
                  onPress={() => handleLinkPress(sponsor.companyUrl!)}
                  activeOpacity={0.7}
                >
                  <View style={styles.linkIconContainer}>
                    <IconSymbol
                      ios_icon_name="globe"
                      android_material_icon_name="language"
                      size={20}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.linkTextContainer}>
                    <Text style={[styles.linkButtonLabel, { color: secondaryTextColor }]}>Website</Text>
                    <Text style={[styles.linkButtonText, { color: colors.primary }]} numberOfLines={1}>
                      {sponsor.companyUrl}
                    </Text>
                  </View>
                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="arrow-forward"
                    size={16}
                    color={secondaryTextColor}
                  />
                </TouchableOpacity>
              )}

              {hasEmail && (
                <TouchableOpacity
                  style={[styles.linkButton, { backgroundColor: cardBg, borderColor: borderColorValue }]}
                  onPress={handleEmailPress}
                  activeOpacity={0.7}
                >
                  <View style={styles.linkIconContainer}>
                    <IconSymbol
                      ios_icon_name="envelope.fill"
                      android_material_icon_name="email"
                      size={20}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.linkTextContainer}>
                    <Text style={[styles.linkButtonLabel, { color: secondaryTextColor }]}>Email</Text>
                    <Text style={[styles.linkButtonText, { color: colors.primary }]} numberOfLines={1}>
                      {sponsor.email}
                    </Text>
                  </View>
                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="arrow-forward"
                    size={16}
                    color={secondaryTextColor}
                  />
                </TouchableOpacity>
              )}

              {hasLinkedIn && (
                <TouchableOpacity
                  style={[styles.linkButton, { backgroundColor: cardBg, borderColor: borderColorValue }]}
                  onPress={() => handleLinkPress(sponsor.linkedIn!)}
                  activeOpacity={0.7}
                >
                  <View style={styles.linkIconContainer}>
                    <IconSymbol
                      ios_icon_name="person.circle.fill"
                      android_material_icon_name="person"
                      size={20}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.linkTextContainer}>
                    <Text style={[styles.linkButtonLabel, { color: secondaryTextColor }]}>LinkedIn</Text>
                    <Text style={[styles.linkButtonText, { color: colors.primary }]} numberOfLines={1}>
                      View Profile
                    </Text>
                  </View>
                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="arrow-forward"
                    size={16}
                    color={secondaryTextColor}
                  />
                </TouchableOpacity>
              )}

              {hasFacebook && (
                <TouchableOpacity
                  style={[styles.linkButton, { backgroundColor: cardBg, borderColor: borderColorValue }]}
                  onPress={() => handleLinkPress(sponsor.facebook!)}
                  activeOpacity={0.7}
                >
                  <View style={styles.linkIconContainer}>
                    <IconSymbol
                      ios_icon_name="person.2.fill"
                      android_material_icon_name="group"
                      size={20}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.linkTextContainer}>
                    <Text style={[styles.linkButtonLabel, { color: secondaryTextColor }]}>Facebook</Text>
                    <Text style={[styles.linkButtonText, { color: colors.primary }]} numberOfLines={1}>
                      View Page
                    </Text>
                  </View>
                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="arrow-forward"
                    size={16}
                    color={secondaryTextColor}
                  />
                </TouchableOpacity>
              )}

              {hasX && (
                <TouchableOpacity
                  style={[styles.linkButton, { backgroundColor: cardBg, borderColor: borderColorValue }]}
                  onPress={() => handleLinkPress(sponsor.x!)}
                  activeOpacity={0.7}
                >
                  <View style={styles.linkIconContainer}>
                    <IconSymbol
                      ios_icon_name="at.circle.fill"
                      android_material_icon_name="alternate-email"
                      size={20}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.linkTextContainer}>
                    <Text style={[styles.linkButtonLabel, { color: secondaryTextColor }]}>X (Twitter)</Text>
                    <Text style={[styles.linkButtonText, { color: colors.primary }]} numberOfLines={1}>
                      View Profile
                    </Text>
                  </View>
                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="arrow-forward"
                    size={16}
                    color={secondaryTextColor}
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
  tierBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  tierText: {
    fontSize: 15,
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
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
  },
  linkIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  linkTextContainer: {
    flex: 1,
  },
  linkButtonLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  linkButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
