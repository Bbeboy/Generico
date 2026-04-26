import { Tabs } from 'expo-router';
import React from 'react';
import { useColorScheme } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';

const tabBarTheme = {
  light: {
    background: '#ffffff',
    border: '#f3f4f6',
    active: '#111827',
    inactive: '#6b7280',
  },
  dark: {
    background: '#0c0c0f',
    border: '#27272a',
    active: '#a78bfa',
    inactive: '#71717a',
  },
} as const;

export default function TabLayout() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const palette = tabBarTheme[scheme];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: palette.active,
        tabBarInactiveTintColor: palette.inactive,
        tabBarStyle: {
          backgroundColor: palette.background,
          borderTopColor: palette.border,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
