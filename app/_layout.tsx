
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider } from '@/contexts/AuthContext';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerBackTitle: 'Back' }}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="exhibitors" options={{ headerShown: true, title: 'Exhibitors' }} />
          <Stack.Screen name="exhibitor-detail" options={{ headerShown: true, title: 'Exhibitor Details' }} />
          <Stack.Screen name="speakers" options={{ headerShown: true, title: 'Speakers' }} />
          <Stack.Screen name="speaker-detail" options={{ headerShown: true, title: 'Speaker Details' }} />
          <Stack.Screen name="sponsors" options={{ headerShown: true, title: 'Sponsors' }} />
          <Stack.Screen name="sponsor-detail" options={{ headerShown: true, title: 'Sponsor Details' }} />
          <Stack.Screen name="agenda" options={{ headerShown: true, title: 'Agenda' }} />
          <Stack.Screen name="agenda-detail" options={{ headerShown: true, title: 'Session Details' }} />
          <Stack.Screen name="activities" options={{ headerShown: true, title: 'Activities' }} />
          <Stack.Screen name="activity-detail" options={{ headerShown: true, title: 'Activity Details' }} />
          <Stack.Screen name="ports" options={{ headerShown: true, title: 'Ports' }} />
          <Stack.Screen name="port-detail" options={{ headerShown: true, title: 'Port Details' }} />
          <Stack.Screen name="presentations" options={{ headerShown: true, title: 'Presentations' }} />
          <Stack.Screen name="venue" options={{ headerShown: true, title: 'Venue' }} />
          <Stack.Screen name="floor-plan" options={{ headerShown: true, title: 'Floor Plan' }} />
          <Stack.Screen name="networking" options={{ headerShown: true, title: 'Networking' }} />
          <Stack.Screen name="attendee-detail" options={{ headerShown: true, title: 'Attendee Details' }} />
          <Stack.Screen name="blocked-users" options={{ headerShown: true, title: 'Blocked Users' }} />
          <Stack.Screen name="announcement-detail" options={{ headerShown: true, title: 'Announcement' }} />
          <Stack.Screen name="about" options={{ headerShown: true, title: 'About' }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}
