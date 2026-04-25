import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function CollectionScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();

  return (
    <View className="flex-1 items-center justify-center bg-canvas px-5">
      <Text className="text-lg font-semibold text-heading">Colección</Text>
      <Text className="mt-2 text-text">{handle}</Text>
    </View>
  );
}
