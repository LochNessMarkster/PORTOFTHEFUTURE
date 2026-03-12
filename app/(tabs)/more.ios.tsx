
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useAuth } from '@/contexts/AuthContext';

interface MenuItem {
  id: string;
  title: string;
  ios_icon: string;
  android_icon: string;
  route: string;
}

const MENU_ITEMS: MenuItem[] = [
  {
    id: 'messages',
    title: 'Messages',
    ios_icon: 'message.fill',
    android_icon: 'message',
    route: '/conversations',
  },
  {
    id: 'blocked-users',
    title: 'Blocked Users',
    ios_icon: 'hand.raised.fill',
    android_icon: 'block',
    route: '/blocked-users',
  },
  {
    id: 'venue',
    title: 'Venue Information',
    ios_icon: 'building.2.fill',
    android_icon: 'business',
    route: '/venue',
  },
  {
    id: 'about',
    title: 'About',
    ios_icon: 'info.circle.fill',
    android_icon: 'info',
    route: '/about',
  },
];

export default function MoreScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { logout } = useAuth();

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const secondaryTextColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const cardBg = isDark ? colors.cardDark : colors.card;
  const borderColorValue = isDark ? colors.borderDark : colors.border;

  const handleMenuPress = (route: string) => {
    console.log('[More] Menu item pressed:', route);
    console.log('[More] Router object:', router);
    try {
      router.push(route as any);
      console.log('[More] Navigation initiated successfully');
    } catch (error) {
      console.error('[More] Navigation error:', error);
    }
  };

  const handleLogout = async () => {
    console.log('[More] User initiated logout');
    try {
      await logout();
      router.replace('/login');
    } catch (error) {
      console.error('[More] Logout error:', error);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]} edges={['top', 'bottom']}>
        <View style={[styles.header, { borderBottomColor: borderColorValue }]}>
          <Text style={[styles.headerTitle, { color: textColor }]}>More</Text>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.menuSection}>
            {MENU_ITEMS.map((item, index) => (
              <React.Fragment key={item.id}>
                <TouchableOpacity
                  style={[
                    styles.menuItem,
                    { backgroundColor: cardBg, borderColor: borderColorValue },
                  ]}
                  onPress={() => handleMenuPress(item.route)}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={[styles.iconCircle, { backgroundColor: colors.primary + '20' }]}>
                      <IconSymbol
                        ios_icon_name={item.ios_icon}
                        android_material_icon_name={item.android_icon}
                        size={22}
                        color={colors.primary}
                      />
                    </View>
                    <Text style={[styles.menuItemText, { color: textColor }]}>{item.title}</Text>
                  </View>
                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="chevron-right"
                    size={20}
                    color={secondaryTextColor}
                  />
                </TouchableOpacity>
                {index < MENU_ITEMS.length - 1 && (
                  <View style={[styles.separator, { backgroundColor: borderColorValue }]} />
                )}
              </React.Fragment>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: colors.error }]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <IconSymbol
              ios_icon_name="arrow.right.square.fill"
              android_material_icon_name="logout"
              size={22}
              color="#FFFFFF"
            />
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  menuSection: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 17,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    marginLeft: 68,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 8,
  },
});
