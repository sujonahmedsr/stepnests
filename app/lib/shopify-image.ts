type ShopifyImageOptions = {
  width?: number;
  height?: number;
  crop?: "center" | "top" | "bottom" | "left" | "right";
};

const SHOPIFY_CDN_HOSTS = ["cdn.shopify.com", "mock.shop"];

function isShopifyImageHost(hostname: string) {
  return SHOPIFY_CDN_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`));
}

function parseShopifyImageUrl(url: string) {
  try {
    const parsed = new URL(url);
    return isShopifyImageHost(parsed.hostname) ? parsed : null;
  } catch {
    return null;
  }
}

export function shopifyImageUrl(url: string, options: ShopifyImageOptions = {}) {
  const parsed = parseShopifyImageUrl(url);
  if (!parsed) return url;

  if (options.width) parsed.searchParams.set("width", String(options.width));
  if (options.height) parsed.searchParams.set("height", String(options.height));
  if (options.crop) parsed.searchParams.set("crop", options.crop);

  return parsed.toString();
}

export function shopifyImageSrcSet(url: string, widths: readonly number[]) {
  if (!parseShopifyImageUrl(url)) return undefined;

  return widths
    .map((width) => `${shopifyImageUrl(url, { width })} ${width}w`)
    .join(", ");
}
