
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
  TouchableOpacity,
  Linking,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

export default function VenueScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const secondaryTextColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardBg = isDark ? colors.cardDark : colors.card;

  const venueName = 'Hilton University Houston';
  const venueAddress = '4450 University Drive';
  const venueCity = 'Houston, TX 77204';
  const venuePhone = '832-531-6300';
  const venueDescription = 'The Hilton University Houston is a premier conference venue located in the heart of Houston\'s vibrant university district. With state-of-the-art facilities, spacious ballrooms, and modern amenities, it provides the perfect setting for the Port of the Future Conference 2026.';

  const floorPlanImage = require('@/assets/images/8546669e-c90d-430b-ba95-15774e09b7bc.jpeg');

  const handleCallVenue = () => {
    console.log('User tapped Call Venue button');
    const phoneUrl = `tel:${venuePhone}`;
    Linking.openURL(phoneUrl).catch(err => console.error('Error opening phone dialer:', err));
  };

  const handleGetDirections = () => {
    console.log('User tapped Get Directions button');
    const address = `${venueAddress}, ${venueCity}`;
    const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(address)}`;
    Linking.openURL(mapsUrl).catch(err => console.error('Error opening maps:', err));
  };

  const handleViewFloorPlan = () => {
    console.log('User tapped View Floor Plan button');
    router.push('/floor-plan');
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Venue',
          headerStyle: {
            backgroundColor: isDark ? colors.backgroundDark : colors.background,
          },
          headerTintColor: textColor,
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]} edges={['bottom']}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Venue Header */}
          <View style={[styles.headerCard, { backgroundColor: cardBg }]}>
            <View style={styles.headerIcon}>
              <IconSymbol
                ios_icon_name="building.2.fill"
                android_material_icon_name="location-city"
                size={48}
                color={colors.primary}
              />
            </View>
            <Text style={[styles.venueName, { color: textColor }]}>{venueName}</Text>
            <Text style={[styles.venueDescription, { color: secondaryTextColor }]}>
              {venueDescription}
            </Text>
          </View>

          {/* Contact Information */}
          <View style={[styles.section, { backgroundColor: cardBg }]}>
            <View style={styles.sectionHeader}>
              <IconSymbol
                ios_icon_name="info.circle.fill"
                android_material_icon_name="info"
                size={22}
                color={colors.primary}
              />
              <Text style={[styles.sectionTitle, { color: textColor }]}>Contact Information</Text>
            </View>

            <View style={styles.contactItem}>
              <IconSymbol
                ios_icon_name="location.fill"
                android_material_icon_name="location-on"
                size={20}
                color={secondaryTextColor}
              />
              <View style={styles.contactText}>
                <Text style={[styles.contactLabel, { color: secondaryTextColor }]}>Address</Text>
                <Text style={[styles.contactValue, { color: textColor }]}>{venueAddress}</Text>
                <Text style={[styles.contactValue, { color: textColor }]}>{venueCity}</Text>
              </View>
            </View>

            <View style={styles.contactItem}>
              <IconSymbol
                ios_icon_name="phone.fill"
                android_material_icon_name="phone"
                size={20}
                color={secondaryTextColor}
              />
              <View style={styles.contactText}>
                <Text style={[styles.contactLabel, { color: secondaryTextColor }]}>Phone</Text>
                <Text style={[styles.contactValue, { color: textColor }]}>{venuePhone}</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={handleGetDirections}
            >
              <IconSymbol
                ios_icon_name="map.fill"
                android_material_icon_name="directions"
                size={22}
                color="#FFFFFF"
              />
              <Text style={styles.actionButtonText}>Get Directions</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={handleCallVenue}
            >
              <IconSymbol
                ios_icon_name="phone.fill"
                android_material_icon_name="phone"
                size={22}
                color="#FFFFFF"
              />
              <Text style={styles.actionButtonText}>Call Venue</Text>
            </TouchableOpacity>
          </View>

          {/* Floor Plan Preview */}
          <View style={[styles.section, { backgroundColor: cardBg }]}>
            <View style={styles.sectionHeader}>
              <IconSymbol
                ios_icon_name="map"
                android_material_icon_name="map"
                size={22}
                color={colors.primary}
              />
              <Text style={[styles.sectionTitle, { color: textColor }]}>Floor Plan</Text>
            </View>

            <TouchableOpacity
              style={styles.floorPlanPreview}
              onPress={handleViewFloorPlan}
            >
              <Image
                source={resolveImageSource(floorPlanImage)}
                style={styles.floorPlanImage}
                resizeMode="cover"
              />
              <View style={styles.floorPlanOverlay}>
                <IconSymbol
                  ios_icon_name="arrow.up.right.square.fill"
                  android_material_icon_name="open-in-new"
                  size={32}
                  color="#FFFFFF"
                />
                <Text style={styles.floorPlanOverlayText}>View Full Floor Plan</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Amenities */}
          <View style={[styles.section, { backgroundColor: cardBg }]}>
            <View style={styles.sectionHeader}>
              <IconSymbol
                ios_icon_name="star.fill"
                android_material_icon_name="star"
                size={22}
                color={colors.primary}
              />
              <Text style={[styles.sectionTitle, { color: textColor }]}>Amenities</Text>
            </View>

            <View style={styles.amenitiesList}>
              <View style={styles.amenityItem}>
                <IconSymbol
                  ios_icon_name="wifi"
                  android_material_icon_name="wifi"
                  size={18}
                  color={colors.primary}
                />
                <Text style={[styles.amenityText, { color: secondaryTextColor }]}>
                  Complimentary Wi-Fi
                </Text>
              </View>

              <View style={styles.amenityItem}>
                <IconSymbol
                  ios_icon_name="car.fill"
                  android_material_icon_name="local-parking"
                  size={18}
                  color={colors.primary}
                />
                <Text style={[styles.amenityText, { color: secondaryTextColor }]}>
                  On-site Parking
                </Text>
              </View>

              <View style={styles.amenityItem}>
                <IconSymbol
                  ios_icon_name="fork.knife"
                  android_material_icon_name="restaurant"
                  size={18}
                  color={colors.primary}
                />
                <Text style={[styles.amenityText, { color: secondaryTextColor }]}>
                  Restaurant & Catering
                </Text>
              </View>

              <View style={styles.amenityItem}>
                <IconSymbol
                  ios_icon_name="figure.walk"
                  android_material_icon_name="accessible"
                  size={18}
                  color={colors.primary}
                />
                <Text style={[styles.amenityText, { color: secondaryTextColor }]}>
                  Accessible Facilities
                </Text>
              </View>

              <View style={styles.amenityItem}>
                <IconSymbol
                  ios_icon_name="display"
                  android_material_icon_name="tv"
                  size={18}
                  color={colors.primary}
                />
                <Text style={[styles.amenityText, { color: secondaryTextColor }]}>
                  AV Equipment
                </Text>
              </View>

              <View style={styles.amenityItem}>
                <IconSymbol
                  ios_icon_name="briefcase.fill"
                  android_material_icon_name="business-center"
                  size={18}
                  color={colors.primary}
                />
                <Text style={[styles.amenityText, { color: secondaryTextColor }]}>
                  Business Center
                </Text>
              </View>
            </View>
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
    paddingBottom: 24,
  },
  headerCard: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerIcon: {
    marginBottom: 16,
  },
  venueName: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  venueDescription: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  contactText: {
    marginLeft: 12,
    flex: 1,
  },
  contactLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  actionsSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  floorPlanPreview: {
    borderRadius: 8,
    overflow: 'hidden',
    height: 200,
    position: 'relative',
  },
  floorPlanImage: {
    width: '100%',
    height: '100%',
  },
  floorPlanOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  floorPlanOverlayText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  amenitiesList: {
    gap: 12,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amenityText: {
    fontSize: 15,
    marginLeft: 12,
  },
});
