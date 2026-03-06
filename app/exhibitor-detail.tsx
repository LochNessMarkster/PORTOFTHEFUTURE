
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
    console.log('Opening URL:', url);
    Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
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
  const hasAddress = Boolean(exhibitor.address);
  const hasUrl = Boolean(exhibitor.url);
  const hasLinkedIn = Boolean(exhibitor.linkedIn);
  const hasFacebook = Boolean(exhibitor.facebook);
  const hasX = Boolean(exhibitor.x);
  const hasContactName = Boolean(exhibitor.primaryContactName);
  const hasContactTitle = Boolean(exhibitor.primaryContactTitle);
  const hasContactEmail = Boolean(exhibitor.primaryContactEmail);
  const hasContactPhone = Boolean(exhibitor.primaryDirectPhone);
  const hasAdminPhone = Boolean(exhibitor.adminPhoneBooth);
  const boothPhoneLabel = 'Booth Phone';

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
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              {exhibitor.logoUrl ? (
                <Image
                  source={resolveImageSource(exhibitor.logoUrl)}
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
            <Text style={[styles.name, { color: textColor }]}>{exhibitor.name}</Text>
            {hasBoothNumber && (
              <View style={[styles.boothBadge, { backgroundColor: colors.primary + '20' }]}>
                <IconSymbol
                  ios_icon_name="mappin.circle.fill"
                  android_material_icon_name="place"
                  size={16}
                  color={colors.primary}
                />
                <Text style={[styles.boothText, { color: colors.primary }]}>
                  {boothLabel}
                </Text>
              </View>
            )}
          </View>

          {hasDescription && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>About</Text>
              <Text style={[styles.description, { color: textColor }]}>{exhibitor.description}</Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Contact Information</Text>

            {hasAddress && (
              <View style={[styles.contactItem, { backgroundColor: cardBg, borderColor: borderColorValue }]}>
                <IconSymbol
                  ios_icon_name="location.fill"
                  android_material_icon_name="location-on"
                  size={20}
                  color={colors.primary}
                />
                <Text style={[styles.contactText, { color: textColor }]}>{exhibitor.address}</Text>
              </View>
            )}

            {hasUrl && (
              <TouchableOpacity
                style={[styles.contactItem, { backgroundColor: cardBg, borderColor: borderColorValue }]}
                onPress={() => handleLinkPress(exhibitor.url!)}
                activeOpacity={0.7}
              >
                <IconSymbol
                  ios_icon_name="globe"
                  android_material_icon_name="language"
                  size={20}
                  color={colors.primary}
                />
                <Text style={[styles.contactTextLink, { color: colors.primary }]}>Visit Website</Text>
              </TouchableOpacity>
            )}

            {hasLinkedIn && (
              <TouchableOpacity
                style={[styles.contactItem, { backgroundColor: cardBg, borderColor: borderColorValue }]}
                onPress={() => handleLinkPress(exhibitor.linkedIn!)}
                activeOpacity={0.7}
              >
                <IconSymbol
                  ios_icon_name="link"
                  android_material_icon_name="link"
                  size={20}
                  color={colors.primary}
                />
                <Text style={[styles.contactTextLink, { color: colors.primary }]}>LinkedIn</Text>
              </TouchableOpacity>
            )}

            {hasFacebook && (
              <TouchableOpacity
                style={[styles.contactItem, { backgroundColor: cardBg, borderColor: borderColorValue }]}
                onPress={() => handleLinkPress(exhibitor.facebook!)}
                activeOpacity={0.7}
              >
                <IconSymbol
                  ios_icon_name="link"
                  android_material_icon_name="link"
                  size={20}
                  color={colors.primary}
                />
                <Text style={[styles.contactTextLink, { color: colors.primary }]}>Facebook</Text>
              </TouchableOpacity>
            )}

            {hasX && (
              <TouchableOpacity
                style={[styles.contactItem, { backgroundColor: cardBg, borderColor: borderColorValue }]}
                onPress={() => handleLinkPress(exhibitor.x!)}
                activeOpacity={0.7}
              >
                <IconSymbol
                  ios_icon_name="link"
                  android_material_icon_name="link"
                  size={20}
                  color={colors.primary}
                />
                <Text style={[styles.contactTextLink, { color: colors.primary }]}>X (Twitter)</Text>
              </TouchableOpacity>
            )}

            {(hasContactName || hasContactTitle) && (
              <View style={[styles.contactItem, { backgroundColor: cardBg, borderColor: borderColorValue }]}>
                <IconSymbol
                  ios_icon_name="person.fill"
                  android_material_icon_name="person"
                  size={20}
                  color={colors.primary}
                />
                <View style={styles.contactTextContainer}>
                  {hasContactName && (
                    <Text style={[styles.contactText, { color: textColor }]}>
                      {exhibitor.primaryContactName}
                    </Text>
                  )}
                  {hasContactTitle && (
                    <Text style={[styles.contactSubtext, { color: secondaryTextColor }]}>
                      {exhibitor.primaryContactTitle}
                    </Text>
                  )}
                </View>
              </View>
            )}

            {hasContactEmail && (
              <TouchableOpacity
                style={[styles.contactItem, { backgroundColor: cardBg, borderColor: borderColorValue }]}
                onPress={handleEmailPress}
                activeOpacity={0.7}
              >
                <IconSymbol
                  ios_icon_name="envelope.fill"
                  android_material_icon_name="email"
                  size={20}
                  color={colors.primary}
                />
                <Text style={[styles.contactTextLink, { color: colors.primary }]}>
                  {exhibitor.primaryContactEmail}
                </Text>
              </TouchableOpacity>
            )}

            {hasContactPhone && (
              <TouchableOpacity
                style={[styles.contactItem, { backgroundColor: cardBg, borderColor: borderColorValue }]}
                onPress={handlePhonePress}
                activeOpacity={0.7}
              >
                <IconSymbol
                  ios_icon_name="phone.fill"
                  android_material_icon_name="phone"
                  size={20}
                  color={colors.primary}
                />
                <Text style={[styles.contactTextLink, { color: colors.primary }]}>
                  {exhibitor.primaryDirectPhone}
                </Text>
              </TouchableOpacity>
            )}

            {hasAdminPhone && (
              <View style={[styles.contactItem, { backgroundColor: cardBg, borderColor: borderColorValue }]}>
                <IconSymbol
                  ios_icon_name="phone.fill"
                  android_material_icon_name="phone"
                  size={20}
                  color={colors.primary}
                />
                <View style={styles.contactTextContainer}>
                  <Text style={[styles.contactText, { color: textColor }]}>
                    {exhibitor.adminPhoneBooth}
                  </Text>
                  <Text style={[styles.contactSubtext, { color: secondaryTextColor }]}>
                    {boothPhoneLabel}
                  </Text>
                </View>
              </View>
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
  boothBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  boothText: {
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
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    gap: 12,
  },
  contactText: {
    fontSize: 15,
    flex: 1,
  },
  contactTextLink: {
    fontSize: 15,
    flex: 1,
    fontWeight: '500',
  },
  contactTextContainer: {
    flex: 1,
  },
  contactSubtext: {
    fontSize: 13,
    marginTop: 2,
  },
});
