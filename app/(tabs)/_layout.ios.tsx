
import React from 'react';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';

export default function TabLayout() {
  const tabs: TabBarItem[] = [
    {
      name: '(home)',
      route: '/(tabs)/(home)/',
      icon: 'home',
      iosIcon: 'house.fill',
      label: 'Home',
    },
    {
      name: 'agenda',
      route: '/agenda',
      icon: 'calendar-today',
      iosIcon: 'calendar',
      label: 'Agenda',
    },
    {
      name: 'my-schedule',
      route: '/my-schedule',
      icon: 'bookmark',
      iosIcon: 'bookmark.fill',
      label: 'My Schedule',
    },
    {
      name: 'speakers',
      route: '/speakers',
      icon: 'person',
      iosIcon: 'person.fill',
      label: 'Speakers',
    },
    {
      name: 'more',
      route: '/(tabs)/more',
      icon: 'menu',
      iosIcon: 'line.3.horizontal',
      label: 'More',
    },
  ];

  // Debug logging for tab configuration
  console.log('[TabLayout iOS] Configured tabs:', tabs.map(t => ({ name: t.name, icon: t.icon, iosIcon: t.iosIcon, label: t.label })));

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
        }}
      >
        <Stack.Screen key="home" name="(home)" />
        <Stack.Screen key="more" name="more" />
        <Stack.Screen key="profile" name="profile" />
      </Stack>
      <FloatingTabBar tabs={tabs} />
    </>
  );
}
