import { Image } from 'expo-image';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import type { HomeHeroBanner as HomeHeroBannerType } from '@/domain/home';

type HomeHeroBannerProps = {
  banner: HomeHeroBannerType;
};

export function HomeHeroBanner({ banner }: HomeHeroBannerProps) {
  const router = useRouter();

  const handleCTAPress = () => {
    if (banner.cta.kind === 'collection' && banner.cta.collectionHandle) {
      router.push(`/collection/${banner.cta.collectionHandle}`);
    } else if (banner.cta.kind === 'external') {
      void Linking.openURL(banner.cta.href);
    }
  };

  const accessibilityLabel =
    banner.cta.kind === 'collection'
      ? `Ver colección ${banner.cta.collectionTitle ?? banner.cta.collectionHandle}`
      : `Abrir enlace ${banner.cta.label}`;

  return (
    <View className="relative h-[520px] overflow-hidden rounded-card">
      {/* Background Image */}
      <Image
        source={{ uri: banner.image.url }}
        alt={banner.image.altText ?? ''}
        contentFit="cover"
        transition={250}
        style={styles.backgroundImage}
      />

      {/* Overlay */}
      <View className="absolute inset-0 bg-black/45 dark:bg-black/55" />

      {/* Content - aligned at bottom */}
      <View className="absolute bottom-0 left-0 right-0 justify-end px-6 pb-8">
        {/* Eyebrow */}
        <Text className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
          {banner.eyebrow}
        </Text>

        {/* Title */}
        <Text className="mb-3 text-3xl font-bold text-white">{banner.title}</Text>

        {/* Description */}
        <Text className="mb-6 text-base text-white/80" numberOfLines={3}>
          {banner.description}
        </Text>

        {/* CTA Button - single only */}
        <Pressable
          onPress={handleCTAPress}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          className="self-start rounded-card bg-primary px-6 py-3 dark:bg-primary">
          <Text className="text-sm font-semibold text-primary-foreground dark:text-primary-foreground">
            {banner.cta.label}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    height: '100%',
    width: '100%',
  },
});
