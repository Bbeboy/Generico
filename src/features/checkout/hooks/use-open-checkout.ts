import { useShopifyCheckoutSheet } from '@shopify/checkout-sheet-kit';

import { useCart } from '@/features/cart/hooks/use-cart';

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
