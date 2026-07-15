import { Link } from 'react-router';
import { SearchBar } from '~/components/search/SearchBar';

export interface HeroProps {
  onSearch: (query: string) => void;
}

export function Hero({ onSearch }: HeroProps) {
  return (
    <section className="relative w-full overflow-visible z-20 h-[500px] lg:h-[600px] bg-secondary-900">
      {/* Background and Overlay Wrapper */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        {/* Background Image */}
        <picture className="absolute inset-0 h-full w-full">
          <source
            srcSet="/hero_background-768.webp 768w, /hero_background-1024.webp 1024w, /hero_background.webp 1376w"
            sizes="100vw"
            type="image/webp"
          />
          <img
            src="/hero_background.jpg"
            alt="Familie fericită pe plajă cu o mașină"
            width={1376}
            height={768}
            fetchPriority="high"
            loading="eager"
            decoding="async"
            sizes="100vw"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        </picture>
        
        {/* Overlay gradient to ensure text readability if needed */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
      </div>

      {/* Floating Search Container at the bottom */}
      <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 w-[92%] md:w-[95%] max-w-4xl">
        <div className="bg-glass border border-white/10 rounded-[24px] shadow-2xl p-4 md:p-6 backdrop-blur-xl">
          <h1 className="text-white text-lg md:text-xl font-bold mb-4 drop-shadow-md text-center">
            Găsește mașina potrivită
          </h1>
          
          <SearchBar
            onSearch={onSearch}
            placeholder="Caută după marcă, model, oraș..."
          />
          
          <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 text-xs text-gray-300">
            <span className="opacity-75 hidden md:inline">Mărci populare:</span>
            {['Dacia', 'Volkswagen', 'BMW', 'Audi', 'Ford'].map((brand) => (
              <Link
                key={brand}
                to={`/search?q=${brand}`}
                className="text-accent-gold hover:text-white transition-colors px-2 py-1 rounded-full bg-white/5 border border-white/10 hover:border-accent-gold/40"
              >
                {brand}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
