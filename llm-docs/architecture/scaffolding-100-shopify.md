# Scaffolding base — App RN (Expo) + Shopify (100% Shopify, sin backend)

Estructura inicial de archivos tipados para arrancar: cliente de Storefront API, tipos de dominio, hooks de carrito con TanStack Query, feature de auth delegada a páginas hospedadas, y provider de Checkout Kit. Todo con TypeScript estricto.

---

## 0. Setup inicial

### Dependencias

```bash
# Core
npx create-expo-app@latest my-store --template tabs
cd my-store

# Estado + cache
npm install @tanstack/react-query

# Checkout Shopify
npm install @shopify/checkout-sheet-kit

# Navegador para páginas de cuenta hospedadas
npx expo install expo-web-browser

# Storage seguro
npx expo install expo-secure-store

# Variables de entorno
npx expo install expo-constants

# (Opcional, recomendado) validación runtime
npm install zod
```

### Variables de entorno

Crea `.env` en la raíz (no lo subas al repo):

```bash
EXPO_PUBLIC_SHOPIFY_DOMAIN=your-store.myshopify.com
EXPO_PUBLIC_SHOPIFY_STOREFRONT_TOKEN=xxxxxxxxxxxxxxxx
EXPO_PUBLIC_SHOPIFY_API_VERSION=2025-10

# URL base de las páginas hospedadas de Customer Accounts.
# Classic:   https://your-store.myshopify.com/account
# Next-gen:  https://shopify.com/{shop_id}/account
# Pon la que aplique a tu tienda (lo ves en Admin → Settings → Customer accounts)
EXPO_PUBLIC_SHOPIFY_ACCOUNT_URL=https://your-store.myshopify.com/account
```

> En producción usa el gestor de secretos del proveedor de build/deploy en vez de `.env` plano. El prefijo `EXPO_PUBLIC_` hace que las vars sean accesibles en el cliente; el token de Storefront es de bajo privilegio por diseño.

### Path alias `@/`

En `tsconfig.json`:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

---

## 1. Estructura de carpetas

```
src/
├── app/                                # Expo Router
│   └── _layout.tsx                     # composición de providers
├── lib/
│   ├── env.ts                          # variables tipadas
│   └── secure-storage.ts               # wrapper expo-secure-store
├── domain/                             # tipos de negocio
│   ├── money.ts
│   ├── product.ts
│   └── cart.ts
├── services/
│   └── shopify/
│       ├── storefront.ts               # cliente GraphQL
│       ├── fragments.ts                # fragments reutilizables
│       ├── queries/
│       │   ├── cart.ts
│       │   └── products.ts
│       └── mutations/
│           └── cart.ts
├── features/
│   ├── cart/
│   │   ├── query-keys.ts
│   │   └── hooks/
│   │       ├── use-cart.ts
│   │       ├── use-add-to-cart.ts
│   │       ├── use-update-cart-line.ts
│   │       └── use-remove-cart-line.ts
│   ├── checkout/
│   │   └── hooks/
│   │       └── use-open-checkout.ts
│   └── auth/
│       └── hooks/
│           └── use-account-pages.ts    # abre páginas hospedadas
└── providers/
    ├── query-provider.tsx
    └── checkout-provider.tsx
```

---

## 2. Capa `lib/` — utilidades transversales

### `src/lib/env.ts`

```typescript
import Constants from 'expo-constants';

function required(key: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required env var: ${key}. Revisa tu .env y expo-constants.`);
  }
  return value;
}

// Expo expone las EXPO_PUBLIC_* en process.env en dev
// y en Constants.expoConfig.extra en build. Este helper unifica.
function env(key: string): string | undefined {
  return process.env[key] ?? (Constants.expoConfig?.extra?.[key] as string | undefined);
}

export const ENV = {
  SHOPIFY_DOMAIN: required('EXPO_PUBLIC_SHOPIFY_DOMAIN', env('EXPO_PUBLIC_SHOPIFY_DOMAIN')),
  SHOPIFY_STOREFRONT_TOKEN: required(
    'EXPO_PUBLIC_SHOPIFY_STOREFRONT_TOKEN',
    env('EXPO_PUBLIC_SHOPIFY_STOREFRONT_TOKEN'),
  ),
  SHOPIFY_API_VERSION: env('EXPO_PUBLIC_SHOPIFY_API_VERSION') ?? '2025-10',
  SHOPIFY_ACCOUNT_URL: required(
    'EXPO_PUBLIC_SHOPIFY_ACCOUNT_URL',
    env('EXPO_PUBLIC_SHOPIFY_ACCOUNT_URL'),
  ),
} as const;
```

### `src/lib/secure-storage.ts`

```typescript
import * as SecureStore from 'expo-secure-store';

// Wrapper tipado. Si algún día cambias de backend de storage,
// solo tocas este archivo.
export const SecureStorage = {
  async get(key: string): Promise<string | null> {
    return SecureStore.getItemAsync(key);
  },

  async set(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  },

  async remove(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  },
} as const;

// Claves centralizadas (evita strings sueltos por la app)
export const StorageKeys = {
  CART_ID: 'shopify.cart.id',
} as const;
```

---

## 3. Capa `domain/` — tipos de negocio

### `src/domain/money.ts`

```typescript
export type Money = {
  amount: string; // Decimal como string (así lo devuelve Shopify)
  currencyCode: string; // "USD", "MXN", "EUR"...
};

/**
 * Formatea un Money con Intl.NumberFormat.
 * @param locale - p.ej. 'es-MX', 'en-US'
 */
export function formatMoney(money: Money, locale = 'es-MX'): string {
  const num = Number(money.amount);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: money.currencyCode,
  }).format(num);
}

export function addMoney(a: Money, b: Money): Money {
  if (a.currencyCode !== b.currencyCode) {
    throw new Error(`Cannot add different currencies: ${a.currencyCode} + ${b.currencyCode}`);
  }
  return {
    amount: (Number(a.amount) + Number(b.amount)).toFixed(2),
    currencyCode: a.currencyCode,
  };
}
```

### `src/domain/product.ts`

```typescript
import type { Money } from './money';

export type Image = {
  url: string;
  altText: string | null;
};

export type ProductVariant = {
  id: string;
  title: string;
  price: Money;
  availableForSale: boolean;
  image: Image | null;
};

export type Product = {
  id: string;
  handle: string;
  title: string;
  description: string;
  featuredImage: Image | null;
  variants: ProductVariant[];
  priceRange: {
    minVariantPrice: Money;
    maxVariantPrice: Money;
  };
};
```

### `src/domain/cart.ts`

```typescript
import type { Money } from './money';
import type { ProductVariant } from './product';

export type CartLine = {
  id: string; // ID de la línea (no del variant)
  quantity: number;
  merchandise: ProductVariant & {
    productTitle: string;
    productHandle: string;
  };
  cost: {
    totalAmount: Money;
  };
};

/**
 * Representación del carrito en la app.
 * Siempre es un carrito anónimo: la app no conoce al cliente.
 * Si el usuario se autentica durante el checkout, la asociación
 * ocurre dentro del Checkout Kit y es transparente para la app.
 */
export type Cart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  lines: CartLine[];
  cost: {
    subtotalAmount: Money;
    totalAmount: Money;
    totalTaxAmount: Money | null;
  };
};

// Error de usuario devuelto por mutations de Shopify
export type UserError = {
  field: string[] | null;
  message: string;
};
```

---

## 4. Capa `services/shopify/`

### `src/services/shopify/storefront.ts`

```typescript
import { ENV } from '@/lib/env';

type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string; path?: string[] }>;
};

export class StorefrontError extends Error {
  constructor(
    message: string,
    public errors?: GraphQLResponse<unknown>['errors'],
  ) {
    super(message);
    this.name = 'StorefrontError';
  }
}

/**
 * Cliente GraphQL para Storefront API.
 * Todas las queries y mutations pasan por aquí.
 */
export async function storefrontFetch<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const endpoint = `https://${ENV.SHOPIFY_DOMAIN}/api/${ENV.SHOPIFY_API_VERSION}/graphql.json`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': ENV.SHOPIFY_STOREFRONT_TOKEN,
      Accept: 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new StorefrontError(`HTTP ${response.status}: ${response.statusText}`);
  }

  const json = (await response.json()) as GraphQLResponse<T>;

  if (json.errors?.length) {
    console.error('Storefront API errors', json.errors);
    throw new StorefrontError(json.errors.map((e) => e.message).join('; '), json.errors);
  }

  if (!json.data) {
    throw new StorefrontError('Empty response data');
  }

  return json.data;
}
```

### `src/services/shopify/fragments.ts`

```typescript
// Fragments reutilizables para mantener las queries DRY.

export const MONEY_FRAGMENT = /* GraphQL */ `
  fragment MoneyFields on MoneyV2 {
    amount
    currencyCode
  }
`;

export const IMAGE_FRAGMENT = /* GraphQL */ `
  fragment ImageFields on Image {
    url
    altText
  }
`;

export const VARIANT_FRAGMENT = /* GraphQL */ `
  fragment VariantFields on ProductVariant {
    id
    title
    availableForSale
    price {
      ...MoneyFields
    }
    image {
      ...ImageFields
    }
  }
  ${MONEY_FRAGMENT}
  ${IMAGE_FRAGMENT}
`;

export const CART_FRAGMENT = /* GraphQL */ `
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    cost {
      subtotalAmount {
        ...MoneyFields
      }
      totalAmount {
        ...MoneyFields
      }
      totalTaxAmount {
        ...MoneyFields
      }
    }
    lines(first: 100) {
      edges {
        node {
          id
          quantity
          cost {
            totalAmount {
              ...MoneyFields
            }
          }
          merchandise {
            ... on ProductVariant {
              ...VariantFields
              product {
                title
                handle
              }
            }
          }
        }
      }
    }
  }
  ${MONEY_FRAGMENT}
  ${VARIANT_FRAGMENT}
`;
```

### `src/services/shopify/queries/cart.ts`

```typescript
import type { Cart } from '@/domain/cart';
import { storefrontFetch } from '../storefront';
import { CART_FRAGMENT } from '../fragments';

const CART_QUERY = /* GraphQL */ `
  query Cart($id: ID!) {
    cart(id: $id) {
      ...CartFields
    }
  }
  ${CART_FRAGMENT}
`;

// Shape crudo que devuelve Shopify (lines en edges)
type RawCart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: {
    subtotalAmount: { amount: string; currencyCode: string };
    totalAmount: { amount: string; currencyCode: string };
    totalTaxAmount: { amount: string; currencyCode: string } | null;
  };
  lines: {
    edges: Array<{
      node: {
        id: string;
        quantity: number;
        cost: { totalAmount: { amount: string; currencyCode: string } };
        merchandise: {
          id: string;
          title: string;
          availableForSale: boolean;
          price: { amount: string; currencyCode: string };
          image: { url: string; altText: string | null } | null;
          product: { title: string; handle: string };
        };
      };
    }>;
  };
};

/**
 * Convierte el shape de Shopify al modelo de dominio.
 */
export function toDomainCart(raw: RawCart): Cart {
  return {
    id: raw.id,
    checkoutUrl: raw.checkoutUrl,
    totalQuantity: raw.totalQuantity,
    cost: raw.cost,
    lines: raw.lines.edges.map(({ node }) => ({
      id: node.id,
      quantity: node.quantity,
      cost: node.cost,
      merchandise: {
        id: node.merchandise.id,
        title: node.merchandise.title,
        price: node.merchandise.price,
        availableForSale: node.merchandise.availableForSale,
        image: node.merchandise.image,
        productTitle: node.merchandise.product.title,
        productHandle: node.merchandise.product.handle,
      },
    })),
  };
}

/**
 * Fetch de un carrito por ID.
 * Devuelve null si el carrito expiró o no existe.
 */
export async function fetchCart(cartId: string): Promise<Cart | null> {
  const data = await storefrontFetch<{ cart: RawCart | null }>(CART_QUERY, {
    id: cartId,
  });

  return data.cart ? toDomainCart(data.cart) : null;
}
```

### `src/services/shopify/queries/products.ts`

```typescript
import type { Product } from '@/domain/product';
import { storefrontFetch } from '../storefront';
import { IMAGE_FRAGMENT, MONEY_FRAGMENT, VARIANT_FRAGMENT } from '../fragments';

const PRODUCTS_QUERY = /* GraphQL */ `
  query Products($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          handle
          title
          description
          featuredImage {
            ...ImageFields
          }
          priceRange {
            minVariantPrice {
              ...MoneyFields
            }
            maxVariantPrice {
              ...MoneyFields
            }
          }
          variants(first: 20) {
            edges {
              node {
                ...VariantFields
              }
            }
          }
        }
      }
    }
  }
  ${IMAGE_FRAGMENT}
  ${MONEY_FRAGMENT}
  ${VARIANT_FRAGMENT}
`;

type RawProductNode = {
  id: string;
  handle: string;
  title: string;
  description: string;
  featuredImage: { url: string; altText: string | null } | null;
  priceRange: {
    minVariantPrice: { amount: string; currencyCode: string };
    maxVariantPrice: { amount: string; currencyCode: string };
  };
  variants: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        availableForSale: boolean;
        price: { amount: string; currencyCode: string };
        image: { url: string; altText: string | null } | null;
      };
    }>;
  };
};

function toDomainProduct(raw: RawProductNode): Product {
  return {
    id: raw.id,
    handle: raw.handle,
    title: raw.title,
    description: raw.description,
    featuredImage: raw.featuredImage,
    priceRange: raw.priceRange,
    variants: raw.variants.edges.map(({ node }) => node),
  };
}

export type ProductsPage = {
  products: Product[];
  hasNextPage: boolean;
  endCursor: string | null;
};

export async function fetchProducts(first = 20, after?: string): Promise<ProductsPage> {
  const data = await storefrontFetch<{
    products: {
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      edges: Array<{ node: RawProductNode }>;
    };
  }>(PRODUCTS_QUERY, { first, after });

  return {
    products: data.products.edges.map(({ node }) => toDomainProduct(node)),
    hasNextPage: data.products.pageInfo.hasNextPage,
    endCursor: data.products.pageInfo.endCursor,
  };
}
```

### `src/services/shopify/mutations/cart.ts`

```typescript
import type { Cart, UserError } from '@/domain/cart';
import { storefrontFetch } from '../storefront';
import { CART_FRAGMENT } from '../fragments';
import { toDomainCart } from '../queries/cart';

export type CartLineInput = {
  merchandiseId: string;
  quantity: number;
};

export type CartLineUpdateInput = {
  id: string; // ID de la línea del carrito
  quantity: number;
};

export class CartUserError extends Error {
  constructor(public userErrors: UserError[]) {
    super(userErrors.map((e) => e.message).join('; '));
    this.name = 'CartUserError';
  }
}

function throwIfUserErrors(userErrors: UserError[]) {
  if (userErrors.length) throw new CartUserError(userErrors);
}

// ---------- cartCreate ----------
// NOTA: en este modelo, cartCreate NUNCA incluye buyerIdentity.
// El carrito es siempre anónimo; la asociación con cliente ocurre
// dentro del Checkout Kit si el usuario decide autenticarse ahí.

const CART_CREATE = /* GraphQL */ `
  mutation CartCreate($lines: [CartLineInput!]!) {
    cartCreate(input: { lines: $lines }) {
      cart {
        ...CartFields
      }
      userErrors {
        field
        message
      }
    }
  }
  ${CART_FRAGMENT}
`;

export async function cartCreate(lines: CartLineInput[]): Promise<Cart> {
  const data = await storefrontFetch<{
    cartCreate: { cart: Parameters<typeof toDomainCart>[0]; userErrors: UserError[] };
  }>(CART_CREATE, { lines });

  throwIfUserErrors(data.cartCreate.userErrors);
  return toDomainCart(data.cartCreate.cart);
}

// ---------- cartLinesAdd ----------

const CART_LINES_ADD = /* GraphQL */ `
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        ...CartFields
      }
      userErrors {
        field
        message
      }
    }
  }
  ${CART_FRAGMENT}
`;

export async function cartLinesAdd(cartId: string, lines: CartLineInput[]): Promise<Cart> {
  const data = await storefrontFetch<{
    cartLinesAdd: {
      cart: Parameters<typeof toDomainCart>[0] | null;
      userErrors: UserError[];
    };
  }>(CART_LINES_ADD, { cartId, lines });

  throwIfUserErrors(data.cartLinesAdd.userErrors);
  if (!data.cartLinesAdd.cart) {
    throw new Error('CART_NOT_FOUND');
  }
  return toDomainCart(data.cartLinesAdd.cart);
}

// ---------- cartLinesUpdate ----------

const CART_LINES_UPDATE = /* GraphQL */ `
  mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart {
        ...CartFields
      }
      userErrors {
        field
        message
      }
    }
  }
  ${CART_FRAGMENT}
`;

export async function cartLinesUpdate(cartId: string, lines: CartLineUpdateInput[]): Promise<Cart> {
  const data = await storefrontFetch<{
    cartLinesUpdate: {
      cart: Parameters<typeof toDomainCart>[0] | null;
      userErrors: UserError[];
    };
  }>(CART_LINES_UPDATE, { cartId, lines });

  throwIfUserErrors(data.cartLinesUpdate.userErrors);
  if (!data.cartLinesUpdate.cart) throw new Error('CART_NOT_FOUND');
  return toDomainCart(data.cartLinesUpdate.cart);
}

// ---------- cartLinesRemove ----------

const CART_LINES_REMOVE = /* GraphQL */ `
  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart {
        ...CartFields
      }
      userErrors {
        field
        message
      }
    }
  }
  ${CART_FRAGMENT}
`;

export async function cartLinesRemove(cartId: string, lineIds: string[]): Promise<Cart> {
  const data = await storefrontFetch<{
    cartLinesRemove: {
      cart: Parameters<typeof toDomainCart>[0] | null;
      userErrors: UserError[];
    };
  }>(CART_LINES_REMOVE, { cartId, lineIds });

  throwIfUserErrors(data.cartLinesRemove.userErrors);
  if (!data.cartLinesRemove.cart) throw new Error('CART_NOT_FOUND');
  return toDomainCart(data.cartLinesRemove.cart);
}
```

---

## 5. Capa `features/cart/` — hooks con TanStack Query

### `src/features/cart/query-keys.ts`

```typescript
// Claves centralizadas para TanStack Query.
export const cartKeys = {
  all: ['cart'] as const,
  current: () => [...cartKeys.all, 'current'] as const,
};
```

### `src/features/cart/hooks/use-cart.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import type { Cart } from '@/domain/cart';
import { SecureStorage, StorageKeys } from '@/lib/secure-storage';
import { fetchCart } from '@/services/shopify/queries/cart';
import { cartKeys } from '../query-keys';

/**
 * Devuelve el carrito actual (o null si no existe / expiró).
 */
export function useCart() {
  return useQuery<Cart | null>({
    queryKey: cartKeys.current(),
    queryFn: async () => {
      const cartId = await SecureStorage.get(StorageKeys.CART_ID);
      if (!cartId) return null;

      const cart = await fetchCart(cartId);
      if (!cart) {
        // Carrito expiró, limpiamos
        await SecureStorage.remove(StorageKeys.CART_ID);
        return null;
      }
      return cart;
    },
    staleTime: 1000 * 30, // 30 segundos
  });
}

/**
 * Helper derivado útil para el badge de la pestaña "Carrito".
 */
export function useCartItemCount(): number {
  const { data: cart } = useCart();
  return cart?.totalQuantity ?? 0;
}
```

### `src/features/cart/hooks/use-add-to-cart.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Cart } from '@/domain/cart';
import { SecureStorage, StorageKeys } from '@/lib/secure-storage';
import { cartCreate, cartLinesAdd } from '@/services/shopify/mutations/cart';
import { cartKeys } from '../query-keys';

type AddToCartVars = {
  variantId: string;
  quantity?: number;
};

/**
 * Agrega una línea al carrito.
 *
 * Maneja tres casos:
 *  - No existe carrito        → cartCreate
 *  - Existe pero expiró       → limpia y cartCreate
 *  - Existe y válido          → cartLinesAdd
 */
export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation<Cart, Error, AddToCartVars>({
    mutationFn: async ({ variantId, quantity = 1 }) => {
      const lines = [{ merchandiseId: variantId, quantity }];
      const existingCartId = await SecureStorage.get(StorageKeys.CART_ID);

      if (!existingCartId) {
        const cart = await cartCreate(lines);
        await SecureStorage.set(StorageKeys.CART_ID, cart.id);
        return cart;
      }

      try {
        return await cartLinesAdd(existingCartId, lines);
      } catch (err) {
        if (err instanceof Error && err.message === 'CART_NOT_FOUND') {
          // Carrito expiró entre lecturas. Creamos uno nuevo.
          await SecureStorage.remove(StorageKeys.CART_ID);
          const cart = await cartCreate(lines);
          await SecureStorage.set(StorageKeys.CART_ID, cart.id);
          return cart;
        }
        throw err;
      }
    },
    onSuccess: (cart) => {
      queryClient.setQueryData(cartKeys.current(), cart);
    },
  });
}
```

### `src/features/cart/hooks/use-update-cart-line.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Cart } from '@/domain/cart';
import { SecureStorage, StorageKeys } from '@/lib/secure-storage';
import { cartLinesUpdate } from '@/services/shopify/mutations/cart';
import { cartKeys } from '../query-keys';

type UpdateCartLineVars = {
  lineId: string;
  quantity: number;
};

/**
 * Actualiza la cantidad de una línea del carrito.
 * Si quantity = 0, considera usar useRemoveCartLine en su lugar.
 */
export function useUpdateCartLine() {
  const queryClient = useQueryClient();

  return useMutation<Cart, Error, UpdateCartLineVars>({
    mutationFn: async ({ lineId, quantity }) => {
      const cartId = await SecureStorage.get(StorageKeys.CART_ID);
      if (!cartId) throw new Error('NO_CART');
      return cartLinesUpdate(cartId, [{ id: lineId, quantity }]);
    },
    onSuccess: (cart) => {
      queryClient.setQueryData(cartKeys.current(), cart);
    },
  });
}
```

### `src/features/cart/hooks/use-remove-cart-line.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Cart } from '@/domain/cart';
import { SecureStorage, StorageKeys } from '@/lib/secure-storage';
import { cartLinesRemove } from '@/services/shopify/mutations/cart';
import { cartKeys } from '../query-keys';

export function useRemoveCartLine() {
  const queryClient = useQueryClient();

  return useMutation<Cart, Error, { lineId: string }>({
    mutationFn: async ({ lineId }) => {
      const cartId = await SecureStorage.get(StorageKeys.CART_ID);
      if (!cartId) throw new Error('NO_CART');
      return cartLinesRemove(cartId, [lineId]);
    },
    onSuccess: (cart) => {
      queryClient.setQueryData(cartKeys.current(), cart);
    },
  });
}
```

---

## 6. Capa `features/checkout/`

### `src/features/checkout/hooks/use-open-checkout.ts`

```typescript
import { useShopifyCheckoutSheet } from '@shopify/checkout-sheet-kit';
import { useCart } from '@/features/cart/hooks/use-cart';

/**
 * Abre el checkout nativo de Shopify con la URL del carrito actual.
 * Si el usuario quiere autenticarse para usar direcciones o métodos
 * de pago guardados, lo hace dentro del propio Checkout Kit.
 *
 * Uso:
 *   const { canOpen, open } = useOpenCheckout();
 *   <Button disabled={!canOpen} onPress={open} title="Pagar" />
 */
export function useOpenCheckout() {
  const sheet = useShopifyCheckoutSheet();
  const { data: cart } = useCart();

  const canOpen = Boolean(cart?.checkoutUrl && cart.totalQuantity > 0);

  return {
    canOpen,
    open: () => {
      if (cart?.checkoutUrl) {
        sheet.present(cart.checkoutUrl);
      }
    },
  };
}
```

---

## 7. Capa `features/auth/` — delegación a páginas hospedadas

No hay estado ni tokens aquí. Solo hooks que abren URLs de Shopify en el navegador del sistema. Shopify gestiona todo lo sensible.

### `src/features/auth/hooks/use-account-pages.ts`

```typescript
import * as WebBrowser from 'expo-web-browser';
import { useCallback } from 'react';
import { ENV } from '@/lib/env';

/**
 * Hook para abrir páginas hospedadas de Customer Accounts de Shopify.
 *
 * Todas las pantallas de login, registro, cuenta, pedidos y direcciones
 * viven en Shopify. La app solo las abre con expo-web-browser.
 *
 * En iOS abre SFSafariViewController; en Android, Chrome Custom Tabs.
 * Las cookies de sesión quedan en el contenedor del browser del sistema;
 * NO se comparten con el WebView del Checkout Kit (eso es esperado).
 */
export function useAccountPages() {
  const base = ENV.SHOPIFY_ACCOUNT_URL;

  const openAccount = useCallback(async () => {
    await WebBrowser.openBrowserAsync(base);
  }, [base]);

  const openLogin = useCallback(async () => {
    // /account redirige a login si no hay sesión; ambas URLs funcionan.
    await WebBrowser.openBrowserAsync(`${base}/login`);
  }, [base]);

  const openRegister = useCallback(async () => {
    await WebBrowser.openBrowserAsync(`${base}/register`);
  }, [base]);

  const openOrders = useCallback(async () => {
    await WebBrowser.openBrowserAsync(`${base}/orders`);
  }, [base]);

  return {
    openAccount,
    openLogin,
    openRegister,
    openOrders,
  };
}
```

---

## 8. Providers

### `src/providers/query-provider.tsx`

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type PropsWithChildren, useState } from 'react';

export function QueryProvider({ children }: PropsWithChildren) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60, // 1 min por defecto
            retry: 2,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
```

### `src/providers/checkout-provider.tsx`

```tsx
import { ShopifyCheckoutSheetProvider } from '@shopify/checkout-sheet-kit';
import { useQueryClient } from '@tanstack/react-query';
import { type PropsWithChildren, useEffect } from 'react';
import { cartKeys } from '@/features/cart/query-keys';
import { SecureStorage, StorageKeys } from '@/lib/secure-storage';

/**
 * Wrapper del Checkout Kit que además:
 *  - Invalida el carrito cuando el checkout se completa (orden creada)
 *  - Limpia el cartId local tras una compra exitosa
 *
 * NOTA: la API exacta de listeners puede variar por versión del paquete.
 * Si tu versión expone `useShopifyCheckoutSheet().addEventListener(...)`,
 * conéctalo desde un hook interno como se sugiere abajo.
 */
export function CheckoutProvider({ children }: PropsWithChildren) {
  return (
    <ShopifyCheckoutSheetProvider>
      <CheckoutEvents />
      {children}
    </ShopifyCheckoutSheetProvider>
  );
}

function CheckoutEvents() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Placeholder: conecta aquí los listeners del Checkout Kit
    // según la API de tu versión del paquete. Ejemplo conceptual:
    //
    //   const offCompleted = sheet.addEventListener('completed', async () => {
    //     await SecureStorage.remove(StorageKeys.CART_ID);
    //     queryClient.invalidateQueries({ queryKey: cartKeys.all });
    //   });
    //   return () => offCompleted();
    //
    return () => {
      // cleanup si registras listeners
    };
  }, [queryClient]);

  return null;
}
```

---

## 9. Composición en el layout raíz

### `src/app/_layout.tsx`

```tsx
import { Stack } from 'expo-router';
import { QueryProvider } from '@/providers/query-provider';
import { CheckoutProvider } from '@/providers/checkout-provider';

export default function RootLayout() {
  return (
    <QueryProvider>
      <CheckoutProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="product/[id]" options={{ presentation: 'card' }} />
        </Stack>
      </CheckoutProvider>
    </QueryProvider>
  );
}
```

---

## 10. Ejemplos de uso end-to-end

### Detalle de producto + agregar al carrito + checkout

```tsx
// src/app/product/[id].tsx
import { useLocalSearchParams } from 'expo-router';
import { Button, Text, View } from 'react-native';
import { useAddToCart } from '@/features/cart/hooks/use-add-to-cart';
import { useOpenCheckout } from '@/features/checkout/hooks/use-open-checkout';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const addToCart = useAddToCart();
  const { canOpen, open } = useOpenCheckout();

  return (
    <View>
      <Text>Product {id}</Text>

      <Button
        title={addToCart.isPending ? 'Agregando…' : 'Agregar al carrito'}
        disabled={addToCart.isPending}
        onPress={() =>
          addToCart.mutate({
            variantId: 'gid://shopify/ProductVariant/123',
            quantity: 1,
          })
        }
      />

      <Button title="Ir a pago" disabled={!canOpen} onPress={open} />
    </View>
  );
}
```

### Pestaña "Mi cuenta" (delegada a Shopify)

```tsx
// src/app/(tabs)/account.tsx
import { Button, Text, View } from 'react-native';
import { useAccountPages } from '@/features/auth/hooks/use-account-pages';

export default function AccountScreen() {
  const { openAccount, openLogin, openOrders } = useAccountPages();

  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: '600' }}>Mi cuenta</Text>
      <Text style={{ opacity: 0.7 }}>
        Tu cuenta se gestiona en el portal seguro de nuestra tienda.
      </Text>

      <Button title="Iniciar sesión" onPress={openLogin} />
      <Button title="Ver mi cuenta" onPress={openAccount} />
      <Button title="Mis pedidos" onPress={openOrders} />
    </View>
  );
}
```

---

## 11. Próximos pasos sugeridos

1. **Generar tipos con codegen.** Cuando el scaffolding esté estable, instala `@graphql-codegen/cli` y genera los tipos desde el schema de Shopify. Elimina los `Raw*` manuales.
2. **Pantalla de carrito real.** Usa `useCart`, `useUpdateCartLine`, `useRemoveCartLine` en una screen con `FlatList`.
3. **Updates optimistas.** Una vez que el flujo básico funcione, añade `onMutate` con `setQueryData` en los hooks de mutación para UI instantánea.
4. **Validación con zod.** Añade schemas en los puntos críticos (`fetchCart`, `cartCreate`) para validar que el payload coincide con los tipos.
5. **Manejo global de errores.** Un hook `useErrorHandler` o Toast global para `CartUserError` y `StorefrontError`.
6. **i18n / multi-moneda.** Agrega `@inContext(country: $country, language: $language)` a todas las queries desde el inicio.
7. **Refrescar carrito al volver de WebBrowser.** Si sospechas que el usuario modificó algo, invalida `cartKeys.all` cuando el browser se cierre. Casi siempre es innecesario, pero es una red de seguridad barata.
