

import * as SplashScreen from "expo-splash-screen";
import { SystemBars } from "react-native-edge-to-edge";
import { useColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Stack, useRouter, useSegments } from "expo-router";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { useFonts } from "expo-font";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useNetworkState } from "expo-network";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { colors } from "@/styles/commonStyles";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Check if user is on the login screen
    const isOnLoginScreen = segments[0] === 'login';

    console.log('Auth state changed. User:', user?.displayName, 'On login screen:', isOnLoginScreen, 'Segments:', segments);

    if (!user && !isOnLoginScreen) {
      // User is not logged in and not on login screen - redirect to login
      console.log('Redirecting to login');
      router.replace('/login');
    } else if (user && isOnLoginScreen) {
      // User is logged in but on login screen - redirect to home
      console.log('Redirecting to home');
      router.replace('/(tabs)/(home)/');
    }
  }, [user, segments, isLoading, router]);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <SystemBars style={colorScheme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="networking" 
          options={{ 
            headerShown: true,
            title: 'Networking',
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.text,
          }} 
        />
        <Stack.Screen 
          name="attendee-detail" 
          options={{ 
            headerShown: true,
            title: 'Attendee Details',
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.text,
          }} 
        />
        <Stack.Screen 
          name="conversation/[id]" 
          options={{ 
            headerShown: true,
            title: 'Conversation',
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.text,
          }} 
        />
        <Stack.Screen 
          name="ports" 
          options={{ 
            headerShown: true,
            title: 'Participating Ports',
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.text,
          }} 
        />
        <Stack.Screen 
          name="port-detail" 
          options={{ 
            headerShown: true,
            title: 'Port Details',
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.text,
          }} 
        />
        <Stack.Screen 
          name="presentations" 
          options={{ 
            headerShown: true,
            title: 'Presentations',
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.text,
          }} 
        />
        <Stack.Screen 
          name="floor-plan" 
          options={{ 
            headerShown: true,
            title: 'Floor Plan',
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.text,
          }} 
        />
        <Stack.Screen 
          name="agenda" 
          options={{ 
            headerShown: true,
            title: 'Agenda',
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.text,
          }} 
        />
        <Stack.Screen 
          name="agenda-detail" 
          options={{ 
            headerShown: true,
            title: 'Session Details',
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.text,
          }} 
        />
        <Stack.Screen 
          name="my-schedule" 
          options={{ 
            headerShown: true,
            title: 'My Schedule',
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.text,
          }} 
        />
        <Stack.Screen 
          name="speakers" 
          options={{ 
            headerShown: true,
            title: 'Speakers',
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.text,
          }} 
        />
        <Stack.Screen 
          name="speaker-detail" 
          options={{ 
            headerShown: true,
            title: 'Speaker Details',
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.text,
          }} 
        />
        <Stack.Screen 
          name="activities" 
          options={{ 
            headerShown: true,
            title: 'Activities',
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.text,
          }} 
        />
        <Stack.Screen 
          name="activity-detail" 
          options={{ 
            headerShown: true,
            title: 'Activity Details',
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.text,
          }} 
        />
        <Stack.Screen 
          name="exhibitors" 
          options={{ 
            headerShown: true,
            title: 'Exhibitors',
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.text,
          }} 
        />
        <Stack.Screen 
          name="exhibitor-detail" 
          options={{ 
            headerShown: true,
            title: 'Exhibitor Details',
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.text,
          }} 
        />
        <Stack.Screen 
          name="sponsors" 
          options={{ 
            headerShown: true,
            title: 'Sponsors',
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.text,
          }} 
        />
        <Stack.Screen 
          name="sponsor-detail" 
          options={{ 
            headerShown: true,
            title: 'Sponsor Details',
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.text,
          }} 
        />
        <Stack.Screen 
          name="announcement-detail" 
          options={{ 
            headerShown: true,
            title: 'Announcement',
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.text,
          }} 
        />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const networkState = useNetworkState();

  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

