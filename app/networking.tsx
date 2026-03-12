
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SwipeListView } from 'react-native-swipe-list-view';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import {
  fetchAttendeesDirectory,
  Attendee,
} from '@/utils/airtable';

interface NetworkingAttendee {
  email: string;
  name: string;
  company?: string;
  title?: string;
}

export default function NetworkingScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const [attendees, setAttendees] = useState<NetworkingAttendee[]>([]);
  const [filteredAttendees, setFilteredAttendees] = useState<NetworkingAttendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const secondaryTextColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardBg = isDark ? colors.cardDark : colors.card;
  const borderColorValue = isDark ? colors.borderDark : colors.border;

  const loadAttendees = useCallback(async () => {
    console.log('[Networking] Loading attendees from Airtable cache...');
    try {
      setLoading(true);
      setError(null);

      const data: Attendee[] = await fetchAttendeesDirectory();

      const mappedAttendees: NetworkingAttendee[] = data.map((attendee) => ({
        email: attendee.email,
        name: attendee.displayName || `${attendee.firstName} ${attendee.lastName}`.trim(),
        company: attendee.company || '',
        title: attendee.title || '',
      }));

      console.log('[Networking] Attendees loaded:', mappedAttendees.length);

      setAttendees(mappedAttendees);
      setFilteredAttendees(mappedAttendees);
    } catch (err) {
      console.error('[Networking] Error loading attendees:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load attendees';
      setError(errorMessage);
      setAttendees([]);
      setFilteredAttendees([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAttendees();
  }, [loadAttendees]);

  const filterAttendees = useCallback(() => {
    if (!searchQuery.trim()) {
      setFilteredAttendees(attendees);
      return;
    }

    const query = searchQuery.toLowerCase().trim();

    const filtered = attendees.filter((attendee) => {
      const nameMatch = attendee.name.toLowerCase().includes(query);
      const companyMatch = attendee.company?.toLowerCase().includes(query);
      const titleMatch = attendee.title?.toLowerCase().includes(query);
      return nameMatch || !!companyMatch || !!titleMatch;
    });

    console.log('[Networking] Filtered attendees:', filtered.length, 'from', attendees.length);
    setFilteredAttendees(filtered);
  }, [searchQuery, attendees]);

  useEffect(() => {
    filterAttendees();
  }, [filterAttendees]);

  const getInitials = (name: string): string => {
    const trimmed = name.trim();
    if (!trimmed) return '?';

    const parts = trimmed.split(' ');
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    }
    return trimmed.charAt(0).toUpperCase();
  };

  const handleAttendeePress = (attendee: NetworkingAttendee) => {
    console.log('[Networking] Attendee pressed:', attendee.name);
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

  const handleConversationsPress = () => {
    console.log('[Networking] Navigating to conversations');
    router.push('/conversations');
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

          {item.title ? (
            <Text style={[styles.attendeeTitle, { color: secondaryTextColor }]} numberOfLines={1}>
              {item.title}
            </Text>
          ) : null}

          {item.company ? (
            <Text
              style={[styles.attendeeCompany, { color: secondaryTextColor }]}
              numberOfLines={1}
            >
              {item.company}
            </Text>
          ) : null}
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

  const renderAttendees = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: secondaryTextColor }]}>
            Loading attendees...
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
            onPress={loadAttendees}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (filteredAttendees.length === 0) {
      return (
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
      );
    }

    return (
      <SwipeListView
        data={filteredAttendees}
        renderItem={renderAttendeeCard}
        keyExtractor={(item) => item.email}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        disableRightSwipe
        rightOpenValue={0}
      />
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
        <View
          style={[
            styles.headerBar,
            { backgroundColor: cardBg, borderBottomColor: borderColorValue },
          ]}
        >
          <View style={styles.headerBarContent}>
            <IconSymbol
              ios_icon_name="person.3.fill"
              android_material_icon_name="people"
              size={18}
              color={colors.primary}
            />
            <Text style={[styles.headerBarText, { color: colors.primary }]}>
              Attendees
            </Text>
          </View>
        </View>

        <View style={styles.conversationsButtonContainer}>
          <TouchableOpacity
            style={[styles.conversationsButton, { backgroundColor: colors.primary }]}
            onPress={handleConversationsPress}
            activeOpacity={0.7}
          >
            <IconSymbol
              ios_icon_name="message.fill"
              android_material_icon_name="message"
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.conversationsButtonText}>Conversations</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <View
            style={[
              styles.searchBar,
              { backgroundColor: cardBg, borderColor: borderColorValue },
            ]}
          >
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
            {searchQuery.length > 0 ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <IconSymbol
                  ios_icon_name="xmark.circle.fill"
                  android_material_icon_name="cancel"
                  size={20}
                  color={secondaryTextColor}
                />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {renderAttendees()}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    borderBottomWidth: 1,
  },
  headerBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  headerBarText: {
    fontSize: 15,
    fontWeight: '600',
  },
  conversationsButtonContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  conversationsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  conversationsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
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
    fontSize: 15,
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 22,
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
    flex: 1,
  },
  attendeeTitle: {
    fontSize: 14,
    marginBottom: 2,
  },
  attendeeCompany: {
    fontSize: 14,
  },
});
