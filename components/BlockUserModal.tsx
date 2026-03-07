
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

interface BlockUserModalProps {
  isVisible: boolean;
  onClose: () => void;
  onBlock: () => Promise<void>;
  userName: string;
}

export function BlockUserModal({
  isVisible,
  onClose,
  onBlock,
  userName,
}: BlockUserModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [blocking, setBlocking] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const textColor = isDark ? colors.textDark : colors.text;
  const secondaryTextColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardBg = isDark ? colors.cardDark : colors.card;
  const borderColorValue = isDark ? colors.borderDark : colors.border;

  const handleClose = () => {
    setShowConfirmation(false);
    onClose();
  };

  const [blockError, setBlockError] = useState<string | null>(null);

  const handleBlock = async () => {
    console.log('[Block] Blocking user:', userName);
    try {
      setBlocking(true);
      setBlockError(null);
      await onBlock();
      console.log('[Block] User blocked successfully');
      setShowConfirmation(true);
    } catch (error) {
      console.error('[Block] Error blocking user:', error);
      setBlockError('Failed to block user. Please try again.');
    } finally {
      setBlocking(false);
    }
  };

  const handleConfirmationClose = () => {
    setBlockError(null);
    handleClose();
  };

  if (showConfirmation) {
    return (
      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={handleConfirmationClose}
      >
        <View style={styles.overlay}>
          <View style={[styles.confirmationContainer, { backgroundColor: cardBg }]}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primary + '20' }]}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check-circle"
                size={48}
                color={colors.primary}
              />
            </View>
            <Text style={[styles.confirmationTitle, { color: textColor }]}>
              User Blocked
            </Text>
            <Text style={[styles.confirmationText, { color: secondaryTextColor }]}>
              {userName} can no longer send you messages.
            </Text>
            <TouchableOpacity
              style={[styles.confirmationButton, { backgroundColor: colors.primary }]}
              onPress={handleConfirmationClose}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmationButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: cardBg }]}>
          {/* Icon */}
          <View style={[styles.iconCircle, { backgroundColor: colors.error + '20' }]}>
            <IconSymbol
              ios_icon_name="hand.raised.fill"
              android_material_icon_name="block"
              size={40}
              color={colors.error}
            />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: textColor }]}>Block User</Text>

          {/* Description */}
          <Text style={[styles.description, { color: secondaryTextColor }]}>
            Blocking {userName} will prevent them from messaging you.
          </Text>

          {/* Error message */}
          {blockError ? (
            <View style={[styles.errorBanner, { backgroundColor: colors.error + '20' }]}>
              <Text style={[styles.errorBannerText, { color: colors.error }]}>{blockError}</Text>
            </View>
          ) : null}

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton, { borderColor: borderColorValue }]}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelButtonText, { color: textColor }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.blockButton, { backgroundColor: colors.error }]}
              onPress={handleBlock}
              disabled={blocking}
              activeOpacity={0.8}
            >
              {blocking ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.blockButtonText}>Block User</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  blockButton: {},
  blockButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmationContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  confirmationTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  confirmationText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  confirmationButton: {
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
  },
  confirmationButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorBanner: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorBannerText: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
});
