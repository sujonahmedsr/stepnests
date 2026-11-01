import { Link } from "react-router";

import type { StorefrontShop } from "~/lib/storefront-shop";

import { PaymentMethodIcon } from "./PaymentMethodIcon";

const linkClass =
  "min-h-touch-target text-on-surface-secondary hover:text-on-surface focus-visible:outline-accent inline-flex items-center font-normal no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 motion-safe:transition-colors";

export function Footer({ shopInfo }: { shopInfo: StorefrontShop }) {
  return (
    <footer className="site-footer">
      <div
        className="site-footer__inner max-w-page px-margin mx-auto grid grid-cols-1 gap-8 text-sm md:grid-cols-2"
      >
        <div className="min-w-0 wrap-anywhere">
          <h2 className="site-footer__brand mb-3">StepNests</h2>
          <p className="site-footer__copy max-w-xs">
            Considered footwear for all the places your day takes you.
          </p>
        </div>
        <nav aria-labelledby="footer-discover-heading">
          <h2
            className="site-footer__heading type-body-sm mb-4 font-medium"
            id="footer-discover-heading"
          >
            Discover
          </h2>
          <ul role="list" className="site-footer__links flex flex-col">
            <li>
              <Link to="/collections" className={linkClass}>
                Shop all
              </Link>
            </li>
            <li>
              <Link to="/#new-arrivals" className={linkClass}>
                New arrivals
              </Link>
            </li>
          </ul>
        </nav>
        <nav aria-labelledby="footer-customer-care-heading">
          <h2
            className="site-footer__heading type-body-sm mb-4 font-medium"
            id="footer-customer-care-heading"
          >
            Customer care
          </h2>
          <ul role="list" className="site-footer__links flex flex-col">
            <li>
              <Link to="/search" className={linkClass}>
                Search
              </Link>
            </li>
            <li>
              <Link to="/account" className={linkClass}>
                Account
              </Link>
            </li>
          </ul>
        </nav>
        {shopInfo.paymentMethods.length > 0 ? (
          <section aria-labelledby="footer-payment-methods-heading">
            <h2
              className="site-footer__heading type-body-sm mb-4 font-medium"
              id="footer-payment-methods-heading"
            >
              Accepted payments
            </h2>
            <ul
              role="list"
              aria-labelledby="footer-payment-methods-heading"
              className="site-footer__payments flex flex-wrap items-center"
            >
              {shopInfo.paymentMethods.map((method) => (
                <li key={method} className="max-w-full">
                  <PaymentMethodIcon method={method} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
      <div className="site-footer__bottom">
        <div className="max-w-page px-margin mx-auto flex flex-wrap items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} StepNests</p>
          <p className="site-footer__locale">Footwear for every day.</p>
        </div>
      </div>
    </footer>
  );
}
