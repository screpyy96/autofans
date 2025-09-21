import { Layout } from '~/components/layout';
import { Navigation } from '~/components/layout';
import type { User } from '~/types';

// Mock user data for demo
const mockUser: User = {
  id: '1',
  email: 'john.doe@example.com',
  firstName: 'John',
  lastName: 'Doe',
  avatar: undefined,
  location: {
    id: '1',
    city: 'București',
    county: 'București',
    country: 'România'
  },
  preferences: {
    language: 'ro',
    currency: 'RON',
    notifications: {
      email: true,
      push: true,
      sms: false,
      savedSearchAlerts: true,
      priceDropAlerts: true,
      newListingAlerts: true,
    },
    searchRadius: 50,
  },
  savedSearches: [],
  favorites: [],
  listings: [],
  createdAt: new Date(),
  isVerified: true,
  role: 'user',
};

export function meta() {
  return [
    { title: "Layout Demo - AutoFans" },
    { name: "description", content: "Demo page for layout components" },
  ];
}

export default function LayoutDemo() {
  const handleSearch = (query: string) => {
    console.log('Search query:', query);
  };

  const handleNewsletterSubmit = async (data: any) => {
    console.log('Newsletter signup:', data);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  return (
    <Layout 
      user={mockUser}
      notificationCount={3}
      onSearch={handleSearch}
      onNewsletterSubmit={handleNewsletterSubmit}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar with Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Navigare</h2>
              <Navigation 
                currentPath="/layout-demo"
                showBreadcrumbs={false}
                items={[]}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">
                Demo Layout Components
              </h1>
              
              <div className="space-y-6">
                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">
                    Header Component
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Header-ul include logo-ul, navigarea principală, bara de căutare, 
                    notificările și meniul utilizatorului. Pe mobil, navigarea se transformă 
                    într-un meniu hamburger.
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">Funcționalități:</h3>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                      <li>Logo interactiv cu animații hover</li>
                      <li>Navigare responsivă cu indicatori de stare activă</li>
                      <li>Bara de căutare cu autocomplete (desktop și mobil)</li>
                      <li>Notificări cu badge pentru numărul de notificări</li>
                      <li>Meniu utilizator cu dropdown</li>
                      <li>Meniu hamburger pentru mobil</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">
                    Navigation Component
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Componenta de navigare include navigarea principală, breadcrumbs și 
                    un drawer pentru mobil cu submeniuri expandabile.
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">Funcționalități:</h3>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                      <li>Navigare ierarhică cu submeniuri</li>
                      <li>Breadcrumbs generate automat din URL</li>
                      <li>Drawer mobil cu animații smooth</li>
                      <li>Indicatori de stare activă</li>
                      <li>Submeniuri expandabile cu animații</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">
                    Footer Component
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Footer-ul include informații despre companie, linkuri utile, 
                    abonare la newsletter și linkuri sociale.
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">Funcționalități:</h3>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                      <li>Informații de contact și despre companie</li>
                      <li>Formular de abonare la newsletter cu validare</li>
                      <li>Linkuri organizate pe categorii</li>
                      <li>Linkuri sociale cu animații hover</li>
                      <li>Layout responsiv pentru toate dimensiunile de ecran</li>
                      <li>Linkuri legale și copyright</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">
                    Layout Component
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Componenta Layout combină Header, Footer și conținutul principal 
                    într-o structură consistentă pentru întreaga aplicație.
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">Beneficii:</h3>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                      <li>Structură consistentă pentru toate paginile</li>
                      <li>Gestionare centralizată a utilizatorului și stării</li>
                      <li>Props pentru customizare și funcționalități</li>
                      <li>Layout flexibil cu sticky header și footer</li>
                    </ul>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}