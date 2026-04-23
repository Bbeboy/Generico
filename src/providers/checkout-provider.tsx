import { ShopifyCheckoutSheetProvider, useShopifyCheckoutSheet } from '@shopify/checkout-sheet-kit';
import { useQueryClient } from '@tanstack/react-query';
import { type PropsWithChildren, useEffect } from 'react';

import { cartKeys } from '@/features/cart/query-keys';
import { SecureStorage, StorageKeys } from '@/lib/secure-storage';

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
  const sheet = useShopifyCheckoutSheet();

  useEffect(() => {
    const completedSubscription = sheet.addEventListener('completed', () => {
      void clearCompletedCheckout(queryClient);
    });

    return () => {
      completedSubscription?.remove();
    };
  }, [queryClient, sheet]);

  return null;
}

async function clearCompletedCheckout(
  queryClient: ReturnType<typeof useQueryClient>,
): Promise<void> {
  await SecureStorage.remove(StorageKeys.CART_ID);
  await queryClient.invalidateQueries({ queryKey: cartKeys.all });
}
