
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

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

export default function ActivityDetailScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const params = useLocalSearchParams();

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const secondaryTextColor = isDark ? colors.textSecondaryDark : colors.textSecondary;

  const name = params.name as string;
  const description = params.description as string;
  const date = params.date as string;
  const time = params.time as string;
  const location = params.location as string;
  const url = params.url as string;
  const imageUrl = params.image_url as string;

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const dateObj = new Date(dateString);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const month = monthNames[dateObj.getMonth()];
    const day = dateObj.getDate();
    const year = dateObj.getFullYear();
    return `${month} ${day}, ${year}`;
  };

  const handleUrlPress = () => {
    if (url) {
      console.log('Opening URL:', url);
      Linking.openURL(url);
    }
  };

  const formattedDate = formatDate(date);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Activity Details',
          headerStyle: {
            backgroundColor: isDark ? colors.backgroundDark : colors.background,
          },
          headerTintColor: textColor,
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]} edges={['bottom']}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Image */}
          {imageUrl && (
            <Image
              source={resolveImageSource(imageUrl)}
              style={styles.image}
              resizeMode="cover"
            />
          )}

          {/* Title */}
          <View style={styles.headerSection}>
            <Text style={[styles.name, { color: textColor }]}>{name}</Text>
          </View>

          {/* Date, Time, Location */}
          <View style={styles.metaSection}>
            {date && (
              <View style={styles.metaRow}>
                <IconSymbol
                  ios_icon_name="calendar"
                  android_material_icon_name="calendar-today"
                  size={20}
                  color={colors.primary}
                />
                <View style={styles.metaTextContainer}>
                  <Text style={[styles.metaLabel, { color: secondaryTextColor }]}>Date</Text>
                  <Text style={[styles.metaValue, { color: textColor }]}>{formattedDate}</Text>
                </View>
              </View>
            )}
            {time && (
              <View style={styles.metaRow}>
                <IconSymbol
                  ios_icon_name="clock.fill"
                  android_material_icon_name="access-time"
                  size={20}
                  color={colors.primary}
                />
                <View style={styles.metaTextContainer}>
                  <Text style={[styles.metaLabel, { color: secondaryTextColor }]}>Time</Text>
                  <Text style={[styles.metaValue, { color: textColor }]}>{time}</Text>
                </View>
              </View>
            )}
            {location && (
              <View style={styles.metaRow}>
                <IconSymbol
                  ios_icon_name="location.fill"
                  android_material_icon_name="location-on"
                  size={20}
                  color={colors.primary}
                />
                <View style={styles.metaTextContainer}>
                  <Text style={[styles.metaLabel, { color: secondaryTextColor }]}>Location</Text>
                  <Text style={[styles.metaValue, { color: textColor }]}>{location}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Description */}
          {description && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>Description</Text>
              <Text style={[styles.description, { color: textColor }]}>{description}</Text>
            </View>
          )}

          {/* URL Button */}
          {url && (
            <TouchableOpacity
              style={[styles.urlButton, { backgroundColor: colors.primary }]}
              onPress={handleUrlPress}
            >
              <IconSymbol
                ios_icon_name="link"
                android_material_icon_name="link"
                size={20}
                color="#FFFFFF"
              />
              <Text style={styles.urlButtonText}>Open Link</Text>
            </TouchableOpacity>
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
    paddingBottom: 24,
  },
  image: {
    width: '100%',
    height: 250,
  },
  headerSection: {
    padding: 16,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    lineHeight: 36,
  },
  metaSection: {
    paddingHorizontal: 16,
    gap: 16,
    marginBottom: 24,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  metaTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 16,
  },
  section: {
    paddingHorizontal: 16,
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
  urlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  urlButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
