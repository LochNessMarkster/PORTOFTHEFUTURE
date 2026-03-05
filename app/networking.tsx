
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import {
  fetchNetworkingAttendees,
  NetworkingAttendee,
  fetchConversations,
  Conversation,
} from '@/utils/airtable';
import { useAuth } from '@/contexts/AuthContext';



export default function NetworkingScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'attendees' | 'messages'>('attendees');

  // Attendees state
  const [attendees, setAttendees] = useState<NetworkingAttendee[]>([]);
  const [filteredAttendees, setFilteredAttendees] = useState<NetworkingAttendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Conversations state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [conversationsError, setConversationsError] = useState<string | null>(null);

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const secondaryTextColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardBg = isDark ? colors.cardDark : colors.card;
  const borderColorValue = isDark ? colors.borderDark : colors.border;

  useEffect(() => {
    loadAttendees();
  }, []);

  useEffect(() => {
    filterAttendees();
  }, [searchQuery, attendees]);

  // Reload conversations when switching to messages tab
  useEffect(() => {
    if (activeTab === 'messages' && user?.email) {
      loadConversations();
    }
  }, [activeTab, user?.email]);

  const loadAttendees = async () => {
    console.log('[API] Loading attendees for networking from backend...');
    try {
      setLoading(true);
      setError(null);
      const data = await fetchNetworkingAttendees();
      console.log('[API] Attendees loaded:', data.length);
      setAttendees(data);
      setFilteredAttendees(data);
    } catch (err) {
      console.error('[API] Error loading attendees:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load attendees';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filterAttendees = () => {
    if (!searchQuery.trim()) {
      setFilteredAttendees(attendees);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = attendees.filter(attendee => {
      const nameMatch = attendee.name.toLowerCase().includes(query);
      const companyMatch = attendee.company?.toLowerCase().includes(query);
      const titleMatch = attendee.title?.toLowerCase().includes(query);
      return nameMatch || companyMatch || titleMatch;
    });

    console.log('[API] Filtered attendees:', filtered.length, 'from', attendees.length);
    setFilteredAttendees(filtered);
  };

  const loadConversations = async () => {
    if (!user?.email) return;
    console.log('[API] Loading conversations for:', user.email);
    try {
      setLoadingConversations(true);
      setConversationsError(null);
      const data = await fetchConversations(user.email);
      console.log('[API] Conversations loaded:', data.length);
      setConversations(data);
    } catch (err) {
      console.error('[API] Error loading conversations:', err);
      setConversationsError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setLoadingConversations(false);
    }
  };

  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  const formatConversationTime = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const handleConversationPress = (conversation: Conversation) => {
    const otherEmail =
      conversation.participant1_email === user?.email
        ? conversation.participant2_email
        : conversation.participant1_email;
    const otherName = conversation.other_participant_name || otherEmail;
    console.log('[API] Opening conversation:', conversation.id);
    router.push({
      pathname: '/conversation/[id]',
      params: {
        id: conversation.id,
        otherParticipantName: otherName,
        otherParticipantEmail: otherEmail,
      },
    });
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    const otherName = item.other_participant_name || item.participant2_email;
    const timeStr = formatConversationTime(item.last_message_at || item.created_at);
    return (
      <TouchableOpacity
        style={[styles.attendeeCard, { backgroundColor: cardBg, borderColor: borderColorValue }]}
        onPress={() => handleConversationPress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.avatarCircle, { backgroundColor: colors.primary + '20' }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>
            {getInitials(otherName)}
          </Text>
        </View>
        <View style={styles.attendeeInfo}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[styles.attendeeName, { color: textColor }]} numberOfLines={1}>
              {otherName}
            </Text>
            <Text style={[styles.attendeeTitle, { color: secondaryTextColor, fontSize: 12 }]}>
              {timeStr}
            </Text>
          </View>
          {item.last_message ? (
            <Text style={[styles.attendeeCompany, { color: secondaryTextColor }]} numberOfLines={1}>
              {item.last_message}
            </Text>
          ) : (
            <Text style={[styles.attendeeCompany, { color: secondaryTextColor }]} numberOfLines={1}>
              No messages yet
            </Text>
          )}
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

  const handleAttendeePress = (attendee: NetworkingAttendee) => {
    console.log('[API] Attendee pressed:', attendee.name);
    router.push({
      pathname: '/attendee-detail',
      params: {
        email: attendee.email,
        displayName: attendee.name,
        company: attendee.company || '',
        title: attendee.title || '',
      },
    });
  };

  const renderAttendeeCard = ({ item }: { item: NetworkingAttendee }) => {
    return (
      <TouchableOpacity
        style={[styles.attendeeCard, { backgroundColor: cardBg, borderColor: borderColorValue }]}
        onPress={() => handleAttendeePress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.avatarCircle, { backgroundColor: colors.primary + '20' }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>
            {getInitials(item.name)}
          </Text>
        </View>
        <View style={styles.attendeeInfo}>
          <Text style={[styles.attendeeName, { color: textColor }]} numberOfLines={1}>
            {item.name}
          </Text>
          {item.title && (
            <Text style={[styles.attendeeTitle, { color: secondaryTextColor }]} numberOfLines={1}>
              {item.title}
            </Text>
          )}
          {item.company && (
            <Text style={[styles.attendeeCompany, { color: secondaryTextColor }]} numberOfLines={1}>
              {item.company}
            </Text>
          )}
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

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Networking',
          headerStyle: {
            backgroundColor: isDark ? colors.backgroundDark : colors.background,
          },
          headerTintColor: textColor,
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]} edges={['bottom']}>
        {/* Tab Switcher */}
        <View style={[styles.tabBar, { backgroundColor: cardBg, borderBottomColor: borderColorValue }]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'attendees' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab('attendees')}
          >
            <IconSymbol
              ios_icon_name="person.3.fill"
              android_material_icon_name="people"
              size={18}
              color={activeTab === 'attendees' ? colors.primary : secondaryTextColor}
            />
            <Text style={[styles.tabText, { color: activeTab === 'attendees' ? colors.primary : secondaryTextColor }]}>
              Attendees
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'messages' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab('messages')}
          >
            <IconSymbol
              ios_icon_name="message.fill"
              android_material_icon_name="message"
              size={18}
              color={activeTab === 'messages' ? colors.primary : secondaryTextColor}
            />
            <Text style={[styles.tabText, { color: activeTab === 'messages' ? colors.primary : secondaryTextColor }]}>
              Messages
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'attendees' ? (
          <>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <View style={[styles.searchBar, { backgroundColor: cardBg, borderColor: borderColorValue }]}>
                <IconSymbol
                  ios_icon_name="magnifyingglass"
                  android_material_icon_name="search"
                  size={20}
                  color={secondaryTextColor}
                />
                <TextInput
                  style={[styles.searchInput, { color: textColor }]}
                  placeholder="Search name, company, or title..."
                  placeholderTextColor={secondaryTextColor}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <IconSymbol
                      ios_icon_name="xmark.circle.fill"
                      android_material_icon_name="cancel"
                      size={20}
                      color={secondaryTextColor}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {loading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: secondaryTextColor }]}>Loading attendees...</Text>
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
                  onPress={loadAttendees}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : filteredAttendees.length === 0 ? (
              <View style={styles.centerContainer}>
                <IconSymbol
                  ios_icon_name="person.3.fill"
                  android_material_icon_name="people"
                  size={48}
                  color={secondaryTextColor}
                />
                <Text style={[styles.emptyText, { color: secondaryTextColor }]}>
                  {searchQuery ? 'No attendees found' : 'No attendees available'}
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredAttendees}
                renderItem={renderAttendeeCard}
                keyExtractor={(item) => item.email}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
              />
            )}
          </>
        ) : (
          /* Messages Tab */
          <>
            {loadingConversations ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: secondaryTextColor }]}>Loading messages...</Text>
              </View>
            ) : conversationsError ? (
              <View style={styles.centerContainer}>
                <IconSymbol
                  ios_icon_name="exclamationmark.triangle.fill"
                  android_material_icon_name="warning"
                  size={48}
                  color={colors.error}
                />
                <Text style={[styles.errorText, { color: colors.error }]}>{conversationsError}</Text>
                <TouchableOpacity
                  style={[styles.retryButton, { backgroundColor: colors.primary }]}
                  onPress={loadConversations}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : conversations.length === 0 ? (
              <View style={styles.centerContainer}>
                <IconSymbol
                  ios_icon_name="message.fill"
                  android_material_icon_name="message"
                  size={64}
                  color={secondaryTextColor}
                />
                <Text style={[styles.emptyText, { color: secondaryTextColor, fontSize: 17, fontWeight: '600', marginBottom: 8 }]}>
                  No Messages Yet
                </Text>
                <Text style={[styles.emptyText, { color: secondaryTextColor }]}>
                  Tap an attendee in the Attendees tab to start a conversation.
                </Text>
              </View>
            ) : (
              <FlatList
                data={conversations}
                renderItem={renderConversation}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
              />
            )}
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
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
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
  emptyText: {
    fontSize: 15,
    marginTop: 12,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
  attendeeCard: {
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
  attendeeInfo: {
    flex: 1,
  },
  attendeeName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2,
  },
  attendeeTitle: {
    fontSize: 14,
    marginBottom: 2,
  },
  attendeeCompany: {
    fontSize: 14,
  },
});
