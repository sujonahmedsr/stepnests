import { getShopNameFromRootMatch } from "~/lib/storefront-shop";

import type { Route } from "./+types/catchall";

export function meta({ matches }: Route.MetaArgs) {
  return [
    { title: `Not found · ${getShopNameFromRootMatch(matches[0])}` },
    { name: "robots", content: "noindex" },
  ];
}

export function loader() {
  throw new Response("Not Found", { status: 404 });
}

export default function CatchAllRoute() {
  return null;
}
