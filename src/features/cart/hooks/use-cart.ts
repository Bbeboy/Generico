import { useQuery } from '@tanstack/react-query';

import type { Cart } from '@/domain/cart';
import { SecureStorage, StorageKeys } from '@/lib/secure-storage';
import { fetchCart } from '@/services/shopify/queries/cart';

import { cartKeys } from '../query-keys';

export function useCart() {
  return useQuery<Cart | null>({
    queryKey: cartKeys.current(),
    queryFn: async () => {
      const cartId = await SecureStorage.get(StorageKeys.CART_ID);
      if (!cartId) {
        return null;
      }

      const cart = await fetchCart(cartId);
      if (!cart) {
        await SecureStorage.remove(StorageKeys.CART_ID);
        return null;
      }

      return cart;
    },
    staleTime: 1000 * 30,
  });
}

export function useCartItemCount(): number {
  const { data: cart } = useCart();

  return cart?.totalQuantity ?? 0;
}
