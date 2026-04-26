import type { Image } from './product';

export type HomeHeroBannerCTA = {
  kind: 'collection' | 'external';
  label: string;
  href: string;
  collectionHandle: string | null;
};

export type HomeHeroBanner = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  image: Image;
  cta: HomeHeroBannerCTA;
};

export type HomeHeroCarousel = {
  id: string;
  banners: HomeHeroBanner[];
};

export type HomeSection = {
  type: 'hero-carousel';
  id: string;
  data: HomeHeroCarousel;
};

export type HomeCanvas = {
  sections: HomeSection[];
};
