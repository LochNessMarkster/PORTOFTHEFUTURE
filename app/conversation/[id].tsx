import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

const ENABLE_MESSAGING = false;

export default function ConversationScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const params = useLocalSearchParams();

  const otherParticipantName = (params.otherParticipantName as string) || 'Conversation';

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const secondaryTextColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardBg = isDark ? colors.cardDark : colors.card;
  const borderColorValue = isDark ? colors.borderDark : colors.border;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: otherParticipantName,
          headerStyle: {
            backgroundColor: isDark ? colors.backgroundDark : colors.background,
          },
          headerTintColor: textColor,
          headerRight: undefined,
        }}
      />

      <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]} edges={['bottom']}>
        <View style={styles.centerContainer}>
          <View
            style={[
              styles.noticeCard,
              {
                backgroundColor: cardBg,
                borderColor: borderColorValue,
              },
            ]}
          >
            <IconSymbol
              ios_icon_name="message.fill"
              android_material_icon_name="message"
              size={52}
              color={secondaryTextColor}
            />
            <Text style={[styles.title, { color: textColor }]}>
              Messaging Temporarily Unavailable
            </Text>
            <Text style={[styles.description, { color: secondaryTextColor }]}>
              This conversation feature depends on backend services that are not currently
              available. Attendee browsing is still working, but conversations, message
              sending, blocking, and reporting are disabled for now.
            </Text>

            <TouchableOpacity
              style={[
                styles.disabledComposer,
                {
                  backgroundColor: isDark ? colors.backgroundDark : '#F3F4F6',
                  borderColor: borderColorValue,
                  opacity: ENABLE_MESSAGING ? 1 : 0.7,
                },
              ]}
              disabled
              activeOpacity={1}
            >
              <Text style={[styles.disabledComposerText, { color: secondaryTextColor }]}>
                Message input disabled
              </Text>
              <View
                style={[
                  styles.sendButton,
                  { backgroundColor: secondaryTextColor },
                ]}
              >
                <IconSymbol
                  ios_icon_name="arrow.up"
                  android_material_icon_name="send"
                  size={20}
                  color="#FFFFFF"
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>
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
    padding: 24,
  },
  noticeCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 14,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 10,
  },
  disabledComposer: {
    marginTop: 22,
    width: '100%',
    minHeight: 56,
    borderRadius: 28,
    borderWidth: 1,
    paddingLeft: 18,
    paddingRight: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  disabledComposerText: {
    fontSize: 15,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});