import { Link } from 'react-router';
import { Search, Shield, Clock, Star, MapPin, Filter, Play, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '~/components/ui/Button';
import { SearchBar } from '~/components/search/SearchBar';

export interface HeroProps {
  onSearch: (query: string) => void;
}

export function Hero({ onSearch }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-premium-gradient text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-secondary-800/30" />
      <div className="absolute -top-32 -right-24 h-64 w-64 rounded-full bg-primary-500/30 blur-3xl" aria-hidden="true" />
      <div className="absolute bottom-0 left-1/2 h-40 w-[90%] -translate-x-1/2 rounded-[40px] bg-primary-500/10 blur-3xl" aria-hidden="true" />

      <div className="relative w-full px-5 pt-14 pb-20 sm:px-6 md:px-10 lg:px-16 lg:py-32">
        <div className="flex flex-col gap-12 lg:grid lg:grid-cols-5 lg:gap-16 lg:items-center">
          {/* Left content */}
          <div className="animate-fade-in space-y-6 lg:col-span-3 w-full">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.2em] text-white/70 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-accent-gold" />
              Platformă premium
            </div>

            <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              <span className="text-white">Găsește mașina </span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 via-yellow-300 to-yellow-500">
                perfectă
              </span>
            </h1>

            <p
              className="text-base leading-relaxed text-white/80 sm:text-lg"
              style={{ whiteSpace: 'normal', wordBreak: 'normal', maxWidth: '40rem' }}
            >
              Platforma premium pentru mașini second-hand din România. Peste 15,000 de anunțuri verificate, vânzători de încredere și proces de cumpărare sigur.
            </p>

            {/* Primary actions */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
              <Link to="/search" className="w-full sm:w-auto">
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full bg-gold-gradient text-secondary-900 hover:shadow-glow transition-all duration-300 sm:w-auto"
                >
                  <Search className="h-5 w-5 mr-2" />
                  Caută mașini
                </Button>
              </Link>

              <a
                href="#hero-quick-search"
                className="inline-flex items-center gap-2 text-sm font-semibold text-white/80 transition-colors hover:text-white"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/5">
                  <Play className="h-4 w-4" />
                </span>
                Vezi cum funcționează
              </a>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center gap-5 pt-5 text-sm text-white/70">
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

          {/* Right search card */}
          <div
            className="relative w-full animate-fade-in lg:col-span-2"
            style={{ animationDelay: '0.2s' }}
          >
            <div className="space-y-6">
              <div
                id="hero-quick-search"
                className="rounded-[26px] border border-white/10 bg-white/5 p-1 backdrop-blur-xl shadow-[0_20px_60px_rgba(10,18,36,0.4)]"
              >
                <div className="rounded-[24px] border border-white/10 bg-secondary-900/40 p-6 shadow-inner">
                  <div className="mb-4 flex items-center justify-between text-sm text-white/60">
                    <span className="font-medium text-white">Căutare rapidă</span>
                    <Link to="/search" className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-accent-gold">
                      Vezi toate
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                  <SearchBar
                    onSearch={onSearch}
                    placeholder="Caută după marcă, model sau oraș..."
                    className="mb-4"
                  />
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link to="/search" className="flex-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full border-white/15 bg-white/5 text-white hover:border-accent-gold/60 hover:bg-accent-gold/10"
                      >
                        <Filter className="mr-2 h-4 w-4" />
                        Filtre avansate
                      </Button>
                    </Link>
                    <Link to="/search" className="flex-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full border-white/15 bg-white/5 text-white hover:border-accent-gold/60 hover:bg-accent-gold/10"
                      >
                        <MapPin className="mr-2 h-4 w-4" />
                        Lângă mine
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 text-sm text-white/70 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-white/50">Anunțuri noi</p>
                  <p className="mt-1 text-lg font-semibold text-white">+450 / săptămână</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-white/50">Verificate manual</p>
                  <p className="mt-1 text-lg font-semibold text-white">100%</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-white/50">Timp mediu răspuns</p>
                  <p className="mt-1 text-lg font-semibold text-white"><span className="text-accent-gold">3h</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
