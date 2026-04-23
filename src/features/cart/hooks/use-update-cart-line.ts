import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { Cart } from '@/domain/cart';
import { SecureStorage, StorageKeys } from '@/lib/secure-storage';
import { cartLinesUpdate } from '@/services/shopify/mutations/cart';

import { cartKeys } from '../query-keys';

type UpdateCartLineVariables = {
  lineId: string;
  quantity: number;
};

export function useUpdateCartLine() {
  const queryClient = useQueryClient();

  return useMutation<Cart, Error, UpdateCartLineVariables>({
    mutationFn: async ({ lineId, quantity }) => {
      const cartId = await SecureStorage.get(StorageKeys.CART_ID);
      if (!cartId) {
        throw new Error('NO_CART');
      }

      return cartLinesUpdate(cartId, [{ id: lineId, quantity }]);
    },
    onSuccess: (cart) => {
      queryClient.setQueryData(cartKeys.current(), cart);
    },
  });
}
