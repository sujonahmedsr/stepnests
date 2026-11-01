import { FootwearSizeTable } from "~/components/FootwearSizeTable";
import { buildPageMeta } from "~/lib/page-meta";
import {
  getOriginFromRootMatch,
  getShopNameFromRootMatch,
} from "~/lib/storefront-shop";

import type { Route } from "./+types/size-guide";

export function meta({ matches }: Route.MetaArgs) {
  return buildPageMeta({
    page: "Size guide",
    description:
      "Use the StepNests footwear size guide to compare EU shoe sizes with approximate foot lengths in centimetres.",
    shopName: getShopNameFromRootMatch(matches[0]),
    origin: getOriginFromRootMatch(matches[0]),
    pathname: "/size-guide",
  });
}

export default function SizeGuideRoute() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="utility-page max-w-page px-margin mx-auto w-full flex-1"
    >
      <div className="utility-page__copy">
        <p className="eyebrow">Find your fit</p>
        <h1 className="type-display mt-3">Footwear size guide</h1>
        <p className="text-on-surface-secondary mt-4">
          Measure from the back of your heel to the tip of your longest toe
          while standing. Lengths are approximate; product sizing can vary by
          style.
        </p>
        <FootwearSizeTable />
        <p className="text-on-surface-secondary mt-5 text-sm">
          If you are between sizes, check the product packaging or contact
          customer care before ordering.
        </p>
      </div>
    </main>
  );
}
