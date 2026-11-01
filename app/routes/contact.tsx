import { Link } from "react-router";

import { buildPageMeta } from "~/lib/page-meta";
import { envContext } from "~/lib/env";
import {
  getOriginFromRootMatch,
  getShopNameFromRootMatch,
} from "~/lib/storefront-shop";

import type { Route } from "./+types/contact";

export function meta({ matches }: Route.MetaArgs) {
  return buildPageMeta({
    page: "Contact",
    description:
      "Contact StepNests about an order, delivery, or finding the right footwear size.",
    shopName: getShopNameFromRootMatch(matches[0]),
    origin: getOriginFromRootMatch(matches[0]),
    pathname: "/contact",
  });
}

export function loader({ context }: Route.LoaderArgs) {
  const configuredEmail = context.get(envContext).PUBLIC_CONTACT_EMAIL?.trim();
  if (configuredEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(configuredEmail)) {
    throw new Error("PUBLIC_CONTACT_EMAIL must be a valid email address.");
  }
  return { contactEmail: configuredEmail || null };
}

export default function ContactRoute({ loaderData }: Route.ComponentProps) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="utility-page max-w-page px-margin mx-auto w-full flex-1"
    >
      <div className="utility-page__copy">
        <p className="eyebrow">Customer care</p>
        <h1 className="type-display mt-3">How can we help?</h1>
        <p className="type-body mt-5">
          For help with an order or delivery, reply to the order confirmation
          email so our team can find the right details. For general questions,
          use the customer-care email below.
        </p>
        {loaderData.contactEmail ? (
          <p className="mt-4">
            <a
              href={`mailto:${loaderData.contactEmail}`}
              className="text-accent-on-light min-h-touch-target inline-flex items-center underline underline-offset-4"
            >
              {loaderData.contactEmail}
            </a>
          </p>
        ) : null}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/size-guide"
            className="button-secondary min-h-touch-target inline-flex items-center justify-center px-5 no-underline"
          >
            View size guide
          </Link>
          <Link
            to="/policies"
            className="button-secondary min-h-touch-target inline-flex items-center justify-center px-5 no-underline"
          >
            Shipping and store policies
          </Link>
        </div>
      </div>
    </main>
  );
}
