import { ShopPayButton } from "@shopify/hydrogen/react";
import { useEffect } from "react";
import { Link } from "react-router";

import { publishCartViewed } from "~/components/AnalyticsTrackers";
import {
  CartErrorBanner,
  CartLineItem,
  FreeDeliveryProgress,
  hasPendingCost,
} from "~/components/CartDrawer";
import { useCart } from "~/lib/cart";
import { formatPrice } from "~/lib/money";
import {
  formatPageTitle,
  getShopNameFromRootMatch,
} from "~/lib/storefront-shop";

import type { Route } from "./+types/cart";

export function meta({ matches }: Route.MetaArgs) {
  return [
    { title: formatPageTitle("Cart", getShopNameFromRootMatch(matches[0])) },
  ];
}

export default function CartRoute() {
  const cart = useCart((state) => state.data);
  const loading = useCart((state) => state.loading);
  const pending = useCart((state) => state.pending);
  const revalidating = useCart(
    (state) => "revalidating" in state && state.revalidating === true,
  );
  const isPending = hasPendingCost(pending) || revalidating;
  const lines = cart.lines.nodes;

  useEffect(() => {
    publishCartViewed(cart);
  }, [cart]);

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="max-w-page px-margin mx-auto w-full flex-1 py-12"
    >
      <h1
        id="cart-page-title"
        tabIndex={-1}
        className="type-display text-on-surface mb-8"
      >
        Cart
      </h1>
      <CartErrorBanner />
      {loading ? (
        <p className="text-on-surface-secondary">Loading cart…</p>
      ) : null}
      {!loading && lines.length === 0 ? (
        <div>
          <p className="text-on-surface font-medium">Your cart is empty.</p>
          <p className="text-on-surface-secondary mt-2 text-sm">
            Looks like you haven&apos;t added anything to your cart yet.
          </p>
          <Link
            to="/collections/all"
            className="button-primary min-h-touch-target mt-6 inline-flex items-center justify-center px-5 no-underline"
          >
            Explore footwear
          </Link>
        </div>
      ) : null}
      {lines.length > 0 ? (
        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <ul role="list" className="divide-border divide-y">
            {lines.map((line) => (
              <CartLineItem
                key={line.id}
                line={line}
                emptyCartFocusId="cart-page-title"
              />
            ))}
          </ul>
          <aside
            className="cart-summary border-border h-fit rounded border p-4"
            aria-label="Cart summary"
          >
            <div className="flex items-center justify-between">
              <span
                className="text-on-surface text-sm font-medium"
                aria-busy={isPending}
              >
                Estimated total
                {isPending ? <span aria-hidden="true"> (updating)</span> : null}
              </span>
              <span
                className={`text-on-surface text-base font-medium ${isPending ? "text-on-surface-secondary" : ""}`}
              >
                {formatPrice(cart.cost.totalAmount)}
              </span>
            </div>
            <FreeDeliveryProgress
              subtotal={cart.cost.subtotalAmount}
              pending={isPending}
            />
            <p className="text-on-surface-secondary mt-3 text-xs">
              Taxes and shipping calculated at checkout
            </p>
            {cart.checkoutUrl ? (
              <div className="mt-4 grid gap-3">
                <ShopPayButton width="100%" borderRadius="8px" />
                <a
                  href={cart.checkoutUrl}
                  className="rounded-button button-primary focus-visible:outline-accent inline-flex h-11 w-full items-center justify-center gap-2 px-4 text-sm font-medium no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 motion-safe:transition-[color,background-color,border-color,transform] motion-safe:active:scale-[0.97]"
                >
                  Checkout
                </a>
              </div>
            ) : null}
          </aside>
        </div>
      ) : null}
    </main>
  );
}
