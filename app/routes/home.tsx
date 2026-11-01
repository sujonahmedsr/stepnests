import { Cache, gql } from "@shopify/hydrogen";
import { Link, useRouteLoaderData } from "react-router";

import {
  CollectionCard,
  COLLECTION_CARD_FRAGMENT,
  type CollectionCardData,
} from "~/components/CollectionCard";
import { HomeHero } from "~/components/HomeHero";
import { PaymentMethodIcon } from "~/components/PaymentMethodIcon";
import { ProductCard, PRODUCT_CARD_FRAGMENT, type ProductCardData } from "~/components/ProductCard";
import { selectHomeHero } from "~/lib/home-hero";
import { storefrontClientContext } from "~/lib/storefront";
import {
  FALLBACK_SHOP_NAME,
  formatPageTitle,
  getShopNameFromRootMatch,
  type PaymentMethodLabel,
} from "~/lib/storefront-shop";
import type { loader as rootLoader } from "~/root";

import type { Route } from "./+types/home";

const HOME_QUERY = gql(
  `
    query Home($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
      newArrivals: products(first: 8, sortKey: CREATED_AT, reverse: true) {
        nodes {
          ...ProductCard
        }
      }
      bestSellers: products(first: 4, sortKey: BEST_SELLING) {
        nodes {
          ...ProductCard
        }
      }
      collections(first: 4) {
        nodes {
          ...CollectionCard
        }
      }
      heroCollections: collections(first: 1, sortKey: UPDATED_AT, reverse: true) {
        nodes {
          title
          handle
          description
          image {
            url
            altText
          }
          products(first: 1) {
            nodes {
              featuredImage {
                url
                altText
              }
            }
          }
        }
      }
    }
  `,
  [PRODUCT_CARD_FRAGMENT, COLLECTION_CARD_FRAGMENT],
);

export function meta({ matches }: Route.MetaArgs) {
  const shopName = getShopNameFromRootMatch(matches[0]);
  return [
    { title: formatPageTitle("Home", shopName) },
    {
      name: "description",
      content: `Discover considered footwear, new arrivals, and the latest collections at ${shopName}.`,
    },
  ];
}

export async function loader({ context }: Route.LoaderArgs) {
  const storefrontClient = context.get(storefrontClientContext);
  const { data } = await storefrontClient.graphql(HOME_QUERY, { cache: Cache.long() });

  // New arrivals: the most recently created products (by creation date, not
  // publication date), newest first, in the order the Storefront API returns.
  const bestSellers: ProductCardData[] = data?.bestSellers.nodes ?? [];
  const bestSellerHandles = new Set(bestSellers.map((product) => product.handle));
  // Keep the new-arrivals row distinct when a recent item also ranks as a bestseller.
  const newArrivals = (data?.newArrivals.nodes ?? [])
    .filter((product) => !bestSellerHandles.has(product.handle))
    .slice(0, 4);
  // The hero features the most recently updated collection, independent of the
  // category list above.
  const heroCollections = data?.heroCollections.nodes ?? [];
  const featuredCollections: CollectionCardData[] = (data?.collections.nodes ?? [])
    .filter((collection) => collection.handle !== heroCollections[0]?.handle)
    .slice(0, 3);

  return {
    bestSellers,
    newArrivals,
    featuredCollections,
    heroCollections,
  };
}

function HomeProductSection({
  id,
  eyebrow,
  title,
  products,
}: {
  id: string;
  eyebrow: string;
  title: string;
  products: readonly ProductCardData[];
}) {
  if (products.length === 0) return null;

  return (
    <section id={id} className="home-product-section w-full" aria-labelledby={`${id}-heading`}>
      <div className="home-section-heading max-w-page px-margin mx-auto mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2 id={`${id}-heading`} className="type-heading-xl">
            {title}
          </h2>
        </div>
        <Link to="/collections" className="editorial-link min-h-touch-target">
          Shop all <span aria-hidden="true">↗</span>
        </Link>
      </div>

      <div className="max-w-page px-margin mx-auto contain-paint">
        <ul
          role="list"
          className="product-grid-cards grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 lg:grid-cols-4"
        >
          {products.map((product) => (
            <li key={product.handle}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ShopByCategory({ collections }: { collections: readonly CollectionCardData[] }) {
  return (
    <section className="home-categories w-full py-16" aria-labelledby="category-heading">
      <div className="home-section-heading max-w-page px-margin mx-auto mb-6">
        <p className="eyebrow">FIND YOUR PAIR</p>
        <h2 id="category-heading" className="type-heading-xl">
          Shop by collection
        </h2>
      </div>
      {collections.length > 0 ? (
        <ul
          role="list"
          className="max-w-page px-margin mx-auto grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {collections.map((collection) => (
            <li key={collection.handle}>
              <CollectionCard collection={collection} />
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function HomeTrustStrip({ paymentMethods }: { paymentMethods: readonly PaymentMethodLabel[] }) {
  return (
    <section className="home-trust-strip" aria-label="Shopping information">
      <ul className="home-trust-strip__inner max-w-page px-margin mx-auto" role="list">
        <li>
          <h2>Shopify-hosted checkout</h2>
          <p>Complete your order through Shopify checkout.</p>
        </li>
        <li>
          <h2>Product details upfront</h2>
          <p>Compare styles, prices, and size options on each product page.</p>
        </li>
        <li>
          <h2>Payment options</h2>
          {paymentMethods.length > 0 ? (
            <ul className="home-trust-strip__payments" role="list">
              {paymentMethods.map((method) => (
                <li key={method}>
                  <PaymentMethodIcon method={method} />
                </li>
              ))}
            </ul>
          ) : (
            <p>Available methods are shown during checkout.</p>
          )}
        </li>
      </ul>
    </section>
  );
}

function BrandNote() {
  return (
    <section className="brand-note" id="brand-story" aria-labelledby="brand-note-heading">
      <div className="max-w-page px-margin brand-note__inner">
        <p className="eyebrow">THE STEP NESTS EDIT</p>
        <h2 id="brand-note-heading">Made for wherever the day takes you.</h2>
        <p>
          From your first coffee to the long way home, discover a considered collection of shoes
          that brings comfort and personal style to every step.
        </p>
        <Link to="/collections" className="editorial-link editorial-link--light">
          Find your next pair <span aria-hidden="true">↗</span>
        </Link>
      </div>
      <span className="brand-note__mark" aria-hidden="true">
        S
      </span>
    </section>
  );
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const rootData = useRouteLoaderData<typeof rootLoader>("root");
  const hero = selectHomeHero(
    loaderData.heroCollections,
    rootData?.shopInfo.name ?? FALLBACK_SHOP_NAME,
  );

  return (
    <main className="flex-1" id="main-content" tabIndex={-1}>
      <HomeHero hero={hero} />
      <HomeTrustStrip paymentMethods={rootData?.shopInfo.paymentMethods ?? []} />
      <ShopByCategory collections={loaderData.featuredCollections} />
      <HomeProductSection
        id="best-sellers"
        eyebrow="BEST SELLING"
        title="Best sellers"
        products={loaderData.bestSellers}
      />
      <HomeProductSection
        id="new-arrivals"
        eyebrow="THE LATEST"
        title="Fresh steps"
        products={loaderData.newArrivals}
      />
      <BrandNote />
    </main>
  );
}
