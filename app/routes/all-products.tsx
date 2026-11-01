import { Link } from "react-router";

import { ProductCard } from "~/components/ProductCard";
import { PRICE_RANGES } from "~/lib/navigation";
import { loadSearchPage, SEARCH_PAGE_SIZE } from "~/lib/search";
import { storefrontClientContext } from "~/lib/storefront";
import {
  formatPageTitle,
  getShopNameFromRootMatch,
} from "~/lib/storefront-shop";

import type { Route } from "./+types/all-products";

export function meta({ data, matches }: Route.MetaArgs) {
  const shopName = getShopNameFromRootMatch(matches[0]);
  const description = `Browse every available pair from ${shopName}, with prices shown in Bangladeshi taka.`;
  return [
    { title: formatPageTitle("All products", shopName) },
    { name: "description", content: description },
    ...(data?.origin
      ? [
          {
            tagName: "link" as const,
            rel: "canonical",
            href: `${data.origin}/collections/all`,
          },
        ]
      : []),
    { property: "og:type", content: "website" },
    {
      property: "og:title",
      content: formatPageTitle("All products", shopName),
    },
    { property: "og:description", content: description },
    { name: "twitter:card", content: "summary" },
  ];
}

export async function loader({ context, request }: Route.LoaderArgs) {
  const storefrontClient = context.get(storefrontClientContext);
  const url = new URL(request.url);
  const price = url.searchParams.get("price");
  const range = PRICE_RANGES.find((candidate) => candidate.id === price);
  const searchUrl = new URL(request.url);
  searchUrl.searchParams.set("q", "*");
  if (range?.minPrice !== undefined) {
    searchUrl.searchParams.set("filter.v.price.gte", String(range.minPrice));
  }
  if (range?.maxPrice !== undefined) {
    searchUrl.searchParams.set("filter.v.price.lte", String(range.maxPrice));
  }
  const data = await loadSearchPage({
    storefrontClient,
    request: new Request(searchUrl, { headers: request.headers }),
  });
  if (!data.performed)
    throw new Response("Products unavailable", { status: 502 });

  return {
    products: data.products,
    pageInfo: data.pageInfo,
    totalCount: data.totalCount,
    price: range?.id ?? null,
    search: url.searchParams.toString(),
    origin: url.origin,
  } satisfies {
    products: typeof data.products;
    pageInfo: typeof data.pageInfo;
    totalCount: number;
    price: string | null;
    search: string;
    origin: string;
  };
}

export default function AllProductsRoute({ loaderData }: Route.ComponentProps) {
  const { products, pageInfo, totalCount, price, search } = loaderData;
  const nextParams = new URLSearchParams(search);
  if (pageInfo.endCursor) nextParams.set("after", pageInfo.endCursor);

  return (
    <main
      className="collection-page max-w-page px-margin mx-auto w-full flex-1"
      id="main-content"
      tabIndex={-1}
    >
      <header className="collection-page-header mb-8">
        <p className="eyebrow mb-3">StepNests footwear</p>
        <h1 className="type-display text-on-surface">All products</h1>
        <p className="text-on-surface-secondary mt-3 max-w-prose">
          {totalCount} pairs for every pace, plan, and part of your day.
        </p>
      </header>

      <nav aria-label="Filter products by price" className="mb-8">
        <ul className="flex flex-wrap gap-2" role="list">
          <li>
            <Link
              to="/collections/all"
              aria-current={price === null ? "page" : undefined}
              className={`price-range-link ${price === null ? "is-selected" : ""}`}
            >
              All products
            </Link>
          </li>
          {PRICE_RANGES.map((range) => (
            <li key={range.id}>
              <Link
                to={`/collections/all?price=${range.id}`}
                aria-current={price === range.id ? "page" : undefined}
                className={`price-range-link ${price === range.id ? "is-selected" : ""}`}
              >
                {range.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {products.length > 0 ? (
        <ul
          role="list"
          className="product-grid-cards grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
        >
          {products.map((product) => (
            <li key={product.handle}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="border-border bg-surface-secondary rounded-card border p-8 text-center">
          <h2 className="type-heading-md text-on-surface">
            No pairs in this range
          </h2>
          <p className="text-on-surface-secondary mt-2 text-sm">
            Try another price range to find your next pair.
          </p>
        </div>
      )}

      {pageInfo.hasNextPage && pageInfo.endCursor ? (
        <div className="mt-10 flex justify-center">
          <Link
            className="button-secondary min-h-touch-target inline-flex items-center justify-center px-6"
            to={`/collections/all?${nextParams}`}
          >
            View more products
          </Link>
        </div>
      ) : null}
    </main>
  );
}
