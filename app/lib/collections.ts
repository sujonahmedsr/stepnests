import { Cache, gql, type StorefrontApi } from "@shopify/hydrogen";

import { COLLECTION_CARD_FRAGMENT } from "~/components/CollectionCard";
import type { RequestStorefrontClient } from "~/lib/storefront";

export const COLLECTIONS_PAGE_SIZE = 12;

export const COLLECTIONS_QUERY = gql(
  `
    query CollectionsList($first: Int!, $after: String) {
      collections(first: $first, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          ...CollectionCard
        }
      }
    }
  `,
  [COLLECTION_CARD_FRAGMENT],
);

type CollectionsQueryVariables = StorefrontApi.VariablesOf<typeof COLLECTIONS_QUERY>;

export async function loadCollectionsPage({
  storefrontClient,
  request,
}: {
  storefrontClient: RequestStorefrontClient;
  request: Request;
}) {
  const url = new URL(request.url);
  const variables: CollectionsQueryVariables = {
    first: COLLECTIONS_PAGE_SIZE,
    after: url.searchParams.get("after") || null,
  };

  const { data } = await storefrontClient.graphql(COLLECTIONS_QUERY, {
    variables,
    cache: Cache.long(),
  });

  return {
    collections: data?.collections ?? {
      nodes: [],
      pageInfo: { hasNextPage: false, endCursor: null },
    },
    origin: url.origin,
  };
}
