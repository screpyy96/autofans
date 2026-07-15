export const loader = async () => {
  const robotsTxt = `
User-agent: *
Allow: /

# Sitemaps
Sitemap: https://www.autofans.ro/sitemap.xml
`.trim();

  return new Response(robotsTxt, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      // robots.txt changes rarely, and caching it keeps repeated crawler
      // requests away from the application server.
      "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
    },
  });
};
