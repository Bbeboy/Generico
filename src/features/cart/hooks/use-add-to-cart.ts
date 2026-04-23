import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { Cart } from '@/domain/cart';
import { SecureStorage, StorageKeys } from '@/lib/secure-storage';
import { cartCreate, cartLinesAdd } from '@/services/shopify/mutations/cart';

import { cartKeys } from '../query-keys';

type AddToCartVariables = {
  variantId: string;
  quantity?: number;
};

export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation<Cart, Error, AddToCartVariables>({
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
      } catch (error) {
        if (error instanceof Error && error.message === 'CART_NOT_FOUND') {
          await SecureStorage.remove(StorageKeys.CART_ID);
          const cart = await cartCreate(lines);
          await SecureStorage.set(StorageKeys.CART_ID, cart.id);
          return cart;
        }

        throw error;
      }
    },
    onSuccess: (cart) => {
      queryClient.setQueryData(cartKeys.current(), cart);
    },
  });
}
