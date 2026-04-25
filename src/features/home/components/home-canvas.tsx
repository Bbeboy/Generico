import { View } from 'react-native';

import type { HomeCanvas as HomeCanvasType } from '@/domain/home';
import { HomeHeroBanner } from './home-hero-banner';

type HomeCanvasProps = {
  canvas: HomeCanvasType;
};

export function HomeCanvas({ canvas }: HomeCanvasProps) {
  return (
    <View className="px-5 py-6">
      {canvas.sections.map((section) => {
        switch (section.type) {
          case 'hero-banner':
            return <HomeHeroBanner key={section.id} banner={section.data} />;
          default:
            return null;
        }
      })}
    </View>
  );
}
