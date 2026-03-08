
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
import { Exhibitor } from '@/utils/airtable';

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

export default function ExhibitorDetailScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const params = useLocalSearchParams();

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const secondaryTextColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardBg = isDark ? colors.cardDark : colors.card;
  const borderColorValue = isDark ? colors.borderDark : colors.border;

  const exhibitor: Exhibitor = JSON.parse(params.exhibitorData as string);

  const handleLinkPress = (url: string) => {
    console.log('[ExhibitorDetail] Opening URL:', url);
    Linking.openURL(url).catch(err => console.error('[ExhibitorDetail] Failed to open URL:', err));
  };

  const handleEmailPress = () => {
    if (exhibitor.primaryContactEmail) {
      const mailtoUrl = `mailto:${exhibitor.primaryContactEmail}`;
      handleLinkPress(mailtoUrl);
    }
  };

  const handlePhonePress = () => {
    if (exhibitor.primaryDirectPhone) {
      const telUrl = `tel:${exhibitor.primaryDirectPhone}`;
      handleLinkPress(telUrl);
    }
  };

  const logoPlaceholderText = exhibitor.name.charAt(0);
  const boothLabel = exhibitor.boothNumber ? `Booth ${exhibitor.boothNumber}` : '';
  const hasBoothNumber = Boolean(exhibitor.boothNumber);
  const hasDescription = Boolean(exhibitor.description);
  const hasWebsite = Boolean(exhibitor.url);
  const hasLinkedIn = Boolean(exhibitor.linkedIn);
  const hasFacebook = Boolean(exhibitor.facebook);
  const hasX = Boolean(exhibitor.x);
  const hasContactName = Boolean(exhibitor.primaryContactName);
  const hasContactTitle = Boolean(exhibitor.primaryContactTitle);
  const hasContactEmail = Boolean(exhibitor.primaryContactEmail);
  const hasContactPhone = Boolean(exhibitor.primaryDirectPhone);
  const hasBoothPhone = Boolean(exhibitor.adminPhoneBooth);
  const hasAddress = Boolean(exhibitor.address);

  const hasSocialLinks = hasLinkedIn || hasFacebook || hasX;
  const hasContactInfo = hasContactName || hasContactTitle || hasContactEmail || hasContactPhone || hasBoothPhone;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Exhibitor Details',
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
              {exhibitor.logoUrl ? (
                <Image
                  source={resolveImageSource(exhibitor.logoUrl)}
                  style={styles.logo}
                  resizeMode="contain"
                />
              ) : (
                <View style={[styles.logoPlaceholder, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.logoPlaceholderText, { color: colors.primary }]}>
                    {logoPlaceholderText}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Header Section */}
          <View style={styles.headerSection}>
            <Text style={[styles.companyName, { color: textColor }]}>{exhibitor.name}</Text>
            {hasBoothNumber && (
              <View style={[styles.boothBadge, { backgroundColor: colors.primary + '20' }]}>
                <IconSymbol
                  ios_icon_name="mappin.circle.fill"
                  android_material_icon_name="place"
                  size={18}
                  color={colors.primary}
                />
                <Text style={[styles.boothText, { color: colors.primary }]}>
                  {boothLabel}
                </Text>
              </View>
            )}
          </View>

          {/* Description Section */}
          {hasDescription && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>About</Text>
              <Text style={[styles.description, { color: textColor }]}>{exhibitor.description}</Text>
            </View>
          )}

          {/* Website Section */}
          {hasWebsite && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>Website</Text>
              <TouchableOpacity
                style={[styles.linkButton, { backgroundColor: cardBg, borderColor: borderColorValue }]}
                onPress={() => handleLinkPress(exhibitor.url!)}
                activeOpacity={0.7}
              >
                <IconSymbol
                  ios_icon_name="globe"
                  android_material_icon_name="language"
                  size={20}
                  color={colors.primary}
                />
                <Text style={[styles.linkText, { color: colors.primary }]} numberOfLines={1}>
                  {exhibitor.url}
                </Text>
                <IconSymbol
                  ios_icon_name="arrow.up.right"
                  android_material_icon_name="open-in-new"
                  size={16}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </View>
          )}

          {/* Contact Info Section */}
          {hasContactInfo && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>Contact Information</Text>

              {(hasContactName || hasContactTitle) && (
                <View style={[styles.infoCard, { backgroundColor: cardBg, borderColor: borderColorValue }]}>
                  <IconSymbol
                    ios_icon_name="person.fill"
                    android_material_icon_name="person"
                    size={20}
                    color={colors.primary}
                  />
                  <View style={styles.infoTextContainer}>
                    {hasContactName && (
                      <Text style={[styles.infoText, { color: textColor }]}>
                        {exhibitor.primaryContactName}
                      </Text>
                    )}
                    {hasContactTitle && (
                      <Text style={[styles.infoSubtext, { color: secondaryTextColor }]}>
                        {exhibitor.primaryContactTitle}
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {hasContactEmail && (
                <TouchableOpacity
                  style={[styles.infoCard, { backgroundColor: cardBg, borderColor: borderColorValue }]}
                  onPress={handleEmailPress}
                  activeOpacity={0.7}
                >
                  <IconSymbol
                    ios_icon_name="envelope.fill"
                    android_material_icon_name="email"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={[styles.infoTextLink, { color: colors.primary }]}>
                    {exhibitor.primaryContactEmail}
                  </Text>
                </TouchableOpacity>
              )}

              {hasContactPhone && (
                <TouchableOpacity
                  style={[styles.infoCard, { backgroundColor: cardBg, borderColor: borderColorValue }]}
                  onPress={handlePhonePress}
                  activeOpacity={0.7}
                >
                  <IconSymbol
                    ios_icon_name="phone.fill"
                    android_material_icon_name="phone"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={[styles.infoTextLink, { color: colors.primary }]}>
                    {exhibitor.primaryDirectPhone}
                  </Text>
                </TouchableOpacity>
              )}

              {hasBoothPhone && (
                <View style={[styles.infoCard, { backgroundColor: cardBg, borderColor: borderColorValue }]}>
                  <IconSymbol
                    ios_icon_name="phone.fill"
                    android_material_icon_name="phone"
                    size={20}
                    color={colors.primary}
                  />
                  <View style={styles.infoTextContainer}>
                    <Text style={[styles.infoText, { color: textColor }]}>
                      {exhibitor.adminPhoneBooth}
                    </Text>
                    <Text style={[styles.infoSubtext, { color: secondaryTextColor }]}>
                      Booth Phone
                    </Text>
                  </View>
                </View>
              )}

              {hasAddress && (
                <View style={[styles.infoCard, { backgroundColor: cardBg, borderColor: borderColorValue }]}>
                  <IconSymbol
                    ios_icon_name="location.fill"
                    android_material_icon_name="location-on"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={[styles.infoText, { color: textColor }]}>
                    {exhibitor.address}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Social Links Section */}
          {hasSocialLinks && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>Social Links</Text>

              {hasLinkedIn && (
                <TouchableOpacity
                  style={[styles.socialButton, { backgroundColor: cardBg, borderColor: borderColorValue }]}
                  onPress={() => handleLinkPress(exhibitor.linkedIn!)}
                  activeOpacity={0.7}
                >
                  <IconSymbol
                    ios_icon_name="link"
                    android_material_icon_name="link"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={[styles.socialText, { color: colors.primary }]}>LinkedIn</Text>
                  <IconSymbol
                    ios_icon_name="arrow.up.right"
                    android_material_icon_name="open-in-new"
                    size={16}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              )}

              {hasFacebook && (
                <TouchableOpacity
                  style={[styles.socialButton, { backgroundColor: cardBg, borderColor: borderColorValue }]}
                  onPress={() => handleLinkPress(exhibitor.facebook!)}
                  activeOpacity={0.7}
                >
                  <IconSymbol
                    ios_icon_name="link"
                    android_material_icon_name="link"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={[styles.socialText, { color: colors.primary }]}>Facebook</Text>
                  <IconSymbol
                    ios_icon_name="arrow.up.right"
                    android_material_icon_name="open-in-new"
                    size={16}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              )}

              {hasX && (
                <TouchableOpacity
                  style={[styles.socialButton, { backgroundColor: cardBg, borderColor: borderColorValue }]}
                  onPress={() => handleLinkPress(exhibitor.x!)}
                  activeOpacity={0.7}
                >
                  <IconSymbol
                    ios_icon_name="link"
                    android_material_icon_name="link"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={[styles.socialText, { color: colors.primary }]}>X (Twitter)</Text>
                  <IconSymbol
                    ios_icon_name="arrow.up.right"
                    android_material_icon_name="open-in-new"
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
    marginBottom: 20,
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
    borderRadius: 12,
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
  companyName: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  boothBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  boothText: {
    fontSize: 15,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  linkText: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoText: {
    fontSize: 15,
    flex: 1,
  },
  infoTextLink: {
    fontSize: 15,
    flex: 1,
    fontWeight: '500',
  },
  infoSubtext: {
    fontSize: 13,
    marginTop: 2,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    gap: 10,
  },
  socialText: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
});
