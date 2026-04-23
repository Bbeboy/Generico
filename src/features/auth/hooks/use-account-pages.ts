import { useCallback } from 'react';
import * as WebBrowser from 'expo-web-browser';

import { ENV } from '@/lib/env';

export function useAccountPages() {
  const base = ENV.SHOPIFY_ACCOUNT_URL;

  const openAccount = useCallback(async () => {
    await WebBrowser.openBrowserAsync(base);
  }, [base]);

  const openLogin = useCallback(async () => {
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
