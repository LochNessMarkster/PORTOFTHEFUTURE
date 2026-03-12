
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchMessages,
  sendMessage,
  ConversationMessage,
} from '@/utils/airtable';

export default function ConversationScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const params = useLocalSearchParams();
  const { user } = useAuth();

  const conversationId = params.id as string;
  const otherParticipantName = (params.otherParticipantName as string) || 'Conversation';

  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const secondaryTextColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardBg = isDark ? colors.cardDark : colors.card;
  const borderColorValue = isDark ? colors.borderDark : colors.border;

  const loadMessages = useCallback(async () => {
    if (!conversationId) {
      console.log('[Conversation] No conversation ID');
      setLoading(false);
      return;
    }

    console.log('[Conversation] Loading messages for:', conversationId);
    try {
      setError(null);
      const data = await fetchMessages(conversationId);
      console.log('[Conversation] Loaded messages:', data.length);
      setMessages(data);
    } catch (err) {
      console.error('[Conversation] Error loading messages:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load messages';
      setError(errorMessage);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useFocusEffect(
    useCallback(() => {
      console.log('[Conversation] Screen focused, reloading messages');
      loadMessages();
    }, [loadMessages])
  );

  const handleSendMessage = async () => {
    const trimmedMessage = messageText.trim();
    if (!trimmedMessage || !user?.email || sending) {
      console.log('[Conversation] Cannot send message - empty or already sending');
      return;
    }

    console.log('[Conversation] Sending message:', trimmedMessage);
    setSending(true);

    try {
      const newMessage = await sendMessage(conversationId, user.email, trimmedMessage);
      console.log('[Conversation] Message sent successfully:', newMessage.id);

      setMessages((prev) => [...prev, newMessage]);
      setMessageText('');

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err) {
      console.error('[Conversation] Error sending message:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      Alert.alert('Error', errorMessage);
    } finally {
      setSending(false);
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '';
    }
  };

  const renderMessage = ({ item }: { item: ConversationMessage }) => {
    const isMyMessage = item.sender_email === user?.email;
    const timestamp = formatTimestamp(item.created_at);

    return (
      <View
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessageContainer : styles.theirMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isMyMessage
              ? [styles.myMessageBubble, { backgroundColor: colors.primary }]
              : [styles.theirMessageBubble, { backgroundColor: cardBg, borderColor: borderColorValue }],
          ]}
        >
          <Text
            style={[
              styles.messageText,
              { color: isMyMessage ? '#FFFFFF' : textColor },
            ]}
          >
            {item.content}
          </Text>
        </View>
        <Text
          style={[
            styles.messageTimestamp,
            { color: secondaryTextColor },
            isMyMessage ? styles.myMessageTimestamp : styles.theirMessageTimestamp,
          ]}
        >
          {timestamp}
        </Text>
      </View>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: secondaryTextColor }]}>
            Loading messages...
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
            onPress={loadMessages}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (messages.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <IconSymbol
            ios_icon_name="message.fill"
            android_material_icon_name="message"
            size={48}
            color={secondaryTextColor}
          />
          <Text style={[styles.emptyText, { color: secondaryTextColor }]}>
            No messages yet
          </Text>
          <Text style={[styles.emptySubtext, { color: secondaryTextColor }]}>
            Start the conversation by sending a message
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />
    );
  };

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
        }}
      />

      <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]} edges={['bottom']}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {renderContent()}

          <View
            style={[
              styles.inputContainer,
              { backgroundColor: cardBg, borderTopColor: borderColorValue },
            ]}
          >
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? colors.backgroundDark : '#F3F4F6',
                  color: textColor,
                  borderColor: borderColorValue,
                },
              ]}
              placeholder="Type a message..."
              placeholderTextColor={secondaryTextColor}
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={1000}
              editable={!sending}
            />

            <TouchableOpacity
              style={[
                styles.sendButton,
                {
                  backgroundColor: messageText.trim() && !sending ? colors.primary : secondaryTextColor,
                },
              ]}
              onPress={handleSendMessage}
              disabled={!messageText.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <IconSymbol
                  ios_icon_name="arrow.up"
                  android_material_icon_name="send"
                  size={20}
                  color="#FFFFFF"
                />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
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
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '75%',
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  theirMessageContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  myMessageBubble: {
    borderBottomRightRadius: 4,
  },
  theirMessageBubble: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  messageTimestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  myMessageTimestamp: {
    textAlign: 'right',
  },
  theirMessageTimestamp: {
    textAlign: 'left',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
