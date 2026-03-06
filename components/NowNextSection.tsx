
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { fetchAgenda, AgendaItem } from '@/utils/airtable';
import { isSessionNow, isSessionNext } from '@/utils/timeUtils';

export function NowNextSection() {
  const router = useRouter();
  const [nowSession, setNowSession] = useState<AgendaItem | null>(null);
  const [nextSession, setNextSession] = useState<AgendaItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
    
    // Refresh every minute
    const interval = setInterval(loadSessions, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadSessions = async () => {
    try {
      const data = await fetchAgenda();
      const sessions = data.agenda || [];
      
      // Find current session
      const now = sessions.find(s => 
        s.EndTime && isSessionNow(s.Date, s.StartTime, s.EndTime)
      );
      
      // Find next session
      const next = sessions.find(s => 
        isSessionNext(s.Date, s.StartTime)
      );
      
      setNowSession(now || null);
      setNextSession(next || null);
    } catch (err) {
      console.error('Error loading now/next sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionPress = (session: AgendaItem) => {
    router.push({
      pathname: '/agenda-detail',
      params: {
        id: session.id,
        title: session.Title || '',
        date: session.Date || '',
        startTime: session.StartTime || '',
        endTime: session.EndTime || '',
        room: session.Room || '',
        typeTrack: session.TypeTrack || '',
        sessionDescription: session.SessionDescription || '',
        speakerNames: Array.isArray(session.SpeakerNames) 
          ? session.SpeakerNames.join(', ') 
          : session.SpeakerNames || '',
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={colors.accent} />
      </View>
    );
  }

  if (!nowSession && !nextSession) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconSymbol
          ios_icon_name="clock.fill"
          android_material_icon_name="schedule"
          size={20}
          color={colors.accent}
        />
        <Text style={styles.headerTitle}>Happening Now</Text>
      </View>

      {nowSession && (
        <TouchableOpacity
          style={styles.sessionCard}
          onPress={() => handleSessionPress(nowSession)}
          activeOpacity={0.7}
        >
          <View style={styles.nowBadge}>
            <Text style={styles.nowBadgeText}>NOW</Text>
          </View>
          <Text style={styles.sessionTitle} numberOfLines={2}>
            {nowSession.Title}
          </Text>
          <Text style={styles.sessionTime}>
            {nowSession.StartTime}
          </Text>
          {nowSession.Room && (
            <Text style={styles.sessionRoom}>
              {nowSession.Room}
            </Text>
          )}
        </TouchableOpacity>
      )}

      {nextSession && (
        <TouchableOpacity
          style={styles.sessionCard}
          onPress={() => handleSessionPress(nextSession)}
          activeOpacity={0.7}
        >
          <View style={styles.nextBadge}>
            <Text style={styles.nextBadgeText}>NEXT</Text>
          </View>
          <Text style={styles.sessionTitle} numberOfLines={2}>
            {nextSession.Title}
          </Text>
          <Text style={styles.sessionTime}>
            {nextSession.StartTime}
          </Text>
          {nextSession.Room && (
            <Text style={styles.sessionRoom}>
              {nextSession.Room}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 8,
  },
  sessionCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  nowBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  nowBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  nextBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  nextBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
  sessionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  sessionTime: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
    marginBottom: 2,
  },
  sessionRoom: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
