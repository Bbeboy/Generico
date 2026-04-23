import type { Cart, UserError } from '@/domain/cart';

import { CART_FRAGMENT } from '../fragments';
import { toDomainCart } from '../queries/cart';
import { storefrontFetch } from '../storefront';

export type CartLineInput = {
  merchandiseId: string;
  quantity: number;
};

export type CartLineUpdateInput = {
  id: string;
  quantity: number;
};

export class CartUserError extends Error {
  constructor(public userErrors: UserError[]) {
    super(userErrors.map((error) => error.message).join('; '));
    this.name = 'CartUserError';
  }
}

function throwIfUserErrors(userErrors: UserError[]): void {
  if (userErrors.length > 0) {
    throw new CartUserError(userErrors);
  }
}

const CART_CREATE = /* GraphQL */ `
  mutation CartCreate($lines: [CartLineInput!]!) {
    cartCreate(input: { lines: $lines }) {
      cart {
        ...CartFields
      }
      userErrors {
        field
        message
      }
    }
  }
  ${CART_FRAGMENT}
`;

export async function cartCreate(lines: CartLineInput[]): Promise<Cart> {
  const data = await storefrontFetch<{
    cartCreate: {
      cart: Parameters<typeof toDomainCart>[0] | null;
      userErrors: UserError[];
    };
  }>(CART_CREATE, { lines });

  throwIfUserErrors(data.cartCreate.userErrors);
  if (!data.cartCreate.cart) {
    throw new Error('CART_NOT_FOUND');
  }

  return toDomainCart(data.cartCreate.cart);
}

const CART_LINES_ADD = /* GraphQL */ `
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        ...CartFields
      }
      userErrors {
        field
        message
      }
    }
  }
  ${CART_FRAGMENT}
`;

export async function cartLinesAdd(cartId: string, lines: CartLineInput[]): Promise<Cart> {
  const data = await storefrontFetch<{
    cartLinesAdd: {
      cart: Parameters<typeof toDomainCart>[0] | null;
      userErrors: UserError[];
    };
  }>(CART_LINES_ADD, { cartId, lines });

  throwIfUserErrors(data.cartLinesAdd.userErrors);
  if (!data.cartLinesAdd.cart) {
    throw new Error('CART_NOT_FOUND');
  }

  return toDomainCart(data.cartLinesAdd.cart);
}

const CART_LINES_UPDATE = /* GraphQL */ `
  mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart {
        ...CartFields
      }
      userErrors {
        field
        message
      }
    }
  }
  ${CART_FRAGMENT}
`;

export async function cartLinesUpdate(cartId: string, lines: CartLineUpdateInput[]): Promise<Cart> {
  const data = await storefrontFetch<{
    cartLinesUpdate: {
      cart: Parameters<typeof toDomainCart>[0] | null;
      userErrors: UserError[];
    };
  }>(CART_LINES_UPDATE, { cartId, lines });

  throwIfUserErrors(data.cartLinesUpdate.userErrors);
  if (!data.cartLinesUpdate.cart) {
    throw new Error('CART_NOT_FOUND');
  }

  return toDomainCart(data.cartLinesUpdate.cart);
}

const CART_LINES_REMOVE = /* GraphQL */ `
  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart {
        ...CartFields
      }
      userErrors {
        field
        message
      }
    }
  }
  ${CART_FRAGMENT}
`;

export async function cartLinesRemove(cartId: string, lineIds: string[]): Promise<Cart> {
  const data = await storefrontFetch<{
    cartLinesRemove: {
      cart: Parameters<typeof toDomainCart>[0] | null;
      userErrors: UserError[];
    };
  }>(CART_LINES_REMOVE, { cartId, lineIds });

  throwIfUserErrors(data.cartLinesRemove.userErrors);
  if (!data.cartLinesRemove.cart) {
    throw new Error('CART_NOT_FOUND');
  }

  return toDomainCart(data.cartLinesRemove.cart);
}
