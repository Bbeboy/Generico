import { z } from 'zod';

import type { HomeCanvas, HomeHeroBanner, HomeHeroBannerLink, HomeSection } from '@/domain/home';
import { storefrontFetch } from '../storefront';

// ---------- Constants ----------
const HERO_METAOBJECT_TYPE = 'hero_banner_home';
const HERO_METAOBJECT_HANDLE = 'hero-banner-home';
const HERO_IMAGE_FIELD_KEY = 'imagen_banner';
const HERO_DESCRIPTION_FIELD_KEY = 'descripcion_banner';
const HERO_DESCRIPTION_FIELD_KEY_ALIASES = [
  HERO_DESCRIPTION_FIELD_KEY,
  'description_banner',
  'descripcion',
  'description',
] as const;
const HERO_LINK_FIELD_KEY = 'enlace_banner';

// ---------- GraphQL Query ----------
const HOME_HERO_BANNER_QUERY = /* GraphQL */ `
  query HomeHeroBanner($handle: MetaobjectHandleInput!) {
    metaobject(handle: $handle) {
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
          ... on Collection {
            id
            handle
            title
          }
        }
      }
    }
  }
`;

// ---------- Zod Schemas (local, not exported) ----------
const RawImageSchema = z.object({
  url: z.string(),
  altText: z.string().nullable(),
});

const RawMediaImageReferenceSchema = z.object({
  image: RawImageSchema,
});

const RawCollectionReferenceSchema = z.object({
  id: z.string(),
  handle: z.string(),
  title: z.string(),
});

const RawMetaobjectFieldSchema = z.object({
  key: z.string(),
  value: z.string().nullable(),
  reference: z.union([RawMediaImageReferenceSchema, RawCollectionReferenceSchema, z.null()]),
});

const RawHeroMetaobjectSchema = z.object({
  id: z.string(),
  handle: z.string(),
  type: z.string(),
  fields: z.array(RawMetaobjectFieldSchema),
});

const RawHomeHeroResponseSchema = z.object({
  metaobject: RawHeroMetaobjectSchema.nullable(),
});

const LinkJsonValueSchema = z.object({
  url: z.string().min(1),
  text: z.string().min(1).optional(),
});

const LinkPlainValueSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^(https?:\/\/|\/)/);

// ---------- Helpers ----------
function getField(
  fields: z.infer<typeof RawMetaobjectFieldSchema>[],
  key: string,
): z.infer<typeof RawMetaobjectFieldSchema> | undefined {
  return fields.find((f) => f.key === key);
}

function getRequiredField(
  fields: z.infer<typeof RawMetaobjectFieldSchema>[],
  key: string,
): z.infer<typeof RawMetaobjectFieldSchema> {
  const field = getField(fields, key);
  if (!field) {
    throw new Error(`MISSING_FIELD: ${key}`);
  }
  return field;
}

function getFieldByKeys(
  fields: z.infer<typeof RawMetaobjectFieldSchema>[],
  keys: readonly string[],
): z.infer<typeof RawMetaobjectFieldSchema> | undefined {
  return keys.map((key) => getField(fields, key)).find((field) => field !== undefined);
}

function parseCollectionHandleFromUrl(url: string): string | null {
  const match = url.match(/\/collections\/([^/?#]+)/);
  return match ? match[1] : null;
}

function isExternalUrl(url: string): boolean {
  return /^https?:\/\//.test(url) && !url.includes('/collections/');
}

function parseLinkValue(value: string): { url: string; text?: string } | null {
  const trimmedValue = z.string().trim().min(1).safeParse(value);
  if (!trimmedValue.success) {
    return null;
  }

  // Try parsing as JSON with url field first.
  try {
    const parsedJson = LinkJsonValueSchema.safeParse(JSON.parse(trimmedValue.data));
    if (parsedJson.success) {
      return parsedJson.data;
    }
  } catch {
    // Not JSON, treat as plain URL
  }

  const plainValue = LinkPlainValueSchema.safeParse(trimmedValue.data);
  return plainValue.success ? { url: plainValue.data } : null;
}

// ---------- Domain Adapter ----------
function toDomainHomeHeroBanner(raw: z.infer<typeof RawHeroMetaobjectSchema>): HomeHeroBanner {
  const imageField = getRequiredField(raw.fields, HERO_IMAGE_FIELD_KEY);
  const descriptionField = getFieldByKeys(raw.fields, HERO_DESCRIPTION_FIELD_KEY_ALIASES);
  const linkField = getRequiredField(raw.fields, HERO_LINK_FIELD_KEY);

  // Image
  let imageUrl = '';
  let imageAltText: string | null = null;

  if (imageField.reference && 'image' in imageField.reference) {
    imageUrl = imageField.reference.image.url;
    imageAltText = imageField.reference.image.altText;
  }

  if (!imageUrl) {
    throw new Error('INVALID_HOME_HERO_IMAGE');
  }

  // Description
  const description =
    descriptionField?.value?.trim() ||
    'Descubre piezas seleccionadas para renovar tu estilo esta temporada.';

  // Link / CTA
  let cta: HomeHeroBannerLink;

  if (linkField.reference && 'handle' in linkField.reference) {
    // Collection reference
    const collection = linkField.reference;
    cta = {
      kind: 'collection',
      label: 'Ver colección',
      href: `/collection/${collection.handle}`,
      collectionHandle: collection.handle,
      collectionTitle: collection.title,
    };
  } else {
    // Parse from value
    const linkValue = parseLinkValue(linkField.value ?? '');
    if (!linkValue) {
      throw new Error('HOME_HERO_LINK_INVALID');
    }

    const { url, text } = linkValue;

    if (url.includes('/collections/')) {
      const handle = parseCollectionHandleFromUrl(url);
      if (handle) {
        cta = {
          kind: 'collection',
          label: text ?? 'Ver colección',
          href: `/collection/${handle}`,
          collectionHandle: handle,
          collectionTitle: null,
        };
      } else {
        throw new Error('HOME_HERO_LINK_INVALID');
      }
    } else if (isExternalUrl(url)) {
      cta = {
        kind: 'external',
        label: text ?? 'Ver más',
        href: url,
        collectionHandle: null,
        collectionTitle: null,
      };
    } else {
      // Internal non-collection URL
      cta = {
        kind: 'external',
        label: text ?? 'Ver más',
        href: url,
        collectionHandle: null,
        collectionTitle: null,
      };
    }
  }

  // Title from collection if available, else fallback
  let title = 'Colección Primavera';
  if (cta.kind === 'collection' && cta.collectionTitle) {
    title = cta.collectionTitle;
  }

  return {
    id: raw.id,
    eyebrow: 'NUEVA LLEGADA',
    title,
    description,
    image: {
      url: imageUrl,
      altText: imageAltText,
    },
    cta,
  };
}

// ---------- Fetch Function ----------
export async function fetchHomeCanvas(): Promise<HomeCanvas> {
  const data = await storefrontFetch<{
    metaobject: z.infer<typeof RawHeroMetaobjectSchema> | null;
  }>(HOME_HERO_BANNER_QUERY, {
    handle: {
      type: HERO_METAOBJECT_TYPE,
      handle: HERO_METAOBJECT_HANDLE,
    },
  });

  const parsed = RawHomeHeroResponseSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error('INVALID_HOME_HERO_BANNER_PAYLOAD');
  }

  const metaobject = parsed.data.metaobject;

  if (!metaobject) {
    // Return empty canvas if no metaobject found
    return { sections: [] };
  }

  const hero = toDomainHomeHeroBanner(metaobject);

  const section: HomeSection = {
    type: 'hero-banner',
    id: hero.id,
    data: hero,
  };

  return {
    sections: [section],
  };
}
