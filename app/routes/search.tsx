import { Link, useFetcher, useLoaderData, useNavigate } from 'react-router';
import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import { lazy, Suspense, useState, useEffect, useMemo, useRef } from 'react';
import { SearchHeader } from '~/components/search';
import { CarGrid } from '~/components/car/CarGrid';
import { Badge } from '~/components/ui/Badge';
import { Button } from '~/components/ui/Button';
import { useFilters } from '~/hooks/useFilters';
import { useSortAndView } from '~/hooks/useSortAndView';
import { useFavorites, useComparison } from '~/stores/useAppStore';
import { RouteErrorBoundary } from '~/components/error';
import type { Car, FilterState } from '~/types';
import { mapListingToCar } from '~/utils/listingMapper';
import { getSupabaseServerClient, hasSupabaseAuthCookie } from '~/lib/supabase.server';
import { parseNaturalSearch } from '~/utils/naturalSearch';
import { Map } from 'lucide-react';
import { trackAnalyticsEvent } from '~/utils/analytics.client';

const MapResults = lazy(() =>
  import('~/components/search/MapResults').then(({ MapResults: MapResultsComponent }) => ({ default: MapResultsComponent }))
);

const FilterPanel = lazy(() =>
  import('~/components/search/FilterPanel').then(({ FilterPanel: FilterPanelComponent }) => ({ default: FilterPanelComponent }))
);

export function meta({}: any) {
  const title = "Căutare Mașini Auto Second-Hand și Noi | AutoFans";
  const description = "Caută mașina potrivită în anunțurile active de pe AutoFans.ro. Filtrează după preț, an, marcă, model și locație.";
  const image = "https://www.autofans.ro/hero_background.jpg";

  return [
    { title },
    { name: "description", content: description },
    { name: "robots", content: "index,follow,max-image-preview:large" },
    { tagName: "link", rel: "canonical", href: "https://www.autofans.ro/search" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: image },
    { property: "og:url", content: "https://www.autofans.ro/search" },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: "AutoFans.ro" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image }
  ];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const initialQuery = new URL(request.url).searchParams.get('q')?.trim().slice(0, 120) || '';
  if (!hasSupabaseAuthCookie(request)) return { canSaveSearch: false, initialQuery };
  try {
    const { supabase, headers } = getSupabaseServerClient(request);
    const { data: { user } } = await supabase.auth.getUser();
    return { canSaveSearch: Boolean(user), initialQuery };
  } catch (e) {
    console.error('search loader error:', e);
    return { canSaveSearch: false, initialQuery };
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const { supabase, headers } = getSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Autentifică-te pentru a salva căutarea.' }, { status: 401, headers });

  const form = await request.formData();
  if (form.get('intent') !== 'save-search') return Response.json({ error: 'Acțiune invalidă.' }, { status: 400, headers });
  const name = String(form.get('name') || '').trim().slice(0, 80);
  const filtersValue = String(form.get('filters') || '{}');
  if (!name) return Response.json({ error: 'Alege un nume pentru căutare.' }, { status: 400, headers });
  let filters: FilterState;
  try { filters = JSON.parse(filtersValue) as FilterState; } catch { return Response.json({ error: 'Filtre invalide.' }, { status: 400, headers }); }

  const { error } = await supabase.from('saved_searches').insert({
    user_id: user.id,
    name,
    query: filters,
    alerts_enabled: true,
    email_alerts_enabled: form.get('emailAlertsEnabled') === 'true',
  });
  if (error) return Response.json({ error: error.message }, { status: 400, headers });
  return Response.json({ ok: true }, { headers });
}

function SearchContent() {
  const data = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const saveSearchFetcher = useFetcher<{ ok?: boolean; error?: string }>();
  const [showFilters, setShowFilters] = useState(false);
  const [displayedCars, setDisplayedCars] = useState<Car[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [failedRequest, setFailedRequest] = useState<{ page: number; append: boolean } | null>(null);
  const [showMap, setShowMap] = useState(false);
  const searchRequestId = useRef(0);
  const searchController = useRef<AbortController | null>(null);
  const appliedUrlQuery = useRef(data.initialQuery);

  const { favorites, addToFavorites, removeFromFavorites, isFavorited } = useFavorites();
  const { comparisonCars, addToComparison, removeFromComparison, isInComparison } = useComparison();

  // A shared search URL must win over stale browser storage. Search state is
  // deliberately not persisted here: saved searches live in the account and
  // reopening /search should always be fast and predictable.
  const { filters, updateFilters, resetFilters, hasActiveFilters, activeFilterCount } = useFilters({
    initialFilters: data.initialQuery ? { query: data.initialQuery } : {},
    enablePersistence: false,
  });
  const { activeSort, viewMode, setActiveSort, setViewMode } = useSortAndView();
  const naturalSearch = useMemo(() => parseNaturalSearch(filters.query || ''), [filters.query]);

  // React Router can retain this route component while only the query string
  // changes. A shared brand/blog link must replace the current search state,
  // not inherit filters from whatever the visitor searched previously.
  useEffect(() => {
    if (appliedUrlQuery.current === data.initialQuery) return;
    appliedUrlQuery.current = data.initialQuery;
    resetFilters();
    updateFilters({ query: data.initialQuery });
  }, [data.initialQuery, resetFilters, updateFilters]);

  const fetchCars = async (currentPage: number, append = false) => {
    const requestId = ++searchRequestId.current;
    searchController.current?.abort();
    const controller = new AbortController();
    searchController.current = controller;
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsSearching(true);
      setSearchError(null);
      setFailedRequest(null);
    }
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          query: naturalSearch.remainingQuery,
          filters: { ...filters, ...naturalSearch.filters },
          page: currentPage,
          pageSize: 12,
          sort: activeSort,
        }),
      });
      if (!response.ok) {
        const errorBody = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(errorBody?.error || 'Nu am putut încărca anunțurile.');
      }
      const result = await response.json() as { listings: unknown[]; signedMap: Record<string, string>; total: number; hasMore: boolean };
      if (requestId !== searchRequestId.current) return;
      const cars = result.listings.map((listing) => mapListingToCar(listing as any, result.signedMap));
      setDisplayedCars(prev => append ? [...prev, ...cars] : cars);
      setTotalCount(result.total);
      setHasMore(result.hasMore);
      setSearchError(null);
      setFailedRequest(null);
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      console.error('Error searching cars:', e);
      if (requestId !== searchRequestId.current) return;
      // Do not leave stale results on screen after a new search failed. For a
      // failed "load more" request, keep the results already earned instead.
      if (!append) {
        setDisplayedCars([]);
        setTotalCount(0);
        setHasMore(false);
      }
      setSearchError(e instanceof Error ? e.message : 'Căutarea nu este disponibilă momentan.');
      setFailedRequest({ page: currentPage, append });
    } finally {
      if (requestId !== searchRequestId.current) return;
      setIsSearching(false);
      setIsLoadingMore(false);
    }
  };

  // Trigger search when filters or activeSort changes
  useEffect(() => {
    setPage(1);
    fetchCars(1, false);
  }, [filters, activeSort]);

  useEffect(() => () => searchController.current?.abort(), []);

  const handleSearch = (query: string) => {
    trackAnalyticsEvent('catalogue_search', {
      has_query: Boolean(query.trim()),
      query_length: query.trim().length,
    });
    updateFilters({ query });
  };

  const handleFilterChange = (newFilters: FilterState) => {
    updateFilters(newFilters);
  };

  const handleSaveSearch = (name: string, searchFilters: FilterState, emailAlertsEnabled: boolean) => {
    const effectiveFilters: FilterState = { ...searchFilters, ...naturalSearch.filters };
    if (naturalSearch.remainingQuery) effectiveFilters.query = naturalSearch.remainingQuery;
    else delete effectiveFilters.query;
    saveSearchFetcher.submit({
      intent: 'save-search',
      name,
      filters: JSON.stringify(effectiveFilters),
      emailAlertsEnabled: String(emailAlertsEnabled),
    }, { method: 'post' });
  };

  const handleFavorite = (carId: string) => {
    if (isFavorited(carId)) {
      removeFromFavorites(carId);
    } else {
      addToFavorites(carId);
    }
  };

  const handleCompare = (carId: string) => {
    if (isInComparison(carId)) {
      removeFromComparison(carId);
    } else {
      addToComparison(carId);
    }
  };

  const handleView = (carId: string) => {
    const car = displayedCars.find((item) => item.id === carId);
    navigate(`/car/${encodeURIComponent(car?.slug || carId)}`);
  };

  const handleLoadMore = () => {
    if (isLoadingMore || isSearching || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchCars(nextPage, true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <SearchHeader
          onSearch={handleSearch}
          query={filters.query || ''}
          totalCarsCount={totalCount}
          comparisonCarsCount={comparisonCars.length}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          activeFilterCount={activeFilterCount}
          hasActiveFilters={hasActiveFilters}
          resetFilters={resetFilters}
          activeSort={activeSort}
          setActiveSort={setActiveSort}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />

        {naturalSearch.summary.length > 0 && (
          <div className="mb-5 flex flex-wrap items-center gap-2 text-sm text-gray-300">
            <span>Am înțeles:</span>
            {naturalSearch.summary.map((item) => <Badge key={item} variant="secondary" className="border-accent-gold/30 bg-accent-gold/10 text-accent-gold">{item}</Badge>)}
          </div>
        )}

        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="w-full flex-shrink-0 lg:w-80 lg:max-w-sm">
              <Suspense fallback={<div className="h-72 rounded-2xl border border-white/10 bg-secondary-900/70" aria-label="Se încarcă filtrele" />}>
                <FilterPanel
                  filters={filters}
                  onFiltersChange={handleFilterChange}
                  onReset={resetFilters}
                  onClose={() => setShowFilters(false)}
                  onApply={() => setShowFilters(false)}
                  isCollapsed={false}
                  onSaveSearch={data.canSaveSearch ? handleSaveSearch : undefined}
                />
              </Suspense>
            </div>
          )}

          {/* Results */}
          <div className="flex-1 min-w-0">
              <div className="mb-6 flex items-center justify-end">

              {comparisonCars.length > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="primary" className="bg-accent-gold/20 text-accent-gold border-accent-gold/30">
                    {comparisonCars.length} mașini în comparație
                  </Badge>
                  <Button asChild variant="outline" size="sm" className="border-accent-gold/30 text-accent-gold hover:bg-accent-gold/10">
                    <Link to={`/compare?cars=${comparisonCars.join(',')}`}>
                      Compară
                    </Link>
                  </Button>
                </div>
              )}
              <Button variant="outline" size="sm" onClick={() => setShowMap((open) => !open)} className="ml-3 border-white/20 text-white">
                <Map className="mr-1.5 h-4 w-4" />{showMap ? 'Ascunde harta' : 'Vezi harta'}
              </Button>
            </div>

            {saveSearchFetcher.data?.ok && <p className="-mt-3 mb-4 text-sm text-emerald-300">Căutarea a fost salvată. Alertele sunt active.</p>}
            {saveSearchFetcher.data?.error && <p className="-mt-3 mb-4 text-sm text-red-300">{saveSearchFetcher.data.error}</p>}

            {searchError && (
              <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-red-400/25 bg-red-500/10 p-4 text-sm text-red-100 sm:flex-row sm:items-center sm:justify-between" role="alert">
                <p>{searchError}</p>
                <Button type="button" variant="outline" size="sm" onClick={() => fetchCars(failedRequest?.page ?? 1, failedRequest?.append ?? false)} className="shrink-0 border-red-300/40 text-red-100 hover:bg-red-500/15">
                  Reîncearcă
                </Button>
              </div>
            )}

            {showMap && (
              <Suspense fallback={<div className="mb-6 flex h-[360px] items-center justify-center rounded-2xl border border-white/10 bg-secondary-900/70 text-sm text-gray-300">Se încarcă harta…</div>}>
                <MapResults cars={displayedCars} onCarClick={(car) => handleView(car.id)} />
              </Suspense>
            )}

            {isSearching ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="relative mb-6">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-accent-gold/20 border-t-accent-gold mx-auto"></div>
                    <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-r-accent-gold/40 animate-spin mx-auto" style={{animationDirection: 'reverse', animationDuration: '1s'}}></div>
                  </div>
                  <p className="text-white text-lg font-medium">Căutăm mașini...</p>
                  <p className="text-gray-300 text-sm mt-2">Te rugăm să aștepți</p>
                </div>
              </div>
            ) : (
              <CarGrid
                cars={displayedCars}
                loading={isLoadingMore}
                onLoadMore={handleLoadMore}
                hasMore={hasMore}
                onFavorite={handleFavorite}
                onCompare={handleCompare}
                onView={handleView}
                viewMode={viewMode}
                favoritedCars={favorites}
                comparisonCars={comparisonCars}
                emptyStateTitle="Nu am găsit mașini"
                emptyStateDescription="Încearcă să modifici filtrele de căutare pentru a găsi mai multe rezultate."
                emptyStateAction={{
                  label: "Resetează filtrele",
                  onClick: resetFilters
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Search() {
  return (
    <RouteErrorBoundary routeName="Căutare">
      <SearchContent />
    </RouteErrorBoundary>
  );
}
