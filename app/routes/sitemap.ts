import type { LoaderFunctionArgs } from "react-router";
import { getSupabaseServerClient } from "~/lib/supabase.server";
import { blogPosts } from '~/data/blogPosts';
import { cityUrl, countyUrl } from '~/utils/localSeo';
import { getMoldovaCountySummaries, getMoldovaInventoryStats } from '~/utils/localSeo.server';

const DOMAIN = "https://www.autofans.ro";

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

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
    "/delete-account",
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

  // Preluăm mașinile publicate reale din Supabase (excluzând datele de test/invalide)
  try {
    const { data: cars } = await supabase
      .from("listings")
      .select("slug, updated_at, owner_id")
      .eq("status", "published")
      .order("updated_at", { ascending: false });

    if (cars && cars.length > 0) {
      const dealerActivity = new Map<string, string>();
      for (const car of cars) {
        if (!car.slug) continue;
        const lowerSlug = car.slug.toLowerCase();
        // Filtrăm anunțurile de test (slug-uri ce conțin 'asd', 'test', 'demo')
        if (lowerSlug.includes("-asd-") || lowerSlug.includes("test") || lowerSlug.includes("asdasd") || lowerSlug.includes("demo")) {
          continue;
        }

        const lastMod = car.updated_at ? new Date(car.updated_at).toISOString() : new Date().toISOString();
        sitemap += `  <url>\n`;
        sitemap += `    <loc>${DOMAIN}/car/${car.slug}</loc>\n`;
        sitemap += `    <lastmod>${lastMod}</lastmod>\n`;
        sitemap += `    <changefreq>weekly</changefreq>\n`;
        sitemap += `    <priority>0.8</priority>\n`;
        sitemap += `  </url>\n`;

        if (car.owner_id && car.updated_at && !dealerActivity.has(car.owner_id)) {
          dealerActivity.set(car.owner_id, new Date(car.updated_at).toISOString());
        }
      }

      const dealerIds = Array.from(dealerActivity.keys());
      if (dealerIds.length) {
        const dealerChunks = chunkArray(dealerIds, 200);
        for (const ids of dealerChunks) {
          const { data: dealers } = await supabase
            .from('profiles')
            .select('id, role')
            .eq('role', 'seller')
            .in('id', ids);

          for (const dealer of dealers || []) {
            const lastMod = dealerActivity.get(dealer.id) || new Date().toISOString();
            sitemap += `  <url>\n`;
            sitemap += `    <loc>${DOMAIN}/seller/${dealer.id}</loc>\n`;
            sitemap += `    <lastmod>${lastMod}</lastmod>\n`;
            sitemap += `    <changefreq>weekly</changefreq>\n`;
            sitemap += `    <priority>0.7</priority>\n`;
            sitemap += `  </url>\n`;
          }
        }
      }
    }
  } catch (error) {
    console.error("Eroare la generarea sitemap-ului pentru mașini:", error);
  }

  // Local pages are listed only after they pass the same inventory thresholds
  // used by the routes. This keeps thin, low-stock pages out of Google.
  try {
    const stats = await getMoldovaInventoryStats(supabase as any);
    const counties = getMoldovaCountySummaries(stats).filter((county) => county.isIndexable);
    if (counties.length) {
      sitemap += `  <url>\n`;
      sitemap += `    <loc>${DOMAIN}/masini-second-hand/moldova</loc>\n`;
      sitemap += `    <changefreq>daily</changefreq>\n`;
      sitemap += `    <priority>0.8</priority>\n`;
      sitemap += `  </url>\n`;
    }
    for (const county of counties) {
      sitemap += `  <url>\n`;
      sitemap += `    <loc>${DOMAIN}${countyUrl(county)}</loc>\n`;
      sitemap += `    <changefreq>daily</changefreq>\n`;
      sitemap += `    <priority>0.8</priority>\n`;
      sitemap += `  </url>\n`;
      for (const city of county.cities) {
        sitemap += `  <url>\n`;
        sitemap += `    <loc>${DOMAIN}${cityUrl(county, city.name)}</loc>\n`;
        sitemap += `    <changefreq>daily</changefreq>\n`;
        sitemap += `    <priority>0.7</priority>\n`;
        sitemap += `  </url>\n`;
      }
    }
  } catch (error) {
    console.error('Eroare la generarea sitemap-ului local:', error);
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
