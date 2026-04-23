import type { Money } from './money';
import type { ProductVariant } from './product';

export type CartLine = {
  id: string;
  quantity: number;
  merchandise: ProductVariant & {
    productTitle: string;
    productHandle: string;
  };
  cost: {
    totalAmount: Money;
  };
};

export type Cart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  lines: CartLine[];
  cost: {
    subtotalAmount: Money;
    totalAmount: Money;
    totalTaxAmount: Money | null;
  };
};

export type UserError = {
  field: string[] | null;
  message: string;
};
