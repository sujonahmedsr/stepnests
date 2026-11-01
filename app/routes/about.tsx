import { Link } from "react-router";

import { buildPageMeta } from "~/lib/page-meta";
import {
  getOriginFromRootMatch,
  getShopNameFromRootMatch,
} from "~/lib/storefront-shop";

import type { Route } from "./+types/about";

export function meta({ matches }: Route.MetaArgs) {
  return buildPageMeta({
    page: "About",
    description:
      "Meet StepNests: a considered footwear collection for sport, walking, casual days, and outdoor plans.",
    shopName: getShopNameFromRootMatch(matches[0]),
    origin: getOriginFromRootMatch(matches[0]),
    pathname: "/about",
  });
}

export default function AboutRoute() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="utility-page max-w-page px-margin mx-auto w-full flex-1"
    >
      <div className="utility-page__copy">
        <p className="eyebrow">Our point of view</p>
        <h1 className="type-display mt-3">Footwear for the everyday.</h1>
        <p className="type-body mt-5">
          StepNests brings sport, walking, casual, and outdoor footwear together
          in one considered collection. The right pair should feel at home on
          the commute, on the move, and wherever the rest of the day leads.
        </p>
        <p className="type-body mt-4">
          Explore practical shapes, familiar fits, and versatile styles selected
          to make getting dressed a little simpler.
        </p>
        <Link
          to="/collections"
          className="button-primary min-h-touch-target mt-8 inline-flex items-center justify-center px-6 no-underline"
        >
          Explore the collection
        </Link>
      </div>
    </main>
  );
}
