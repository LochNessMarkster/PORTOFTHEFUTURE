
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
  RefreshControl,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { fetchBlockedUsers, unblockUser, BlockedUser } from '@/utils/airtable';

export default function BlockedUsersScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { user } = useAuth();

  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unblocking, setUnblocking] = useState<string | null>(null);
  const [unblockError, setUnblockError] = useState<string | null>(null);

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const secondaryTextColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardBg = isDark ? colors.cardDark : colors.card;
  const borderColorValue = isDark ? colors.borderDark : colors.border;

  const loadBlockedUsers = useCallback(async () => {
    if (!user?.email) return;
    console.log('[BlockedUsers] Loading blocked users for:', user.email);
    try {
      setError(null);
      const data = await fetchBlockedUsers(user.email);
      console.log('[BlockedUsers] Loaded:', data.length, 'blocked users');
      setBlockedUsers(data);
    } catch (err) {
      console.error('[BlockedUsers] Error loading blocked users:', err);
      setError(err instanceof Error ? err.message : 'Failed to load blocked users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.email]);

  useEffect(() => {
    loadBlockedUsers();
  }, [loadBlockedUsers]);

  const onRefresh = () => {
    setRefreshing(true);
    loadBlockedUsers();
  };

  const handleUnblock = async (blockedEmail: string) => {
    if (!user?.email) return;
    console.log('[BlockedUsers] Unblocking user:', blockedEmail);
    try {
      setUnblocking(blockedEmail);
      setUnblockError(null);
      await unblockUser(user.email, blockedEmail);
      console.log('[BlockedUsers] User unblocked successfully');
      // Remove from list
      setBlockedUsers(prev => prev.filter(u => u.blocked_email !== blockedEmail));
    } catch (err) {
      console.error('[BlockedUsers] Error unblocking user:', err);
      setUnblockError('Failed to unblock user. Please try again.');
    } finally {
      setUnblocking(null);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderBlockedUser = ({ item }: { item: BlockedUser }) => {
    const isUnblocking = unblocking === item.blocked_email;
    const blockedDate = formatDate(item.created_at);

    return (
      <View style={[styles.userCard, { backgroundColor: cardBg, borderColor: borderColorValue }]}>
        <View style={styles.userInfo}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.error + '20' }]}>
            <IconSymbol
              ios_icon_name="hand.raised.fill"
              android_material_icon_name="block"
              size={24}
              color={colors.error}
            />
          </View>
          <View style={styles.userDetails}>
            <Text style={[styles.userEmail, { color: textColor }]} numberOfLines={1}>
              {item.blocked_email}
            </Text>
            <Text style={[styles.blockedDate, { color: secondaryTextColor }]}>
              Blocked on {blockedDate}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.unblockButton, { borderColor: colors.primary }]}
          onPress={() => handleUnblock(item.blocked_email)}
          disabled={isUnblocking}
          activeOpacity={0.7}
        >
          {isUnblocking ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.unblockButtonText, { color: colors.primary }]}>
              Unblock
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Blocked Users',
          headerStyle: {
            backgroundColor: isDark ? colors.backgroundDark : colors.background,
          },
          headerTintColor: textColor,
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]} edges={['bottom']}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: secondaryTextColor }]}>
              Loading blocked users...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <IconSymbol
              ios_icon_name="exclamationmark.triangle.fill"
              android_material_icon_name="warning"
              size={48}
              color={colors.error}
            />
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={loadBlockedUsers}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : blockedUsers.length === 0 ? (
          <View style={styles.centerContainer}>
            <IconSymbol
              ios_icon_name="hand.raised.fill"
              android_material_icon_name="block"
              size={64}
              color={secondaryTextColor}
            />
            <Text style={[styles.emptyTitle, { color: textColor }]}>
              No Blocked Users
            </Text>
            <Text style={[styles.emptyText, { color: secondaryTextColor }]}>
              You haven't blocked anyone yet.
            </Text>
          </View>
        ) : (
          <>
            {/* Unblock Error Banner */}
            {unblockError ? (
              <View style={[styles.errorBanner, { backgroundColor: colors.error + '20' }]}>
                <Text style={[styles.errorBannerText, { color: colors.error }]}>{unblockError}</Text>
                <TouchableOpacity onPress={() => setUnblockError(null)} style={styles.errorBannerClose}>
                  <Text style={[styles.errorBannerCloseText, { color: colors.error }]}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Info Banner */}
            <View style={[styles.infoBanner, { backgroundColor: cardBg, borderColor: borderColorValue }]}>
              <IconSymbol
                ios_icon_name="info.circle.fill"
                android_material_icon_name="info"
                size={20}
                color={colors.accent}
              />
              <Text style={[styles.infoBannerText, { color: secondaryTextColor }]}>
                Blocked users cannot send you messages. You can unblock them at any time.
              </Text>
            </View>

            <FlatList
              data={blockedUsers}
              renderItem={renderBlockedUser}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={colors.primary}
                />
              }
            />
          </>
        )}
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
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
  },
  errorText: {
    fontSize: 15,
    marginTop: 12,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoBannerText: {
    fontSize: 13,
    lineHeight: 18,
    marginLeft: 10,
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  blockedDate: {
    fontSize: 13,
  },
  unblockButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  unblockButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  errorBannerClose: {
    padding: 4,
    marginLeft: 8,
  },
  errorBannerCloseText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
