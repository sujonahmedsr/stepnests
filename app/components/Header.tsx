import { useState } from "react";
import { Link } from "react-router";

import { useCart } from "~/lib/cart";
import { CART_DRAWER_ID, SEARCH_DRAWER_ID, openDialogFromLinkClick } from "~/lib/cart-drawer";
import type { StorefrontShop } from "~/lib/storefront-shop";

import { MobileNav, MobileNavTrigger } from "./MobileNav";

function cartCountLabel(count: number) {
  return count === 1 ? "Cart (1 item)" : `Cart (${count} items)`;
}

function liveCartCountLabel(count: number) {
  return count === 1 ? "1 item in cart" : `${count} items in cart`;
}

function displayCount(count: number) {
  return count > 99 ? "99+" : String(count);
}

export function Header({ shopInfo }: { shopInfo: StorefrontShop }) {
  const totalQuantity = useCart((state) => state.data.totalQuantity);
  const [failedLogoUrl, setFailedLogoUrl] = useState<string | null>(null);
  const logo = shopInfo.logo;

  return (
    <header className="site-header border-border bg-background sticky top-0 z-40 border-b">
      <div className="site-header__inner max-w-page px-margin mx-auto grid h-16 w-full items-center">
        <div className="site-header__primary flex min-w-0 items-center">
          <div className="site-header__menu-trigger" data-hamburger-wrapper>
            <MobileNavTrigger />
          </div>
          <nav aria-label="Main navigation" className="site-nav hidden min-w-0 items-center md:flex">
            <Link to="/collections">Collections</Link>
            <Link to="/#new-arrivals">New arrivals</Link>
            <Link to="/#brand-story">Our story</Link>
          </nav>
        </div>

        <Link
          to="/"
          aria-label={shopInfo.name}
          title={shopInfo.name}
          className="site-brand text-on-surface focus-visible:outline-accent inline-flex min-w-0 items-center justify-center rounded-sm no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {logo && failedLogoUrl !== logo.url ? (
            <img
              src={logo.url}
              alt={logo.altText ?? shopInfo.name}
              width={logo.width ?? undefined}
              height={logo.height ?? undefined}
              className="site-brand__image h-auto w-auto object-contain"
              onError={() => setFailedLogoUrl(logo.url)}
            />
          ) : (
            <span className="site-brand__wordmark">StepNests</span>
          )}
        </Link>

        <div className="site-header__actions flex shrink-0 items-center">
          <Link
            to="/search"
            className="site-header__icon button-icon focus-visible:outline-accent inline-flex cursor-pointer items-center justify-center rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 motion-safe:transition-[color,background-color,border-color,transform] motion-safe:active:scale-[0.97]"
            aria-label="Search"
            aria-controls={SEARCH_DRAWER_ID}
            aria-haspopup="dialog"
            data-testid="search-trigger"
            onClick={(event) => openDialogFromLinkClick(event, SEARCH_DRAWER_ID)}
          >
            <img src="/icons/icon-search.svg" alt="" className="size-5" aria-hidden="true" />
          </Link>
          <Link
            to="/cart"
            className="site-header__icon text-on-surface focus-visible:outline-accent relative inline-flex cursor-pointer items-center justify-center rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 motion-safe:transition motion-safe:active:scale-[0.97]"
            aria-label={cartCountLabel(totalQuantity)}
            aria-controls={CART_DRAWER_ID}
            aria-haspopup="dialog"
            data-testid="cart-trigger"
            onClick={(event) => openDialogFromLinkClick(event, CART_DRAWER_ID)}
          >
            <span className="relative inline-flex size-5 shrink-0 items-center justify-center" aria-hidden="true">
              <img src="/icons/icon-cart.svg" alt="" className="size-5" />
              {totalQuantity > 0 ? (
                <span className="site-header__cart-count bg-interactive text-interactive-text absolute end-0 top-0 flex min-w-5 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full px-1 font-medium">
                  {displayCount(totalQuantity)}
                </span>
              ) : null}
            </span>
          </Link>
          <span aria-live="polite" aria-atomic="true" className="sr-only">
            {liveCartCountLabel(totalQuantity)}
          </span>
        </div>
      </div>
      <MobileNav />
    </header>
  );
}
