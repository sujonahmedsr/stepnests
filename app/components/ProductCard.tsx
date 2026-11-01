import { gql, type StorefrontApi } from "@shopify/hydrogen";
import { Link } from "react-router";

import { compareMoney, formatPrice } from "~/lib/money";
import { shopifyImageSrcSet, shopifyImageUrl } from "~/lib/shopify-image";

export const PRODUCT_CARD_FRAGMENT = gql(`
  fragment ProductCard on Product {
    handle
    title
    tags
    options {
      name
      optionValues {
        name
      }
    }
    featuredImage {
      url
      altText
      width
      height
    }
    images(first: 2) {
      nodes {
        url
        altText
      }
    }
    availableForSale
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    compareAtPriceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
  }
`);

const PRODUCT_CARD_SHAPE_QUERY = gql(
  `query ProductCardShape { products(first: 1) { nodes { ...ProductCard } } }`,
  [PRODUCT_CARD_FRAGMENT],
);

export type ProductCardData = StorefrontApi.ResultOf<
  typeof PRODUCT_CARD_SHAPE_QUERY
>["products"]["nodes"][number];

type ProductCardProps = {
  product: ProductCardData;
};

export function ProductCard({ product }: ProductCardProps) {
  const primaryImage = product.featuredImage ?? product.images.nodes[0] ?? null;
  const hoverImage = product.images.nodes[1] ?? null;
  const price = product.priceRange.minVariantPrice;
  const compareAt = product.compareAtPriceRange.minVariantPrice;
  const onSale = compareMoney(compareAt, price) > 0;
  const isNew = product.tags.some((tag) => {
    const normalized = tag.trim().toLowerCase().replace(/[-_]+/g, " ");
    return normalized === "new" || normalized === "new arrival" || normalized === "new arrivals";
  });
  const colorCount =
    product.options.find(({ name }) => /^(color|colour)$/i.test(name.trim()))?.optionValues.length ??
    0;
  const badge = !product.availableForSale ? "Sold out" : onSale ? "Sale" : isNew ? "New" : null;
  const badgeClass = !product.availableForSale
    ? "badge-soldout"
    : onSale
      ? "badge-sale"
      : "badge-accent";

  return (
    <article
      className="product-card group card flex flex-col gap-3"
      aria-label={product.title}
      data-testid="product-card"
    >
      <div className="product-card__media rounded-card bg-surface-secondary relative block overflow-hidden">
        {primaryImage ? (
          <Link
            to={`/products/${product.handle}`}
            aria-label={`View ${product.title}`}
            className="product-card__image-link absolute inset-0"
          >
            <img
              src={shopifyImageUrl(primaryImage.url, { width: 640 })}
              srcSet={shopifyImageSrcSet(primaryImage.url, [320, 480, 640, 960])}
              sizes="(min-width: 100rem) 20rem, (min-width: 64rem) 25vw, (min-width: 48rem) 33vw, 50vw"
              alt={primaryImage.altText ?? product.title}
              className="product-card__image h-full w-full object-contain"
              loading="lazy"
              fetchPriority="auto"
            />
          </Link>
        ) : null}
        {hoverImage ? (
          <div className="product-card__hover-image pointer-events-none absolute inset-0 opacity-0 motion-safe:transition-opacity motion-safe:duration-300 motion-safe:group-hover:opacity-100">
            <img
              src={shopifyImageUrl(hoverImage.url, { width: 640 })}
              srcSet={shopifyImageSrcSet(hoverImage.url, [320, 480, 640, 960])}
              sizes="(min-width: 100rem) 20rem, (min-width: 64rem) 25vw, (min-width: 48rem) 33vw, 50vw"
              alt={hoverImage.altText ?? ""}
              className="product-card__image h-full w-full object-contain"
              loading="lazy"
            />
          </div>
        ) : null}
        {badge ? (
          <span
            className={`${badgeClass} absolute start-2 top-2 inline-flex items-center rounded-full font-medium`}
          >
            {badge}
          </span>
        ) : null}
      </div>
      <div className="product-card__details flex flex-col gap-1 text-left">
        <h3 className="type-body-sm text-on-surface line-clamp-2 font-medium">
          <Link to={`/products/${product.handle}`} className="card-link text-on-surface">
            {product.title}
          </Link>
        </h3>
        <div className="inline-flex flex-wrap items-baseline gap-2 text-sm">
          {onSale ? (
            <>
              <span className="text-sale font-medium">
                <span className="sr-only">Sale price: </span>
                {formatPrice(price)}
              </span>
              <s className="text-compare text-sm">
                <span className="sr-only">Regular price: </span>
                {formatPrice(compareAt)}
              </s>
            </>
          ) : (
            <span className="text-on-surface font-medium">
              <span className="sr-only">Price: </span>
              {formatPrice(price)}
            </span>
          )}
        </div>
        {colorCount > 1 ? (
          <p className="text-on-surface-secondary text-xs">{colorCount} colors</p>
        ) : null}
      </div>
    </article>
  );
}
