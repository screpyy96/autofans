import { useState } from 'react';
import { Link, useLoaderData } from 'react-router';
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
  Heart
} from 'lucide-react';
import { Card } from '~/components/ui/Card';
import { Button } from '~/components/ui/Button';
import { Badge } from '~/components/ui/Badge';
import { getSupabaseServerClient } from '~/lib/supabase.server';

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

const DEMO_GARAGE_MAP: Record<string, any> = {
  "bmw-m3-e46-laguna-seca": {
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
    story: `Această mașină a fost achiziționată în 2022 ca un proiect de restaurare totală. Fiind un fan înrăit al șasiului E46 M3, am reconstruit întreaga punte spate cu ranforsări Redish Motorsport, am schimbat cuzineții de bielă preventiv și am refăcut vanos-ul cu piese Beisan Systems.

Mașina nu are nicio pată de rugină și este păstrată exclusiv în garaj încălzit. Este o plăcere absolută de condus atât pe drumuri montane cât și la event-uri de track day.`,
    images: [
      { url: "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1400&q=80" },
      { url: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1400&q=80" },
      { url: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1400&q=80" }
    ],
    upvotesCount: 142,
    isForSale: true,
    salePrice: 38500,
    ownerId: "seller-1",
    ownerName: "Alex M.",
    ownerAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
  }
};

export async function loader({ params, request }: { params: any; request: Request }) {
  const { slug } = params;
  try {
    const { supabase } = getSupabaseServerClient(request);
    const { data: v } = await supabase
      .from('garage_vehicles')
      .select('*, owner:profiles(id, display_name, avatar_url)')
      .eq('slug', slug)
      .single();

    if (v) {
      return {
        vehicle: {
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
        }
      };
    }
  } catch (e) {
    // Fallback
  }
  return { vehicle: DEMO_GARAGE_MAP[slug] || DEMO_GARAGE_MAP["bmw-m3-e46-laguna-seca"] };
}

export default function GarageDetail() {
  const { vehicle } = useLoaderData<typeof loader>();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [upvotes, setUpvotes] = useState(vehicle.upvotesCount);
  const [hasUpvoted, setHasUpvoted] = useState(false);

  const handleUpvote = () => {
    if (!hasUpvoted) {
      setUpvotes((prev: number) => prev + 1);
      setHasUpvoted(true);
    } else {
      setUpvotes((prev: number) => prev - 1);
      setHasUpvoted(false);
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
            {/* Upvote Button */}
            <Button
              onClick={handleUpvote}
              className={`px-5 py-3 rounded-xl font-bold transition-all flex items-center gap-2 border-none shadow-lg ${
                hasUpvoted
                  ? 'bg-red-500 text-white shadow-red-500/30 scale-105'
                  : 'bg-white/10 hover:bg-accent-gold/20 text-accent-gold border border-accent-gold/30'
              }`}
            >
              <Flame className={`h-5 w-5 ${hasUpvoted ? 'fill-white text-white' : 'fill-accent-gold text-accent-gold'}`} />
              <span>{hasUpvoted ? 'Respect Acordat!' : 'Dă Respect (Upvote)'}</span>
              <span className="bg-black/40 px-2 py-0.5 rounded-full text-xs ml-1">{upvotes}</span>
            </Button>

            {/* Direct Contact if for sale */}
            {vehicle.isForSale && vehicle.ownerId && (
              <Link to={`/messages?seller=${vehicle.ownerId}`}>
                <Button className="bg-gold-gradient text-secondary-950 font-black px-5 py-3 rounded-xl shadow-glow hover:scale-[1.02] transition-all border-none">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Cumpără / Contactează
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-3xl overflow-hidden bg-black/60 border border-white/10 shadow-2xl">
            <img
              src={vehicle.images[activeImageIndex]?.url || vehicle.images[0]?.url}
              alt={vehicle.title}
              className="w-full h-full object-cover"
            />
          </div>

          {vehicle.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {vehicle.images.map((img: any, idx: number) => (
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

        {/* Grid Content: Specs & Story */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Main Column: Story & Mod List */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Modifications list */}
            {vehicle.modifications && vehicle.modifications.length > 0 && (
              <Card variant="elevated" className="bg-glass border-white/10 p-6 sm:p-8 space-y-4 shadow-xl">
                <h3 className="text-xl font-extrabold text-white flex items-center gap-2 border-b border-white/10 pb-4">
                  <Wrench className="h-5 w-5 text-accent-gold" />
                  Modificări & Piese Tuning
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {vehicle.modifications.map((mod: string, idx: number) => (
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
