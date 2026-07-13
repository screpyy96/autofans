import { useEffect, useState } from 'react';
import { Link, redirect, Form, useFetcher, useLoaderData } from 'react-router';
import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import { getSupabaseServerClient } from '~/lib/supabase.server';
import type { Route } from "./+types/profile";
import { Button } from '~/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/Card';
import { Badge } from '~/components/ui/Badge';
import { NotificationPreferences } from '~/components/ui/NotificationPreferences';
import { Modal } from '~/components/ui/Modal'; // Added Modal import
import { NotificationType } from '~/types';
import type { NotificationPreferences as NotificationPreferencesType } from '~/types';
import { 
  User, 
  Settings, 
  Car, 
  Heart, 
  Bell, 
  Shield, 
  Edit,
  Plus,
  Eye,
  MessageCircle,
  TrendingUp,
  Star
} from 'lucide-react';
import { cn } from '~/lib/utils';
import { useFavorites } from '~/stores/useAppStore';
import { getSupabaseBrowserClient } from '~/lib/supabase.client';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Contul meu - AutoFans" },
    { name: "description", content: "Gestionează contul tău, anunțurile și preferințele pe AutoFans." },
  ];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabase, headers } = getSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const next = new URL(request.url).pathname;
    return redirect(`/login?next=${encodeURIComponent(next)}`, { headers });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, email, display_name, avatar_url, phone, is_verified, created_at')
    .eq('id', user.id)
    .single();

  let listings: any[] = [];
  let thumbs: Record<number, string> = {};
  if (profile?.role === 'seller') {
    const { data: userListings } = await supabase
      .from('listings')
      .select('id, slug, title, price, status, updated_at, images')
      .eq('owner_id', user.id)
      .order('updated_at', { ascending: false });
    listings = userListings || [];

    const paths = listings
      .map((l) => (l.images || []).find((i: any) => i.isMain)?.path || (l.images || [])[0]?.path)
      .filter(Boolean) as string[];
    if (paths.length) {
      const { data: signed } = await supabase.storage.from('listing-images').createSignedUrls(paths, 60 * 60);
      const map: Record<string, string> = {};
      for (const s of signed || []) {
        const it: any = s; if (it?.path && it?.signedUrl) map[it.path] = it.signedUrl as string;
      }
      listings.forEach((l) => {
        const p = (l.images || []).find((i: any) => i.isMain)?.path || (l.images || [])[0]?.path;
        if (p && map[p]) thumbs[l.id] = map[p];
      });
    }
  }

  const [{ data: verificationRequest }, { data: riskFlags }] = await Promise.all([
    supabase
      .from('verification_requests')
      .select('id, kind, status, created_at, review_note')
      .eq('user_id', user.id)
      .eq('kind', 'seller')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    profile?.role === 'seller'
      ? supabase
          .from('listing_risk_flags')
          .select('id, listing_id, flag_type, severity, created_at')
          .is('resolved_at', null)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  const [{ count: favoritesCount }, { data: favoriteRows }] = await Promise.all([
    supabase.from('favorites').select('listing_id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('favorites').select('listing_id, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
  ]);

  let favoriteListings: any[] = [];
  const favoriteIds = (favoriteRows || []).map((row: any) => row.listing_id);
  if (favoriteIds.length) {
    const { data: favoriteData } = await supabase
      .from('listings')
      .select('id, slug, title, price, currency, status, make, model, year, city, county')
      .in('id', favoriteIds);
    const byId = new Map((favoriteData || []).map((listing: any) => [listing.id, listing]));
    favoriteListings = favoriteIds.map((id: number) => byId.get(id)).filter(Boolean);
  }

  const listingIds = listings.map((listing) => listing.id);
  let viewsCount = 0;
  let contactsCount = 0;
  if (listingIds.length) {
    const [{ count: views }, { count: contacts }] = await Promise.all([
      supabase.from('listing_views').select('id', { count: 'exact', head: true }).in('listing_id', listingIds),
      supabase.from('listing_contacts').select('id', { count: 'exact', head: true }).in('listing_id', listingIds),
    ]);
    viewsCount = views || 0;
    contactsCount = contacts || 0;
  }

  const listingTitleById = new Map(listings.map((listing) => [listing.id, listing.title]));
  const openRiskFlags = (riskFlags || []).map((flag: any) => ({
    ...flag,
    listingTitle: listingTitleById.get(flag.listing_id) || 'Un anunț al tău',
  }));

  return {
    profile,
    listings,
    thumbs,
    favoriteListings,
    favoritesCount: favoritesCount || 0,
    viewsCount,
    contactsCount,
    verificationRequest: verificationRequest || null,
    openRiskFlags,
    userAuth: user,
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const { supabase, headers } = getSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/login?next=/profile', { headers });

  const formData = await request.formData();
  if (formData.get('intent') !== 'request-seller-verification') {
    return Response.json({ error: 'Cerere necunoscută.' }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_verified')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'seller') {
    return Response.json({ error: 'Doar conturile de vânzător pot solicita verificarea.' }, { status: 403 });
  }

  if (profile.is_verified) {
    return Response.json({ ok: true, message: 'Contul tău este deja verificat.' });
  }

  const { data: existing } = await supabase
    .from('verification_requests')
    .select('id')
    .eq('user_id', user.id)
    .eq('kind', 'seller')
    .eq('status', 'pending')
    .maybeSingle();

  if (existing) {
    return Response.json({ ok: true, message: 'Ai deja o solicitare în analiză.' });
  }

  const { error } = await supabase
    .from('verification_requests')
    .insert({ user_id: user.id, kind: 'seller' });

  if (error) {
    const isDuplicateRequest = error.code === '23505';
    return Response.json(
      { error: isDuplicateRequest ? 'Ai deja o solicitare în analiză.' : 'Nu am putut trimite solicitarea. Încearcă din nou.' },
      { status: isDuplicateRequest ? 409 : 400 },
    );
  }

  return Response.json({ ok: true, message: 'Solicitarea a fost trimisă. O verificăm manual înainte de a afișa badge-ul.' });
}

export default function Profile() {
  const {
    profile,
    listings = [],
    thumbs = {},
    favoriteListings = [],
    favoritesCount = 0,
    viewsCount = 0,
    contactsCount = 0,
    verificationRequest,
    openRiskFlags = [],
    userAuth,
  } = useLoaderData<typeof loader>();
  const verificationFetcher = useFetcher<typeof action>();
  const { favorites: localFavoriteIds } = useFavorites();
  const [recentFavoriteListings, setRecentFavoriteListings] = useState<any[]>(favoriteListings);

  useEffect(() => {
    let cancelled = false;
    setRecentFavoriteListings(favoriteListings);
    if (!localFavoriteIds.length) return;

    const loadLocalFavorites = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
          .from('listings')
          .select('id, slug, title, price, currency, status, make, model, city, county')
          .in('id', localFavoriteIds.slice(-3).reverse());
        if (error) throw error;
        if (!cancelled && data?.length) {
          const byId = new Map(data.map((listing: any) => [listing.id, listing]));
          setRecentFavoriteListings(localFavoriteIds.slice(-3).reverse().map((id) => byId.get(Number(id)) || byId.get(id)).filter(Boolean));
        }
      } catch (error) {
        console.warn('Unable to load recent local favorites:', error);
      }
    };

    void loadLocalFavorites();
    return () => { cancelled = true; };
  }, [favoriteListings, localFavoriteIds]);
  const role = profile?.role as 'buyer' | 'seller' | undefined;
  const verificationPending = verificationRequest?.status === 'pending' || verificationFetcher.data?.ok === true;
  
  const [activeTab, setActiveTab] = useState<'overview' | 'listings' | 'settings'>('overview');
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);

  // Profile fields state
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSaveChanges = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const { getSupabaseBrowserClient } = await import('~/lib/supabase.client');
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          phone: phone,
          avatar_url: avatarUrl
        })
        .eq('id', profile?.id);
      
      if (error) throw error;
      setSaveMessage({ type: 'success', text: 'Modificările au fost salvate cu succes!' });
    } catch (e: any) {
      setSaveMessage({ type: 'error', text: e.message || 'A apărut o eroare la salvare.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;
    
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const { getSupabaseBrowserClient } = await import('~/lib/supabase.client');
      const supabase = getSupabaseBrowserClient();
      
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${profile.id}/avatars/${Date.now()}-${safeName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('listing-images')
        .upload(path, file, {
          upsert: true,
          cacheControl: '3600',
          contentType: file.type
        });
        
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('listing-images')
        .getPublicUrl(path);
        
      setAvatarUrl(publicUrl);
      setSaveMessage({ type: 'success', text: 'Imaginea de profil a fost încărcată! Apasă pe „Salvează modificările” pentru a confirma.' });
    } catch (err: any) {
      setSaveMessage({ type: 'error', text: err.message || 'Eroare la încărcarea imaginii.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Notification preferences state (persisted in localStorage)
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferencesType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('autofans_notification_prefs');
      if (saved) return JSON.parse(saved) as NotificationPreferencesType;
    }
    return {
      inApp: true,
      email: true,
      push: false,
      sms: false,
      types: {
        [NotificationType.MESSAGE]: true,
        [NotificationType.PRICE_DROP]: true,
        [NotificationType.NEW_LISTING]: true,
        [NotificationType.SAVED_SEARCH_ALERT]: true,
        [NotificationType.APPOINTMENT_REMINDER]: true,
        [NotificationType.SYSTEM]: true,
      },
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00',
      },
    };
  });

  const handleSaveNotifPrefs = async (prefs: NotificationPreferencesType) => {
    setNotifPrefs(prefs);
    if (typeof window !== 'undefined') {
      localStorage.setItem('autofans_notification_prefs', JSON.stringify(prefs));
    }
  };

  // Dynamic user data from profile
  const user = {
    name: displayName || profile?.display_name || 'Utilizator AutoFans',
    email: profile?.email || userAuth?.email || 'email@autofans.ro',
    phone: phone || profile?.phone || 'Adaugă telefon în Setări',
    avatar: avatarUrl || profile?.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    isVerified: !!profile?.is_verified,
    memberSince: profile?.created_at ? new Date(profile.created_at).getFullYear().toString() : '2026',
    stats: {
      listings: listings.filter((listing) => listing.status === 'published').length,
      favorites: Math.max(favoritesCount, localFavoriteIds.length),
      views: viewsCount,
      contacts: contactsCount
    }
  };

  const tabs = [
    {
      id: 'overview',
      label: 'Prezentare generală',
      icon: User,
      shortLabel: 'Prezentare',
      description: 'Vedere de ansamblu a activității tale'
    },
    {
      id: 'listings',
      label: 'Anunțurile mele',
      icon: Car,
      shortLabel: 'Anunțuri',
      description: 'Gestionează anunțurile tale de vânzare'
    },
    {
      id: 'settings',
      label: 'Setări cont',
      icon: Settings,
      shortLabel: 'Setări',
      description: 'Configurează preferințele tale'
    },
  ] as const;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Seller status and quick actions */}
        <Card variant="elevated" padding="none" className="mb-6 p-4 sm:mb-8 sm:p-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white font-semibold">Tip cont</h2>
              <p className="text-gray-300 text-sm">{role === 'seller' ? 'Vânzător (poți publica anunțuri)' : 'Cumpărător (poți salva favorite și căutări)'}</p>
            </div>
            {role === 'seller' ? (
              <Link to="/dashboard">
                <Button variant="outline" size="sm">Deschide Dashboard</Button>
              </Link>
            ) : (
              <Form method="post" action="/dashboard">
                <input type="hidden" name="intent" value="promote" />
                <Button size="sm" className="bg-gold-gradient text-secondary-900">Devino vânzător</Button>
              </Form>
            )}
          </div>
        </Card>

        {role === 'seller' && (
          <Card variant="elevated" padding="lg" className="mb-6 sm:mb-8 border border-accent-gold/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Shield className="h-5 w-5 text-accent-gold" />
                Siguranță și verificare
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-white">
                    {user.isVerified ? 'Cont verificat' : verificationPending ? 'Solicitare în analiză' : 'Verifică-ți contul de vânzător'}
                  </p>
                  <p className="mt-1 max-w-2xl text-sm text-gray-300">
                    {user.isVerified
                      ? 'Badge-ul este afișat public pe anunțurile tale.'
                      : verificationPending
                        ? verificationFetcher.data?.message || 'Analizăm datele contului. Badge-ul apare numai după aprobarea manuală.'
                        : 'Trimite solicitarea, iar echipa AutoFans o verifică manual înainte de activarea badge-ului.'}
                  </p>
                </div>
                {!user.isVerified && !verificationPending && (
                  <verificationFetcher.Form method="post">
                    <input type="hidden" name="intent" value="request-seller-verification" />
                    <Button
                      type="submit"
                      className="bg-gold-gradient text-secondary-900"
                      disabled={verificationFetcher.state !== 'idle'}
                    >
                      {verificationFetcher.state === 'submitting' ? 'Se trimite...' : 'Solicită verificarea'}
                    </Button>
                  </verificationFetcher.Form>
                )}
              </div>

              {verificationFetcher.data?.error && (
                <p className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                  {verificationFetcher.data.error}
                </p>
              )}

              {openRiskFlags.length > 0 && (
                <div className="mt-5 border-t border-white/10 pt-5">
                  <p className="text-sm font-semibold text-amber-300">Anunțuri de verificat</p>
                  <div className="mt-3 space-y-2">
                    {openRiskFlags.map((flag: any) => (
                      <Link
                        key={flag.id}
                        to={`/create-listing?edit=${flag.listing_id}`}
                        className="flex items-center justify-between gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-100 transition-colors hover:bg-amber-500/15"
                      >
                        <span className="min-w-0 truncate">{flag.listingTitle}: VIN identic găsit într-un alt anunț</span>
                        <span className="shrink-0 font-medium">Verifică</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Profile Header - Mobile Optimized */}
        <Card variant="elevated" padding="lg" className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div className="relative">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-white/20"
              />
              {user.isVerified && (
                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1.5">
                  <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white truncate">{user.name}</h1>
                {user.isVerified && (
                  <Badge variant="success" className="bg-green-500/10 text-green-400 border-green-500/20 text-xs sm:text-sm">
                    <Shield className="h-3 w-3 mr-1" />
                    Verificat
                  </Badge>
                )}
              </div>
              <p className="text-gray-300 text-sm sm:text-base mb-1 truncate">{user.email}</p>
              <p className="text-xs sm:text-sm text-gray-400">Membru din {user.memberSince}</p>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-sm sm:text-base border-white/20 hover:bg-white/5"
              onClick={() => setActiveTab('settings')}
            >
              <Edit className="h-4 w-4" />
              Editează
            </Button>
          </div>

          {/* Stats - Mobile Optimized */}
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-5 sm:mt-8 sm:gap-6 sm:pt-6 lg:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center sm:p-4">
              <div className="mb-1.5 flex items-center justify-center gap-2 sm:mb-2">
                <Car className="h-4 w-4 text-accent-gold" />
                <div className="text-lg sm:text-2xl font-bold text-white">{user.stats.listings}</div>
              </div>
              <div className="text-xs sm:text-sm text-gray-300">Anunțuri active</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center sm:p-4">
              <div className="mb-1.5 flex items-center justify-center gap-2 sm:mb-2">
                <Heart className="h-4 w-4 text-red-400" />
                <div className="text-lg sm:text-2xl font-bold text-white">{user.stats.favorites}</div>
              </div>
              <div className="text-xs sm:text-sm text-gray-300">Favorite</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center sm:p-4">
              <div className="mb-1.5 flex items-center justify-center gap-2 sm:mb-2">
                <Eye className="h-4 w-4 text-blue-400" />
                <div className="text-lg sm:text-2xl font-bold text-white">{user.stats.views}</div>
              </div>
              <div className="text-xs sm:text-sm text-gray-300">Vizualizări</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center sm:p-4">
              <div className="mb-1.5 flex items-center justify-center gap-2 sm:mb-2">
                <MessageCircle className="h-4 w-4 text-green-400" />
                <div className="text-lg sm:text-2xl font-bold text-white">{user.stats.contacts}</div>
              </div>
              <div className="text-xs sm:text-sm text-gray-300">Contactări</div>
            </div>
          </div>
        </Card>

        {/* Tabs - Mobile Optimized */}
        <div className="mb-6 sm:mb-8">
          <div className="border-b border-white/10">
            <div className="-mb-px flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={cn(
                    'relative flex flex-1 items-center justify-center gap-2 px-2 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all group rounded-lg sm:mx-1 sm:flex-none sm:gap-3 sm:px-6 sm:py-4',
                    activeTab === tab.id
                      ? 'border-accent-gold text-accent-gold bg-gradient-to-r from-accent-gold/10 to-accent-gold/5 shadow-sm'
                      : 'border-transparent text-gray-400 hover:text-white hover:border-white/20 hover:bg-white/5'
                  )}
                  onClick={() => setActiveTab(tab.id)}
                  title={tab.description}
                >
                  <tab.icon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate font-semibold">
                    <span className="sm:hidden">{tab.shortLabel}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </span>

                  {/* Active indicator glow */}
                  {activeTab === tab.id && (
                    <div className="absolute inset-0 bg-gradient-to-r from-accent-gold/5 to-transparent rounded-lg border border-accent-gold/20" />
                  )}

                  {/* Subtle glow effect */}
                  <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-white/5 to-transparent" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            <Card variant="elevated" padding="lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Car className="h-5 w-5 text-accent-gold" />
                  Anunțurile mele recente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                </div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
              </CardContent>
            </Card>

            <Card variant="elevated" padding="lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Heart className="h-5 w-5 text-red-400" />
                  Favorite recente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentFavoriteListings.length > 0 ? recentFavoriteListings.map((listing: any) => (
                    <Link
                      key={listing.id}
                      to={`/car/${encodeURIComponent(listing.slug || listing.id)}`}
                      className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-white truncate">{listing.title || `${listing.make} ${listing.model}`}</h4>
                        <p className="text-sm text-gray-300 mt-1">
                          {Number(listing.price || 0).toLocaleString('ro-RO')} {listing.currency || 'EUR'} • {listing.city || 'Locație nespecificată'}
                        </p>
                      </div>
                      <Badge variant="success" size="sm" className="bg-green-500/10 text-green-400 border-green-500/20">
                        {listing.status === 'published' ? 'Disponibil' : listing.status}
                      </Badge>
                    </Link>
                  )) : (
                    <p className="py-6 text-center text-gray-400">Nu ai favorite salvate încă.</p>
                  )}

                  <div className="text-center py-4">
                    <Link to="/create-listing">
                      <Button variant="outline" className="flex items-center gap-2 mx-auto border-white/20 hover:bg-white/5 px-4 py-2">
                        <Plus className="h-4 w-4" />
                        Adaugă anunț nou
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'listings' && (
          <div className="space-y-4 text-center">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-xl font-bold text-white">Anunțurile mele</h3>
              <Link to="/create-listing" className="w-full sm:w-auto">
                <Button className="flex w-full items-center justify-center gap-2 bg-gold-gradient font-semibold text-secondary-900 sm:w-auto">
                  <Plus className="h-4 w-4" />
                  Adaugă anunț
                </Button>
              </Link>
            </div>
            {listings.length === 0 ? (
              <Card variant="elevated" padding="lg" className="text-center relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute inset-0 bg-gradient-to-br from-accent-gold/5 via-transparent to-transparent opacity-50" />
                <div className="relative">
                  <div className="py-12 sm:py-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-accent-gold/20 to-accent-gold/10 border border-accent-gold/20 rounded-full mb-6 shadow-lg">
                      <Car className="h-8 w-8 sm:h-10 sm:w-10 text-accent-gold" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-semibold text-white mb-4">
                      Gestionează-ți anunțurile
                    </h3>
                    <p className="text-gray-300 mb-8 max-w-md mx-auto text-sm sm:text-base leading-relaxed">
                      Creează și gestionează toate anunțurile tale de mașini. Adaugă primul tău anunț pentru a începe să vinzi.
                    </p>
                    <Link to="/create-listing">
                      <Button variant="primary" className="flex items-center gap-2 mx-auto bg-gold-gradient text-secondary-900 hover:shadow-glow px-6 py-3 font-semibold">
                        <Plus className="h-4 w-4" />
                        Adaugă primul anunț
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {listings.map((l: any) => (
                  <Card key={l.id} variant="elevated" padding="none" className="flex flex-wrap items-center gap-3 p-4 sm:flex-nowrap sm:p-6">
                    {thumbs[l.id] ? (
                      <img src={thumbs[l.id]} alt="thumb" className="h-16 w-20 shrink-0 rounded-lg border border-white/10 object-cover" />
                    ) : (
                      <div className="h-16 w-20 shrink-0 rounded-lg border border-white/10 bg-white/5" />
                    )}
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-white font-medium truncate">{l.title}</p>
                      <p className="text-gray-400 text-sm">
                        {l.status === 'published' ? 'Publicat' : 'Ciornă'} • {new Date(l.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex w-full items-center gap-2 border-t border-white/10 pt-3 sm:w-auto sm:border-0 sm:pt-0">
                      <span className="mr-auto shrink-0 text-sm font-semibold text-accent-gold sm:mr-2 sm:text-base">€{Number(l.price).toLocaleString()}</span>
                      <Link to={`/create-listing?edit=${l.id}`} className="flex-1 sm:flex-none">
                        <Button variant="outline" size="sm" className="w-full border-accent-gold/20 text-accent-gold">
                          Editează
                        </Button>
                      </Link>
                      <Link to={`/car/${l.slug || l.id}`} className="flex-1 sm:flex-none">
                        <Button variant="outline" size="sm" className="w-full">
                          Vezi
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6 sm:space-y-8">
            <Card variant="elevated" padding="lg">
              <CardHeader>
                <CardTitle className="text-white">Informații personale</CardTitle>
              </CardHeader>
              <CardContent>
                {saveMessage && (
                  <div className={cn(
                    "mb-6 p-4 rounded-xl text-sm font-semibold border",
                    saveMessage.type === 'success' 
                      ? "bg-green-500/10 text-green-400 border-green-500/20"
                      : "bg-red-500/10 text-red-400 border-red-500/20"
                  )}>
                    {saveMessage.text}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nume complet
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Introdu numele tău complet"
                      className="w-full px-3 py-2 sm:py-3 bg-white/5 border border-white/20 text-white rounded-lg focus:ring-2 focus:ring-accent-gold focus:border-accent-gold transition-all text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email (Nu poate fi schimbat)
                    </label>
                    <input
                      type="email"
                      value={user.email}
                      className="w-full px-3 py-2 sm:py-3 bg-white/5 border border-white/20 text-gray-400 rounded-lg text-sm sm:text-base cursor-not-allowed opacity-80"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Introdu numărul tău de telefon"
                      className="w-full px-3 py-2 sm:py-3 bg-white/5 border border-white/20 text-white rounded-lg focus:ring-2 focus:ring-accent-gold focus:border-accent-gold transition-all text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Imagine Profil (Avatar)
                    </label>
                    <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-3.5 rounded-xl">
                      {avatarUrl ? (
                        <img 
                          src={avatarUrl} 
                          alt="Avatar Previzualizare" 
                          className="h-14 w-14 rounded-full object-cover border border-accent-gold/40 shadow-sm"
                        />
                      ) : (
                        <div className="h-14 w-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400">
                          <User className="h-6 w-6" />
                        </div>
                      )}
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarFileChange}
                          className="hidden"
                          id="avatar-upload-input"
                        />
                        <label 
                          htmlFor="avatar-upload-input"
                          className="inline-flex items-center px-4 py-2 bg-white/5 border border-white/20 hover:border-accent-gold/40 hover:bg-white/10 text-white text-xs font-semibold rounded-lg cursor-pointer transition-all active:scale-95"
                        >
                          Alege imagine
                        </label>
                        <p className="text-[10px] text-gray-400 mt-1.5">JPEG, PNG, WebP (max. 5MB)</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <Button 
                    variant="primary" 
                    onClick={handleSaveChanges} 
                    disabled={isSaving}
                    className="bg-gold-gradient text-secondary-900 hover:shadow-glow font-semibold"
                  >
                    {isSaving ? 'Se salvează...' : 'Salvează modificările'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated" padding="lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Bell className="h-5 w-5 text-accent-gold" />
                  Preferințe notificări
                </CardTitle>
              </CardHeader>
              <CardContent>
                <NotificationPreferences
                  preferences={notifPrefs}
                  onSave={handleSaveNotifPrefs}
                />
              </CardContent>
            </Card>
          </div>
        )}

    </div>
  );
}
