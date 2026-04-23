import { ENV } from '@/lib/env';

type GraphQLResponse<T> = {
  data?: T;
  errors?: { message: string; path?: string[] }[];
};

export class StorefrontError extends Error {
  constructor(
    message: string,
    public errors?: GraphQLResponse<unknown>['errors'],
  ) {
    super(message);
    this.name = 'StorefrontError';
  }
}

export async function storefrontFetch<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const endpoint = `https://${ENV.SHOPIFY_DOMAIN}/api/${ENV.SHOPIFY_API_VERSION}/graphql.json`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': ENV.SHOPIFY_STOREFRONT_TOKEN,
      Accept: 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new StorefrontError(`HTTP ${response.status}: ${response.statusText}`);
  }

  const json = (await response.json()) as GraphQLResponse<T>;

  if (json.errors?.length) {
    throw new StorefrontError(json.errors.map((error) => error.message).join('; '), json.errors);
  }

  if (!json.data) {
    throw new StorefrontError('Empty response data');
  }

  return json.data;
}
