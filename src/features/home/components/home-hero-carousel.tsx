import { useWindowDimensions } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';

import type { HomeHeroCarousel as HomeHeroCarouselType } from '@/domain/home';
import { HomeHeroBanner } from './home-hero-banner';

type HomeHeroCarouselProps = {
  carousel: HomeHeroCarouselType;
};

const SLIDE_HEIGHT = 520;
const AUTOPLAY_INTERVAL_MS = 3000;
const SCROLL_ANIMATION_MS = 600;
const HORIZONTAL_PADDING = 20;

export function HomeHeroCarousel({ carousel }: HomeHeroCarouselProps) {
  const { width: windowWidth } = useWindowDimensions();
  const slideWidth = windowWidth - HORIZONTAL_PADDING * 2;

  if (carousel.banners.length === 1) {
    return <HomeHeroBanner banner={carousel.banners[0]} />;
  }

  return (
    <Carousel
      width={slideWidth}
      height={SLIDE_HEIGHT}
      data={carousel.banners}
      loop
      autoPlay
      autoPlayInterval={AUTOPLAY_INTERVAL_MS}
      scrollAnimationDuration={SCROLL_ANIMATION_MS}
      renderItem={({ item }) => <HomeHeroBanner banner={item} />}
    />
  );
}
