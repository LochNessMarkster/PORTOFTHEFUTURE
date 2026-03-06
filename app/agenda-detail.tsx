
import React from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  TouchableOpacity,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AgendaDetailScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const params = useLocalSearchParams();
  const router = useRouter();

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const secondaryTextColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardBg = isDark ? colors.cardDark : colors.card;

  const title = params.title as string;
  const date = params.date as string;
  const startTime = params.startTime as string;
  const room = params.room as string;
  const typeTrack = params.typeTrack as string;
  const sessionDescription = params.sessionDescription as string;
  const speakerNames = params.speakerNames as string;

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const dateObj = new Date(dateString);
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const weekday = weekdays[dateObj.getDay()];
    const month = months[dateObj.getMonth()];
    const day = dateObj.getDate();
    const year = dateObj.getFullYear();
    
    return `${weekday}, ${month} ${day}, ${year}`;
  };

  const formattedDate = formatDate(date);

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: true,
          title: 'Session Details',
          headerStyle: {
            backgroundColor: isDark ? colors.backgroundDark : colors.background,
          },
          headerTintColor: textColor,
        }} 
      />
      <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]} edges={['bottom']}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <Text style={[styles.title, { color: textColor }]}>
              {title}
            </Text>

            {typeTrack && (
              <View style={[styles.typeChip, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.typeChipText, { color: colors.primary }]}>
                  {typeTrack}
                </Text>
              </View>
            )}

            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <IconSymbol
                  ios_icon_name="calendar"
                  android_material_icon_name="calendar-today"
                  size={20}
                  color={colors.primary}
                />
                <View style={styles.detailTextContainer}>
                  <Text style={[styles.detailLabel, { color: secondaryTextColor }]}>
                    Date
                  </Text>
                  <Text style={[styles.detailValue, { color: textColor }]}>
                    {formattedDate}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <IconSymbol
                  ios_icon_name="clock.fill"
                  android_material_icon_name="access-time"
                  size={20}
                  color={colors.primary}
                />
                <View style={styles.detailTextContainer}>
                  <Text style={[styles.detailLabel, { color: secondaryTextColor }]}>
                    Time
                  </Text>
                  <Text style={[styles.detailValue, { color: textColor }]}>
                    {startTime}
                  </Text>
                </View>
              </View>

              {room && (
                <View style={styles.detailRow}>
                  <IconSymbol
                    ios_icon_name="location.fill"
                    android_material_icon_name="location-on"
                    size={20}
                    color={colors.primary}
                  />
                  <View style={styles.detailTextContainer}>
                    <Text style={[styles.detailLabel, { color: secondaryTextColor }]}>
                      Room
                    </Text>
                    <Text style={[styles.detailValue, { color: textColor }]}>
                      {room}
                    </Text>
                  </View>
                </View>
              )}

              {speakerNames && (
                <View style={styles.detailRow}>
                  <IconSymbol
                    ios_icon_name="person.fill"
                    android_material_icon_name="person"
                    size={20}
                    color={colors.primary}
                  />
                  <View style={styles.detailTextContainer}>
                    <Text style={[styles.detailLabel, { color: secondaryTextColor }]}>
                      Speaker(s)
                    </Text>
                    <Text style={[styles.detailValue, { color: textColor }]}>
                      {speakerNames}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {sessionDescription && (
              <View style={styles.descriptionContainer}>
                <Text style={[styles.descriptionLabel, { color: secondaryTextColor }]}>
                  Description
                </Text>
                <Text style={[styles.descriptionText, { color: textColor }]}>
                  {sessionDescription}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              console.log('Add to My Schedule pressed');
              // TODO: Implement add to schedule functionality
            }}
          >
            <IconSymbol
              ios_icon_name="bookmark.fill"
              android_material_icon_name="bookmark"
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.addButtonText}>Add to My Schedule</Text>
          </TouchableOpacity>
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
  card: {
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  typeChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 20,
  },
  typeChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailsContainer: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 16,
  },
  descriptionContainer: {
    marginTop: 8,
  },
  descriptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
