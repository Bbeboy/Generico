import type { Product } from '@/domain/product';

import { IMAGE_FRAGMENT, MONEY_FRAGMENT, VARIANT_FRAGMENT } from '../fragments';
import { storefrontFetch } from '../storefront';

const PRODUCTS_QUERY = /* GraphQL */ `
  query Products($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          handle
          title
          description
          featuredImage {
            ...ImageFields
          }
          priceRange {
            minVariantPrice {
              ...MoneyFields
            }
            maxVariantPrice {
              ...MoneyFields
            }
          }
          variants(first: 20) {
            edges {
              node {
                ...VariantFields
              }
            }
          }
        }
      }
    }
  }
  ${IMAGE_FRAGMENT}
  ${MONEY_FRAGMENT}
  ${VARIANT_FRAGMENT}
`;

type RawMoney = {
  amount: string;
  currencyCode: string;
};

type RawImage = {
  url: string;
  altText: string | null;
};

type RawProductNode = {
  id: string;
  handle: string;
  title: string;
  description: string;
  featuredImage: RawImage | null;
  priceRange: {
    minVariantPrice: RawMoney;
    maxVariantPrice: RawMoney;
  };
  variants: {
    edges: {
      node: {
        id: string;
        title: string;
        availableForSale: boolean;
        price: RawMoney;
        image: RawImage | null;
      };
    }[];
  };
};

export type ProductsPage = {
  products: Product[];
  hasNextPage: boolean;
  endCursor: string | null;
};

function toDomainProduct(raw: RawProductNode): Product {
  return {
    id: raw.id,
    handle: raw.handle,
    title: raw.title,
    description: raw.description,
    featuredImage: raw.featuredImage,
    variants: raw.variants.edges.map(({ node }) => node),
    priceRange: raw.priceRange,
  };
}

export async function fetchProducts(first = 20, after?: string): Promise<ProductsPage> {
  const data = await storefrontFetch<{
    products: {
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string | null;
      };
      edges: { node: RawProductNode }[];
    };
  }>(PRODUCTS_QUERY, { first, after });

  return {
    products: data.products.edges.map(({ node }) => toDomainProduct(node)),
    hasNextPage: data.products.pageInfo.hasNextPage,
    endCursor: data.products.pageInfo.endCursor,
  };
}
