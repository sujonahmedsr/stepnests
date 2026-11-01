import { Link } from "react-router";

import { buildPageMeta } from "~/lib/page-meta";
import { loadStorePolicies } from "~/lib/store-policies";
import { storefrontClientContext } from "~/lib/storefront";
import {
  getOriginFromRootMatch,
  getShopNameFromRootMatch,
} from "~/lib/storefront-shop";

import type { Route } from "./+types/policies";

export function meta({ matches }: Route.MetaArgs) {
  return buildPageMeta({
    page: "Store policies",
    description:
      "Read the current privacy, refund, shipping, and terms policies for StepNests.",
    shopName: getShopNameFromRootMatch(matches[0]),
    origin: getOriginFromRootMatch(matches[0]),
    pathname: "/policies",
  });
}

export async function loader({ context }: Route.LoaderArgs) {
  const storefrontClient = context.get(storefrontClientContext);
  return { policies: await loadStorePolicies(storefrontClient) };
}

export default function PoliciesRoute({ loaderData }: Route.ComponentProps) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="utility-page max-w-page px-margin mx-auto w-full flex-1"
    >
      <div className="utility-page__copy">
        <p className="eyebrow">Customer care</p>
        <h1 className="type-display mt-3">Store policies</h1>
        <p className="text-on-surface-secondary mt-4">
          The latest store policies are provided by Shopify.
        </p>
        {loaderData.policies.length > 0 ? (
          <ul role="list" className="mt-8 grid gap-2">
            {loaderData.policies.map((policy) => (
              <li key={policy.id}>
                <Link
                  to={`/policies/${policy.handle}`}
                  className="border-border text-on-surface focus-visible:outline-accent flex min-h-touch-target items-center justify-between border-b py-3 no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  {policy.title}
                  <span aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-8" role="status">
            Store policies are not available yet.
          </p>
        )}
      </div>
    </main>
  );
}
