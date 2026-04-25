import { Linking } from 'react-native';

import { useCart } from '@/features/cart/hooks/use-cart';

export function useOpenCheckout() {
  const { data: cart } = useCart();

  const canOpen = Boolean(cart?.checkoutUrl && cart.totalQuantity > 0);

  return {
    canOpen,
    open: () => {
      if (cart?.checkoutUrl) {
        void Linking.openURL(cart.checkoutUrl);
      }
    },
  };
}
