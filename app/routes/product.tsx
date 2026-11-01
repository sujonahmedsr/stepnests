import {
  AnalyticsEvent,
  Cache,
  buildProductSelectionSearchParams,
  canAddToCart,
  getSelectedProductOptions,
  gql,
  type SelectedOption,
} from "@shopify/hydrogen";
import { ShopPayButton } from "@shopify/hydrogen/react";
import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router";

import { ProductCard, PRODUCT_CARD_FRAGMENT } from "~/components/ProductCard";
import { FootwearSizeTable } from "~/components/FootwearSizeTable";
import {
  closeDialogFallback,
  openCartDrawer,
  openDialogFallback,
} from "~/lib/cart-drawer";
import { formatPrice, salePercent } from "~/lib/money";
import { ProductProvider, useProductForm } from "~/lib/product";
import { shopifyImageSrcSet, shopifyImageUrl } from "~/lib/shopify-image";
import { storefrontClientContext } from "~/lib/storefront";
import {
  formatPageTitle,
  getShopNameFromRootMatch,
} from "~/lib/storefront-shop";

import type { Route } from "./+types/product";

const PRODUCT_VARIANT_FRAGMENT = gql(`
  fragment ProductVariantFields on ProductVariant {
    id
    title
    availableForSale
    quantityAvailable
    selectedOptions {
      name
      value
    }
    price {
      amount
      currencyCode
    }
    compareAtPrice {
      amount
      currencyCode
    }
    image {
      id
      url
      altText
      width
      height
    }
    product {
      title
      handle
    }
    sku
  }
`);

const PRODUCT_QUERY = gql(
  `
    query ProductPage(
      $country: CountryCode
      $language: LanguageCode
      $handle: String!
      $selectedOptions: [SelectedOptionInput!]!
    ) @inContext(country: $country, language: $language) {
      product(handle: $handle) {
        id
        handle
        title
        vendor
        availableForSale
        description
        descriptionHtml
        requiresSellingPlan
        encodedVariantExistence
        encodedVariantAvailability
        featuredImage {
          id
          url
          altText
          width
          height
        }
        images(first: 8) {
          nodes {
            id
            url
            altText
            width
            height
          }
        }
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
          maxVariantPrice {
            amount
            currencyCode
          }
        }
        options {
          name
          optionValues {
            name
            firstSelectableVariant {
              ...ProductVariantFields
            }
            swatch {
              color
              image {
                previewImage {
                  url
                }
              }
            }
          }
        }
        selectedOrFirstAvailableVariant(
          selectedOptions: $selectedOptions
          ignoreUnknownOptions: true
          caseInsensitiveMatch: true
        ) {
          ...ProductVariantFields
        }
        adjacentVariants(
          selectedOptions: $selectedOptions
          ignoreUnknownOptions: true
          caseInsensitiveMatch: true
        ) {
          ...ProductVariantFields
        }
      }
    }
  `,
  [PRODUCT_VARIANT_FRAGMENT],
);

const PRODUCT_RECOMMENDATIONS_QUERY = gql(
  `
    query ProductRecommendations(
      $country: CountryCode
      $language: LanguageCode
      $productId: ID!
    ) @inContext(country: $country, language: $language) {
      productRecommendations(productId: $productId) {
        ...ProductCard
      }
    }
  `,
  [PRODUCT_CARD_FRAGMENT],
);

export function meta({ data, matches }: Route.MetaArgs) {
  const shopName = getShopNameFromRootMatch(matches[0]);
  const product = data?.product;
  if (!product) return [{ title: formatPageTitle("Product", shopName) }];

  const description =
    product.description?.trim().slice(0, 160) ||
    `Discover ${product.title} at ${shopName}.`;
  const image = product.featuredImage?.url;
  const price = product.priceRange.minVariantPrice;

  return [
    { title: formatPageTitle(product.title, shopName) },
    { name: "description", content: description },
    {
      tagName: "link",
      rel: "canonical",
      href: `${data.origin}/products/${product.handle}`,
    },
    { property: "og:type", content: "product" },
    { property: "og:title", content: product.title },
    { property: "og:description", content: description },
    ...(image ? [{ property: "og:image", content: image }] : []),
    { property: "product:price:amount", content: price.amount },
    { property: "product:price:currency", content: price.currencyCode },
    {
      name: "twitter:card",
      content: image ? "summary_large_image" : "summary",
    },
  ];
}

export async function loader({ context, params, request }: Route.LoaderArgs) {
  const handle = params.handle;
  if (!handle) throw new Response("Not Found", { status: 404 });

  const storefrontClient = context.get(storefrontClientContext);
  const selectedOptions = getSelectedProductOptions({
    searchParams: new URL(request.url).searchParams,
  });
  const { data } = await storefrontClient.graphql(PRODUCT_QUERY, {
    variables: { handle, selectedOptions },
    cache: Cache.short(),
  });

  if (!data?.product) throw new Response("Not Found", { status: 404 });

  const recommendations = await storefrontClient.graphql(
    PRODUCT_RECOMMENDATIONS_QUERY,
    {
      variables: { productId: data.product.id },
      cache: Cache.long(),
    },
  );
  if (recommendations.errors?.length) {
    throw new Response("Product recommendations unavailable", { status: 502 });
  }

  return {
    product: data.product,
    relatedProducts: (recommendations.data?.productRecommendations ?? [])
      .filter((product) => product.handle !== data.product?.handle)
      .slice(0, 4),
    origin: new URL(request.url).origin,
  };
}

type ProductData = Route.ComponentProps["loaderData"]["product"];
type ProductVariant = NonNullable<
  ProductData["selectedOrFirstAvailableVariant"]
>;
type RelatedProduct =
  Route.ComponentProps["loaderData"]["relatedProducts"][number];

type ProductImage = {
  id?: string | null;
  url: string;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
};

type SwatchValue = {
  color?: string | null;
  imageUrl?: string | null;
};

function toRouterLocation(url: string) {
  return url;
}

function variantUrl(
  product: { handle: string; options: Array<{ name: string }> },
  selectedOptions: SelectedOption[],
  handle = product.handle,
  base: URLSearchParams = new URLSearchParams(),
) {
  const params = buildProductSelectionSearchParams({
    selectedOptions,
    optionNames: product.options.map((option) => option.name),
    base,
  });
  const query = params.toString();
  return `/products/${handle}${query ? `?${query}` : ""}`;
}

function buildSwatchLookup(product: ProductData) {
  const lookup = new Map<string, SwatchValue>();
  for (const option of product.options) {
    for (const value of option.optionValues) {
      const swatch = value.swatch;
      lookup.set(`${option.name}:${value.name}`, {
        color: swatch?.color ?? null,
        imageUrl: swatch?.image?.previewImage?.url ?? null,
      });
    }
  }
  return lookup;
}

function hasSwatchData(product: ProductData, optionName: string) {
  const option = product.options.find(
    (candidate) => candidate.name === optionName,
  );
  return Boolean(
    option?.optionValues.some(
      (value) => value.swatch?.color || value.swatch?.image?.previewImage?.url,
    ),
  );
}

function ProductViewedTracker({ product }: { product: ProductData }) {
  useEffect(() => {
    const selectedVariant = product.selectedOrFirstAvailableVariant;
    window.Shopify?.analytics?.publish(AnalyticsEvent.PRODUCT_VIEWED, {
      products: [
        {
          id: product.id,
          title: product.title,
          price: selectedVariant?.price ?? product.priceRange.minVariantPrice,
          vendor: product.vendor ?? "",
          variantId: selectedVariant?.id ?? product.id,
          variantTitle: selectedVariant?.title ?? product.title,
          quantity: 1,
          sku: selectedVariant?.sku,
        },
      ],
    });
  }, [product]);

  return null;
}

function useGalleryImages(
  product: ProductData,
  selectedVariant: ProductVariant | null,
) {
  return useMemo(() => {
    const images: ProductImage[] = [];
    const seen = new Set<string>();
    const addImage = (image: ProductImage | null | undefined) => {
      if (!image?.url || seen.has(image.url)) return;
      seen.add(image.url);
      images.push(image);
    };

    addImage(
      selectedVariant?.image ??
        product.featuredImage ??
        product.images.nodes[0],
    );
    for (const image of product.images.nodes) addImage(image);
    return images;
  }, [product, selectedVariant]);
}

function galleryDotClass(active: boolean) {
  if (active) return "bg-on-surface size-2 rounded-full";
  return "bg-on-surface/30 size-2 rounded-full";
}

function ProductGallery({
  product,
  selectedVariant,
}: {
  product: ProductData;
  selectedVariant: ProductVariant | null;
}) {
  const images = useGalleryImages(product, selectedVariant);
  const primaryImageUrl = images[0]?.url;
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex] ?? images[0];

  useEffect(() => setActiveIndex(0), [primaryImageUrl]);

  if (!activeImage) return null;

  return (
    <div className="product-gallery" data-testid="product-gallery">
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label={product.title}
        className="product-gallery__mobile relative"
      >
        <div
          data-product-gallery-track
          className="flex snap-x snap-mandatory overflow-x-auto"
          style={{ scrollbarWidth: "none" }}
          tabIndex={0}
          onScroll={(event) => {
            const track = event.currentTarget;
            if (track.clientWidth > 0) {
              setActiveIndex(Math.round(track.scrollLeft / track.clientWidth));
            }
          }}
        >
          {images.map((image, index) => (
            <div
              key={image.url}
              role="group"
              aria-roledescription="slide"
              aria-label={`Slide ${index + 1} of ${images.length}`}
              className="w-full shrink-0 snap-center"
            >
              <div className="bg-surface-secondary aspect-portrait overflow-hidden">
                <img
                  src={shopifyImageUrl(image.url, { width: 900 })}
                  srcSet={shopifyImageSrcSet(image.url, [480, 640, 900, 1200])}
                  sizes="100vw"
                  alt={image.altText ?? product.title}
                  width={image.width ?? undefined}
                  height={image.height ?? undefined}
                  className="h-full w-full object-contain"
                  loading={index === 0 ? "eager" : "lazy"}
                  fetchPriority={index === 0 ? "high" : "auto"}
                  data-testid={
                    index === 0 ? "product-gallery-image" : undefined
                  }
                />
              </div>
            </div>
          ))}
        </div>
        {images.length > 1 ? (
          <div className="absolute inset-x-0 bottom-4 z-10 flex items-center justify-center gap-3">
            <div
              data-slideshow-dots
              role="group"
              aria-label="Slideshow pagination"
              className="flex items-center justify-center gap-2"
            >
              {images.map((image, index) => (
                <span
                  key={image.url}
                  className={galleryDotClass(index === activeIndex)}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
      <div className="product-gallery__desktop">
        <div className="product-gallery__hero">
          <img
            src={shopifyImageUrl(activeImage.url, { width: 1200 })}
            srcSet={shopifyImageSrcSet(activeImage.url, [640, 900, 1200, 1600])}
            sizes="(min-width: 64rem) 60vw, 100vw"
            alt={activeImage.altText ?? product.title}
            width={activeImage.width ?? undefined}
            height={activeImage.height ?? undefined}
            loading="eager"
            fetchPriority="high"
            data-testid="product-gallery-image"
          />
        </div>
        {images.length > 1 ? (
          <div
            className="product-gallery__thumbnails"
            role="group"
            aria-label="Product images"
          >
            {images.map((image, index) => (
              <button
                key={image.url}
                type="button"
                className="product-gallery__thumbnail"
                aria-label={`Show image ${index + 1} of ${images.length}`}
                aria-pressed={index === activeIndex}
                onClick={() => setActiveIndex(index)}
              >
                <img
                  src={shopifyImageUrl(image.url, { width: 160 })}
                  alt=""
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function PriceBlock({
  product,
  selectedVariant,
}: {
  product: ProductData;
  selectedVariant: ProductVariant | null;
}) {
  const price = selectedVariant?.price ?? product.priceRange.minVariantPrice;
  const compareAt = selectedVariant?.compareAtPrice;
  const percent = salePercent(price, compareAt);

  return (
    <div className="mt-4" data-product-price>
      <div className="inline-flex flex-wrap items-baseline gap-2">
        {compareAt && percent ? (
          <>
            <span className="text-sale font-medium">
              <span className="sr-only">Sale price: </span>
              {formatPrice(price)}
            </span>
            <s className="text-compare text-sm">
              <span className="sr-only">Regular price: </span>
              {formatPrice(compareAt)}
            </s>
            <span
              className="text-sale text-sm font-medium"
              aria-label={`Save ${percent}%`}
            >
              (-{percent}%)
            </span>
          </>
        ) : (
          <span className="text-on-surface font-medium">
            <span className="sr-only">Price: </span>
            {formatPrice(price)}
          </span>
        )}
      </div>
    </div>
  );
}

function InventoryHint({
  selectedVariant,
}: {
  selectedVariant: ProductVariant | null;
}) {
  if (!selectedVariant) return null;
  if (!selectedVariant.availableForSale) {
    return (
      <div className="mt-3">
        <div className="flex items-center gap-2 text-sm" data-product-inventory>
          <span
            className="bg-critical inline-block h-2 w-2 shrink-0 rounded-full"
            aria-hidden="true"
          />
          <span className="text-critical font-medium">Out of stock</span>
        </div>
      </div>
    );
  }

  const quantity = selectedVariant.quantityAvailable;
  if (quantity == null || quantity > 5) return null;

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2 text-sm" data-product-inventory>
        <span
          className="bg-warning inline-block h-2 w-2 shrink-0 rounded-full"
          aria-hidden="true"
        />
        <span className="text-warning font-medium">
          Only {quantity} left in stock
        </span>
      </div>
    </div>
  );
}

// Mirrors React Router's own Link guard: a modified or non-primary click belongs to
// the browser (new tab, new window), so the href must stay in charge of it.
function isPlainActivation(event: MouseEvent<HTMLAnchorElement>) {
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.metaKey &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    (!event.currentTarget.target || event.currentTarget.target === "_self")
  );
}

const SIZE_GUIDE_DIALOG_ID = "product-size-guide";

function SizeGuideDialog() {
  return (
    <>
      <button
        type="button"
        commandfor={SIZE_GUIDE_DIALOG_ID}
        command="show-modal"
        className="text-on-surface-secondary min-h-touch-target underline underline-offset-4"
        aria-haspopup="dialog"
        aria-controls={SIZE_GUIDE_DIALOG_ID}
        onClick={() => openDialogFallback(SIZE_GUIDE_DIALOG_ID)}
      >
        Size guide
      </button>
      <dialog
        id={SIZE_GUIDE_DIALOG_ID}
        className="size-guide-dialog"
        closedby="any"
        aria-labelledby="product-size-guide-title"
        aria-describedby="product-size-guide-note"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Find your fit</p>
            <h2 id="product-size-guide-title" className="type-heading-md mt-2">
              Footwear size guide
            </h2>
          </div>
          <button
            type="button"
            commandfor={SIZE_GUIDE_DIALOG_ID}
            command="close"
            className="button-icon inline-flex h-11 w-11 shrink-0 items-center justify-center"
            aria-label="Close size guide"
            onClick={() => closeDialogFallback(SIZE_GUIDE_DIALOG_ID)}
          >
            <img
              src="/icons/icon-x.svg"
              alt=""
              aria-hidden="true"
              className="icon-size"
            />
          </button>
        </div>
        <p
          id="product-size-guide-note"
          className="text-on-surface-secondary my-4 text-sm"
        >
          Measure your foot from heel to longest toe while standing. Lengths are
          approximate; check the product packaging if you are between sizes.
        </p>
        <FootwearSizeTable />
        <Link
          to="/size-guide"
          className="text-accent-on-light min-h-touch-target mt-4 inline-flex items-center underline underline-offset-4"
          onClick={() => closeDialogFallback(SIZE_GUIDE_DIALOG_ID)}
        >
          View full size guide
        </Link>
      </dialog>
    </>
  );
}

function VariantOptions({ product }: { product: ProductData }) {
  const { options, register } = useProductForm();
  const swatches = useMemo(() => buildSwatchLookup(product), [product]);
  const location = useLocation();
  const baseParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );

  if (options.every((option) => option.values.length <= 1)) return null;

  return (
    <div className="swatch-buttons space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="eyebrow">Choose your options</p>
        {options.some((option) => /size/i.test(option.name)) ? (
          <SizeGuideDialog />
        ) : null}
      </div>
      {options.map((option) => {
        const selectedValue = option.values.find(
          (value) => value.selected,
        )?.name;
        const renderSwatches = hasSwatchData(product, option.name);
        const isColorOption = /colou?r/i.test(option.name);

        return (
          <fieldset key={option.name} className="space-y-2">
            <legend className="text-on-surface text-sm font-medium">
              {option.name}
              {selectedValue ? `: ${selectedValue}` : ""}
            </legend>
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label={option.name}
            >
              {option.values.map((variantOption) => {
                const valueName = variantOption.name;
                const registered = register("optionValue", {
                  optionName: option.name,
                  value: valueName,
                });
                const isCrossProduct = variantOption.handle !== product.handle;
                const linkTarget = variantUrl(
                  product,
                  variantOption.selectedOptions,
                  variantOption.handle,
                  baseParams,
                );
                const soldOut = !variantOption.available;
                const testId = isColorOption ? "color-swatch" : undefined;
                const swatch = renderSwatches
                  ? swatches.get(`${option.name}:${valueName}`)
                  : null;
                const swatchStyle = swatch?.imageUrl
                  ? {
                      backgroundImage: `url("${shopifyImageUrl(swatch.imageUrl, { width: 96 })}")`,
                    }
                  : { backgroundColor: swatch?.color ?? undefined };

                const className = renderSwatches
                  ? `min-h-touch-target min-w-touch-target relative inline-flex cursor-pointer items-center justify-center motion-safe:transition-transform motion-safe:active:scale-[0.93] ${soldOut ? "opacity-50" : ""}`
                  : `option-pill focus-visible:outline-accent motion-safe:transition-[color,background-color,border-color,transform] motion-safe:active:scale-[0.97] ${variantOption.selected ? "is-selected" : ""} ${soldOut ? "opacity-50" : ""}`;
                const content = renderSwatches ? (
                  <>
                    <span
                      className={`swatch-md border-border relative inline-flex items-center justify-center overflow-hidden rounded-full border-2 ring-offset-2 ${variantOption.selected ? "border-interactive" : ""}`}
                      style={swatchStyle}
                    >
                      {variantOption.selected ? (
                        <span className="swatch-scrim absolute inset-0" />
                      ) : null}
                      {soldOut ? (
                        <svg
                          className="absolute inset-0 h-full w-full"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          aria-hidden="true"
                        >
                          <line x1="4" y1="4" x2="20" y2="20" />
                        </svg>
                      ) : null}
                    </span>
                    <span className="sr-only">
                      {valueName}
                      {soldOut ? " (Sold out)" : ""}
                    </span>
                  </>
                ) : (
                  `${valueName}${soldOut ? " (Sold out)" : ""}`
                );

                if (!isCrossProduct && !variantOption.exists) {
                  return (
                    <button
                      key={valueName}
                      type="button"
                      disabled
                      className={className}
                      aria-label={renderSwatches ? valueName : undefined}
                      aria-pressed={variantOption.selected}
                      data-testid={testId}
                    >
                      {content}
                    </button>
                  );
                }

                // Every selectable value is an <a> whichever product it belongs to. The
                // activated value flips from cross-product to same-product after the
                // navigation, and a change of element type there would remount the
                // focused control and drop focus to <body>.
                return (
                  <Link
                    key={valueName}
                    to={toRouterLocation(linkTarget)}
                    replace={!isCrossProduct}
                    preventScrollReset
                    className={className}
                    aria-label={renderSwatches ? valueName : undefined}
                    aria-current={variantOption.selected ? "true" : undefined}
                    data-testid={testId}
                    onClick={
                      isCrossProduct
                        ? undefined
                        : (event) => {
                            if (!isPlainActivation(event)) return;
                            event.preventDefault();
                            registered.onClick();
                            // onSelect has already navigated with the provider's replace
                            // and revalidation settings. Letting Link navigate too would
                            // refetch the loader that a resolved selection just skipped.
                          }
                    }
                  >
                    {content}
                  </Link>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}

function QuantitySelector({
  quantity,
  setQuantity,
}: {
  quantity: number;
  setQuantity: (quantity: number) => void;
}) {
  const { register } = useProductForm();
  const clamp = (value: number) => Math.min(99, Math.max(1, value));

  return (
    <div className="shrink-0">
      <label
        className="text-on-surface mb-2 block text-sm font-medium"
        htmlFor="quantity"
      >
        Quantity
      </label>
      <div
        className="quantity-selector-outlined rounded-input inline-flex items-center"
        data-testid="quantity-stepper"
      >
        <button
          type="button"
          className="text-on-surface-secondary hover:text-on-surface inline-flex size-11 items-center justify-center disabled:cursor-not-allowed disabled:opacity-50 motion-safe:transition-[color,transform] motion-safe:active:scale-[0.90]"
          aria-label="Decrease quantity"
          onClick={() => setQuantity(clamp(quantity - 1))}
          disabled={quantity <= 1}
        >
          <img
            src="/icons/icon-minus.svg"
            alt=""
            className="size-4"
            aria-hidden="true"
          />
        </button>
        <input
          type="number"
          id="quantity"
          {...register("quantity", { value: quantity })}
          min={1}
          max={99}
          step={1}
          className="number-reset text-on-surface h-11 w-12 rounded-none border-0 bg-transparent p-0 text-center text-sm"
          aria-label="Quantity"
          onChange={(event) =>
            setQuantity(
              clamp(Number.parseInt(event.currentTarget.value, 10) || 1),
            )
          }
        />
        <button
          type="button"
          className="text-on-surface-secondary hover:text-on-surface inline-flex size-11 items-center justify-center disabled:cursor-not-allowed disabled:opacity-50 motion-safe:transition-[color,transform] motion-safe:active:scale-[0.90]"
          aria-label="Increase quantity"
          onClick={() => setQuantity(clamp(quantity + 1))}
          disabled={quantity >= 99}
        >
          <img
            src="/icons/icon-plus.svg"
            alt=""
            className="size-4"
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  );
}

function AddToCart({
  product,
  quantity,
  setQuantity,
  selectedVariant,
}: {
  product: ProductData;
  quantity: number;
  setQuantity: (quantity: number) => void;
  selectedVariant: ProductVariant | null;
}) {
  const { options, register, formProps, errors, pending } = useProductForm();
  const addable = canAddToCart(product, options);
  const buttonText = purchaseButtonText(
    product,
    options,
    selectedVariant,
    addable,
  );

  return (
    <>
      <form {...formProps({ beforeSubmit: openCartDrawer })}>
        <div className="mt-6 mb-10 flex items-center gap-4">
          <QuantitySelector quantity={quantity} setQuantity={setQuantity} />
        </div>
        <input type="hidden" {...register("merchandiseId", {})} />
        <button
          {...register("addToCart", {})}
          className="rounded-button button-primary focus-visible:outline-accent inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 px-3 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-safe:transition-[color,background-color,border-color,transform] motion-safe:active:scale-[0.97]"
          disabled={!addable || pending}
          data-testid="add-to-cart"
        >
          {buttonText}
        </button>
      </form>
      {selectedVariant ? (
        <div className="mt-3">
          <ShopPayButton
            variants={[{ id: selectedVariant.id, quantity }]}
            disabled={!addable || pending}
            width="100%"
            borderRadius="8px"
          />
        </div>
      ) : null}
      {[...errors.userErrors, ...errors.warnings, ...errors.networkErrors]
        .length ? (
        <div className="mt-3 grid gap-1 text-sm" role="alert">
          {errors.userErrors.map((error) => (
            <p key={error.message} className="text-critical">
              {error.message}
            </p>
          ))}
          {errors.warnings.map((warning) => (
            <p key={warning.message} className="text-warning">
              {warning.message}
            </p>
          ))}
          {errors.networkErrors.map((error) => (
            <p key={error.message} className="text-critical">
              {error.message}
            </p>
          ))}
        </div>
      ) : null}
    </>
  );
}

function purchaseButtonText(
  product: ProductData,
  options: ReturnType<typeof useProductForm>["options"],
  selectedVariant: ProductVariant | null,
  addable: boolean,
) {
  if (addable) return "Add to cart";
  if (product.requiresSellingPlan) return "Unavailable";
  if (selectedVariant && !selectedVariant.availableForSale) return "Sold out";
  if (!selectedVariant && options.some((option) => option.values.length > 1))
    return "Select options";
  return "Sold out";
}

function ProductTrustStrip() {
  return (
    <ul
      className="product-trust-list"
      role="list"
      aria-label="Shopping benefits"
    >
      <li className="product-trust-item">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z" />
          <circle cx="7.5" cy="18.5" r="1.5" />
          <circle cx="18" cy="18.5" r="1.5" />
        </svg>
        <span>Cash on delivery available</span>
      </li>
      <li className="product-trust-item">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M20 7v5h-5M4 17v-5h5" />
          <path d="M5.5 9a7 7 0 0 1 11.6-2L20 9M4 15l2.9 2a7 7 0 0 0 11.6-2" />
        </svg>
        <span>7-day size exchange</span>
      </li>
      <li className="product-trust-item">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M12 3 19 6v5c0 4.5-2.8 7.7-7 10-4.2-2.3-7-5.5-7-10V6l7-3Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
        <span>Secure Shopify checkout</span>
      </li>
    </ul>
  );
}

function StickyMobilePurchase({
  product,
  selectedVariant,
  quantity,
}: {
  product: ProductData;
  selectedVariant: ProductVariant | null;
  quantity: number;
}) {
  const { options, register, formProps, pending } = useProductForm();
  const addable = canAddToCart(product, options);
  const buttonText = purchaseButtonText(
    product,
    options,
    selectedVariant,
    addable,
  );
  const price = selectedVariant?.price ?? product.priceRange.minVariantPrice;

  return (
    <div className="product-sticky-buy" data-testid="product-sticky-buy">
      <div className="product-sticky-buy__meta">
        <p className="product-sticky-buy__title">{product.title}</p>
        <p className="product-sticky-buy__price">{formatPrice(price)}</p>
      </div>
      <form {...formProps({ afterSubmit: openCartDrawer })}>
        <input type="hidden" {...register("merchandiseId", {})} />
        <input type="hidden" {...register("quantity", { value: quantity })} />
        <button
          {...register("addToCart", {})}
          className="rounded-button button-primary inline-flex items-center justify-center px-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!addable || pending}
        >
          {buttonText}
        </button>
      </form>
    </div>
  );
}

function ProductJsonLd({
  product,
  origin,
}: {
  product: ProductData;
  origin: string;
}) {
  const { selectedVariant } = useProductForm();
  const price = selectedVariant?.price ?? product.priceRange.minVariantPrice;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description ?? undefined,
    image: product.images.nodes.map((image) => image.url),
    sku: selectedVariant?.sku ?? undefined,
    brand: product.vendor
      ? { "@type": "Brand", name: product.vendor }
      : undefined,
    offers: {
      "@type": "Offer",
      url: `${origin}/products/${product.handle}`,
      price: price.amount,
      priceCurrency: price.currencyCode,
      availability:
        (selectedVariant?.availableForSale ?? product.availableForSale)
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
      }}
    />
  );
}

function ProductInfo({
  product,
  selectedVariant,
  quantity,
  setQuantity,
}: {
  product: ProductData;
  selectedVariant: ProductVariant | null;
  quantity: number;
  setQuantity: (quantity: number) => void;
}) {
  return (
    <div className="product-info flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
      <div className="pt-4 md:pt-8">
        {product.vendor ? (
          <p className="type-body-sm text-on-surface-secondary mb-4 tracking-wide uppercase">
            {product.vendor}
          </p>
        ) : null}
        <h1 className="type-display text-on-surface">{product.title}</h1>
        <PriceBlock product={product} selectedVariant={selectedVariant} />
        <InventoryHint selectedVariant={selectedVariant} />
      </div>

      <span className="sr-only" aria-live="polite" id="inventory-status" />

      <div data-product-form>
        <span className="sr-only" aria-live="polite" data-add-to-cart-status />
        <VariantOptions product={product} />
        <AddToCart
          product={product}
          quantity={quantity}
          setQuantity={setQuantity}
          selectedVariant={selectedVariant}
        />
      </div>

      <ProductTrustStrip />

      <h2 className="sr-only">Product details</h2>
      <details
        className="product-details group border-border border-t border-b"
        name="product-details"
        open
      >
        <summary className="marker-hidden text-on-surface hover:text-on-surface-secondary flex cursor-pointer items-center justify-between px-1 py-4 text-sm font-medium">
          <span className="text-sm font-medium">Product details</span>
          <span
            className="ms-4 size-4 shrink-0 group-open:rotate-180 motion-safe:transition-transform motion-safe:duration-200"
            aria-hidden="true"
          >
            <img src="/icons/icon-chevron-down.svg" alt="" className="size-4" />
          </span>
        </summary>
        <div className="richtext text-on-surface-secondary px-1 pb-4 text-sm">
          {product.descriptionHtml ? (
            <div
              dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
            />
          ) : (
            <p>{product.description}</p>
          )}
        </div>
      </details>
      <details
        className="product-details group border-border border-b"
        name="product-details"
      >
        <summary className="marker-hidden text-on-surface hover:text-on-surface-secondary flex cursor-pointer items-center justify-between px-1 py-4 text-sm font-medium">
          <span>Delivery &amp; exchange</span>
          <span
            className="ms-4 size-4 shrink-0 group-open:rotate-180 motion-safe:transition-transform motion-safe:duration-200"
            aria-hidden="true"
          >
            <img src="/icons/icon-chevron-down.svg" alt="" className="size-4" />
          </span>
        </summary>
        <div className="richtext text-on-surface-secondary px-1 pb-4 text-sm">
          <p>Cash on delivery is available at checkout across Bangladesh.</p>
          <p>
            Request a size exchange within 7 days of delivery. Shoes must be
            unworn and returned with their original packaging.
          </p>
        </div>
      </details>
    </div>
  );
}

function ProductPageContent({
  product,
  origin,
}: {
  product: ProductData;
  origin: string;
}) {
  const { selectedVariant } = useProductForm();
  const [quantity, setQuantity] = useState(1);

  return (
    <>
      <ProductJsonLd product={product} origin={origin} />
      <section className="product-page max-w-page px-margin mx-auto w-full pb-4">
        <nav aria-label="Breadcrumb" className="product-breadcrumb">
          <ol>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link to="/collections/all">Shop</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">{product.title}</li>
          </ol>
        </nav>
        <div className="product-grid mb-16 grid grid-cols-1 gap-6 md:gap-12">
          <ProductGallery product={product} selectedVariant={selectedVariant} />
          <ProductInfo
            product={product}
            selectedVariant={selectedVariant}
            quantity={quantity}
            setQuantity={setQuantity}
          />
        </div>
      </section>
      <StickyMobilePurchase
        product={product}
        selectedVariant={selectedVariant}
        quantity={quantity}
      />
    </>
  );
}

function RelatedProducts({ products }: { products: RelatedProduct[] }) {
  if (products.length === 0) return null;

  return (
    <section className="py-4" aria-labelledby="related-products-heading">
      <div className="border-border border-t pt-12">
        <h2
          id="related-products-heading"
          className="type-heading-xl max-w-page px-margin mx-auto mb-8"
        >
          More products
        </h2>
        <div className="max-w-page px-margin mx-auto contain-paint">
          <ul
            role="list"
            className="product-grid-cards grid grid-cols-2 lg:grid-cols-4"
          >
            {products.map((product) => (
              <li key={product.handle}>
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default function ProductRoute({ loaderData }: Route.ComponentProps) {
  const { product, relatedProducts, origin } = loaderData;
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <ProductProvider
      product={product}
      onSelect={(result) => {
        const url = toRouterLocation(
          variantUrl(
            product,
            result.selectedOptions,
            result.selectedVariant?.product?.handle,
            new URLSearchParams(location.search),
          ),
        );
        void navigate(url, {
          replace: true,
          preventScrollReset: true,
          ...(result.status === "resolved"
            ? { defaultShouldRevalidate: false }
            : {}),
        });
      }}
    >
      <ProductViewedTracker product={product} />
      <main className="flex-1" id="main-content" tabIndex={-1}>
        <ProductPageContent product={product} origin={origin} />
        <RelatedProducts products={relatedProducts} />
      </main>
    </ProductProvider>
  );
}
