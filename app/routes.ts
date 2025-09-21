import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // Core routes - loaded immediately
  index("routes/home.tsx"),
  route("/search", "routes/search.tsx"),
  
  // Secondary routes - can be lazy loaded
  route("/favorites", "routes/favorites.tsx", { lazy: true }),
  route("/profile", "routes/profile.tsx", { lazy: true }),
  route("/car/:id", "routes/car.$id.tsx"),
  route("/create-listing", "routes/create-listing.tsx", { lazy: true }),
  route("/compare", "routes/compare.tsx", { lazy: true }),
  
  // Demo routes (pentru dezvoltare) - always lazy
  route("/demo/design-system", "routes/design-system.tsx", { lazy: true }),
  route("/demo/layout", "routes/layout-demo.tsx", { lazy: true }),
  route("/demo/search", "routes/search-demo.tsx", { lazy: true }),
  route("/demo/search-system", "routes/search-system-demo.tsx", { lazy: true }),
  route("/demo/car-listing", "routes/car-listing-demo.tsx", { lazy: true }),
] satisfies RouteConfig;
