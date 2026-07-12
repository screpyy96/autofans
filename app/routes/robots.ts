export const loader = async () => {
  const robotsTxt = `
User-agent: *
Allow: /

# Sitemaps
Sitemap: https://autofans.ro/sitemap.xml
`.trim();

  return new Response(robotsTxt, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
