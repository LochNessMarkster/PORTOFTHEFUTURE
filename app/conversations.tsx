
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
  RefreshControl,
  Alert,
} from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SwipeListView } from 'react-native-swipe-list-view';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchConversations,
  deleteConversation,
  Conversation,
} from '@/utils/airtable';
import { ConfirmDeleteModal } from '@/components/ConfirmDeleteModal';

export default function ConversationsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { user } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null);

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const secondaryTextColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardBg = isDark ? colors.cardDark : colors.card;
  const borderColorValue = isDark ? colors.borderDark : colors.border;

  const loadConversations = useCallback(async () => {
    if (!user?.email) {
      console.log('[Conversations] No user email, skipping load');
      setLoading(false);
      return;
    }

    console.log('[Conversations] Loading conversations for:', user.email);
    try {
      setError(null);
      const data = await fetchConversations(user.email);
      console.log('[Conversations] Loaded conversations:', data.length);
      setConversations(data);
    } catch (err) {
      console.error('[Conversations] Error loading conversations:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load conversations';
      setError(errorMessage);
      setConversations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.email]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useFocusEffect(
    useCallback(() => {
      console.log('[Conversations] Screen focused, reloading conversations');
      loadConversations();
    }, [loadConversations])
  );

  const onRefresh = useCallback(() => {
    console.log('[Conversations] User triggered refresh');
    setRefreshing(true);
    loadConversations();
  }, [loadConversations]);

  const handleConversationPress = (conversation: Conversation) => {
    console.log('[Conversations] Opening conversation:', conversation.id);
    router.push({
      pathname: '/conversation/[id]',
      params: {
        id: conversation.id,
        otherParticipantName: conversation.other_participant_name || 'Conversation',
      },
    });
  };

  const handleDeletePress = (conversation: Conversation) => {
    console.log('[Conversations] Delete requested for:', conversation.id);
    setConversationToDelete(conversation);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!conversationToDelete) return;

    console.log('[Conversations] Deleting conversation:', conversationToDelete.id);
    try {
      await deleteConversation(conversationToDelete.id);
      console.log('[Conversations] Conversation deleted successfully');
      
      setConversations((prev) =>
        prev.filter((c) => c.id !== conversationToDelete.id)
      );
      
      setDeleteModalVisible(false);
      setConversationToDelete(null);
    } catch (err) {
      console.error('[Conversations] Error deleting conversation:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete conversation';
      Alert.alert('Error', errorMessage);
    }
  };

  const cancelDelete = () => {
    console.log('[Conversations] Delete cancelled');
    setDeleteModalVisible(false);
    setConversationToDelete(null);
  };

  const getInitials = (name: string): string => {
    const trimmed = name.trim();
    if (!trimmed) return '?';

    const parts = trimmed.split(' ');
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    }
    return trimmed.charAt(0).toUpperCase();
  };

  const formatTimestamp = (timestamp: string | undefined): string => {
    if (!timestamp) return '';

    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const renderConversationCard = ({ item }: { item: Conversation }) => {
    const otherParticipantName = item.other_participant_name || 'Unknown';
    const lastMessagePreview = item.last_message || 'No messages yet';
    const timestamp = formatTimestamp(item.last_message_at);

    return (
      <TouchableOpacity
        style={[styles.conversationCard, { backgroundColor: cardBg, borderColor: borderColorValue }]}
        onPress={() => handleConversationPress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.avatarCircle, { backgroundColor: colors.primary + '20' }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>
            {getInitials(otherParticipantName)}
          </Text>
        </View>

        <View style={styles.conversationInfo}>
          <View style={styles.conversationHeader}>
            <Text style={[styles.participantName, { color: textColor }]} numberOfLines={1}>
              {otherParticipantName}
            </Text>
            {timestamp ? (
              <Text style={[styles.timestamp, { color: secondaryTextColor }]}>
                {timestamp}
              </Text>
            ) : null}
          </View>

          <Text style={[styles.lastMessage, { color: secondaryTextColor }]} numberOfLines={2}>
            {lastMessagePreview}
          </Text>
        </View>

        <IconSymbol
          ios_icon_name="chevron.right"
          android_material_icon_name="chevron-right"
          size={20}
          color={secondaryTextColor}
        />
      </TouchableOpacity>
    );
  };

  const renderHiddenItem = ({ item }: { item: Conversation }) => (
    <View style={styles.hiddenItemContainer}>
      <TouchableOpacity
        style={[styles.deleteButton, { backgroundColor: colors.error }]}
        onPress={() => handleDeletePress(item)}
      >
        <IconSymbol
          ios_icon_name="trash.fill"
          android_material_icon_name="delete"
          size={24}
          color="#FFFFFF"
        />
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: secondaryTextColor }]}>
            Loading conversations...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
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
            onPress={loadConversations}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (conversations.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <IconSymbol
            ios_icon_name="message.fill"
            android_material_icon_name="message"
            size={48}
            color={secondaryTextColor}
          />
          <Text style={[styles.emptyText, { color: secondaryTextColor }]}>
            No conversations yet
          </Text>
          <Text style={[styles.emptySubtext, { color: secondaryTextColor }]}>
            Start a conversation from the Networking screen
          </Text>
        </View>
      );
    }

    return (
      <SwipeListView
        data={conversations}
        renderItem={renderConversationCard}
        renderHiddenItem={renderHiddenItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        disableRightSwipe
        rightOpenValue={-80}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Messages',
          headerStyle: {
            backgroundColor: isDark ? colors.backgroundDark : colors.background,
          },
          headerTintColor: textColor,
        }}
      />

      <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]} edges={['bottom']}>
        {renderContent()}
      </SafeAreaView>

      <ConfirmDeleteModal
        visible={deleteModalVisible}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        title="Delete Conversation"
        message="Are you sure you want to delete this conversation? This action cannot be undone."
      />
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
    textAlign: 'center',
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
  emptyText: {
    fontSize: 17,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: {
    padding: 16,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  participantName: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
  },
  timestamp: {
    fontSize: 13,
    marginLeft: 8,
  },
  lastMessage: {
    fontSize: 14,
    lineHeight: 18,
  },
  hiddenItemContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 12,
    height: '100%',
  },
  deleteButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});
