
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

const ENABLE_MESSAGING = false;
const ENABLE_MODERATION_ACTIONS = false;

export default function AttendeeDetailScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const params = useLocalSearchParams();

  const email = (params.email as string) || '';
  const displayName = (params.displayName as string) || '';
  const company = (params.company as string) || '';
  const title = (params.title as string) || '';

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const secondaryTextColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardBg = isDark ? colors.cardDark : colors.card;
  const borderColorValue = isDark ? colors.borderDark : colors.border;

  const name = displayName || 'Attendee';

  const initials = useMemo(() => {
    const trimmed = name.trim();
    if (!trimmed) return '?';

    const parts = trimmed.split(' ');
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    }

    return trimmed.charAt(0).toUpperCase();
  }, [name]);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: name,
          headerStyle: {
            backgroundColor: isDark ? colors.backgroundDark : colors.background,
          },
          headerTintColor: textColor,
          headerRight: ENABLE_MODERATION_ACTIONS
            ? () => (
                <TouchableOpacity style={{ marginRight: 8, padding: 8 }}>
                  <IconSymbol
                    ios_icon_name="ellipsis.circle"
                    android_material_icon_name="more-vert"
                    size={24}
                    color={textColor}
                  />
                </TouchableOpacity>
              )
            : undefined,
        }}
      />

      <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]} edges={['bottom']}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={[styles.headerSection, { backgroundColor: cardBg }]}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>{initials}</Text>
            </View>
            <Text style={[styles.attendeeName, { color: textColor }]}>{name}</Text>
          </View>

          <View style={[styles.section, { backgroundColor: cardBg }]}>
            {title ? (
              <View style={styles.detailRow}>
                <IconSymbol
                  ios_icon_name="briefcase.fill"
                  android_material_icon_name="work"
                  size={20}
                  color={colors.primary}
                />
                <View style={styles.detailTextContainer}>
                  <Text style={[styles.detailLabel, { color: secondaryTextColor }]}>Title</Text>
                  <Text style={[styles.detailValue, { color: textColor }]}>{title}</Text>
                </View>
              </View>
            ) : null}

            {company ? (
              <View style={styles.detailRow}>
                <IconSymbol
                  ios_icon_name="building.2.fill"
                  android_material_icon_name="business"
                  size={20}
                  color={colors.primary}
                />
                <View style={styles.detailTextContainer}>
                  <Text style={[styles.detailLabel, { color: secondaryTextColor }]}>Company</Text>
                  <Text style={[styles.detailValue, { color: textColor }]}>{company}</Text>
                </View>
              </View>
            ) : null}

            {email ? (
              <View style={styles.detailRow}>
                <IconSymbol
                  ios_icon_name="envelope.fill"
                  android_material_icon_name="email"
                  size={20}
                  color={colors.primary}
                />
                <View style={styles.detailTextContainer}>
                  <Text style={[styles.detailLabel, { color: secondaryTextColor }]}>Email</Text>
                  <Text style={[styles.detailValue, { color: textColor }]}>{email}</Text>
                </View>
              </View>
            ) : null}
          </View>

          {email ? (
            <View style={styles.actionsSection}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: cardBg }]}
                activeOpacity={0.7}
                onPress={() => Linking.openURL(`mailto:${email}`)}
              >
                <IconSymbol
                  ios_icon_name="envelope.fill"
                  android_material_icon_name="email"
                  size={24}
                  color={colors.primary}
                />
                <Text style={[styles.actionButtonText, { color: textColor }]}>Send Email</Text>
              </TouchableOpacity>
            </View>
          ) : null}
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
  headerSection: {
    padding: 24,
    alignItems: 'center',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '600',
  },
  attendeeName: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  section: {
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
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: 13,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  actionsSection: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
});
