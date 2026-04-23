import * as SecureStore from 'expo-secure-store';

export const StorageKeys = {
  CART_ID: 'shopify.cart.id',
} as const;

type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];

export const SecureStorage = {
  get(key: StorageKey): Promise<string | null> {
    return SecureStore.getItemAsync(key);
  },

  async set(key: StorageKey, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  },

  async remove(key: StorageKey): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  },
} as const;
