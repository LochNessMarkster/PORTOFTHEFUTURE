
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useRouter } from 'expo-router';

interface MessagingNoticeModalProps {
  visible: boolean;
  onClose: () => void;
}

export function MessagingNoticeModal({ visible, onClose }: MessagingNoticeModalProps) {
  const colorScheme = useColorScheme();
  const router = useRouter();

  const titleText = 'In-App Messaging Notice';
  const bodyText1 = 'This app includes in-app messaging that allows conference attendees to communicate with one another.';
  const bodyText2 = 'If you prefer not to receive messages, you can disable messaging at any time by going to My Profile → Privacy Settings.';
  const bodyText3 = 'Users may report inappropriate messages or block other attendees at any time within the messaging feature.';

  const handlePrivacySettings = () => {
    console.log('Privacy Settings button pressed');
    onClose();
    // Navigate to profile/privacy settings
    router.push('/profile');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Icon */}
            <View style={styles.iconContainer}>
              <IconSymbol
                ios_icon_name="message.fill"
                android_material_icon_name="message"
                size={48}
                color={colors.accent}
              />
            </View>

            {/* Title */}
            <Text style={styles.title}>
              {titleText}
            </Text>

            {/* Body Text */}
            <Text style={styles.bodyText}>
              {bodyText1}
            </Text>

            <Text style={styles.bodyText}>
              {bodyText2}
            </Text>

            <Text style={styles.bodyText}>
              {bodyText3}
            </Text>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.continueButton}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={styles.continueButtonText}>Continue</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.privacyButton}
                onPress={handlePrivacySettings}
                activeOpacity={0.8}
              >
                <Text style={styles.privacyButtonText}>Privacy Settings</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    backgroundColor: colors.card,
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  scrollContent: {
    padding: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  bodyText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 16,
    textAlign: 'left',
  },
  buttonContainer: {
    marginTop: 8,
    gap: 12,
  },
  continueButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  privacyButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  privacyButtonText: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '600',
  },
});
