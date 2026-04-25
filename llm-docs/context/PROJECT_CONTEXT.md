# Contexto esencial del proyecto

Este archivo resume lo necesario para que una IA pueda trabajar en este proyecto sin tener que leer todos los documentos largos de `llm-docs/` al inicio.

## Stack principal

- App móvil/web con **Expo + React Native**.
- Routing con **Expo Router** bajo `src/app/`.
- Ecommerce conectado **100% directo a Shopify Storefront API**.
- Estado remoto con **TanStack React Query**.
- Estado UI compartido con **Zustand**, pero **no** para datos de Shopify.
- Validación de payloads externos con **Zod** en `src/services/`.
- Estilos con **Uniwind** usando `className` y tokens de `src/global.css`.
- Imágenes remotas con **expo-image**.

## Arquitectura y reglas críticas

El flujo de dependencias debe ser:

```txt
src/app -> src/features -> src/services -> src/domain
```

Reglas importantes:

- `src/app/` debe contener rutas/screens delgadas.
- `src/domain/` debe ser puro: sin React, React Native, Expo, Zod, Shopify, fetch ni hooks.
- `src/services/shopify/` es el único lugar que habla con Shopify.
- `features/*` consume `services/` y `domain/`.
- No importar una feature desde otra feature.
- No usar `process.env` fuera de `src/lib/env.ts`.
- No crear backend propio.
- No usar Admin API.
- No usar Customer Account API/OAuth.
- No guardar tokens de cliente.
- No introducir `buyerIdentity` en carrito.
- No usar Zustand para datos que vienen de Shopify.

## Variables y Storefront API

La versión actual de Shopify Storefront API es:

```txt
2026-01
```

Está configurada en:

- `src/lib/env.ts`
- `.env.example`

Toda llamada a Shopify pasa por:

```txt
src/services/shopify/storefront.ts
```

## Diseño visual

Brand: **Luminous Commerce**.

Principios:

- Soft minimalism.
- Mucho whitespace.
- UI limpia, premium, serena y approachable.
- Evitar bordes pesados; preferir tonos suaves y sombras ligeras.

Tokens principales definidos en `src/global.css`:

- `bg-canvas`
- `bg-surface`
- `text-heading`
- `text-text`
- `bg-primary`
- `text-primary-foreground`
- `border-border`
- `rounded-card`
- `rounded-pill`
- `shadow-card`

Light theme:

- Canvas `#f9fafb`
- Surface `#ffffff`
- Heading `#111827`
- Text `#374151`
- Primary `#111827`

Dark theme:

- Canvas `#09090b`
- Surface `#0c0c0f`
- Heading `#fafafa`
- Text `#a1a1aa`
- Primary violet `#a78bfa`

## Home Canvas + Hero Banner Shopify

Se implementó una Home ecommerce que reemplaza el template inicial de Expo.

Archivos relevantes:

- `src/app/(tabs)/index.tsx`
- `src/features/home/components/home-screen.tsx`
- `src/features/home/components/home-canvas.tsx`
- `src/features/home/components/home-hero-banner.tsx`
- `src/features/home/hooks/use-home-canvas.ts`
- `src/features/home/query-keys.ts`
- `src/services/shopify/queries/home.ts`
- `src/domain/home.ts`
- `src/app/collection/[handle].tsx`

### Metaobject esperado en Shopify

Tipo:

```ts
hero_banner_home;
```

Handle:

```ts
hero - banner - home;
```

Keys esperadas:

```ts
imagen_banner;
descripcion_banner;
enlace_banner;
```

Notas reales de implementación:

- Shopify no siempre devolvió `descripcion_banner`, por eso el adaptador acepta aliases:
  - `descripcion_banner`
  - `description_banner`
  - `descripcion`
  - `description`
- Si la descripción no llega, se mantiene fallback editorial:

```txt
Descubre piezas seleccionadas para renovar tu estilo esta temporada.
```

Esto fue una desviación intencional del plan original para evitar que la app truene con Shopify real.

### Query y adaptador

El archivo `src/services/shopify/queries/home.ts`:

- Usa `metaobject(handle: $handle)`.
- Valida payload raw con Zod.
- Transforma Shopify raw shape a tipos de dominio.
- Soporta imagen `MediaImage`.
- Soporta link como:
  - referencia `Collection`
  - URL interna `/collections/{handle}`
  - URL absoluta externa `https://...`
- `parseLinkValue` usa Zod para JSON `{ url, text }` y URL simple.

### Dominio Home

`src/domain/home.ts` define:

- `HomeHeroBannerLink`
- `HomeHeroBanner`
- `HomeSection`
- `HomeCanvas`

El dominio no contiene tipos GraphQL ni imports externos no permitidos.

### UI del Hero

`src/features/home/components/home-hero-banner.tsx` renderiza:

- Card vertical con `rounded-card`.
- Imagen de fondo con `expo-image`.
- Overlay oscuro.
- Eyebrow uppercase.
- Título.
- Descripción.
- **Un solo CTA**.

Importante: la imagen usa `StyleSheet.absoluteFillObject` + `height: '100%'` + `width: '100%'` porque `className="absolute inset-0 size-full"` no renderizaba bien en Android con `expo-image`.

## Navegación

Ruta Home:

```txt
src/app/(tabs)/index.tsx
```

Debe mantenerse delgada:

```tsx
import { HomeScreen } from '@/features/home/components/home-screen';

export default function IndexScreen() {
  return <HomeScreen />;
}
```

Ruta placeholder de colección:

```txt
src/app/collection/[handle].tsx
```

CTA del Hero:

- Si es colección: `router.push('/collection/{handle}')`.
- Si es externo: `Linking.openURL(href)`.

## Husky y validaciones

Husky pre-commit está en:

```txt
.husky/pre-commit
```

Ejecuta:

```sh
npx lint-staged
npm run format:check
```

Scripts importantes:

```sh
npm run typecheck
npm run lint
npm run format:check
npx expo export --platform web
```

Actualmente no hay tests configurados.

## Gotchas conocidos

- Si Metro lanza `Error: Got unexpected undefined` después de crear/mover archivos, suele ser cache transitorio. Reiniciar Expo o correr `npx expo start -c` normalmente lo resuelve.
- Si el Hero no muestra imagen pero sí texto/link, revisar primero el render de `expo-image` y que la URL sea pública.
- Si Shopify no devuelve campos esperados, confirmar publicación/permisos del metaobject y scope `unauthenticated_read_metaobjects`.
- El campo de descripción tiene fallback por compatibilidad con Shopify real.

## Qué NO hacer

- No agregar backend.
- No usar Admin API.
- No usar Customer Account API/OAuth.
- No guardar tokens de cliente.
- No meter datos Shopify en Zustand.
- No hacer fetch directo desde componentes.
- No poner lógica pesada en `src/app/`.
- No instalar dependencias sin justificarlo primero.
- No crear segundo botón en el Hero Banner.
