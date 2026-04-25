import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { useHomeCanvas } from '../hooks/use-home-canvas';
import { HomeCanvas } from './home-canvas';

export function HomeScreen() {
  const { data: canvas, isLoading, isError, error } = useHomeCanvas();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <ActivityIndicator size="large" className="text-primary" />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas px-5">
        <Text className="text-center font-semibold text-heading">Error al cargar</Text>
        <Text className="mt-2 text-center text-text">{error?.message ?? 'Algo salió mal'}</Text>
      </View>
    );
  }

  if (!canvas || canvas.sections.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas px-5">
        <Text className="text-center text-text">No hay contenido disponible</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-canvas">
      <HomeCanvas canvas={canvas} />
    </ScrollView>
  );
}
