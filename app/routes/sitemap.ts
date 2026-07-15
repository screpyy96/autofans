import type { LoaderFunctionArgs } from "react-router";
import { getSupabaseServerClient } from "~/lib/supabase.server";
import { blogPosts } from '~/data/blogPosts';

// Adăugăm site-ul principal (în producție ar trebui să provină dintr-o variabilă de mediu)
const DOMAIN = "https://www.autofans.ro";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { supabase } = getSupabaseServerClient(request);

  // Paginile statice principale
  const staticPages = [
    "",
    "/search",
    "/contact",
    "/help",
    "/blog",
    "/termeni-si-conditii",
    "/politica-de-confidentialitate",
  ];

  // Generăm URL-urile statice
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  sitemap += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  for (const page of staticPages) {
    sitemap += `  <url>\n`;
    sitemap += `    <loc>${DOMAIN}${page}</loc>\n`;
    sitemap += `    <changefreq>daily</changefreq>\n`;
    sitemap += `    <priority>${page === "" ? "1.0" : "0.8"}</priority>\n`;
    sitemap += `  </url>\n`;
  }

  for (const post of blogPosts) {
    sitemap += `  <url>\n`;
    sitemap += `    <loc>${DOMAIN}/blog/${post.slug}</loc>\n`;
    sitemap += `    <lastmod>${new Date(post.updatedAt).toISOString()}</lastmod>\n`;
    sitemap += `    <changefreq>monthly</changefreq>\n`;
    sitemap += `    <priority>0.7</priority>\n`;
    sitemap += `  </url>\n`;
  }

  // Preluăm mașinile publicate din Supabase
  try {
    const { data: cars } = await supabase
      .from("listings")
      .select("slug, owner_id, updated_at")
      .eq("status", "published")
      .order("updated_at", { ascending: false });

    if (cars && cars.length > 0) {
      const sellerLastModified = new Map<string, string>();
      for (const car of cars) {
        // Data formatată corect pentru sitemap
        const lastMod = car.updated_at ? new Date(car.updated_at).toISOString() : new Date().toISOString();
        if (car.slug) {
          sitemap += `  <url>\n`;
          sitemap += `    <loc>${DOMAIN}/car/${car.slug}</loc>\n`;
          sitemap += `    <lastmod>${lastMod}</lastmod>\n`;
          sitemap += `    <changefreq>weekly</changefreq>\n`;
          sitemap += `    <priority>0.9</priority>\n`;
          sitemap += `  </url>\n`;
        }
        // Listings are ordered by most recently updated, so the first record
        // for an owner gives the freshest accurate lastmod for that profile.
        if (car.owner_id && !sellerLastModified.has(car.owner_id)) {
          sellerLastModified.set(car.owner_id, lastMod);
        }
      }

      for (const [sellerId, lastMod] of sellerLastModified) {
        sitemap += `  <url>\n`;
        sitemap += `    <loc>${DOMAIN}/seller/${sellerId}</loc>\n`;
        sitemap += `    <lastmod>${lastMod}</lastmod>\n`;
        sitemap += `    <changefreq>weekly</changefreq>\n`;
        sitemap += `    <priority>0.6</priority>\n`;
        sitemap += `  </url>\n`;
      }
    }
  } catch (error) {
    console.error("Eroare la generarea sitemap-ului pentru mașini:", error);
  }

  sitemap += `</urlset>`;

  return new Response(sitemap, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      // Un cache mic de 1 oră ca să nu lovim mereu baza de date pentru boți
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
};
