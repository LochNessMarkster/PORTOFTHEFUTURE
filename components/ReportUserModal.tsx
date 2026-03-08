
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

interface ReportUserModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (reason: string, notes: string) => Promise<void>;
  reportedUserName: string;
}

const REPORT_REASONS = [
  'Harassment',
  'Spam',
  'Inappropriate Content',
  'Impersonation',
  'Other',
];

export function ReportUserModal({
  isVisible,
  onClose,
  onSubmit,
  reportedUserName,
}: ReportUserModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const secondaryTextColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardBg = isDark ? colors.cardDark : colors.card;
  const borderColorValue = isDark ? colors.borderDark : colors.border;

  const handleClose = () => {
    setSelectedReason(null);
    setNotes('');
    setShowConfirmation(false);
    setSubmitError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedReason) return;

    console.log('[Report] Submitting report for:', reportedUserName, 'Reason:', selectedReason);
    try {
      setSubmitting(true);
      setSubmitError(null);
      await onSubmit(selectedReason, notes.trim());
      console.log('[Report] Report submitted successfully');
      setShowConfirmation(true);
    } catch (error) {
      console.error('[Report] Error submitting report:', error);
      setSubmitError('Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmationClose = () => {
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
            <View style={[styles.iconCircle, { backgroundColor: colors.success + '20' }]}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check-circle"
                size={48}
                color={colors.success}
              />
            </View>
            <Text style={[styles.confirmationTitle, { color: textColor }]}>
              Report Submitted
            </Text>
            <Text style={[styles.confirmationText, { color: secondaryTextColor }]}>
              Conference administrators will review it.
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
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: cardBg }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: borderColorValue }]}>
            <Text style={[styles.title, { color: textColor }]}>Report User</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={24}
                color={textColor}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Description */}
            <Text style={[styles.description, { color: secondaryTextColor }]}>
              Report inappropriate behavior, harassment, spam, or other misuse of messaging.
            </Text>

            {/* Reported User */}
            <View style={[styles.userCard, { backgroundColor: bgColor, borderColor: borderColorValue }]}>
              <Text style={[styles.userLabel, { color: secondaryTextColor }]}>
                Reporting:
              </Text>
              <Text style={[styles.userName, { color: textColor }]}>
                {reportedUserName}
              </Text>
            </View>

            {/* Reason Selection */}
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Reason for Report
            </Text>
            {REPORT_REASONS.map((reason) => {
              const isSelected = selectedReason === reason;
              return (
                <TouchableOpacity
                  key={reason}
                  style={[
                    styles.reasonOption,
                    { backgroundColor: bgColor, borderColor: borderColorValue },
                    isSelected && { borderColor: colors.primary, borderWidth: 2 },
                  ]}
                  onPress={() => setSelectedReason(reason)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      { borderColor: isSelected ? colors.primary : borderColorValue },
                      isSelected && { backgroundColor: colors.primary },
                    ]}
                  >
                    {isSelected && (
                      <IconSymbol
                        ios_icon_name="checkmark"
                        android_material_icon_name="check"
                        size={14}
                        color="#FFFFFF"
                      />
                    )}
                  </View>
                  <Text style={[styles.reasonText, { color: textColor }]}>
                    {reason}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* Optional Notes */}
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Additional Details (Optional)
            </Text>
            <TextInput
              style={[
                styles.notesInput,
                { backgroundColor: bgColor, borderColor: borderColorValue, color: textColor },
              ]}
              placeholder="Provide any additional context..."
              placeholderTextColor={secondaryTextColor}
              value={notes}
              onChangeText={setNotes}
              multiline
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={[styles.charCount, { color: secondaryTextColor }]}>
              {notes.length}/500
            </Text>
          </ScrollView>

          {/* Footer Buttons */}
          <View style={[styles.footer, { borderTopColor: borderColorValue }]}>
            {submitError ? (
              <View style={[styles.errorBanner, { backgroundColor: colors.error + '20' }]}>
                <Text style={[styles.errorBannerText, { color: colors.error }]}>{submitError}</Text>
              </View>
            ) : null}
            <View style={styles.footerButtons}>
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
                style={[
                  styles.button,
                  styles.submitButton,
                  { backgroundColor: selectedReason ? colors.error : secondaryTextColor },
                ]}
                onPress={handleSubmit}
                disabled={!selectedReason || submitting}
                activeOpacity={0.8}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit Report</Text>
                )}
              </TouchableOpacity>
            </View>
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
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  userCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  userLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  userName: {
    fontSize: 17,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reasonText: {
    fontSize: 16,
    flex: 1,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    minHeight: 100,
    marginBottom: 8,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 16,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  errorBanner: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  errorBannerText: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    minHeight: 48,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmationContainer: {
    margin: 20,
    padding: 32,
    borderRadius: 20,
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
});
