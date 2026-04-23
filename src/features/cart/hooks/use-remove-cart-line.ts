import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { Cart } from '@/domain/cart';
import { SecureStorage, StorageKeys } from '@/lib/secure-storage';
import { cartLinesRemove } from '@/services/shopify/mutations/cart';

import { cartKeys } from '../query-keys';

type RemoveCartLineVariables = {
  lineId: string;
};

export function useRemoveCartLine() {
  const queryClient = useQueryClient();

  return useMutation<Cart, Error, RemoveCartLineVariables>({
    mutationFn: async ({ lineId }) => {
      const cartId = await SecureStorage.get(StorageKeys.CART_ID);
      if (!cartId) {
        throw new Error('NO_CART');
      }

      return cartLinesRemove(cartId, [lineId]);
    },
    onSuccess: (cart) => {
      queryClient.setQueryData(cartKeys.current(), cart);
    },
  });
}
