
import React from 'react';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';

export default function TabLayout() {
  const tabs: TabBarItem[] = [
    {
      name: '(home)',
      route: '/(tabs)/(home)/',
      icon: 'home',
      label: 'Home',
    },
    {
      name: 'agenda',
      route: '/agenda',
      icon: 'calendar-today',
      label: 'Agenda',
    },
    {
      name: 'my-schedule',
      route: '/my-schedule',
      icon: 'bookmark',
      label: 'My Schedule',
    },
    {
      name: 'speakers',
      route: '/speakers',
      icon: 'person',
      label: 'Speakers',
    },
    {
      name: 'more',
      route: '/(tabs)/more',
      icon: 'menu',
      label: 'More',
    },
  ];

  // Debug logging for tab configuration
  console.log('[TabLayout iOS] Configured tabs:', tabs.map(t => ({ name: t.name, icon: t.icon, label: t.label })));

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
