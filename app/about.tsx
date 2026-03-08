
import React from 'react';
import { StyleSheet, View, Text, ScrollView, useColorScheme, TouchableOpacity, Linking } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

export default function AboutScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const secondaryTextColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardBg = isDark ? colors.cardDark : colors.card;

  const handleWebsitePress = () => {
    console.log('User tapped website link');
    Linking.openURL('https://portofthefutureconference.com/');
  };

  const welcomeText = 'Welcome to the 2026 Port of the Future Conference!';
  const paragraph1 = 'The 2026 Port of the Future Conference is focused on creating and revitalizing our Nation&apos;s seaports, infrastructure, and processes – across maritime, air, land, and cyber domains. This symposium addresses the urgent and emerging issues facing ports of entry, regulators, and associated industries.';
  const paragraph2 = 'This year&apos;s Conference brings together the leaders of more than 60 seaports from the United States and Canada, Europe, the Middle East, Africa, Asia, and Central and South America to Houston – offering their vast accumulated knowledge and experiences to address the port and maritime industries&apos; most pressing challenges, formulate viable solutions, highlight innovations, and identify best practices.';
  const paragraph3 = 'The Conference offers free registration to its speakers and to one representative from each participating port. The 2026 Port of the Future Conference is shaped by new concepts, research and innovation, advances in technology, increased dependence on automation, enhancements in data security and information sharing, and heightened environmental compliance – all impacting the ability to move cargo and people rapidly and securely across international borders.';
  const paragraph4 = 'Hear from industry visionaries, thought leaders, government agency executives, and prominent researchers on their visions for Ports of the Future, projected trends and emerging challenges, promising research, and new, innovative technology. The Port of the Future Conference has attained a stellar record of hosting premier industry leaders and visionaries.';
  const paragraph5 = 'The 2026 Port of the Future Conference offers a dynamic and highly informative agenda. This event features keynote presentations, case studies, panel discussions, interviews, and technology demonstrations – all organized into the following nine tracks, relevant to our port and maritime industries:';

  const tracks = [
    'Ensuring America&apos;s Maritime Security',
    'Port Development',
    'Inter-modal Connectivity',
    'Port Infrastructure 4.0',
    'Increasing Ports&apos; Operational Efficiencies',
    'Decarbonization and Alternative Fuels',
    'Port Energy and Sustainability',
    'Port Security, Cybersecurity, and Emergency Management',
    'Advances in Dredging Technology and Techniques'
  ];

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: true,
          title: 'About',
          headerStyle: {
            backgroundColor: isDark ? colors.backgroundDark : colors.background,
          },
          headerTintColor: textColor,
        }} 
      />
      <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]} edges={['bottom']}>
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <Text style={[styles.title, { color: colors.primary }]}>
              {welcomeText}
            </Text>

            <Text style={[styles.paragraph, { color: textColor }]}>
              {paragraph1}
            </Text>

            <Text style={[styles.paragraph, { color: textColor }]}>
              {paragraph2}
            </Text>

            <Text style={[styles.paragraph, { color: textColor }]}>
              {paragraph3}
            </Text>

            <Text style={[styles.paragraph, { color: textColor }]}>
              {paragraph4}
            </Text>

            <Text style={[styles.paragraph, { color: textColor }]}>
              {paragraph5}
            </Text>

            <View style={styles.tracksList}>
              {tracks.map((track, index) => (
                <View key={index} style={styles.trackItem}>
                  <View style={[styles.bullet, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.trackText, { color: textColor }]}>
                    {track}
                  </Text>
                </View>
              ))}
            </View>

            <TouchableOpacity 
              style={[styles.websiteButton, { backgroundColor: colors.primary }]}
              onPress={handleWebsitePress}
            >
              <IconSymbol
                ios_icon_name="globe"
                android_material_icon_name="language"
                size={20}
                color="#FFFFFF"
              />
              <Text style={styles.websiteButtonText}>
                Learn more at portofthefutureconference.com
              </Text>
            </TouchableOpacity>
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
    fontWeight: 'bold',
    marginBottom: 20,
    lineHeight: 32,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  tracksList: {
    marginTop: 8,
    marginBottom: 24,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingLeft: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    marginRight: 12,
  },
  trackText: {
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
  },
  websiteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  websiteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
