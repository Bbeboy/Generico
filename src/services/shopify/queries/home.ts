import { z } from 'zod';

import type {
  HomeCanvas,
  HomeHeroBanner,
  HomeHeroBannerCTA,
  HomeHeroCarousel,
  HomeSection,
} from '@/domain/home';
import { storefrontFetch } from '../storefront';

const CAROUSEL_METAOBJECT_TYPE = 'carrusel_hero_banners';
const CAROUSEL_BANNERS_FIELD_KEY = 'banners';

const HERO_FIELD_KEYS = {
  image: 'imagen_banner',
  title: 'titulo',
  subtitle: 'subtitulo',
  description: 'descripcion',
  buttonText: 'texto_boton',
  buttonUrl: 'url_boton',
} as const;

const MAX_BANNERS = 20;

const HOME_HERO_CAROUSEL_QUERY = /* GraphQL */ `
  query HomeHeroCarousel($type: String!, $first: Int!) {
    metaobjects(type: $type, first: 1) {
      nodes {
        id
        handle
        fields {
          key
          references(first: $first) {
            nodes {
              ... on Metaobject {
                id
                handle
                type
                fields {
                  key
                  value
                  reference {
                    ... on MediaImage {
                      image {
                        url
                        altText
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

const RawImageSchema = z.object({
  url: z.string(),
  altText: z.string().nullable(),
});

const RawMediaImageReferenceSchema = z.object({
  image: RawImageSchema,
});

const RawHeroFieldSchema = z.object({
  key: z.string(),
  value: z.string().nullable(),
  reference: z.union([RawMediaImageReferenceSchema, z.null()]).optional(),
});

const RawHeroMetaobjectSchema = z.object({
  id: z.string(),
  handle: z.string(),
  type: z.string(),
  fields: z.array(RawHeroFieldSchema),
});

const RawCarouselFieldSchema = z.object({
  key: z.string(),
  references: z
    .object({
      nodes: z.array(RawHeroMetaobjectSchema),
    })
    .nullable()
    .optional(),
});

const RawCarouselMetaobjectSchema = z.object({
  id: z.string(),
  handle: z.string(),
  fields: z.array(RawCarouselFieldSchema),
});

const RawHomeHeroCarouselResponseSchema = z.object({
  metaobjects: z.object({
    nodes: z.array(RawCarouselMetaobjectSchema),
  }),
});

function getField<T extends { key: string }>(fields: T[], key: string): T | undefined {
  return fields.find((f) => f.key === key);
}

function parseCollectionHandleFromUrl(url: string): string | null {
  const match = url.match(/\/collections\/([^/?#]+)/);
  return match ? match[1] : null;
}

function buildCTA(rawUrl: string, label: string): HomeHeroBannerCTA {
  const trimmed = rawUrl.trim();
  const collectionHandle = parseCollectionHandleFromUrl(trimmed);

  if (collectionHandle) {
    return {
      kind: 'collection',
      label,
      href: `/collection/${collectionHandle}`,
      collectionHandle,
    };
  }

  return {
    kind: 'external',
    label,
    href: trimmed,
    collectionHandle: null,
  };
}

function toDomainHeroBanner(raw: z.infer<typeof RawHeroMetaobjectSchema>): HomeHeroBanner | null {
  const imageField = getField(raw.fields, HERO_FIELD_KEYS.image);
  const titleField = getField(raw.fields, HERO_FIELD_KEYS.title);
  const subtitleField = getField(raw.fields, HERO_FIELD_KEYS.subtitle);
  const descriptionField = getField(raw.fields, HERO_FIELD_KEYS.description);
  const buttonTextField = getField(raw.fields, HERO_FIELD_KEYS.buttonText);
  const buttonUrlField = getField(raw.fields, HERO_FIELD_KEYS.buttonUrl);

  let imageUrl = '';
  let imageAltText: string | null = null;

  if (imageField?.reference && 'image' in imageField.reference) {
    imageUrl = imageField.reference.image.url;
    imageAltText = imageField.reference.image.altText;
  }

  const title = titleField?.value?.trim() ?? '';
  const subtitle = subtitleField?.value?.trim() ?? '';
  const description = descriptionField?.value?.trim() ?? '';
  const buttonText = buttonTextField?.value?.trim() ?? '';
  const buttonUrl = buttonUrlField?.value?.trim() ?? '';

  if (!imageUrl || !title || !buttonUrl) {
    return null;
  }

  return {
    id: raw.id,
    eyebrow: subtitle,
    title,
    description,
    image: {
      url: imageUrl,
      altText: imageAltText,
    },
    cta: buildCTA(buttonUrl, buttonText || 'Ver más'),
  };
}

export async function fetchHomeCanvas(): Promise<HomeCanvas> {
  const data = await storefrontFetch<unknown>(HOME_HERO_CAROUSEL_QUERY, {
    type: CAROUSEL_METAOBJECT_TYPE,
    first: MAX_BANNERS,
  });

  const parsed = RawHomeHeroCarouselResponseSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error('INVALID_HOME_HERO_CAROUSEL_PAYLOAD');
  }

  const carousel = parsed.data.metaobjects.nodes[0];
  if (!carousel) {
    return { sections: [] };
  }

  const bannersField = getField(carousel.fields, CAROUSEL_BANNERS_FIELD_KEY);
  const rawBanners = bannersField?.references?.nodes ?? [];

  const banners = rawBanners
    .map(toDomainHeroBanner)
    .filter((banner): banner is HomeHeroBanner => banner !== null);

  if (banners.length === 0) {
    return { sections: [] };
  }

  const heroCarousel: HomeHeroCarousel = {
    id: carousel.id,
    banners,
  };

  const section: HomeSection = {
    type: 'hero-carousel',
    id: carousel.id,
    data: heroCarousel,
  };

  return { sections: [section] };
}
