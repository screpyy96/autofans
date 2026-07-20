-- Performance optimization: add targeted compound index for comparable listing queries
-- (make, model, year, price) where status = 'published'.
-- Used in car details page for instant price score calculations and similar listing recommendations.

create index if not exists idx_listings_published_make_model_year_price
  on public.listings (make, model, year, price)
  where status = 'published';

-- Targeted index for city and county local SEO listing queries
create index if not exists idx_listings_published_county_city
  on public.listings (county, city, created_at desc)
  where status = 'published';
