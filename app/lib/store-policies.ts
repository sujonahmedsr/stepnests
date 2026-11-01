import { Cache, gql, type StorefrontApi } from "@shopify/hydrogen";

import type { RequestStorefrontClient } from "~/lib/storefront";

const STORE_POLICY_FRAGMENT = gql(`
  fragment StorePolicyFields on ShopPolicy {
    body
    handle
    id
    title
    url
  }
`);

const STORE_POLICIES_QUERY = gql(
  `
    query StorePolicies($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
      shop {
        privacyPolicy {
          ...StorePolicyFields
        }
        refundPolicy {
          ...StorePolicyFields
        }
        shippingPolicy {
          ...StorePolicyFields
        }
        termsOfService {
          ...StorePolicyFields
        }
      }
    }
  `,
  [STORE_POLICY_FRAGMENT],
);

export type StorePolicy = NonNullable<
  StorefrontApi.ResultOf<typeof STORE_POLICIES_QUERY>["shop"]["privacyPolicy"]
>;

export async function loadStorePolicies(
  storefrontClient: RequestStorefrontClient,
): Promise<StorePolicy[]> {
  const { data, errors } = await storefrontClient.graphql(
    STORE_POLICIES_QUERY,
    {
      cache: Cache.long(),
    },
  );

  if (errors?.length) {
    throw new Response("Store policies are unavailable", { status: 502 });
  }
  if (!data?.shop) {
    throw new Response("Store policies are unavailable", { status: 502 });
  }

  return [
    data.shop.privacyPolicy,
    data.shop.refundPolicy,
    data.shop.shippingPolicy,
    data.shop.termsOfService,
  ].filter((policy): policy is StorePolicy => policy !== null);
}
