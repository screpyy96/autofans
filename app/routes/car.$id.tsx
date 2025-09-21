import { useState } from 'react';
import type { Route } from "./+types/car.$id";
import { CarDetails } from '~/components/car/CarDetails';
import { LoanCalculator } from '~/components/calculator/LoanCalculator';
import { ContactModal } from '~/components/ui/ContactModal';
import { Card } from '~/components/ui/Card';
import { Button } from '~/components/ui/Button';
import { Calculator, MessageCircle } from 'lucide-react';
import { mockCars } from '~/data/mockData';
import { useComparison } from '~/stores/useAppStore';

export function meta({ params }: Route.MetaArgs) {
  const car = mockCars.find(c => c.id === params.id);
  
  if (!car) {
    return [
      { title: "Mașină nu a fost găsită - AutoFans" },
    ];
  }

  return [
    { title: `${car.title} - AutoFans` },
    { name: "description", content: car.description.substring(0, 160) + "..." },
  ];
}

export default function CarDetail({ params }: Route.ComponentProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);

  const car = mockCars.find(c => c.id === params.id);
  const similarCars = mockCars.filter(c => c.id !== params.id && c.brand === car?.brand).slice(0, 4);

  const { isInComparison, addToComparison, removeFromComparison } = useComparison();

  if (!car) {
    return (
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Mașina nu a fost găsită
          </h1>
          <p className="text-gray-300 mb-8">
            Mașina pe care o cauți nu există sau a fost ștearsă.
          </p>
          <a href="/search" className="text-accent-gold hover:text-accent-gold/80">
            ← Înapoi la căutare
          </a>
        </div>
    );
  }

  const handleContactSeller = () => {
    setShowContactModal(true);
  };

  const handleScheduleViewing = () => {
    alert('Deschidere modal programare vizionare');
  };

  const handleAddToCompare = () => {
    if (isInComparison(car.id)) {
      removeFromComparison(car.id);
    } else {
      addToComparison(car.id);
    }
  };

  const handleAddToFavorites = () => {
    setIsFavorited(!isFavorited);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: car.title,
        text: `Verifică această mașină pe AutoFans: ${car.title}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiat în clipboard!');
    }
  };

  const handleSimilarCarClick = (carId: string) => {
    window.location.href = `/car/${carId}`;
  };

  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <CarDetails
              car={car}
              onContactSeller={handleContactSeller}
              onScheduleViewing={handleScheduleViewing}
              onAddToCompare={handleAddToCompare}
              onAddToFavorites={handleAddToFavorites}
              onShare={handleShare}
              similarCars={similarCars}
              onSimilarCarClick={handleSimilarCarClick}
              isFavorited={isFavorited}
              isInComparison={isInComparison(car.id)}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Actions */}
            <Card variant="elevated" padding="lg">
              <h3 className="text-lg font-semibold text-white mb-4">
                Acțiuni rapide
              </h3>
              <div className="space-y-3">
                <Button
                  variant="primary"
                  onClick={handleContactSeller}
                  className="w-full flex items-center gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  Contactează vânzătorul
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCalculator(!showCalculator)}
                  className="w-full flex items-center gap-2"
                >
                  <Calculator className="h-4 w-4" />
                  Calculator credit
                </Button>
              </div>
            </Card>

            {/* Loan Calculator */}
            {showCalculator && (
              <Card variant="elevated" padding="lg">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Calculator credit auto
                </h3>
                <LoanCalculator car={car} />
              </Card>
            )}
          </div>
        </div>

        {/* Contact Modal */}
        {showContactModal && (
          <ContactModal
            isOpen={showContactModal}
            onClose={() => setShowContactModal(false)}
            car={car}
            seller={{
              id: 'seller-1',
              type: 'dealer',
              name: 'Ion Popescu',
              phone: '+40721123456',
              email: 'ion.popescu@email.com',
              isVerified: true,
              responseTime: '2 ore',
              rating: 4.8,
              location: {
                id: 'loc-bucuresti',
                city: 'București',
                county: 'București',
                country: 'RO'
              }
            }}
          />
        )}
      </div>
  );
}