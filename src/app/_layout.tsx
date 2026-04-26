import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import '../global.css';
import 'react-native-reanimated';

import { CheckoutProvider } from '@/providers/checkout-provider';
import { QueryProvider } from '@/providers/query-provider';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <QueryProvider>
        <CheckoutProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="auto" />
        </CheckoutProvider>
      </QueryProvider>
    </SafeAreaProvider>
  );
}
