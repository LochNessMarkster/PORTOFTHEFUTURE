
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  Image,
  ImageSourcePropType,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { GestureHandlerRootView, PinchGestureHandler, PinchGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

export default function FloorPlanScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const secondaryTextColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardBg = isDark ? colors.cardDark : colors.card;

  const [resetZoom, setResetZoom] = useState(0);

  // Pinch-to-zoom state
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  const floorPlanImage = require('@/assets/images/8546669e-c90d-430b-ba95-15774e09b7bc.jpeg');

  const venueAddress = '4450 University Drive';
  const venueCity = 'Houston, TX 77204';
  const venuePhone = '832-531-6300';
  const venueName = 'Hilton University Houston';

  const pinchHandler = useAnimatedGestureHandler<PinchGestureHandlerGestureEvent>({
    onActive: (event) => {
      scale.value = savedScale.value * event.scale;
    },
    onEnd: () => {
      savedScale.value = scale.value;
      // Limit zoom range
      if (scale.value < 1) {
        scale.value = withTiming(1);
        savedScale.value = 1;
      } else if (scale.value > 4) {
        scale.value = withTiming(4);
        savedScale.value = 4;
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handleResetZoom = () => {
    console.log('User tapped Reset Zoom button');
    scale.value = withTiming(1);
    savedScale.value = 1;
    setResetZoom(prev => prev + 1);
  };

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

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Floor Plan',
          headerStyle: {
            backgroundColor: isDark ? colors.backgroundDark : colors.background,
          },
          headerTintColor: textColor,
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]} edges={['bottom']}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Instructions */}
          <View style={[styles.instructionsCard, { backgroundColor: cardBg }]}>
            <IconSymbol
              ios_icon_name="hand.pinch.fill"
              android_material_icon_name="pinch"
              size={24}
              color={colors.primary}
            />
            <Text style={[styles.instructionsText, { color: secondaryTextColor }]}>
              Pinch to zoom in and out on the floor plan
            </Text>
          </View>

          {/* Floor Plan Image with Pinch-to-Zoom */}
          <View style={[styles.floorPlanContainer, { backgroundColor: cardBg }]}>
            <GestureHandlerRootView style={styles.gestureContainer}>
              <PinchGestureHandler onGestureEvent={pinchHandler}>
                <Animated.View style={[styles.imageWrapper, animatedStyle]}>
                  <Image
                    key={resetZoom}
                    source={resolveImageSource(floorPlanImage)}
                    style={styles.floorPlanImage}
                    resizeMode="contain"
                  />
                </Animated.View>
              </PinchGestureHandler>
            </GestureHandlerRootView>
          </View>

          {/* Reset Zoom Button */}
          <TouchableOpacity
            style={[styles.resetButton, { backgroundColor: colors.primary }]}
            onPress={handleResetZoom}
          >
            <IconSymbol
              ios_icon_name="arrow.counterclockwise"
              android_material_icon_name="refresh"
              size={18}
              color="#FFFFFF"
            />
            <Text style={styles.resetButtonText}>Reset Zoom</Text>
          </TouchableOpacity>

          {/* Venue Information */}
          <View style={[styles.venueSection, { backgroundColor: cardBg }]}>
            <View style={styles.venueSectionHeader}>
              <IconSymbol
                ios_icon_name="building.2.fill"
                android_material_icon_name="location-city"
                size={24}
                color={colors.primary}
              />
              <Text style={[styles.venueSectionTitle, { color: textColor }]}>Venue Information</Text>
            </View>

            <View style={styles.venueDetails}>
              <Text style={[styles.venueName, { color: textColor }]}>{venueName}</Text>
              
              <View style={styles.venueInfoRow}>
                <IconSymbol
                  ios_icon_name="location.fill"
                  android_material_icon_name="location-on"
                  size={20}
                  color={secondaryTextColor}
                />
                <View style={styles.venueInfoText}>
                  <Text style={[styles.venueAddress, { color: secondaryTextColor }]}>
                    {venueAddress}
                  </Text>
                  <Text style={[styles.venueAddress, { color: secondaryTextColor }]}>
                    {venueCity}
                  </Text>
                </View>
              </View>

              <View style={styles.venueInfoRow}>
                <IconSymbol
                  ios_icon_name="phone.fill"
                  android_material_icon_name="phone"
                  size={20}
                  color={secondaryTextColor}
                />
                <Text style={[styles.venuePhone, { color: secondaryTextColor }]}>
                  {venuePhone}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={handleGetDirections}
              >
                <IconSymbol
                  ios_icon_name="map.fill"
                  android_material_icon_name="directions"
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.actionButtonText}>Get Directions</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonSecondary, { borderColor: colors.primary }]}
                onPress={handleCallVenue}
              >
                <IconSymbol
                  ios_icon_name="phone.fill"
                  android_material_icon_name="phone"
                  size={20}
                  color={colors.primary}
                />
                <Text style={[styles.actionButtonTextSecondary, { color: colors.primary }]}>Call Venue</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Floor Plan Legend */}
          <View style={[styles.legendSection, { backgroundColor: cardBg }]}>
            <View style={styles.legendHeader}>
              <IconSymbol
                ios_icon_name="list.bullet"
                android_material_icon_name="list"
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.legendTitle, { color: textColor }]}>Key Areas</Text>
            </View>
            
            <View style={styles.legendItems}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#FFD700' }]} />
                <Text style={[styles.legendText, { color: secondaryTextColor }]}>
                  Registration & Exhibitors
                </Text>
              </View>
              
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#4169E1' }]} />
                <Text style={[styles.legendText, { color: secondaryTextColor }]}>
                  Session Rooms & Ballrooms
                </Text>
              </View>
              
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#87CEEB' }]} />
                <Text style={[styles.legendText, { color: secondaryTextColor }]}>
                  Lobby & Common Areas
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
    paddingBottom: 24,
  },
  instructionsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  instructionsText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  floorPlanContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gestureContainer: {
    width: '100%',
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
  },
  floorPlanImage: {
    width: '100%',
    height: '100%',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  venueSection: {
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
  venueSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  venueSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  venueDetails: {
    marginBottom: 16,
  },
  venueName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  venueInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  venueInfoText: {
    marginLeft: 12,
    flex: 1,
  },
  venueAddress: {
    fontSize: 15,
    lineHeight: 22,
  },
  venuePhone: {
    fontSize: 15,
    marginLeft: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  actionButtonTextSecondary: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  legendSection: {
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
  legendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  legendItems: {
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  legendText: {
    fontSize: 14,
    flex: 1,
  },
});
