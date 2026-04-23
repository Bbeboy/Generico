import type { Cart } from '@/domain/cart';

import { CART_FRAGMENT } from '../fragments';
import { storefrontFetch } from '../storefront';

const CART_QUERY = /* GraphQL */ `
  query Cart($id: ID!) {
    cart(id: $id) {
      ...CartFields
    }
  }
  ${CART_FRAGMENT}
`;

type RawMoney = {
  amount: string;
  currencyCode: string;
};

type RawImage = {
  url: string;
  altText: string | null;
};

type RawCart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: {
    subtotalAmount: RawMoney;
    totalAmount: RawMoney;
    totalTaxAmount: RawMoney | null;
  };
  lines: {
    edges: {
      node: {
        id: string;
        quantity: number;
        cost: {
          totalAmount: RawMoney;
        };
        merchandise: {
          id: string;
          title: string;
          availableForSale: boolean;
          price: RawMoney;
          image: RawImage | null;
          product: {
            title: string;
            handle: string;
          };
        };
      };
    }[];
  };
};

export function toDomainCart(raw: RawCart): Cart {
  return {
    id: raw.id,
    checkoutUrl: raw.checkoutUrl,
    totalQuantity: raw.totalQuantity,
    lines: raw.lines.edges.map(({ node }) => ({
      id: node.id,
      quantity: node.quantity,
      merchandise: {
        id: node.merchandise.id,
        title: node.merchandise.title,
        price: node.merchandise.price,
        availableForSale: node.merchandise.availableForSale,
        image: node.merchandise.image,
        productTitle: node.merchandise.product.title,
        productHandle: node.merchandise.product.handle,
      },
      cost: node.cost,
    })),
    cost: raw.cost,
  };
}

export async function fetchCart(cartId: string): Promise<Cart | null> {
  const data = await storefrontFetch<{ cart: RawCart | null }>(CART_QUERY, {
    id: cartId,
  });

  return data.cart ? toDomainCart(data.cart) : null;
}
