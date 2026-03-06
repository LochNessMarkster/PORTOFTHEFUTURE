
import React, { useState } from "react";
import { StyleSheet, View, Text, ScrollView, useColorScheme, TouchableOpacity, Modal } from "react-native";
import { Stack, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";

export default function MoreScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const secondaryTextColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardBg = isDark ? colors.cardDark : colors.card;

  const handleLogout = async () => {
    console.log('User confirmed logout');
    setShowLogoutModal(false);
    try {
      await logout();
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleVenuePress = () => {
    console.log('User tapped Venue button');
    router.push('/venue');
  };

  const handleSpeakersPress = () => {
    console.log('User tapped Speakers button');
    router.push('/speakers');
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: true,
          title: 'More',
          headerStyle: {
            backgroundColor: isDark ? colors.backgroundDark : colors.background,
          },
          headerTintColor: textColor,
        }} 
      />
      <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]} edges={['bottom']}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {user && (
            <View style={[styles.card, { backgroundColor: cardBg }]}>
              <View style={styles.profileHeader}>
                <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                  <Text style={styles.avatarText}>
                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                  </Text>
                </View>
                <View style={styles.profileInfo}>
                  <Text style={[styles.profileName, { color: textColor }]}>
                    {user.displayName}
                  </Text>
                  <Text style={[styles.profileEmail, { color: secondaryTextColor }]}>
                    {user.email}
                  </Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: secondaryTextColor }]}>
              CONFERENCE
            </Text>
            
            <TouchableOpacity style={[styles.menuItem, { backgroundColor: cardBg }]}>
              <IconSymbol
                ios_icon_name="info.circle"
                android_material_icon_name="info"
                size={24}
                color={colors.primary}
              />
              <Text style={[styles.menuText, { color: textColor }]}>
                About
              </Text>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="arrow-forward"
                size={20}
                color={secondaryTextColor}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, { backgroundColor: cardBg }]}
              onPress={handleVenuePress}
            >
              <IconSymbol
                ios_icon_name="building.2.fill"
                android_material_icon_name="location-city"
                size={24}
                color={colors.primary}
              />
              <Text style={[styles.menuText, { color: textColor }]}>
                Venue
              </Text>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="arrow-forward"
                size={20}
                color={secondaryTextColor}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, { backgroundColor: cardBg }]}
              onPress={handleSpeakersPress}
            >
              <IconSymbol
                ios_icon_name="person.2"
                android_material_icon_name="group"
                size={24}
                color={colors.primary}
              />
              <Text style={[styles.menuText, { color: textColor }]}>
                Speakers
              </Text>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="arrow-forward"
                size={20}
                color={secondaryTextColor}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: secondaryTextColor }]}>
              ACCOUNT
            </Text>

            <TouchableOpacity
              style={[styles.menuItem, { backgroundColor: cardBg }]}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <IconSymbol
                ios_icon_name="person.circle.fill"
                android_material_icon_name="account-circle"
                size={24}
                color={colors.primary}
              />
              <Text style={[styles.menuText, { color: textColor }]}>
                My Profile & Privacy
              </Text>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="arrow-forward"
                size={20}
                color={secondaryTextColor}
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.menuItem, { backgroundColor: cardBg }]}
              onPress={() => setShowLogoutModal(true)}
            >
              <IconSymbol
                ios_icon_name="arrow.right.square"
                android_material_icon_name="exit-to-app"
                size={24}
                color={colors.error}
              />
              <Text style={[styles.menuText, { color: colors.error }]}>
                Sign Out
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: secondaryTextColor }]}>
              Port of the Future Conference 2026
            </Text>
            <Text style={[styles.footerText, { color: secondaryTextColor }]}>
              Version 1.0.0
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>
              Sign Out
            </Text>
            <Text style={[styles.modalMessage, { color: secondaryTextColor }]}>
              Are you sure you want to sign out?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: textColor }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleLogout}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                  Sign Out
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  menuText: {
    fontSize: 16,
    flex: 1,
    marginLeft: 12,
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  footerText: {
    fontSize: 12,
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: colors.border,
  },
  modalButtonConfirm: {
    backgroundColor: colors.error,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
