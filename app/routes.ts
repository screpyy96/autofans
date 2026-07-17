import { type RouteConfig, index, route } from "@react-router/dev/routes";

// Current React Router emits the correct lazy route manifest at build time, but
// its local config type does not yet expose the option. Keep the runtime code
// split while containing that temporary typing gap in one place.
const lazyRoute = (path: string, file: string) => route(path, file, { lazy: true } as any);

export default [
  // Core routes - loaded immediately
  route("/sitemap.xml", "routes/sitemap.ts"),
  route("/robots.txt", "routes/robots.ts"),
  index("routes/home.tsx"),
  route("/search", "routes/search.tsx"),
  route("/masini-second-hand/moldova", "routes/masini-second-hand.moldova.tsx"),
  route("/masini-second-hand/:county/:city?", "routes/masini-second-hand.$county.$city.tsx"),
  lazyRoute("/login", "routes/login.tsx"),
  lazyRoute("/auth/callback", "routes/auth.callback.tsx"),
  lazyRoute("/logout", "routes/logout.tsx"),
  
  // Secondary routes - can be lazy loaded
  lazyRoute("/blog", "routes/blog.tsx"),
  route("/blog/:slug", "routes/blog.$slug.tsx"),
  lazyRoute("/dealeri", "routes/dealeri.tsx"),
  lazyRoute("/notifications", "routes/notifications.tsx"),
  lazyRoute("/messages", "routes/messages.tsx"),
  lazyRoute("/contact", "routes/contact.tsx"),
  lazyRoute("/help", "routes/help.tsx"),
  lazyRoute("/favorites", "routes/favorites.tsx"),
  lazyRoute("/reports", "routes/reports.tsx"),
  lazyRoute("/profile", "routes/profile.tsx"),
  route("/car/:slug", "routes/car.$slug.tsx"),
  lazyRoute("/seller/:id", "routes/seller.$id.tsx"),
  lazyRoute("/create-listing", "routes/create-listing.tsx"),
  route("/api/alerts/dispatch", "routes/api.alerts.dispatch.tsx"),
  route("/api/indexnow/submit", "routes/api.indexnow.submit.ts"),
  route("/api/home", "routes/api.home.tsx"),
  route("/api/search", "routes/api.search.ts"),
  route("/og/car/:slug", "routes/og.car.$slug.ts"),
  lazyRoute("/compare", "routes/compare.tsx"),
  lazyRoute("/dashboard", "routes/dashboard.tsx"),
  lazyRoute("/dashboard/listings", "routes/dashboard.listings.tsx"),
  lazyRoute("/dashboard/dealer-import", "routes/dashboard.dealer-import.tsx"),
  lazyRoute("/admin/reports", "routes/admin.reports.tsx"),
  lazyRoute("/termeni-si-conditii", "routes/terms.tsx"),
  lazyRoute("/politica-de-confidentialitate", "routes/privacy.tsx"),
  
] satisfies RouteConfig;
