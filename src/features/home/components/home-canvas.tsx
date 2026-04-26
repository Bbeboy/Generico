import { View } from 'react-native';

import type { HomeCanvas as HomeCanvasType } from '@/domain/home';
import { HomeHeroCarousel } from './home-hero-carousel';

type HomeCanvasProps = {
  canvas: HomeCanvasType;
};

export function HomeCanvas({ canvas }: HomeCanvasProps) {
  return (
    <View className="px-5 py-6">
      {canvas.sections.map((section) => {
        switch (section.type) {
          case 'hero-carousel':
            return <HomeHeroCarousel key={section.id} carousel={section.data} />;
          default:
            return null;
        }
      })}
    </View>
  );
}
