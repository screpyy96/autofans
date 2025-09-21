import { Link } from 'react-router';
import type { Route } from "./+types/home";
import { Search, Car, Shield, Clock, TrendingUp } from 'lucide-react';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';
import { Hero } from '~/components/home/Hero';
import { RouteErrorBoundary } from '~/components/error';

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "AutoFans - Mașini Second-Hand Premium în România" },
    { name: "description", content: "Găsește mașina perfectă sau vinde-ți mașina rapid și sigur pe AutoFans, platforma premium pentru mașini second-hand în România." },
  ];
}

function HomeContent() {
  const handleSearch = (query: string) => {
    window.location.href = `/search?q=${encodeURIComponent(query)}`;
  };

  const stats = [
    { label: 'Mașini active', value: '15,234', icon: Car },
    { label: 'Utilizatori verificați', value: '8,567', icon: Shield },
    { label: 'Tranzacții finalizate', value: '3,421', icon: TrendingUp },
    { label: 'Timp mediu de vânzare', value: '12 zile', icon: Clock },
  ];

  return (
    <>
      <Hero onSearch={handleSearch} />

      {/* Stats Section */}
      <section className="py-20 bg-glass backdrop-blur-xl border-y border-premium w-full">
        <div className="w-full px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-accent-gold/20 rounded-2xl mb-6 group-hover:bg-accent-gold/30 transition-all duration-300">
                  <stat.icon className="h-8 w-8 text-accent-gold" />
                </div>
                <div className="text-3xl lg:text-4xl font-bold text-white mb-2 group-hover-text-glow transition-all duration-300">
                  {stat.value}
                </div>
                <div className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-glass backdrop-blur-xl w-full">
        <div className="w-full px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">
              De ce să alegi AutoFans?
            </h2>
            <p className="text-xl text-gray-300 leading-relaxed">
              Oferim cea mai sigură și convenabilă experiență de cumpărare și vânzare
              de mașini second-hand din România
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <Card variant="elevated" padding="lg" className="text-center bg-glass border-premium hover:border-accent-gold transition-all duration-300 group">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-accent-gold/20 rounded-full mb-8 group-hover:bg-accent-gold/30 transition-all duration-300">
                <Shield className="h-10 w-10 text-accent-gold" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-6">
                100% Verificat
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Toate anunțurile sunt verificate manual. Vânzătorii sunt autentificați
                și mașinile sunt inspectate pentru siguranța ta.
              </p>
            </Card>

            <Card variant="elevated" padding="lg" className="text-center bg-glass border-premium hover:border-accent-gold transition-all duration-300 group">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-accent-gold/20 rounded-full mb-8 group-hover:bg-accent-gold/30 transition-all duration-300">
                <Search className="h-10 w-10 text-accent-gold" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-6">
                Căutare avansată
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Filtre inteligente și căutare AI pentru a găsi exact mașina pe care
                o cauți, în funcție de buget, preferințe și locație.
              </p>
            </Card>

            <Card variant="elevated" padding="lg" className="text-center bg-glass border-premium hover:border-accent-gold transition-all duration-300 group">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-accent-gold/20 rounded-full mb-8 group-hover:bg-accent-gold/30 transition-all duration-300">
                <Clock className="h-10 w-10 text-accent-gold" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-6">
                Suport complet
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Echipa noastră te ajută în tot procesul - de la căutare și negociere
                până la finalizarea tranzacției și transferul actelor.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gold-gradient relative overflow-hidden w-full">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-gold/20 via-transparent to-accent-gold/10"></div>
        <div className="relative w-full px-6 text-center">
          <h2 className="text-4xl font-bold text-secondary-900 mb-6">
            Gata să găsești mașina perfectă?
          </h2>
          <p className="text-xl text-secondary-800 mb-10 leading-relaxed">
            Alătură-te celor peste 50,000 de utilizatori care au găsit deja mașina
            ideală pe AutoFans
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link to="/search">
              <Button variant="secondary" size="lg" className="bg-secondary-900 text-white hover:bg-secondary-800 hover:shadow-lg transition-all duration-300">
                <Search className="h-5 w-5 mr-2" />
                Începe căutarea
              </Button>
            </Link>
            <Link to="/create-listing">
              <Button variant="ghost" size="lg" className="text-secondary-900 border-secondary-900 hover:bg-secondary-900/10 transition-all duration-300">
                Vinde mașina ta
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default function Home() {
  return (
    <RouteErrorBoundary routeName="Acasă">
      <HomeContent />
    </RouteErrorBoundary>
  );
}
