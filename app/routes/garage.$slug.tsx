import { useState, useEffect } from 'react';
import { Link, useLoaderData, Form, useActionData, useLocation, useNavigate } from 'react-router';
import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import { 
  Flame, 
  ArrowLeft, 
  Wrench, 
  Tag, 
  MessageSquare, 
  Share2, 
  CheckCircle2, 
  Calendar, 
  Zap, 
  Shield, 
  User,
  Send,
  Heart,
  AlertCircle
} from 'lucide-react';
import { Card } from '~/components/ui/Card';
import { Button } from '~/components/ui/Button';
import { Badge } from '~/components/ui/Badge';
import { getSupabaseServerClient, hasSupabaseAuthCookie } from '~/lib/supabase.server';
import { getSupabaseBrowserClient } from '~/lib/supabase.client';
import { createBrowserClient } from '@supabase/ssr';

export function meta({ data }: { data: any }) {
  const vehicle = data?.vehicle;
  const title = vehicle 
    ? `${vehicle.title} - Garajul AutoFans` 
    : "Vehicul Garaj - AutoFans.ro";
  const description = vehicle?.story || "Vezi povestea și modificările acestui vehicul pe AutoFans.ro";
  const image = vehicle?.images[0]?.url || "https://www.autofans.ro/hero_background.jpg";

  return [
    { title },
    { name: "description", content: description },
    { name: "robots", content: "index,follow,max-image-preview:large" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: image },
  ];
}

export async function loader({ params, request }: LoaderFunctionArgs) {
  const { slug } = params;
  const { supabase } = getSupabaseServerClient(request);

  let user = null;
  if (hasSupabaseAuthCookie(request)) {
    const { data: userData } = await supabase.auth.getUser();
    user = userData.user;
  }

  // Fetch vehicle details from DB
  const { data: v } = await supabase
    .from('garage_vehicles')
    .select('*, owner:profiles(id, display_name, avatar_url)')
    .eq('slug', slug)
    .single();

  // Fetch comments
  const { data: comments } = v ? await supabase
    .from('garage_comments')
    .select('id, comment, created_at, user:profiles(display_name, avatar_url)')
    .eq('vehicle_id', v.id)
    .order('created_at', { ascending: true }) : { data: [] };

  // Check if current user upvoted
  let userHasUpvoted = false;
  if (user && v) {
    const { data: upvote } = await supabase
      .from('garage_upvotes')
      .select('vehicle_id')
      .eq('vehicle_id', v.id)
      .eq('user_id', user.id)
      .maybeSingle();
    userHasUpvoted = !!upvote;
  }

  const fallbackVehicle = {
    id: "g-1",
    title: "BMW M3 E46 - Track Tool & OEM Plus",
    slug: "bmw-m3-e46-laguna-seca",
    make: "BMW",
    model: "M3 E46",
    year: 2003,
    engine: "3.2L S54 Inline-6",
    powerHp: 360,
    modifications: [
      "Admisie Carbon Karbonius CSL (Sunet incredibil)",
      "Suspensie KW V3 Clubsport reglabilă pe 2 căi",
      "Sistem de frânare AP Racing 6 pistoane față / 4 pistoane spate",
      "Evacuare Eisenmann Race 4x76mm stainless steel",
      "Jante BBS E88 pe 18 inch cu anvelope Michelin Cup 2",
      "Scaune Scoică Recaro Pole Position cu prinderi Macht Schnell"
    ],
    story: `Această mașină a fost achiziționată în 2022 ca un proiect de restaurare totală. Fiind un fan înrăit al șasiului E46 M3, am reconstruit întreaga punte spate cu ranforsări Redish Motorsport, am schimbat cuzineții de bielă preventiv și am refăcut vanos-ul cu piese Beisan Systems.`,
    images: [
      { url: "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1400&q=80" },
      { url: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1400&q=80" },
    ],
    upvotesCount: 142,
    isForSale: true,
    salePrice: 38500,
    ownerId: "seller-1",
    ownerName: "Alex M.",
    ownerAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
  };

  const currentVehicle = v ? {
    id: v.id,
    title: v.title,
    slug: v.slug,
    make: v.make,
    model: v.model,
    year: v.year,
    engine: v.engine || '',
    powerHp: v.power_hp || 0,
    modifications: v.modifications || [],
    story: v.story || '',
    images: v.images || [],
    upvotesCount: v.upvotes_count || 0,
    isForSale: v.is_for_sale || false,
    salePrice: v.sale_price || null,
    ownerId: v.owner?.id || '',
    ownerName: v.owner?.display_name || 'Membru AutoFans',
    ownerAvatar: v.owner?.avatar_url || null
  } : fallbackVehicle;

  return {
    vehicle: currentVehicle,
    comments: comments || [],
    userHasUpvoted,
    user
  };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { supabase } = getSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return Response.json({ error: "Trebuie să fii conectat." }, { status: 401 });

  const formData = await request.formData();
  const actionType = String(formData.get("actionType"));
  const vehicleId = String(formData.get("vehicleId"));

  if (actionType === "upvote") {
    // Upvote logic
    const { data: existing } = await supabase
      .from('garage_upvotes')
      .select('vehicle_id')
      .eq('vehicle_id', vehicleId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      await supabase.from('garage_upvotes').delete().eq('vehicle_id', vehicleId).eq('user_id', user.id);
      await supabase.rpc('decrement_garage_upvotes', { vid: vehicleId });
    } else {
      await supabase.from('garage_upvotes').insert({ vehicle_id: vehicleId, user_id: user.id });
      await supabase.rpc('increment_garage_upvotes', { vid: vehicleId });
    }
    return Response.json({ success: true });
  }

  if (actionType === "comment") {
    const commentText = String(formData.get("commentText") || "").trim();
    if (!commentText) return Response.json({ error: "Comentariul nu poate fi gol." }, { status: 400 });

    await supabase.from('garage_comments').insert({
      vehicle_id: vehicleId,
      user_id: user.id,
      comment: commentText
    });
    return Response.json({ success: true });
  }

  return Response.json({ success: true });
}

export default function GarageDetail() {
  const { vehicle, comments: initialComments, userHasUpvoted: initialUpvoted, user } = useLoaderData<typeof loader>();
  const location = useLocation();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [upvotes, setUpvotes] = useState(vehicle?.upvotesCount || 0);
  const [hasUpvoted, setHasUpvoted] = useState(initialUpvoted);
  const [commentsList, setCommentsList] = useState(Array.isArray(initialComments) ? initialComments : []);
  const [newComment, setNewComment] = useState('');

  const imagesList = (Array.isArray(vehicle?.images) && vehicle.images.length > 0)
    ? vehicle.images
    : [{ url: "https://www.autofans.ro/hero_background.jpg" }];
  const modsList = Array.isArray(vehicle?.modifications) ? vehicle.modifications : [];
  const safeCommentsList = Array.isArray(commentsList) ? commentsList : [];

  // Live Supabase Realtime Subscription for comments & upvotes
  useEffect(() => {
    if (!vehicle?.id) return;
    const supabaseUrl = (window as any).ENV?.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
    const supabaseAnonKey = (window as any).ENV?.VITE_SUPABASE_ANON_KEY || 'placeholder';
    const client = createBrowserClient(supabaseUrl, supabaseAnonKey);

    const channel = client
      .channel(`garage-vehicle-${vehicle.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'garage_comments', filter: `vehicle_id=eq.${vehicle.id}` },
        (payload) => {
          setCommentsList((prev: any[]) => [...(Array.isArray(prev) ? prev : []), payload.new]);
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [vehicle?.id]);

  const handleUpvoteClick = () => {
    if (!hasUpvoted) {
      setUpvotes((prev: number) => prev + 1);
      setHasUpvoted(true);
    } else {
      setUpvotes((prev: number) => prev - 1);
      setHasUpvoted(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newComment.trim();
    if (!text) return;

    const tempComment = {
      id: Math.random().toString(),
      comment: text,
      created_at: new Date().toISOString(),
      user: {
        display_name: user?.email ? user.email.split('@')[0] : 'Tu',
        avatar_url: null
      }
    };
    setCommentsList((prev: any[]) => [...(Array.isArray(prev) ? prev : []), tempComment]);
    setNewComment('');

    try {
      const supabase = getSupabaseBrowserClient();
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        await supabase.from('garage_comments').insert({
          vehicle_id: vehicle.id,
          user_id: authData.user.id,
          comment: text
        });
      }
    } catch (err) {
      console.error('Eroare la salvarea comentariului în Supabase:', err);
    }
  };

  return (
    <div className="min-h-screen bg-premium-gradient text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
        
        {/* Back Link */}
        <Link to="/garage" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-accent-gold transition-colors font-semibold">
          <ArrowLeft className="h-4 w-4" />
          Înapoi la Garajul Comunității
        </Link>

        {/* Top Header & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-glass p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="bg-accent-gold/20 text-accent-gold border-accent-gold/30 px-2.5 py-0.5 text-xs font-bold">
                {vehicle.make} {vehicle.model}
              </Badge>
              {vehicle.isForSale && (
                <Badge variant="success" className="bg-green-500/20 text-green-400 border-green-500/30 px-2.5 py-0.5 text-xs font-bold animate-pulse">
                  🏷️ DE VÂNZARE • {vehicle.salePrice?.toLocaleString('ro-RO')} €
                </Badge>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white">{vehicle.title}</h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">
              An {vehicle.year} • Motor {vehicle.engine} • {vehicle.powerHp} CP
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Realtime Upvote Form */}
            <Form method="post" onSubmit={handleUpvoteClick}>
              <input type="hidden" name="actionType" value="upvote" />
              <input type="hidden" name="vehicleId" value={vehicle.id} />
              <Button
                type="submit"
                variant={hasUpvoted ? "danger" : "secondary"}
                className={`px-5 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg ${
                  hasUpvoted
                    ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white border-red-500/50 shadow-red-500/30 scale-105'
                    : 'bg-secondary-900/90 border border-accent-gold/50 text-accent-gold hover:bg-accent-gold/20 hover:text-white'
                }`}
              >
                <Flame className={`h-5 w-5 ${hasUpvoted ? 'fill-white text-white' : 'fill-accent-gold text-accent-gold'}`} />
                <span className="font-black text-sm">{hasUpvoted ? 'Respect Acordat!' : 'Dă Respect (Upvote)'}</span>
                <span className="bg-black/70 border border-white/20 text-white px-2.5 py-0.5 rounded-full text-xs font-black ml-1 shadow-inner">{upvotes}</span>
              </Button>
            </Form>

            {/* Direct Contact if for sale */}
            {vehicle.isForSale && vehicle.ownerId && (
              <Link to={`/messages?seller=${vehicle.ownerId}`}>
                <Button variant="primary" className="bg-gold-gradient text-secondary-950 font-black px-5 py-3 rounded-xl shadow-glow hover:scale-[1.02] transition-all border-none flex items-center gap-2 text-sm">
                  <MessageSquare className="h-5 w-5 text-secondary-950" />
                  <span>Cumpără / Contactează</span>
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-3xl overflow-hidden bg-black/60 border border-white/10 shadow-2xl">
            <img
              src={imagesList[activeImageIndex]?.url || imagesList[0]?.url}
              alt={vehicle.title}
              className="w-full h-full object-cover"
            />
          </div>

          {imagesList.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {imagesList.map((img: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-24 h-16 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                    activeImageIndex === idx ? 'border-accent-gold scale-105 shadow-glow' : 'border-white/10 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Grid Content: Specs, Story & Live Comments */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Main Column: Story, Mod List & Live Chat Comments */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Modifications list */}
            {modsList.length > 0 && (
              <Card variant="elevated" className="bg-glass border-white/10 p-6 sm:p-8 space-y-4 shadow-xl">
                <h3 className="text-xl font-extrabold text-white flex items-center gap-2 border-b border-white/10 pb-4">
                  <Wrench className="h-5 w-5 text-accent-gold" />
                  Modificări & Piese Tuning
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {modsList.map((mod: string, idx: number) => (
                    <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-start gap-2.5 text-xs sm:text-sm text-gray-200">
                      <CheckCircle2 className="h-4 w-4 text-accent-gold flex-shrink-0 mt-0.5" />
                      <span>{mod}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Vehicle Story */}
            <Card variant="elevated" className="bg-glass border-white/10 p-6 sm:p-8 space-y-4 shadow-xl">
              <h3 className="text-xl font-extrabold text-white flex items-center gap-2 border-b border-white/10 pb-4">
                <Zap className="h-5 w-5 text-accent-gold" />
                Povestea Mașinii
              </h3>
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                {vehicle.story}
              </p>
            </Card>

            {/* Live Discussion & Comments Section */}
            <Card variant="elevated" className="bg-glass border-white/10 p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-accent-gold" />
                  Comentarii & Discuții Live ({safeCommentsList.length})
                </h3>
                <span className="text-xs text-green-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
                  Realtime Active
                </span>
              </div>

              {/* Comments List */}
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {safeCommentsList.length > 0 ? (
                  safeCommentsList.map((c: any) => (
                    <div key={c.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-accent-gold/20 flex items-center justify-center text-accent-gold text-xs font-bold">
                            {(c.user?.display_name || 'U')[0]}
                          </div>
                          <span className="text-xs font-bold text-white">{c.user?.display_name || 'Utilizator'}</span>
                        </div>
                        <span className="text-[10px] text-gray-400">
                          {new Date(c.created_at).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-200 pl-8">{c.comment}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 text-center py-6">
                    Niciun comentariu încă. Fii primul care adresează o întrebare despre acest proiect!
                  </p>
                )}
              </div>

              {/* Add Comment Form or Auth Required Notice */}
              {user ? (
                <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Scrie un comentariu sau o întrebare despre proiect..."
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-accent-gold"
                  />
                  <Button
                    type="submit"
                    disabled={!newComment.trim()}
                    className="bg-gold-gradient text-secondary-950 font-bold px-4 py-3 rounded-xl border-none"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              ) : (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 text-center space-y-3">
                  <p className="text-xs sm:text-sm text-gray-300 font-medium">
                    🔒 Trebuie să fii autentificat pentru ca comentariile tale să se salveze în baza de date!
                  </p>
                  <Link to={`/login?next=${encodeURIComponent(location.pathname)}`}>
                    <Button variant="primary" className="bg-gold-gradient text-secondary-950 font-black px-6 py-2.5 rounded-xl text-xs sm:text-sm shadow-glow border-none">
                      Loghează-te pentru a comenta
                    </Button>
                  </Link>
                </div>
              )}
            </Card>

          </div>

          {/* Sidebar: Owner & Specs */}
          <div className="space-y-6">
            
            {/* Owner Info */}
            <Card variant="elevated" className="bg-glass border-white/10 p-6 space-y-4 text-center shadow-xl">
              <div className="w-20 h-20 rounded-full mx-auto overflow-hidden border-2 border-accent-gold/40 shadow-glow">
                {vehicle.ownerAvatar ? (
                  <img src={vehicle.ownerAvatar} alt={vehicle.ownerName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-accent-gold/20 flex items-center justify-center text-accent-gold text-2xl font-bold">
                    {vehicle.ownerName[0]}
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-lg font-bold text-white">{vehicle.ownerName}</h4>
                <p className="text-xs text-gray-400">Proprietar Garaj AutoFans</p>
              </div>

              {vehicle.isForSale && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 text-center space-y-2">
                  <span className="text-xs text-green-400 font-bold block">🏷️ ACEASTĂ MAȘINĂ ESTE DE VÂNZARE</span>
                  <span className="text-2xl font-black text-white">{vehicle.salePrice?.toLocaleString('ro-RO')} €</span>
                  {vehicle.ownerId && (
                    <Link to={`/messages?seller=${vehicle.ownerId}`} className="block">
                      <Button className="w-full bg-gold-gradient text-secondary-950 font-black py-2.5 rounded-xl shadow-md border-none text-xs">
                        Trimite Mesaj Proprietarului
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </Card>

          </div>

        </div>

      </div>
    </div>
  );
}
