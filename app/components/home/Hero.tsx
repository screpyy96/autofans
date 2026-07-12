import { Link } from 'react-router';
import { Shield, Clock, Star, Sparkles } from 'lucide-react';
import { SearchBar } from '~/components/search/SearchBar';
import { motion } from 'framer-motion';

export interface HeroProps {
  onSearch: (query: string) => void;
}

export function Hero({ onSearch }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-premium-gradient text-white">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-secondary-800/30" />
      <div className="absolute -top-32 -right-24 h-64 w-64 rounded-full bg-primary-500/30 blur-3xl" aria-hidden="true" />
      <div className="absolute bottom-0 left-1/2 h-40 w-[90%] -translate-x-1/2 rounded-[40px] bg-primary-500/10 blur-3xl" aria-hidden="true" />

      <div className="relative w-full px-5 pt-14 pb-16 sm:px-6 md:px-10 lg:px-16 lg:py-24 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-10 lg:gap-12 w-full">
          
          {/* Left column (Main text and unified search) */}
          <div className="animate-fade-in space-y-6 w-full lg:w-[58%] flex-shrink-0">
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              <span className="text-white">Găsește mașina </span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 via-yellow-300 to-yellow-500">
                potrivită
              </span>
            </h1>

            <p
              className="text-base leading-relaxed text-white/80 sm:text-lg max-w-xl"
              style={{ whiteSpace: 'normal', wordBreak: 'normal' }}
            >
              Cumpără și vinde mașini second-hand în siguranță pe Autofans.ro. Mii de anunțuri auto din România, verificate individual pentru liniștea ta.
            </p>

            {/* Unique Unified Search Bar */}
            <div className="w-full max-w-xl bg-glass border border-white/10 rounded-[22px] p-3 shadow-modal backdrop-blur-xl">
              <SearchBar
                onSearch={onSearch}
                placeholder="Caută după marcă, model, oraș..."
                className="mb-3"
              />
              
              {/* Brand quick links */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-300 px-1">
                <span className="opacity-75">Mărci populare:</span>
                {['Dacia', 'Volkswagen', 'BMW', 'Audi', 'Ford'].map((brand) => (
                  <Link
                    key={brand}
                    to={`/search?q=${brand}`}
                    className="text-accent-gold hover:text-white transition-colors px-1.5 py-0.5 rounded bg-white/5 border border-white/5 hover:border-accent-gold/40"
                  >
                    {brand}
                  </Link>
                ))}
              </div>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center gap-5 pt-3 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-accent-gold" />
                <span>100% Sigur</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-accent-gold" />
                <span>4.8/5 Rating</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-accent-gold" />
                <span>Suport 24/7</span>
              </div>
            </div>
          </div>

          {/* Right column (Visual premium car image) */}
          <div className="w-full lg:w-[38%] flex-shrink-0 relative mt-6 lg:mt-0">
            <motion.div
              className="relative w-full h-full flex items-center justify-center"
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            >
              {/* Glow background effect behind the car */}
              <div className="absolute inset-0 bg-accent-gold/5 blur-[80px] rounded-full scale-75" />
              
              <img
                src="/hero_car.png"
                alt="Autofans Car"
                className="w-full h-auto object-contain max-h-[360px] drop-shadow-[0_15px_30px_rgba(0,0,0,0.5)] select-none"
                draggable="false"
              />
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
