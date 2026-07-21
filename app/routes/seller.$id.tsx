import { useState, useEffect } from 'react';
import { Link, Form, useLoaderData, useActionData, useNavigation, redirect } from 'react-router';
import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { getSupabaseServerClient, hasSupabaseAuthCookie } from '~/lib/supabase.server';
import type { Route } from "./+types/seller.$id";
import { Card, CardContent } from '~/components/ui/Card';
import { Button } from '~/components/ui/Button';
import { Badge } from '~/components/ui/Badge';
import { CarCard } from '~/components/car/CarCard';
import { cn } from '~/lib/utils';
import { 
  Star, 
  Car, 
  MessageCircle, 
  Shield, 
  ArrowLeft, 
  Calendar, 
  Phone, 
  User,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { formatRelativeTime } from '~/utils/helpers';
import { useComparison, useFavorites } from '~/stores/useAppStore';

export function meta({ data }: Route.MetaArgs) {
  const seller = (data as any)?.seller;
  const sellerName = seller?.display_name || 'Vânzător Auto';
  const isDealer = seller?.role === 'dealer';
  const canonicalUrl = seller?.id ? `https://www.autofans.ro/seller/${encodeURIComponent(seller.id)}` : 'https://www.autofans.ro/seller';

  const title = `Profil ${sellerName} - ${isDealer ? 'Dealer' : 'Vânzător'} pe AutoFans.ro`;
  const description = `Vezi anunțurile publicate și informațiile de profil pentru ${sellerName} pe AutoFans.ro.`;
  const image = seller?.avatar_url || "https://www.autofans.ro/hero_background.jpg";

  return [
    { title },
    { name: "description", content: description },
    { name: "robots", content: isDealer ? "index,follow,max-image-preview:large" : "noindex,follow" },
    { tagName: "link", rel: "canonical", href: canonicalUrl },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: image },
    { property: "og:url", content: canonicalUrl },
    { property: "og:type", content: "profile" },
    { property: "og:site_name", content: "AutoFans.ro" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image }
  ];
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { id: sellerId } = params;
  const { supabase, headers } = getSupabaseServerClient(request);
  
  // Public seller pages should not wait for an auth validation when the
  // visitor has no Supabase session. The three public data sources are
  // independent, so fetch them concurrently instead of serially.
  const userResult = hasSupabaseAuthCookie(request)
    ? supabase.auth.getUser()
    : Promise.resolve({ data: { user: null } });
  const [userResponse, sellerResult, listingsResult, reviewsResult] = await Promise.all([
    userResult,
    supabase
      .from('profiles')
      // Seller profiles are public, but email addresses are never public
      // profile data. Contact happens through the protected conversation flow.
      .select('id, display_name, phone, avatar_url, role, is_verified, created_at')
      .eq('id', sellerId)
      .single(),
    supabase
      .from('listings')
      .select('id, slug, title, description, price, currency, make, model, year, mileage, fuel_type, transmission, body_type, images, created_at, city, county')
      .eq('owner_id', sellerId)
      .eq('status', 'published')
      .order('created_at', { ascending: false }),
    supabase
      .from('seller_reviews')
      .select(`
        id,
        reviewer_id,
        rating,
        comment,
        created_at,
        reviewer:profiles!reviewer_id(display_name, avatar_url)
      `)
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false }),
  ]);
  const user = userResponse.data.user;
  const seller = sellerResult.data;
  const sellerError = sellerResult.error;

  if (sellerError || !seller) {
    throw new Response("Vânzătorul nu a fost găsit", { status: 404, headers });
  }

  const listings = listingsResult.data;
  const reviews = reviewsResult.data;
  const reviewsAvailable = !reviewsResult.error;
  const { data: priorConversation } = user
    ? await supabase
        .from('conversations')
        .select('id')
        .eq('buyer_id', user.id)
        .eq('seller_id', sellerId)
        .limit(1)
        .maybeSingle()
    : { data: null };

  // Convert schema listings to matches expected by CarCard (mapping snake_case to camelCase keys)
  const mappedListings = (listings || []).map(l => ({
    id: l.id.toString(),
    slug: l.slug || l.id.toString(),
    title: l.title,
    price: Number(l.price),
    currency: l.currency,
    make: l.make,
    model: l.model,
    year: l.year,
    mileage: l.mileage,
    fuelType: l.fuel_type,
    transmission: l.transmission,
    images: l.images || [],
    createdAt: l.created_at ? new Date(l.created_at) : new Date(),
    negotiable: false,
    location: { id: 'loc-1', city: l.city || 'București', county: l.county || 'București', country: 'RO' },
    specifications: { engineSize: 0, power: 0, doors: 4, seats: 5 },
    features: [],
    condition: { overall: 3 as any, exterior: 3 as any, interior: 3 as any, engine: 3 as any, transmission: 3 as any, hasAccidents: false },
    seller: {
      id: seller.id,
      type: seller.role === 'seller' ? 'dealer' : 'individual',
      name: seller.display_name || 'Vânzător',
      email: '',
      phone: seller.phone || '',
      location: { id: 'loc-1', city: l.city || 'București', county: l.county || 'București', country: 'RO' },
      isVerified: !!seller.is_verified,
    },
    owners: 1,
    serviceHistory: false
  }));

  // Sign URLs for listing images
  let signedListings = mappedListings;
  if (listings?.length) {
    const paths = listings.flatMap(l => {
      const imgs = l.images as any[];
      return imgs?.length ? [imgs[0].path] : [];
    });
    
    if (paths.length) {
      const { data: signedUrls } = await (supabase.storage
        .from('listing-images') as any)
        .createSignedUrls(paths, 3600, {
          transform: { width: 720, height: 450, quality: 70, resize: 'cover' },
        });
        
      if (signedUrls) {
        signedListings = mappedListings.map((l, index) => {
          const orig = listings[index];
          const imgs = orig.images as any[];
          if (imgs?.length) {
            const match = signedUrls.find((s: { path?: string; signedUrl?: string }) => s.path === imgs[0].path);
            if (match) {
              return {
                ...l,
                images: [{ ...imgs[0], url: match.signedUrl }, ...imgs.slice(1)]
              };
            }
          }
          return l;
        });
      }
    }
  }

  return {
    seller,
    listings: signedListings,
    reviews: reviews || [],
    reviewsAvailable,
    currentUser: user,
    canReview: Boolean(priorConversation),
  };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { id: sellerId } = params;
  const { supabase, headers } = getSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return Response.json({ error: "Trebuie să fii conectat pentru a lăsa o recenzie." }, { status: 401, headers });
  }

  if (user.id === sellerId) {
    return Response.json({ error: "Nu îți poți lăsa recenzie propriului cont." }, { status: 400, headers });
  }

  const { data: priorConversation } = await supabase
    .from('conversations')
    .select('id')
    .eq('buyer_id', user.id)
    .eq('seller_id', sellerId)
    .limit(1)
    .maybeSingle();
  if (!priorConversation) {
    return Response.json({ error: 'Poți lăsa o recenzie după ce ai discutat cu acest vânzător prin AutoFans.' }, { status: 403, headers });
  }

  const formData = await request.formData();
  const rating = Number(formData.get("rating"));
  const comment = String(formData.get("comment") || '').trim();

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return Response.json({ error: "Te rugăm să alegi o notă de la 1 la 5 stele." }, { status: 400, headers });
  }

  if (comment.length < 10) {
    return Response.json({ error: "Comentariul trebuie să aibă cel puțin 10 caractere." }, { status: 400, headers });
  }
  if (comment.length > 1000) {
    return Response.json({ error: "Comentariul poate avea cel mult 1000 de caractere." }, { status: 400, headers });
  }

  const { error } = await supabase
    .from("seller_reviews")
    .insert({
      reviewer_id: user.id,
      seller_id: sellerId,
      rating,
      comment
    });

  if (error) {
    if (error.code === "23505") {
      return Response.json({ error: "Ai lăsat deja o recenzie acestui vânzător." }, { status: 400, headers });
    }
    return Response.json({ error: error.message }, { status: 500, headers });
  }

  return Response.json({ success: true }, { headers });
}

export default function SellerProfile() {
  const { seller, listings, reviews, reviewsAvailable, currentUser, canReview } = useLoaderData<typeof loader>();
  const actionData = useActionData() as any;
  const navigation = useNavigation();
  const { isFavorited, addToFavorites, removeFromFavorites } = useFavorites();
  const { isInComparison, addToComparison, removeFromComparison } = useComparison();
  
  const [activeTab, setActiveTab] = useState<'listings' | 'reviews'>('listings');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");
  
  const isSubmitting = navigation.state === 'submitting';

  // Calculate review stats
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews).toFixed(1) 
    : '0.0';

  const starsBreakdown = [5, 4, 3, 2, 1].map(star => {
    const count = reviews.filter(r => r.rating === star).length;
    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
    return { star, count, percentage };
  });

  const handleFavorite = (listingId: string) => {
    if (isFavorited(listingId)) removeFromFavorites(listingId);
    else addToFavorites(listingId);
  };

  const handleCompare = (listingId: string) => {
    if (isInComparison(listingId)) removeFromComparison(listingId);
    else addToComparison(listingId);
  };

  // Clear form on successful submission
  useEffect(() => {
    if (actionData && 'success' in actionData && actionData.success) {
      setCommentText("");
      setRating(5);
    }
  }, [actionData]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Back button */}
      <Link to="/" className="inline-flex items-center text-accent-gold hover:text-accent-gold/80 transition-colors mb-6 text-sm font-semibold">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Înapoi la catalog
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
        {/* Left Column - Seller Profile Details */}
        <div className="lg:col-span-1 space-y-6">
          <Card variant="elevated" padding="lg" className="bg-glass border-white/10 shadow-2xl relative overflow-hidden text-center py-8">
            <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-accent-gold/10 to-transparent" />
            
            <div className="relative inline-block mx-auto mb-4">
              {seller.avatar_url ? (
                <img 
                  src={seller.avatar_url} 
                  alt={seller.display_name || 'Vânzător'} 
                  className="w-24 h-24 rounded-full object-cover border-2 border-accent-gold/40 shadow-glow"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-accent-gold/15 flex items-center justify-center border-2 border-accent-gold/40 shadow-glow">
                  <User className="h-10 w-10 text-accent-gold" />
                </div>
              )}
              {seller.is_verified && (
                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1.5 border border-secondary-950">
                  <Shield className="h-4 w-4 text-white" />
                </div>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-white line-clamp-1 mb-1 px-2">
              {seller.display_name || 'Vânzător'}
            </h1>
            
            <div className="flex items-center justify-center gap-1.5 mb-4">
              <Badge variant="secondary" className="bg-white/5 border-white/10 text-gray-300 text-xs py-0.5">
                {seller.role === 'seller' ? 'Dealer' : 'Persoană Fizică'}
              </Badge>
              {seller.is_verified && (
                <Badge variant="success" className="bg-green-500/10 text-green-400 border-green-500/20 text-xs py-0.5">
                  Verificat
                </Badge>
              )}
            </div>

            {reviewsAvailable && (
              <div className="flex items-center justify-center gap-2 mb-6 bg-white/5 py-2 px-4 rounded-xl border border-white/5 max-w-[200px] mx-auto">
                <div className="flex items-center text-accent-gold">
                  <Star className="h-5 w-5 fill-accent-gold" />
                  <span className="font-bold text-white ml-1 text-base">{averageRating}</span>
                </div>
                <span className="text-white/10">•</span>
                <span className="text-xs text-gray-400 font-semibold">{totalReviews} recenzii</span>
              </div>
            )}

            {/* Contact details */}
            <div className="border-t border-white/5 pt-6 text-left space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 text-accent-gold">
                  <Calendar className="h-4.5 w-4.5" />
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400 leading-none">Membru din</span>
                  <span className="text-sm font-semibold text-white mt-1 block">
                    {new Date(seller.created_at).toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {seller.phone && (
                <a href={`tel:${seller.phone}`} className="flex items-center gap-3 group hover:opacity-85 transition-opacity">
                  <div className="h-9 w-9 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 text-accent-gold group-hover:border-accent-gold/30">
                    <Phone className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-gray-400 leading-none">Telefon</span>
                    <span className="text-sm font-semibold text-white mt-1 block group-hover:text-accent-gold transition-colors">
                      {seller.phone}
                    </span>
                  </div>
                </a>
              )}

            </div>
          </Card>
        </div>

        {/* Right Column - Tabs & Tab Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tab buttons */}
          <div className="flex border-b border-white/10 bg-glass/40 p-1.5 rounded-xl border border-white/5">
            <button
              onClick={() => setActiveTab('listings')}
              className={cn(
                "flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2",
                activeTab === 'listings'
                  ? "bg-gold-gradient text-secondary-900 shadow-md font-bold"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Car className="h-4.5 w-4.5" />
              Anunțuri active ({listings.length})
            </button>
            {reviewsAvailable && <button
              onClick={() => setActiveTab('reviews')}
              className={cn(
                "flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2",
                activeTab === 'reviews'
                  ? "bg-gold-gradient text-secondary-900 shadow-md font-bold"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Star className="h-4.5 w-4.5" />
              Recenzii ({totalReviews})
            </button>}
          </div>

          {/* Active Listings Tab */}
          {activeTab === 'listings' && (
            <div className="space-y-6">
              {listings.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {listings.map((car) => (
                    <CarCard
                      key={car.id}
                      car={car as any}
                      onFavorite={handleFavorite}
                      onCompare={handleCompare}
                      isFavorited={isFavorited(car.id)}
                      isInComparison={isInComparison(car.id)}
                    />
                  ))}
                </div>
              ) : (
                <Card variant="elevated" className="bg-glass/80 border-white/5 text-center py-12">
                  <div className="h-14 w-14 bg-white/5 border border-white/10 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Car className="h-6 w-6" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-1">Fără anunțuri active</h3>
                  <p className="text-gray-400 text-sm max-w-sm mx-auto">
                    Acest vânzător nu are niciun anunț publicat în acest moment.
                  </p>
                </Card>
              )}
            </div>
          )}

          {/* Reviews Tab */}
          {reviewsAvailable && activeTab === 'reviews' && (
            <div className="space-y-6">
              {/* Reviews rating overview card */}
              <Card variant="elevated" padding="lg" className="bg-glass border-white/10 shadow-2xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  <div className="text-center md:border-r border-white/5 md:pr-6 py-4">
                    <span className="text-5xl font-black text-white">{averageRating}</span>
                    <div className="flex items-center justify-center text-accent-gold mt-2 mb-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={cn(
                            "h-5 w-5", 
                            star <= Math.round(Number(averageRating)) ? "fill-accent-gold" : "text-white/20"
                          )} 
                        />
                      ))}
                    </div>
                    <span className="text-xs font-semibold text-gray-400">Media din {totalReviews} recenzii</span>
                  </div>

                  <div className="md:col-span-2 space-y-2 py-2">
                    {starsBreakdown.map(({ star, count, percentage }) => (
                      <div key={star} className="flex items-center gap-3 text-xs sm:text-sm">
                        <span className="w-3 text-gray-400 font-bold">{star}</span>
                        <Star className="h-3.5 w-3.5 text-accent-gold fill-accent-gold flex-shrink-0" />
                        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                          <div 
                            className="h-full bg-gold-gradient rounded-full" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-gray-400 font-semibold">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Review submit form */}
              {currentUser && currentUser.id !== seller.id && canReview ? (
                <Card variant="elevated" padding="lg" className="bg-glass border-white/10 shadow-2xl">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-accent-gold" />
                    Lasă o recenzie
                  </h3>

                  <Form method="post" className="space-y-4">
                    {actionData && 'error' in actionData && (
                      <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                        {actionData.error}
                      </div>
                    )}

                    {actionData && 'success' in actionData && actionData.success && (
                      <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 animate-fade-in">
                        <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                        Recenzia ta a fost publicată cu succes! Mulțumim pentru feedback.
                      </div>
                    )}

                    {/* Star selector */}
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-2">
                        Nota acordată *
                      </label>
                      <input type="hidden" name="rating" value={rating} />
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(null)}
                            className="focus:outline-none transition-transform duration-200 hover:scale-110"
                            aria-label={`Acordă ${star} stele`}
                          >
                            <Star
                              className={cn(
                                "h-8 w-8 transition-all duration-200",
                                (hoverRating !== null ? star <= hoverRating : star <= rating)
                                  ? "text-accent-gold fill-accent-gold drop-shadow-[0_0_6px_rgba(212,175,55,0.4)]"
                                  : "text-white/20 fill-transparent hover:text-white/40"
                              )}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Comment text */}
                    <div>
                      <label htmlFor="comment" className="block text-xs sm:text-sm font-semibold text-gray-300 mb-2">
                        Comentariul tău *
                      </label>
                      <textarea
                        id="comment"
                        name="comment"
                        rows={4}
                        maxLength={1000}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Cum a fost experiența de tranzacționare cu acest vânzător? (minim 10 caractere)"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-accent-gold focus:border-accent-gold transition-all text-xs sm:text-sm"
                        required
                      />
                      <div className="flex justify-between items-center mt-1.5">
                        <span className={cn(
                          "text-[10px] sm:text-xs",
                          commentText.length >= 10 ? "text-gray-400" : "text-orange-400 font-semibold"
                        )}>
                          {commentText.length}/1000 caractere (minim 10)
                        </span>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting || commentText.length < 10}
                      className="bg-gold-gradient text-secondary-900 font-bold shadow-md hover:shadow-glow hover:scale-[1.01] active:scale-[0.99] transition-all border-none py-2.5 px-6 rounded-xl"
                    >
                      {isSubmitting ? 'Se trimite...' : 'Trimite recenzia'}
                    </Button>
                  </Form>
                </Card>
              ) : currentUser && currentUser.id !== seller.id ? (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center sm:p-5">
                  <p className="text-xs font-medium text-gray-300 sm:text-sm">
                    După ce discuți cu acest vânzător prin AutoFans, poți lăsa o recenzie verificată aici.
                  </p>
                </div>
              ) : !currentUser ? (
                <div className="bg-white/5 border border-white/5 rounded-xl p-4 sm:p-5 text-center">
                  <p className="text-gray-300 text-xs sm:text-sm font-medium">
                    Trebuie să fii conectat ca cumpărător pentru a lăsa o recenzie.
                  </p>
                  <Link to="/login" className="text-accent-gold hover:underline font-bold text-xs sm:text-sm mt-2 inline-block">
                    Conectează-te acum →
                  </Link>
                </div>
              ) : null}

              {/* Reviews list */}
              <div className="space-y-4">
                {reviews.length > 0 ? (
                  reviews.map((review) => {
                    const revReviewer = review.reviewer as any;
                    const reviewerName = revReviewer?.display_name || 'Utilizator';
                    const reviewerAvatar = revReviewer?.avatar_url;
                    
                    return (
                      <Card key={review.id} variant="elevated" padding="md" className="bg-glass/80 border-white/5 shadow-lg relative">
                        <div className="flex items-start gap-3 sm:gap-4">
                          {reviewerAvatar ? (
                            <img 
                              src={reviewerAvatar} 
                              alt={reviewerName} 
                              className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover border border-white/10"
                            />
                          ) : (
                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                              <User className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 mb-2">
                              <div>
                                <h4 className="font-bold text-white text-sm sm:text-base leading-none mb-1">
                                  {reviewerName}
                                </h4>
                                <div className="flex items-center text-accent-gold">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star 
                                      key={star} 
                                      className={cn(
                                        "h-3.5 w-3.5",
                                        star <= review.rating ? "fill-accent-gold text-accent-gold" : "text-white/15"
                                      )}
                                    />
                                  ))}
                                </div>
                              </div>
                              <span className="text-[10px] sm:text-xs text-gray-400 font-semibold self-start sm:self-center">
                                {formatRelativeTime(review.created_at)}
                              </span>
                            </div>
                            
                            <p className="text-gray-300 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                              {review.comment}
                            </p>
                          </div>
                        </div>
                      </Card>
                    );
                  })
                ) : (
                  <Card variant="elevated" className="bg-glass/80 border-white/5 text-center py-10">
                    <MessageCircle className="h-8 w-8 text-gray-500 mx-auto mb-3" />
                    <h3 className="text-white font-bold text-base mb-1">Nicio recenzie încă</h3>
                    <p className="text-gray-400 text-xs sm:text-sm">
                      Fii primul care lasă o recenzie pentru acest vânzător!
                    </p>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
