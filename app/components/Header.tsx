import { useRef, useState } from "react";
import { Link } from "react-router";

import { useCart } from "~/lib/cart";
import {
  CART_DRAWER_ID,
  SEARCH_DRAWER_ID,
  openDialogFromLinkClick,
} from "~/lib/cart-drawer";
import { NEW_ARRIVALS_LINK, SHOP_MENU_GROUPS } from "~/lib/navigation";
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
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuTriggers = useRef(new Map<string, HTMLButtonElement>());
  const logo = shopInfo.logo;

  return (
    <header
      className="site-header border-border bg-background sticky top-0 z-40 border-b"
      onPointerLeave={() => setOpenMenu(null)}
      onBlur={(event) => {
        if (
          !(event.relatedTarget instanceof Node) ||
          !event.currentTarget.contains(event.relatedTarget)
        ) {
          setOpenMenu(null);
        }
      }}
      onKeyDown={(event) => {
        if (event.key !== "Escape" || !openMenu) return;
        setOpenMenu(null);
        menuTriggers.current.get(openMenu)?.focus();
      }}
    >
      <div className="site-header__inner max-w-page px-margin mx-auto grid h-16 w-full items-center">
        <div className="site-header__primary flex min-w-0 items-center">
          <div className="site-header__menu-trigger" data-hamburger-wrapper>
            <MobileNavTrigger />
          </div>
          <nav
            aria-label="Main navigation"
            className="site-nav hidden min-w-0 items-center lg:flex"
          >
            <Link to={NEW_ARRIVALS_LINK.to} className="site-nav__link">
              {NEW_ARRIVALS_LINK.label}
            </Link>
            {SHOP_MENU_GROUPS.map((group) => (
              <button
                key={group.id}
                ref={(element) => {
                  if (element) menuTriggers.current.set(group.id, element);
                  else menuTriggers.current.delete(group.id);
                }}
                type="button"
                className={`site-nav__link site-nav__trigger ${openMenu === group.id ? "is-open" : ""}`}
                aria-expanded={openMenu === group.id}
                aria-controls={`site-mega-menu-${group.id}`}
                onPointerEnter={() => setOpenMenu(group.id)}
                onClick={() => setOpenMenu(group.id)}
              >
                {group.label}
                <img
                  src="/icons/icon-chevron-down.svg"
                  alt=""
                  aria-hidden="true"
                  className="icon-size-small"
                />
              </button>
            ))}
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
            onClick={(event) =>
              openDialogFromLinkClick(event, SEARCH_DRAWER_ID)
            }
          >
            <img
              src="/icons/icon-search.svg"
              alt=""
              className="icon-size"
              aria-hidden="true"
            />
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
            <span
              className="relative inline-flex shrink-0 items-center justify-center icon-size"
              aria-hidden="true"
            >
              <img src="/icons/icon-cart.svg" alt="" className="icon-size" />
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
      {SHOP_MENU_GROUPS.map((group) => (
        <div
          key={group.id}
          id={`site-mega-menu-${group.id}`}
          className={`site-mega-menu ${openMenu === group.id ? "is-open" : ""}`}
          aria-hidden={openMenu !== group.id}
          aria-label={`${group.label} navigation`}
          role="region"
        >
          <div className="site-mega-menu__inner max-w-page px-margin mx-auto">
            <div className="site-mega-menu__intro">
              <p className="eyebrow">Explore</p>
              <h2>{group.label}</h2>
              <Link
                to={group.allTo}
                className="site-mega-menu__all-link"
                onClick={() => setOpenMenu(null)}
              >
                {group.allLabel}
                <img
                  src="/icons/icon-chevron-right.svg"
                  alt=""
                  aria-hidden="true"
                  className="icon-size-small"
                />
              </Link>
            </div>
            <ul className="site-mega-menu__links" role="list">
              {group.links.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} onClick={() => setOpenMenu(null)}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
      <MobileNav />
    </header>
  );
}
