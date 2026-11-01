import { Link } from "react-router";

import { buildPageMeta } from "~/lib/page-meta";
import { loadStorePolicies } from "~/lib/store-policies";
import { storefrontClientContext } from "~/lib/storefront";
import {
  getOriginFromRootMatch,
  getShopNameFromRootMatch,
} from "~/lib/storefront-shop";

import type { Route } from "./+types/policy";

export function meta({ data, matches }: Route.MetaArgs) {
  const shopName = getShopNameFromRootMatch(matches[0]);
  const policyTitle = data?.policy.title ?? "Store policy";

  return buildPageMeta({
    page: policyTitle,
    description: `Read the ${policyTitle.toLowerCase()} for ${shopName}.`,
    shopName,
    origin: getOriginFromRootMatch(matches[0]),
    pathname: data?.policy.handle
      ? `/policies/${data.policy.handle}`
      : "/policies",
  });
}

export async function loader({ context, params }: Route.LoaderArgs) {
  const handle = params.handle;
  if (!handle) throw new Response("Not Found", { status: 404 });

  const storefrontClient = context.get(storefrontClientContext);
  const policies = await loadStorePolicies(storefrontClient);
  const policy = policies.find((candidate) => candidate.handle === handle);
  if (!policy) throw new Response("Policy not found", { status: 404 });

  return { policy };
}

export default function PolicyRoute({ loaderData }: Route.ComponentProps) {
  const { policy } = loaderData;

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="utility-page max-w-page px-margin mx-auto w-full flex-1"
    >
      <div className="utility-page__copy">
        <p className="eyebrow">Store policy</p>
        <h1 className="type-display mt-3">{policy.title}</h1>
        <div
          className="policy-content mt-8"
          dangerouslySetInnerHTML={{ __html: policy.body }}
        />
        <Link
          to="/policies"
          className="text-accent-on-light min-h-touch-target mt-8 inline-flex items-center underline underline-offset-4"
        >
          All store policies
        </Link>
      </div>
    </main>
  );
}
