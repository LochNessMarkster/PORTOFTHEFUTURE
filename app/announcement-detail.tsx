
import React from "react";
import { StyleSheet, View, Text, ScrollView, useColorScheme, Image, ImageSourcePropType } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";

// Helper to resolve image sources (handles both local require() and remote URLs)
function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

export default function AnnouncementDetailScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const params = useLocalSearchParams();

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const secondaryTextColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardBg = isDark ? colors.cardDark : colors.card;

  const title = typeof params.title === 'string' ? params.title : '';
  const content = typeof params.content === 'string' ? params.content : '';
  const alertTag = typeof params.alert_tag === 'string' ? params.alert_tag : '';
  const date = typeof params.date === 'string' ? params.date : '';
  const timeDisplay = typeof params.time_display === 'string' ? params.time_display : '';
  const imageUrl = typeof params.image_url === 'string' ? params.image_url : '';

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const dateObj = new Date(dateString);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const month = monthNames[dateObj.getMonth()];
    const day = dateObj.getDate();
    const year = dateObj.getFullYear();
    return `${month} ${day}, ${year}`;
  };

  const formattedDate = formatDate(date);

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: true,
          title: 'Announcement',
          headerStyle: {
            backgroundColor: isDark ? colors.backgroundDark : colors.background,
          },
          headerTintColor: textColor,
          headerBackTitle: 'Back',
        }} 
      />
      <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]} edges={['bottom']}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {imageUrl ? (
            <Image
              source={resolveImageSource(imageUrl)}
              style={styles.headerImage}
              resizeMode="cover"
            />
          ) : null}

          <View style={styles.contentContainer}>
            {alertTag ? (
              <View style={[styles.alertChip, { backgroundColor: colors.error + '20' }]}>
                <IconSymbol
                  ios_icon_name="exclamationmark.triangle.fill"
                  android_material_icon_name="warning"
                  size={16}
                  color={colors.error}
                />
                <Text style={[styles.alertChipText, { color: colors.error }]}>
                  {alertTag}
                </Text>
              </View>
            ) : null}

            <Text style={[styles.title, { color: textColor }]}>
              {title}
            </Text>

            <View style={styles.metaRow}>
              <IconSymbol
                ios_icon_name="calendar"
                android_material_icon_name="calendar-today"
                size={16}
                color={secondaryTextColor}
              />
              <Text style={[styles.dateText, { color: secondaryTextColor }]}>
                {formattedDate}
              </Text>
              {timeDisplay ? (
                <>
                  <Text style={[styles.separator, { color: secondaryTextColor }]}>•</Text>
                  <IconSymbol
                    ios_icon_name="clock.fill"
                    android_material_icon_name="access-time"
                    size={16}
                    color={secondaryTextColor}
                  />
                  <Text style={[styles.timeText, { color: secondaryTextColor }]}>
                    {timeDisplay}
                  </Text>
                </>
              ) : null}
            </View>

            <View style={[styles.divider, { backgroundColor: isDark ? colors.borderDark : colors.border }]} />

            <Text style={[styles.content, { color: textColor }]}>
              {content}
            </Text>
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
  headerImage: {
    width: '100%',
    height: 250,
  },
  contentContainer: {
    padding: 20,
  },
  alertChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  alertChipText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    lineHeight: 36,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dateText: {
    fontSize: 14,
    marginLeft: 6,
  },
  separator: {
    fontSize: 14,
    marginHorizontal: 8,
  },
  timeText: {
    fontSize: 14,
    marginLeft: 6,
  },
  divider: {
    height: 1,
    marginBottom: 20,
  },
  content: {
    fontSize: 16,
    lineHeight: 26,
  },
});
