import { formatPageTitle } from "~/lib/storefront-shop";

type PageMetaInput = {
  page: string;
  description: string;
  shopName: string;
  origin: string | null;
  pathname: string;
};

export function buildPageMeta({
  page,
  description,
  shopName,
  origin,
  pathname,
}: PageMetaInput) {
  const title = formatPageTitle(page, shopName);

  return [
    { title },
    { name: "description", content: description },
    ...(origin
      ? [
          {
            tagName: "link" as const,
            rel: "canonical",
            href: `${origin}${pathname}`,
          },
        ]
      : []),
    { property: "og:type", content: "website" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { name: "twitter:card", content: "summary" },
  ];
}
