
import React from "react";
import { StyleSheet, View, Text, ScrollView, useColorScheme } from "react-native";
import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useAuth();

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const secondaryTextColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardBg = isDark ? colors.cardDark : colors.card;

  const welcomeText = `Welcome, ${user?.displayName || 'Guest'}`;
  const conferenceTitle = 'Port of the Future Conference 2026';
  const conferenceDate = 'Coming Soon';

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: true,
          title: 'Home',
          headerStyle: {
            backgroundColor: isDark ? colors.backgroundDark : colors.background,
          },
          headerTintColor: textColor,
          headerLargeTitle: true,
        }} 
      />
      <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]} edges={['bottom']}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={[styles.welcomeText, { color: secondaryTextColor }]}>
              {welcomeText}
            </Text>
            <Text style={[styles.title, { color: textColor }]}>
              {conferenceTitle}
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <View style={styles.cardHeader}>
              <IconSymbol
                ios_icon_name="calendar"
                android_material_icon_name="calendar-today"
                size={24}
                color={colors.primary}
              />
              <Text style={[styles.cardTitle, { color: textColor }]}>
                Event Information
              </Text>
            </View>
            <Text style={[styles.cardText, { color: secondaryTextColor }]}>
              {conferenceDate}
            </Text>
            <Text style={[styles.cardText, { color: secondaryTextColor }]}>
              Stay tuned for more details about the conference schedule and sessions.
            </Text>
          </View>

          {user && (
            <View style={[styles.card, { backgroundColor: cardBg }]}>
              <View style={styles.cardHeader}>
                <IconSymbol
                  ios_icon_name="person.circle"
                  android_material_icon_name="person"
                  size={24}
                  color={colors.primary}
                />
                <Text style={[styles.cardTitle, { color: textColor }]}>
                  Your Registration
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: secondaryTextColor }]}>
                  Name:
                </Text>
                <Text style={[styles.infoValue, { color: textColor }]}>
                  {user.displayName}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: secondaryTextColor }]}>
                  Email:
                </Text>
                <Text style={[styles.infoValue, { color: textColor }]}>
                  {user.email}
                </Text>
              </View>
              {user.company ? (
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: secondaryTextColor }]}>
                    Company:
                  </Text>
                  <Text style={[styles.infoValue, { color: textColor }]}>
                    {user.company}
                  </Text>
                </View>
              ) : null}
              {user.registrationType ? (
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: secondaryTextColor }]}>
                    Type:
                  </Text>
                  <Text style={[styles.infoValue, { color: textColor }]}>
                    {user.registrationType}
                  </Text>
                </View>
              ) : null}
            </View>
          )}

          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <View style={styles.cardHeader}>
              <IconSymbol
                ios_icon_name="info.circle"
                android_material_icon_name="info"
                size={24}
                color={colors.primary}
              />
              <Text style={[styles.cardTitle, { color: textColor }]}>
                About the Conference
              </Text>
            </View>
            <Text style={[styles.cardText, { color: secondaryTextColor }]}>
              The Port of the Future Conference brings together industry leaders, innovators, and experts to discuss the future of maritime logistics and port operations.
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
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  cardText: {
    fontSize: 15,
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 15,
    width: 80,
  },
  infoValue: {
    fontSize: 15,
    flex: 1,
    fontWeight: '500',
  },
});
