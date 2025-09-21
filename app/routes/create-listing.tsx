import { useState } from 'react';
import type { Route } from "./+types/create-listing";
import { CreateListingWizard } from '~/components/listing/CreateListingWizard';
import { Card } from '~/components/ui/Card';
import { Button } from '~/components/ui/Button';
import { ArrowLeft, Shield, Clock, Star } from 'lucide-react';
import { Link } from 'react-router';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Creează anunț - AutoFans" },
    { name: "description", content: "Creează un anunț pentru mașina ta și găsește cumpărători rapid și sigur." },
  ];
}

export default function CreateListing() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Listing data:', data);
      alert('Anunțul a fost creat cu succes!');
      // Redirect to profile or listing page
      window.location.href = '/profile';
    } catch (error) {
      console.error('Error creating listing:', error);
      alert('A apărut o eroare. Te rugăm să încerci din nou.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async (data: any) => {
    localStorage.setItem('autofans_draft_listing', JSON.stringify(data));
    alert('Anunțul a fost salvat ca draft.');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/profile" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Înapoi la profil
          </Link>
          
          <h1 className="text-3xl font-bold text-white mb-2">
            Creează un anunț nou
          </h1>
          <p className="text-white">
            Completează informațiile despre mașina ta pentru a crea un anunț atractiv
          </p>
        </div>

        {/* Benefits */}
        <Card variant="elevated" padding="lg" className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">
            De ce să vinzi pe AutoFans?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-white">Vânzare sigură</h4>
                <p className="text-sm text-gray-600">Cumpărători verificați</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-white">Vânzare rapidă</h4>
                <p className="text-sm text-gray-600">Timp mediu: 12 zile</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Star className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium text-white">Suport complet</h4>
                <p className="text-sm text-gray-600">Te ajutăm în tot procesul</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Wizard */}
        <CreateListingWizard
          onSubmit={handleSubmit}
          onSaveDraft={handleSaveDraft}
        />
    </div>
  );
}