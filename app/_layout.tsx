

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
        <Stack.Screen name="networking" options={{ headerShown: false }} />
        <Stack.Screen name="attendee-detail" options={{ headerShown: false }} />
        <Stack.Screen name="conversation/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="ports" options={{ headerShown: false }} />
        <Stack.Screen name="port-detail" options={{ headerShown: false }} />
        <Stack.Screen name="presentations" options={{ headerShown: false }} />
        <Stack.Screen name="floor-plan" options={{ headerShown: false }} />
        <Stack.Screen name="agenda" options={{ headerShown: false }} />
        <Stack.Screen name="agenda-detail" options={{ headerShown: false }} />
        <Stack.Screen name="my-schedule" options={{ headerShown: false }} />
        <Stack.Screen name="speakers" options={{ headerShown: false }} />
        <Stack.Screen name="speaker-detail" options={{ headerShown: false }} />
        <Stack.Screen name="activities" options={{ headerShown: false }} />
        <Stack.Screen name="activity-detail" options={{ headerShown: false }} />
        <Stack.Screen name="exhibitors" options={{ headerShown: false }} />
        <Stack.Screen name="exhibitor-detail" options={{ headerShown: false }} />
        <Stack.Screen name="sponsors" options={{ headerShown: false }} />
        <Stack.Screen name="sponsor-detail" options={{ headerShown: false }} />
        <Stack.Screen name="announcement-detail" options={{ headerShown: false }} />
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

