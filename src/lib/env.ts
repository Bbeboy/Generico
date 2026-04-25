import Constants from 'expo-constants';

function required(key: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required env var: ${key}. Revisa tu .env y expo-constants.`);
  }

  return value;
}

function env(key: string): string | undefined {
  return process.env[key] ?? (Constants.expoConfig?.extra?.[key] as string | undefined);
}

export const ENV = {
  SHOPIFY_DOMAIN: required('EXPO_PUBLIC_SHOPIFY_DOMAIN', env('EXPO_PUBLIC_SHOPIFY_DOMAIN')),
  SHOPIFY_STOREFRONT_TOKEN: required(
    'EXPO_PUBLIC_SHOPIFY_STOREFRONT_TOKEN',
    env('EXPO_PUBLIC_SHOPIFY_STOREFRONT_TOKEN'),
  ),
  SHOPIFY_API_VERSION: env('EXPO_PUBLIC_SHOPIFY_API_VERSION') ?? '2026-01',
  SHOPIFY_ACCOUNT_URL: required(
    'EXPO_PUBLIC_SHOPIFY_ACCOUNT_URL',
    env('EXPO_PUBLIC_SHOPIFY_ACCOUNT_URL'),
  ),
} as const;
