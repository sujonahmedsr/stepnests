import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("products/:handle", "routes/product.tsx"),
  route("collections/all", "routes/all-products.tsx"),
  route("collections", "routes/collections.tsx"),
  route("collections/:handle", "routes/collection.tsx"),
  route("cart", "routes/cart.tsx"),
  route("search", "routes/search.tsx"),
  route("account", "routes/account.tsx"),
  route("about", "routes/about.tsx"),
  route("size-guide", "routes/size-guide.tsx"),
  route("contact", "routes/contact.tsx"),
  route("policies", "routes/policies.tsx"),
  route("policies/:handle", "routes/policy.tsx"),
  route("*", "routes/catchall.tsx"),
] satisfies RouteConfig;
