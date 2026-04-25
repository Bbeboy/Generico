import { Link } from 'expo-router';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function ModalScreen() {
  return (
    <ThemedView className="flex-1 items-center justify-center bg-canvas px-5">
      <View className="rounded-card bg-surface px-6 py-5 shadow-card">
        <ThemedText type="title">This is a modal</ThemedText>
      </View>
      <View className="mt-4 rounded-pill bg-accent-mint px-5 py-3">
        <ThemedText type="defaultSemiBold" className="text-heading">
          Uniwind activo
        </ThemedText>
      </View>
      <Link href="/" dismissTo className="mt-4 py-4">
        <ThemedText type="link">Go to home screen</ThemedText>
      </Link>
    </ThemedView>
  );
}
