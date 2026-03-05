
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  Image,
  ImageSourcePropType,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
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
import { fetchFloorPlan, FloorPlan } from '@/utils/airtable';

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

  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pinch-to-zoom state
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  useEffect(() => {
    loadFloorPlan();
  }, []);

  const loadFloorPlan = async () => {
    console.log('[API] Loading floor plan from backend...');
    try {
      setLoading(true);
      setError(null);
      const data = await fetchFloorPlan();
      console.log('[API] Floor plan loaded:', data.image_url);
      setFloorPlan(data);
    } catch (err) {
      console.error('[API] Error loading floor plan:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load floor plan';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
      } else if (scale.value > 3) {
        scale.value = withTiming(3);
        savedScale.value = 3;
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

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
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: secondaryTextColor }]}>Loading floor plan...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <IconSymbol
              ios_icon_name="exclamationmark.triangle.fill"
              android_material_icon_name="warning"
              size={48}
              color={colors.error}
            />
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={loadFloorPlan}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
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
            {floorPlan?.image_url ? (
              <View style={[styles.floorPlanContainer, { backgroundColor: cardBg }]}>
                <GestureHandlerRootView style={styles.gestureContainer}>
                  <PinchGestureHandler onGestureEvent={pinchHandler}>
                    <Animated.View style={[styles.imageWrapper, animatedStyle]}>
                      <Image
                        source={resolveImageSource(floorPlan.image_url)}
                        style={styles.floorPlanImage}
                        resizeMode="contain"
                      />
                    </Animated.View>
                  </PinchGestureHandler>
                </GestureHandlerRootView>
              </View>
            ) : (
              <View style={[styles.floorPlanContainer, { backgroundColor: cardBg }]}>
                <View style={styles.noImageContainer}>
                  <IconSymbol
                    ios_icon_name="map.fill"
                    android_material_icon_name="map"
                    size={64}
                    color={secondaryTextColor}
                  />
                  <Text style={[styles.noImageText, { color: secondaryTextColor }]}>
                    Floor plan image not available
                  </Text>
                </View>
              </View>
            )}

            {/* Venue Notes */}
            {floorPlan?.venue_notes ? (
              <View style={[styles.notesSection, { backgroundColor: cardBg }]}>
                <View style={styles.notesSectionHeader}>
                  <IconSymbol
                    ios_icon_name="note.text"
                    android_material_icon_name="description"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={[styles.notesSectionTitle, { color: textColor }]}>Venue Information</Text>
                </View>
                <Text style={[styles.venueNotes, { color: secondaryTextColor }]}>{floorPlan.venue_notes}</Text>
              </View>
            ) : null}
          </ScrollView>
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
  },
  errorText: {
    fontSize: 15,
    marginTop: 12,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  noImageContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    marginTop: 12,
    fontSize: 15,
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
  notesSection: {
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
  notesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  notesSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  venueNotes: {
    fontSize: 14,
    lineHeight: 22,
  },
});
