import { DEFAULT_MONEY_LOCALE } from "~/lib/money";

const formatBDT = (amount: number) =>
  new Intl.NumberFormat(DEFAULT_MONEY_LOCALE, {
    style: "currency",
    currency: "BDT",
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
  }).format(amount);

export const PRICE_RANGES = [
  {
    id: "under-3000",
    label: `Under ${formatBDT(3000)}`,
    minPrice: undefined,
    maxPrice: 2999.99,
  },
  {
    id: "3000-4999",
    label: `${formatBDT(3000)} – ${formatBDT(4999)}`,
    minPrice: 3000,
    maxPrice: 4999.99,
  },
  {
    id: "5000-plus",
    label: `${formatBDT(5000)} & Above`,
    minPrice: 5000,
    maxPrice: undefined,
  },
] as const;

export const NEW_ARRIVALS_LINK = {
  label: "New Arrivals",
  to: "/collections/new-arrivals",
} as const;

export const SHOP_MENU_GROUPS = [
  {
    id: "men",
    label: "Men",
    allLabel: "Shop all men",
    allTo: "/collections/men",
    links: [
      { label: "Sports & Running", to: "/collections/men-sports" },
      { label: "Casual", to: "/collections/men-casual" },
      { label: "Walking", to: "/collections/men-walking" },
    ],
  },
  {
    id: "women",
    label: "Women",
    allLabel: "Shop all women",
    allTo: "/collections/women",
    links: [
      { label: "Sports & Running", to: "/collections/women-sports" },
      { label: "Casual", to: "/collections/women-casual" },
      { label: "Walking", to: "/collections/women-walking" },
      { label: "Outdoor", to: "/collections/women-outdoor" },
    ],
  },
  {
    id: "brands",
    label: "Brands",
    allLabel: "Browse all collections",
    allTo: "/collections",
    links: [
      { label: "Power", to: "/collections/power" },
      { label: "North Star", to: "/collections/north-star" },
      { label: "Weinbrenner", to: "/collections/weinbrenner" },
    ],
  },
  {
    id: "price",
    label: "Shop by Price",
    allLabel: "All products",
    allTo: "/collections/all",
    links: PRICE_RANGES.map(({ id, label }) => ({
      label,
      to: `/collections/all?price=${id}`,
    })),
  },
] as const;
