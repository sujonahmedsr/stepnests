import { Link } from "react-router";

import type { HomeHeroData } from "~/lib/home-hero";
import { shopifyImageSrcSet, shopifyImageUrl } from "~/lib/shopify-image";

export function HomeHero({ hero }: { hero: HomeHeroData }) {
  return (
    <section className="home-hero" aria-labelledby="hero-heading">
      {hero.image ? (
        <img
          src={shopifyImageUrl(hero.image.url, { width: 1280 })}
          srcSet={shopifyImageSrcSet(hero.image.url, [640, 960, 1280, 1600])}
          sizes="100vw"
          alt=""
          className="home-hero__image"
          loading="eager"
          fetchPriority="high"
        />
      ) : null}
      <div
        className={`home-hero__shade${hero.image ? "" : " home-hero__shade--empty"}`}
        aria-hidden="true"
      />
      <div className="home-hero__inner max-w-page px-margin">
        <div className="home-hero__copy">
          <p className="eyebrow home-hero__eyebrow">STEP NESTS · FOOTWEAR</p>
          <h1 id="hero-heading">
            Good shoes.
            <br />
            <em>Better days.</em>
          </h1>
          <p>
            Find the pair that feels like you. Explore shoes for every plan, every pace, and all the
            little moments in between.
          </p>
          <div className="home-hero__actions">
            <Link to={hero.to} className="home-hero__button">
              Shop the collection <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
        <p className="home-hero__caption" aria-hidden="true">
          A STEP AHEAD, EVERY DAY
        </p>
      </div>
    </section>
  );
}
