
import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

interface ConflictingSession {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
}

interface ConflictModalProps {
  visible: boolean;
  newSession: ConflictingSession;
  existingSession: ConflictingSession;
  onKeepBoth: () => void;
  onCancel: () => void;
  onReplace: () => void;
}

export function ConflictModal({
  visible,
  newSession,
  existingSession,
  onKeepBoth,
  onCancel,
  onReplace,
}: ConflictModalProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    return `${month} ${day}`;
  };

  const newSessionDate = formatDate(newSession.date);
  const newSessionTime = `${newSession.startTime} - ${newSession.endTime}`;
  
  const existingSessionDate = formatDate(existingSession.date);
  const existingSessionTime = `${existingSession.startTime} - ${existingSession.endTime}`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <IconSymbol
              ios_icon_name="exclamationmark.triangle.fill"
              android_material_icon_name="warning"
              size={32}
              color={colors.error}
            />
            <Text style={styles.title}>Schedule Conflict</Text>
          </View>

          <ScrollView style={styles.content}>
            <Text style={styles.message}>
              This session overlaps with another session already saved in My Schedule.
            </Text>

            <View style={styles.sessionContainer}>
              <Text style={styles.sessionLabel}>New Session:</Text>
              <View style={styles.sessionCard}>
                <Text style={styles.sessionTitle} numberOfLines={2}>
                  {newSession.title}
                </Text>
                <Text style={styles.sessionInfo}>
                  {newSessionDate} • {newSessionTime}
                </Text>
                <Text style={styles.sessionRoom}>
                  {newSession.room}
                </Text>
              </View>
            </View>

            <View style={styles.sessionContainer}>
              <Text style={styles.sessionLabel}>Existing Session:</Text>
              <View style={styles.sessionCard}>
                <Text style={styles.sessionTitle} numberOfLines={2}>
                  {existingSession.title}
                </Text>
                <Text style={styles.sessionInfo}>
                  {existingSessionDate} • {existingSessionTime}
                </Text>
                <Text style={styles.sessionRoom}>
                  {existingSession.room}
                </Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.keepBothButton]}
              onPress={onKeepBoth}
              activeOpacity={0.7}
            >
              <Text style={styles.keepBothButtonText}>Keep Both</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.replaceButton]}
              onPress={onReplace}
              activeOpacity={0.7}
            >
              <Text style={styles.replaceButtonText}>Replace Existing</Text>
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
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: colors.card,
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
  },
  content: {
    padding: 20,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  sessionContainer: {
    marginBottom: 16,
  },
  sessionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  sessionCard: {
    backgroundColor: colors.cardAlt,
    borderRadius: 12,
    padding: 12,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  sessionInfo: {
    fontSize: 14,
    color: colors.accent,
    marginBottom: 4,
  },
  sessionRoom: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  buttonContainer: {
    padding: 16,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  keepBothButton: {
    backgroundColor: colors.accent,
  },
  keepBothButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  cancelButton: {
    backgroundColor: colors.cardAlt,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  replaceButton: {
    backgroundColor: colors.error,
  },
  replaceButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
