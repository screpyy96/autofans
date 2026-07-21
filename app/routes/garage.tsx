import { useState } from 'react';
import { Link, useLoaderData } from 'react-router';
import { Car, Flame, Plus, ShieldCheck, Heart, Sparkles, Tag, ArrowRight, Wrench, MessageSquare } from 'lucide-react';
import { Card } from '~/components/ui/Card';
import { Button } from '~/components/ui/Button';
import { Badge } from '~/components/ui/Badge';
import { getSupabaseServerClient } from '~/lib/supabase.server';

export function meta() {
  const title = "Garajul Comunității - Proiecte Auto, Mașini de Colecție și Anunțuri | AutoFans.ro";
  const description = "Descoperă garajele membrilor AutoFans: proiecte de tuning, mașini modificate, istorice și mașini scoase la vânzare direct din garajul proprietarului.";
  return [
    { title },
    { name: "description", content: description },
    { name: "robots", content: "index,follow,max-image-preview:large" },
    { tagName: "link", rel: "canonical", href: "https://www.autofans.ro/garage" },
  ];
}

const DEMO_GARAGE_VEHICLES = [
  {
    id: "g-1",
    title: "BMW M3 E46 - Track Tool & OEM Plus",
    slug: "bmw-m3-e46-laguna-seca",
    make: "BMW",
    model: "M3 E46",
    year: 2003,
    engine: "3.2L S54 Inline-6",
    powerHp: 360,
    modifications: ["Admisie Karbonius CSL", "Suspensie KW V3 Clubsport", "Frâne AP Racing 6 Pistoane", "Evacuare Eisenmann Race"],
    story: "Pasiune pură construită în 4 ani. Mașina a fost restaurată complet de la chassis la ultimul șurub OEM. Folosită doar în weekend și la event-uri speciale.",
    images: [{ url: "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80" }],
    upvotesCount: 142,
    isForSale: true,
    salePrice: 38500,
    ownerName: "Alex M.",
    ownerAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
  },
  {
    id: "g-2",
    title: "Porsche 911 GT3 (991.2) - Clubsport Package",
    slug: "porsche-911-gt3-991-2",
    make: "Porsche",
    model: "911 GT3",
    year: 2018,
    engine: "4.0L Atmospheric Flat-6",
    powerHp: 500,
    modifications: ["Pachet Clubsport OEM", "Rollcage Titan Manthey", "Scaune Scoică Carbon 918"],
    story: "Achiziționată de nouă din Germania. Folosită exclusiv pentru roadtrip-uri montane și track days pe Nürburgring & MotorPark Romania. Fără niciun accident.",
    images: [{ url: "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80" }],
    upvotesCount: 218,
    isForSale: false,
    salePrice: null,
    ownerName: "Mihai R.",
    ownerAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
  },
  {
    id: "g-3",
    title: "Golf 7 R Stage 3 - 520 HP Build",
    slug: "vw-golf-7-r-stage-3-520hp",
    make: "Volkswagen",
    model: "Golf 7 R",
    year: 2016,
    engine: "2.0 TSI EA888.3 (Forged Engine)",
    powerHp: 520,
    modifications: ["Turbină HGP Hybrid", "Pistoane & Biele Kovatech", "Evacuare Milltek Valved 3 inch", "Cooler Wagner Competition"],
    story: "Construită de la zero pentru performanță zilnică confortabilă. Peste 25.000€ investiți în piese de calitate supremă. Mașina dezvoltă 520 CP și 620 Nm stabili.",
    images: [{ url: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1200&q=80" }],
    upvotesCount: 98,
    isForSale: true,
    salePrice: 27900,
    ownerName: "Dan T.",
    ownerAvatar: null
  }
];

export async function loader({ request }: { request: Request }) {
  try {
    const { supabase } = getSupabaseServerClient(request);
    const { data: dbVehicles } = await supabase
      .from('garage_vehicles')
      .select('*, owner:profiles(display_name, avatar_url)')
      .order('upvotes_count', { ascending: false });

    if (dbVehicles && dbVehicles.length > 0) {
      const mapped = dbVehicles.map(v => ({
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
        ownerName: v.owner?.display_name || 'Membru AutoFans',
        ownerAvatar: v.owner?.avatar_url || null
      }));
      return { vehicles: mapped };
    }
  } catch (e) {
    // Fallback demo data
  }
  return { vehicles: DEMO_GARAGE_VEHICLES };
}

export default function GarageIndex() {
  const { vehicles } = useLoaderData<typeof loader>();
  const [filter, setFilter] = useState<'all' | 'for_sale'>('all');

  const filteredVehicles = filter === 'for_sale'
    ? vehicles.filter(v => v.isForSale)
    : vehicles;

  return (
    <div className="min-h-screen bg-premium-gradient text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">

        {/* Header Hero */}
        <div className="relative rounded-3xl overflow-hidden border border-white/10 p-8 sm:p-12 text-center bg-glass backdrop-blur-2xl shadow-2xl">
          <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-accent-gold/15 to-transparent pointer-events-none" />
          
          <Badge variant="secondary" className="bg-accent-gold/20 text-accent-gold border-accent-gold/30 px-3 py-1 mb-4 text-xs font-bold uppercase tracking-wider">
            🏎️ Comunitatea AutoFans
          </Badge>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
            Garajul Comunității
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed mb-6">
            Descoperă mașinile personale, proiectele de tuning și colecțiile membrilor AutoFans. Cunoaște povestea fiecărei mașini și cumpără direct de la proprietar cu istoric 100% transparent!
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/garage/add">
              <Button className="bg-gold-gradient text-secondary-900 font-bold px-6 py-3 rounded-xl shadow-glow hover:scale-[1.02] transition-all border-none">
                <Plus className="h-5 w-5 mr-2" />
                Adaugă mașina ta în Garaj
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex gap-2 bg-glass p-1.5 rounded-xl border border-white/10">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                filter === 'all'
                  ? 'bg-gold-gradient text-secondary-950 shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🔥 Toate Garajele ({vehicles.length})
            </button>
            <button
              onClick={() => setFilter('for_sale')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                filter === 'for_sale'
                  ? 'bg-gold-gradient text-secondary-950 shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🏷️ De Vânzare din Garaj ({vehicles.filter(v => v.isForSale).length})
            </button>
          </div>
        </div>

        {/* Vehicle Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredVehicles.map((car) => (
            <Card key={car.id} variant="elevated" className="bg-glass border-white/10 overflow-hidden flex flex-col group hover:border-accent-gold/40 transition-all duration-300 shadow-xl">
              
              {/* Image & Badges */}
              <div className="relative aspect-[16/10] overflow-hidden bg-black/40">
                <img
                  src={car.images[0]?.url || 'https://www.autofans.ro/hero_background.jpg'}
                  alt={car.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-secondary-950 via-transparent to-transparent opacity-80" />

                {/* For Sale Badge */}
                {car.isForSale && (
                  <div className="absolute top-3 left-3 bg-gold-gradient text-secondary-950 px-3 py-1 rounded-full font-black text-xs shadow-glow flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5" />
                    DE VÂNZARE • {car.salePrice ? `${car.salePrice.toLocaleString('ro-RO')} €` : 'Contact proprietar'}
                  </div>
                )}

                {/* Upvotes Counter Badge */}
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white border border-white/20 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5 text-accent-gold fill-accent-gold" />
                  {car.upvotesCount} Voturi
                </div>

                {/* Bottom title overlay */}
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-lg font-extrabold text-white line-clamp-1 group-hover:text-accent-gold transition-colors">
                    {car.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-300 mt-1">
                    <span>{car.year}</span>
                    <span>•</span>
                    <span>{car.engine}</span>
                    {car.powerHp > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-accent-gold font-bold">{car.powerHp} CP</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                
                {/* Modifications snippet */}
                {car.modifications && car.modifications.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] uppercase tracking-wider text-gray-400 font-bold flex items-center gap-1">
                      <Wrench className="h-3.5 w-3.5 text-accent-gold" />
                      Modificări cheie:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {car.modifications.slice(0, 3).map((mod: string, idx: number) => (
                        <span key={idx} className="bg-white/5 border border-white/10 text-gray-300 px-2 py-0.5 rounded-md text-[11px]">
                          {mod}
                        </span>
                      ))}
                      {car.modifications.length > 3 && (
                        <span className="text-[11px] text-accent-gold font-bold self-center">
                          +{car.modifications.length - 3} altele
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Story snippet */}
                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                  {car.story}
                </p>

                {/* Footer Owner & Action */}
                <div className="border-t border-white/10 pt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {car.ownerAvatar ? (
                      <img src={car.ownerAvatar} alt={car.ownerName} className="w-7 h-7 rounded-full object-cover border border-white/20" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-accent-gold/20 flex items-center justify-center text-accent-gold text-xs font-bold">
                        {car.ownerName[0]}
                      </div>
                    )}
                    <span className="text-xs font-semibold text-gray-300">{car.ownerName}</span>
                  </div>

                  <Link to={`/garage/${car.slug}`}>
                    <Button variant="ghost" size="sm" className="text-accent-gold hover:text-white hover:bg-accent-gold/20 text-xs font-bold px-3 py-1.5">
                      Vezi Garajul <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>

              </div>

            </Card>
          ))}
        </div>

      </div>
    </div>
  );
}
