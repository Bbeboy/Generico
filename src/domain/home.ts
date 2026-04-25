import type { Image } from './product';

export type HomeHeroBannerLink = {
  kind: 'collection' | 'external';
  label: string;
  href: string;
  collectionHandle: string | null;
  collectionTitle: string | null;
};

export type HomeHeroBanner = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  image: Image;
  cta: HomeHeroBannerLink;
};

export type HomeSection = {
  type: 'hero-banner';
  id: string;
  data: HomeHeroBanner;
};

export type HomeCanvas = {
  sections: HomeSection[];
};
