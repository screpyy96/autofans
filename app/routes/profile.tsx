import { useState } from 'react';
import { Link } from 'react-router';
import type { Route } from "./+types/profile";
import { Button } from '~/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/Card';
import { Badge } from '~/components/ui/Badge';
import { NotificationPreferences } from '~/components/ui/NotificationPreferences';
import { Modal } from '~/components/ui/Modal'; // Added Modal import
import { NotificationType } from '~/types';
import type { NotificationPreferences as NotificationPreferencesType } from '~/types';
import { 
  User, 
  Settings, 
  Car, 
  Heart, 
  Bell, 
  Shield, 
  Edit,
  Plus,
  Eye,
  MessageCircle,
  TrendingUp,
  Star
} from 'lucide-react';
import { cn } from '~/lib/utils';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Contul meu - AutoFans" },
    { name: "description", content: "Gestionează contul tău, anunțurile și preferințele pe AutoFans." },
  ];
}

export default function Profile() {
  const [activeTab, setActiveTab] = useState<'overview' | 'listings' | 'settings'>('overview');
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);

  // Notification preferences state (persisted in localStorage)
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferencesType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('autofans_notification_prefs');
      if (saved) return JSON.parse(saved) as NotificationPreferencesType;
    }
    return {
      inApp: true,
      email: true,
      push: false,
      sms: false,
      types: {
        [NotificationType.MESSAGE]: true,
        [NotificationType.PRICE_DROP]: true,
        [NotificationType.NEW_LISTING]: true,
        [NotificationType.SAVED_SEARCH_ALERT]: true,
        [NotificationType.APPOINTMENT_REMINDER]: true,
        [NotificationType.SYSTEM]: true,
      },
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00',
      },
    };
  });

  const handleSaveNotifPrefs = async (prefs: NotificationPreferencesType) => {
    setNotifPrefs(prefs);
    if (typeof window !== 'undefined') {
      localStorage.setItem('autofans_notification_prefs', JSON.stringify(prefs));
    }
  };

  // Mock user data
  const user = {
    name: 'Ion Popescu',
    email: 'ion.popescu@email.com',
    phone: '+40721123456',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    isVerified: true,
    memberSince: '2023',
    stats: {
      listings: 3,
      favorites: 12,
      views: 1250,
      contacts: 45
    }
  };

  const tabs = [
    {
      id: 'overview',
      label: 'Prezentare generală',
      icon: User,
      shortLabel: 'Prezentare',
      description: 'Vedere de ansamblu a activității tale'
    },
    {
      id: 'listings',
      label: 'Anunțurile mele',
      icon: Car,
      shortLabel: 'Anunțurile mele',
      description: 'Gestionează anunțurile tale de vânzare'
    },
    {
      id: 'settings',
      label: 'Setări cont',
      icon: Settings,
      shortLabel: 'Setări',
      description: 'Configurează preferințele tale'
    },
  ] as const;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Profile Header - Mobile Optimized */}
        <Card variant="elevated" padding="lg" className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div className="relative">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-white/20"
              />
              {user.isVerified && (
                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1.5">
                  <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white truncate">{user.name}</h1>
                {user.isVerified && (
                  <Badge variant="success" className="bg-green-500/10 text-green-400 border-green-500/20 text-xs sm:text-sm">
                    <Shield className="h-3 w-3 mr-1" />
                    Verificat
                  </Badge>
                )}
              </div>
              <p className="text-gray-300 text-sm sm:text-base mb-1 truncate">{user.email}</p>
              <p className="text-xs sm:text-sm text-gray-400">Membru din {user.memberSince}</p>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-sm sm:text-base border-white/20 hover:bg-white/5"
            >
              <Edit className="h-4 w-4" />
              Editează
            </Button>
          </div>

          {/* Stats - Mobile Optimized */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-6 sm:mt-8 pt-6 border-t border-white/10">
            <div className="text-center p-3 sm:p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Car className="h-4 w-4 text-accent-gold" />
                <div className="text-lg sm:text-2xl font-bold text-white">{user.stats.listings}</div>
              </div>
              <div className="text-xs sm:text-sm text-gray-300">Anunțuri active</div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Heart className="h-4 w-4 text-red-400" />
                <div className="text-lg sm:text-2xl font-bold text-white">{user.stats.favorites}</div>
              </div>
              <div className="text-xs sm:text-sm text-gray-300">Favorite</div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Eye className="h-4 w-4 text-blue-400" />
                <div className="text-lg sm:text-2xl font-bold text-white">{user.stats.views}</div>
              </div>
              <div className="text-xs sm:text-sm text-gray-300">Vizualizări</div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center justify-center gap-2 mb-2">
                <MessageCircle className="h-4 w-4 text-green-400" />
                <div className="text-lg sm:text-2xl font-bold text-white">{user.stats.contacts}</div>
              </div>
              <div className="text-xs sm:text-sm text-gray-300">Contactări</div>
            </div>
          </div>
        </Card>

        {/* Tabs - Mobile Optimized */}
        <div className="mb-6 sm:mb-8">
          <div className="border-b border-white/10">
            <div className="flex overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent -mb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={cn(
                    'relative flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap flex-shrink-0 group rounded-lg mx-1',
                    activeTab === tab.id
                      ? 'border-accent-gold text-accent-gold bg-gradient-to-r from-accent-gold/10 to-accent-gold/5 shadow-sm'
                      : 'border-transparent text-gray-400 hover:text-white hover:border-white/20 hover:bg-white/5'
                  )}
                  onClick={() => setActiveTab(tab.id)}
                  title={tab.description}
                >
                  <tab.icon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate font-semibold">
                    <span className="sm:hidden">{tab.shortLabel}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </span>

                  {/* Active indicator glow */}
                  {activeTab === tab.id && (
                    <div className="absolute inset-0 bg-gradient-to-r from-accent-gold/5 to-transparent rounded-lg border border-accent-gold/20" />
                  )}

                  {/* Subtle glow effect */}
                  <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-white/5 to-transparent" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            <Card variant="elevated" padding="lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Car className="h-5 w-5 text-accent-gold" />
                  Anunțurile mele recente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                </div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
              </CardContent>
            </Card>

            <Card variant="elevated" padding="lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Heart className="h-5 w-5 text-red-400" />
                  Favorite recente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-white truncate">Audi A4 2.0 TDI</h4>
                      <p className="text-sm text-gray-300 mt-1">32.000 RON • Cluj-Napoca</p>
                    </div>
                    <Badge variant="success" size="sm" className="bg-green-500/10 text-green-400 border-green-500/20">
                      Disponibil
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-white truncate">VW Golf 1.6 TDI</h4>
                      <p className="text-sm text-gray-300 mt-1">18.500 RON • Timișoara</p>
                    </div>
                    <Badge variant="success" size="sm" className="bg-green-500/10 text-green-400 border-green-500/20">
                      Disponibil
                    </Badge>
                  </div>

                  <div className="text-center py-4">
                    <Link to="/create-listing">
                      <Button variant="outline" className="flex items-center gap-2 mx-auto border-white/20 hover:bg-white/5 px-4 py-2">
                        <Plus className="h-4 w-4" />
                        Adaugă anunț nou
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'listings' && (
          <Card variant="elevated" padding="lg" className="text-center relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent-gold/5 via-transparent to-transparent opacity-50" />
            <div className="relative">
              <div className="py-12 sm:py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-accent-gold/20 to-accent-gold/10 border border-accent-gold/20 rounded-full mb-6 shadow-lg">
                  <Car className="h-8 w-8 sm:h-10 sm:w-10 text-accent-gold" />
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold text-white mb-4">
                  Gestionează-ți anunțurile
                </h3>
                <p className="text-gray-300 mb-8 max-w-md mx-auto text-sm sm:text-base leading-relaxed">
                  Creează și gestionează toate anunțurile tale de mașini. Adaugă primul tău anunț pentru a începe să vinzi.
                </p>
                <Link to="/create-listing">
                  <Button variant="primary" className="flex items-center gap-2 mx-auto bg-gold-gradient text-secondary-900 hover:shadow-glow px-6 py-3 font-semibold">
                    <Plus className="h-4 w-4" />
                    Adaugă primul anunț
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6 sm:space-y-8">
            <Card variant="elevated" padding="lg">
              <CardHeader>
                <CardTitle className="text-white">Informații personale</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nume complet
                    </label>
                    <input
                      type="text"
                      value={user.name}
                      className="w-full px-3 py-2 sm:py-3 bg-white/5 border border-white/20 text-white rounded-lg focus:ring-2 focus:ring-accent-gold focus:border-accent-gold transition-all text-sm sm:text-base"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={user.email}
                      className="w-full px-3 py-2 sm:py-3 bg-white/5 border border-white/20 text-white rounded-lg focus:ring-2 focus:ring-accent-gold focus:border-accent-gold transition-all text-sm sm:text-base"
                      readOnly
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      value={user.phone}
                      className="w-full px-3 py-2 sm:py-3 bg-white/5 border border-white/20 text-white rounded-lg focus:ring-2 focus:ring-accent-gold focus:border-accent-gold transition-all text-sm sm:text-base"
                      readOnly
                    />
                  </div>
                </div>
                <div className="mt-6">
                  <Button variant="primary" className="bg-gold-gradient text-secondary-900 hover:shadow-glow">
                    Salvează modificările
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated" padding="lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Bell className="h-5 w-5 text-accent-gold" />
                  Preferințe notificări
                </CardTitle>
              </CardHeader>
              <CardContent>
                <NotificationPreferences
                  preferences={notifPrefs}
                  onSave={handleSaveNotifPrefs}
                />
              </CardContent>
            </Card>
          </div>
        )}

    </div>
  );
}