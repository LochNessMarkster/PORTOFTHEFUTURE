
import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, ActivityIndicator, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/IconSymbol";
import { Stack, useRouter, useFocusEffect } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { colors } from "@/styles/commonStyles";
import { fetchPreferences, updatePreferences, UserPreferences } from "@/utils/airtable";

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useAuth();
  const router = useRouter();

  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsError, setPrefsError] = useState<string | null>(null);

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const secondaryTextColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardBg = isDark ? colors.cardDark : colors.card;
  const borderColorValue = isDark ? colors.borderDark : colors.border;

  const loadPreferences = useCallback(async () => {
    if (!user?.email) {
      setLoadingPrefs(false);
      return;
    }
    try {
      setLoadingPrefs(true);
      setPrefsError(null);
      const prefs = await fetchPreferences(user.email);
      setPreferences(prefs);
    } catch (err) {
      setPrefsError('Failed to load preferences');
    } finally {
      setLoadingPrefs(false);
    }
  }, [user?.email]);

  useFocusEffect(
    useCallback(() => {
      console.log('[Profile] Screen focused, user email:', user?.email);
      if (user?.email) {
        loadPreferences();
      } else {
        console.log('[Profile] No user email on focus, setting loading to false');
        setLoadingPrefs(false);
      }
    }, [user?.email, loadPreferences])
  );

  const handleToggle = async (key: keyof Omit<UserPreferences, 'email'>, value: boolean) => {
    if (!user?.email || !preferences) return;
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    try {
      setSavingPrefs(true);
      await updatePreferences(user.email, { [key]: value });
    } catch (err) {
      setPreferences(preferences);
      setPrefsError('Failed to save preference');
    } finally {
      setSavingPrefs(false);
    }
  };

  const getInitials = (): string => {
    if (!user) return "?";
    const first = (user.firstName || "").charAt(0);
    const last = (user.lastName || "").charAt(0);
    const initials = (first + last).toUpperCase();
    return initials || user.email.charAt(0).toUpperCase();
  };

  return (
    <React.Fragment>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "My Profile",
          headerStyle: { backgroundColor: isDark ? colors.backgroundDark : colors.background },
          headerTintColor: textColor,
        }}
      />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
          {/* Profile Header */}
          <View style={[styles.profileHeader, { backgroundColor: cardBg }]}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>{getInitials()}</Text>
            </View>
            <Text style={[styles.name, { color: textColor }]}>{user?.displayName || 'Attendee'}</Text>
            <Text style={[styles.email, { color: secondaryTextColor }]}>{user?.email || ''}</Text>
            {user?.company ? (
              <Text style={[styles.company, { color: secondaryTextColor }]}>{user.company}</Text>
            ) : null}
            {user?.title ? (
              <Text style={[styles.title, { color: secondaryTextColor }]}>{user.title}</Text>
            ) : null}
          </View>

          {/* Privacy Preferences */}
          <View style={[styles.section, { backgroundColor: cardBg, borderColor: borderColorValue }]}>
            <View style={styles.sectionHeader}>
              <IconSymbol
                ios_icon_name="lock.shield.fill"
                android_material_icon_name="security"
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.sectionTitle, { color: textColor }]}>Privacy Settings</Text>
              {savingPrefs && <ActivityIndicator size="small" color={colors.primary} style={styles.savingIndicator} />}
            </View>

            {prefsError ? (
              <View style={styles.errorContainer}>
                <Text style={[styles.errorText, { color: colors.error }]}>{prefsError}</Text>
                <TouchableOpacity
                  style={[styles.retryButton, { backgroundColor: colors.primary }]}
                  onPress={loadPreferences}
                  activeOpacity={0.7}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {loadingPrefs ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.loadingText, { color: secondaryTextColor }]}>Loading privacy settings...</Text>
              </View>
            ) : preferences ? (
              <>
                <View style={[styles.preferenceRow, { borderBottomColor: borderColorValue }]}>
                  <View style={styles.preferenceInfo}>
                    <Text style={[styles.preferenceLabel, { color: textColor }]}>Show Email</Text>
                    <Text style={[styles.preferenceDesc, { color: secondaryTextColor }]}>
                      Display your email on your profile
                    </Text>
                  </View>
                  <Switch
                    value={preferences.show_email}
                    onValueChange={(v) => handleToggle('show_email', v)}
                    trackColor={{ false: borderColorValue, true: colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <View style={[styles.preferenceRow, { borderBottomColor: borderColorValue }]}>
                  <View style={styles.preferenceInfo}>
                    <Text style={[styles.preferenceLabel, { color: textColor }]}>Show Phone</Text>
                    <Text style={[styles.preferenceDesc, { color: secondaryTextColor }]}>
                      Display your phone number on your profile
                    </Text>
                  </View>
                  <Switch
                    value={preferences.show_phone}
                    onValueChange={(v) => handleToggle('show_phone', v)}
                    trackColor={{ false: borderColorValue, true: colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <View style={[styles.preferenceRow, { borderBottomColor: borderColorValue }]}>
                  <View style={styles.preferenceInfo}>
                    <Text style={[styles.preferenceLabel, { color: textColor }]}>Show Company</Text>
                    <Text style={[styles.preferenceDesc, { color: secondaryTextColor }]}>
                      Display your company on your profile
                    </Text>
                  </View>
                  <Switch
                    value={preferences.show_company}
                    onValueChange={(v) => handleToggle('show_company', v)}
                    trackColor={{ false: borderColorValue, true: colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <View style={[styles.preferenceRow, { borderBottomColor: 'transparent' }]}>
                  <View style={styles.preferenceInfo}>
                    <Text style={[styles.preferenceLabel, { color: textColor }]}>Show Title</Text>
                    <Text style={[styles.preferenceDesc, { color: secondaryTextColor }]}>
                      Display your job title on your profile
                    </Text>
                  </View>
                  <Switch
                    value={preferences.show_title}
                    onValueChange={(v) => handleToggle('show_title', v)}
                    trackColor={{ false: borderColorValue, true: colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </>
            ) : !loadingPrefs && !prefsError ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: secondaryTextColor }]}>
                  No preferences available. Please try refreshing.
                </Text>
                <TouchableOpacity
                  style={[styles.retryButton, { backgroundColor: colors.primary }]}
                  onPress={loadPreferences}
                  activeOpacity={0.7}
                >
                  <Text style={styles.retryButtonText}>Refresh</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </SafeAreaView>
    </React.Fragment>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  email: {
    fontSize: 14,
    marginBottom: 4,
    textAlign: 'center',
  },
  company: {
    fontSize: 14,
    marginBottom: 2,
    textAlign: 'center',
  },
  title: {
    fontSize: 14,
    textAlign: 'center',
  },
  section: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
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
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  savingIndicator: {
    marginLeft: 8,
  },
  errorContainer: {
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    marginBottom: 12,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    fontSize: 13,
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  emptyText: {
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  preferenceInfo: {
    flex: 1,
    marginRight: 12,
  },
  preferenceLabel: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  preferenceDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
});
