
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchPreferences,
  fetchAttendeeDetail,
  createOrGetConversation,
  UserPreferences,
  AttendeeDetail,
  submitReport,
  blockUser,
} from '@/utils/airtable';
import { ReportUserModal } from '@/components/ReportUserModal';
import { BlockUserModal } from '@/components/BlockUserModal';

export default function AttendeeDetailScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const params = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  // Params passed from networking screen
  const email = params.email as string;
  const displayName = (params.displayName as string) || '';

  const [attendeeDetail, setAttendeeDetail] = useState<AttendeeDetail | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [currentUserPreferences, setCurrentUserPreferences] = useState<UserPreferences | null>(null);
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  const [messagingLoading, setMessagingLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const secondaryTextColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardBg = isDark ? colors.cardDark : colors.card;

  const loadData = useCallback(async () => {
    console.log('[API] Loading attendee detail and preferences for:', email);
    try {
      setLoadingPreferences(true);
      setErrorMessage(null);

      // Fetch attendee detail (respects visibility toggles)
      const [detail, attendeePrefs] = await Promise.all([
        fetchAttendeeDetail(email, user?.email),
        fetchPreferences(email),
      ]);
      setAttendeeDetail(detail);
      setPreferences(attendeePrefs);
      console.log('[API] Attendee detail loaded:', detail.name);

      // Fetch current user preferences
      if (user?.email) {
        const currentPrefs = await fetchPreferences(user.email);
        setCurrentUserPreferences(currentPrefs);
        console.log('[API] Current user preferences loaded');
      }
    } catch (err) {
      console.error('[API] Error loading attendee data:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to load attendee data');
    } finally {
      setLoadingPreferences(false);
    }
  }, [email, user?.email]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEmailPress = () => {
    if (attendeeDetail?.email && preferences?.show_email) {
      console.log('[API] Opening email:', attendeeDetail.email);
      Linking.openURL(`mailto:${attendeeDetail.email}`).catch(err => {
        console.error('Failed to open email:', err);
      });
    }
  };

  const handleMessagePress = async () => {
    console.log('[API] Message button pressed for:', displayName);

    if (!user?.email) {
      console.error('[API] Current user email not available');
      return;
    }

    try {
      setMessagingLoading(true);
      setErrorMessage(null);
      console.log('[API] Creating/getting conversation between', user.email, 'and', email);
      const conversation = await createOrGetConversation(user.email, email);
      console.log('[API] Conversation ready:', conversation.id);
      router.push({
        pathname: '/conversation/[id]',
        params: {
          id: conversation.id,
          otherParticipantName: attendeeDetail?.name || displayName,
          otherParticipantEmail: email,
        },
      });
    } catch (err) {
      console.error('[API] Error creating conversation:', err);
      const msg = err instanceof Error ? err.message : 'Failed to start conversation';
      setErrorMessage(msg);
    } finally {
      setMessagingLoading(false);
    }
  };

  const canMessage = preferences?.accept_messages && currentUserPreferences?.accept_messages;

  const name = attendeeDetail?.name || displayName;
  const getInitials = (n: string): string => {
    const parts = n.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    }
    return n.charAt(0).toUpperCase();
  };
  const initials = getInitials(name);

  const handleReportUser = async (reason: string, notes: string) => {
    if (!user?.email) return;
    console.log('[Report] Submitting report:', { reason, notes });
    await submitReport(user.email, email, reason, notes);
    setShowReportModal(false);
  };

  const handleBlockUser = async () => {
    if (!user?.email) return;
    console.log('[Block] Blocking user:', email);
    await blockUser(user.email, email);
    setShowBlockModal(false);
    // Navigate back after blocking
    setTimeout(() => {
      router.back();
    }, 1500);
  };

  const handleOpenActionsMenu = () => {
    setShowActionsMenu(true);
  };

  const handleCloseActionsMenu = () => {
    setShowActionsMenu(false);
  };

  const handleReportPress = () => {
    setShowActionsMenu(false);
    setShowReportModal(true);
  };

  const handleBlockPress = () => {
    setShowActionsMenu(false);
    setShowBlockModal(true);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: name || displayName,
          headerStyle: {
            backgroundColor: isDark ? colors.backgroundDark : colors.background,
          },
          headerTintColor: textColor,
          headerRight: () => (
            <TouchableOpacity
              onPress={handleOpenActionsMenu}
              style={{ marginRight: 8, padding: 8 }}
            >
              <IconSymbol
                ios_icon_name="ellipsis.circle"
                android_material_icon_name="more-vert"
                size={24}
                color={textColor}
              />
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]} edges={['bottom']}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Avatar and Name */}
          <View style={[styles.headerSection, { backgroundColor: cardBg }]}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>{initials}</Text>
            </View>
            <Text style={[styles.attendeeName, { color: textColor }]}>{name}</Text>
          </View>

          {/* Error message */}
          {errorMessage ? (
            <View style={[styles.errorBanner, { backgroundColor: colors.error + '20' }]}>
              <IconSymbol
                ios_icon_name="exclamationmark.triangle.fill"
                android_material_icon_name="warning"
                size={16}
                color={colors.error}
              />
              <Text style={[styles.errorBannerText, { color: colors.error }]}>{errorMessage}</Text>
            </View>
          ) : null}

          {loadingPreferences ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : (
            <>
              {/* Details */}
              <View style={[styles.section, { backgroundColor: cardBg }]}>
                {preferences?.show_title && attendeeDetail?.title && (
                  <View style={styles.detailRow}>
                    <IconSymbol
                      ios_icon_name="briefcase.fill"
                      android_material_icon_name="work"
                      size={20}
                      color={colors.primary}
                    />
                    <View style={styles.detailTextContainer}>
                      <Text style={[styles.detailLabel, { color: secondaryTextColor }]}>Title</Text>
                      <Text style={[styles.detailValue, { color: textColor }]}>{attendeeDetail.title}</Text>
                    </View>
                  </View>
                )}

                {preferences?.show_company && attendeeDetail?.company && (
                  <View style={styles.detailRow}>
                    <IconSymbol
                      ios_icon_name="building.2.fill"
                      android_material_icon_name="business"
                      size={20}
                      color={colors.primary}
                    />
                    <View style={styles.detailTextContainer}>
                      <Text style={[styles.detailLabel, { color: secondaryTextColor }]}>Company</Text>
                      <Text style={[styles.detailValue, { color: textColor }]}>{attendeeDetail.company}</Text>
                    </View>
                  </View>
                )}

                {attendeeDetail?.registration_type && (
                  <View style={styles.detailRow}>
                    <IconSymbol
                      ios_icon_name="ticket.fill"
                      android_material_icon_name="confirmation-number"
                      size={20}
                      color={colors.primary}
                    />
                    <View style={styles.detailTextContainer}>
                      <Text style={[styles.detailLabel, { color: secondaryTextColor }]}>Registration Type</Text>
                      <Text style={[styles.detailValue, { color: textColor }]}>{attendeeDetail.registration_type}</Text>
                    </View>
                  </View>
                )}

                {/* Show email only if attendee allows it */}
                {preferences?.show_email && attendeeDetail?.email && (
                  <View style={styles.detailRow}>
                    <IconSymbol
                      ios_icon_name="envelope.fill"
                      android_material_icon_name="email"
                      size={20}
                      color={colors.primary}
                    />
                    <View style={styles.detailTextContainer}>
                      <Text style={[styles.detailLabel, { color: secondaryTextColor }]}>Email</Text>
                      <Text style={[styles.detailValue, { color: textColor }]}>{attendeeDetail.email}</Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Contact Actions */}
              <View style={styles.actionsSection}>
                {preferences?.show_email && attendeeDetail?.email && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: cardBg }]}
                    onPress={handleEmailPress}
                    activeOpacity={0.7}
                  >
                    <IconSymbol
                      ios_icon_name="envelope.fill"
                      android_material_icon_name="email"
                      size={24}
                      color={colors.primary}
                    />
                    <Text style={[styles.actionButtonText, { color: textColor }]}>Email</Text>
                  </TouchableOpacity>
                )}

                {canMessage && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: cardBg }]}
                    onPress={handleMessagePress}
                    disabled={messagingLoading}
                    activeOpacity={0.7}
                  >
                    {messagingLoading ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <IconSymbol
                        ios_icon_name="message.fill"
                        android_material_icon_name="message"
                        size={24}
                        color={colors.primary}
                      />
                    )}
                    <Text style={[styles.actionButtonText, { color: textColor }]}>Message</Text>
                  </TouchableOpacity>
                )}
              </View>

              {!canMessage && !loadingPreferences && (
                <View style={[styles.messageDisabledNote, { backgroundColor: cardBg }]}>
                  <IconSymbol
                    ios_icon_name="info.circle.fill"
                    android_material_icon_name="info"
                    size={20}
                    color={secondaryTextColor}
                  />
                  <Text style={[styles.messageDisabledText, { color: secondaryTextColor }]}>
                    Messaging is not available with this attendee
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>

        {/* Actions Menu Modal */}
        {showActionsMenu && (
          <TouchableOpacity
            style={styles.actionsOverlay}
            activeOpacity={1}
            onPress={handleCloseActionsMenu}
          >
            <View style={[styles.actionsMenu, { backgroundColor: cardBg }]}>
              <TouchableOpacity
                style={styles.actionMenuItem}
                onPress={handleReportPress}
                activeOpacity={0.7}
              >
                <IconSymbol
                  ios_icon_name="exclamationmark.triangle.fill"
                  android_material_icon_name="warning"
                  size={22}
                  color={colors.error}
                />
                <Text style={[styles.actionMenuText, { color: colors.error }]}>
                  Report User
                </Text>
              </TouchableOpacity>
              <View style={[styles.actionMenuDivider, { backgroundColor: isDark ? colors.borderDark : colors.border }]} />
              <TouchableOpacity
                style={styles.actionMenuItem}
                onPress={handleBlockPress}
                activeOpacity={0.7}
              >
                <IconSymbol
                  ios_icon_name="hand.raised.fill"
                  android_material_icon_name="block"
                  size={22}
                  color={colors.error}
                />
                <Text style={[styles.actionMenuText, { color: colors.error }]}>
                  Block User
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}

        {/* Report User Modal */}
        <ReportUserModal
          isVisible={showReportModal}
          onClose={() => setShowReportModal(false)}
          onSubmit={handleReportUser}
          reportedUserName={name}
        />

        {/* Block User Modal */}
        <BlockUserModal
          isVisible={showBlockModal}
          onClose={() => setShowBlockModal(false)}
          onBlock={handleBlockUser}
          userName={name}
        />
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
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  errorBannerText: {
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
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
  messageDisabledNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageDisabledText: {
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  actionsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 16,
  },
  actionsMenu: {
    borderRadius: 12,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  actionMenuText: {
    fontSize: 16,
    fontWeight: '500',
  },
  actionMenuDivider: {
    height: 1,
    marginHorizontal: 16,
  },
});
