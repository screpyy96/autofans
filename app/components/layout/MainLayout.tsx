import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { motion } from 'framer-motion';
import {
  Search,
  Heart,
  User,
  Menu,
  X,
  Plus
} from 'lucide-react';
import { Button } from '~/components/ui/Button';
import { PremiumFooter } from '~/components/layout/PremiumFooter';
import { NotificationBell } from '~/components/ui/NotificationBell';
import { useNotifications } from '~/hooks/useNotifications';
import { useUser, useComparison } from '~/stores/useAppStore';
import { cn } from '~/lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Acasă', href: '/', icon: Search },
  { name: 'Căutare', href: '/search', icon: Search },
  { name: 'Favorite', href: '/favorites', icon: Heart },
  { name: 'Contul meu', href: '/profile', icon: User },
];

export function MainLayout({ children }: MainLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user } = useUser();
  const { comparisonCars } = useComparison();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    handleNotificationClick
  } = useNotifications();


  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  // Handle mobile menu keyboard navigation
  const handleMobileMenuKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-premium-gradient">
      

      {/* Header */}
      <header 
        className="bg-glass backdrop-blur-xl shadow-modal border-premium sticky top-0 z-50"
        role="banner"
      >
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-18">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <motion.img
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                src="/logo.png"
                alt="AutoFans Logo"
                className="h-12 w-auto"
              />
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-white group-hover:text-glow transition-all duration-300">
                  AutoFans
                </span>
                <span className="text-xs text-accent-gold font-medium -mt-1 tracking-wider">PREMIUM CARS</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav 
              id="main-navigation"
              className="hidden md:flex items-center gap-6"
              role="navigation"
              aria-label="Navigare principală"
            >
              {navigation.map((item) => (
                <motion.div key={item.name} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to={item.href}
                    className={cn(
                      'relative flex items-center gap-2 px-1 pt-2 pb-2 text-sm font-semibold transition-colors group border-b-2 border-transparent',
                      'focus:outline-none focus:ring-0',
                      isActive(item.href)
                        ? 'text-white border-accent-gold'
                        : 'text-gray-300 hover:text-white hover:border-accent-gold/60'
                    )}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                  >
                    <motion.div
                      whileHover={{ rotate: 5, scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <item.icon 
                        className={cn(
                          "h-4 w-4 transition-colors duration-300",
                          isActive(item.href) ? "text-white" : ""
                        )}
                        aria-hidden="true"
                      />
                    </motion.div>
                    <motion.span
                      whileHover={{ x: 2 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      {item.name}
                    </motion.span>
                  </Link>
                </motion.div>
              ))}
            </nav>

            {/* Right side actions */}
            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <NotificationBell
                notifications={notifications}
                unreadCount={unreadCount}
                onNotificationClick={handleNotificationClick}
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
                onClearAll={clearAll}
                className="hidden sm:block"
              />

              <Link to="/create-listing">
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex bg-glass backdrop-blur-sm border-premium hover:bg-gold-gradient hover:text-secondary-900 hover:border-transparent transition-all duration-300 hover:shadow-glow hover:scale-105"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adaugă anunț
                </Button>
              </Link>

              {/* Mobile menu button */}
              <button
                className="md:hidden p-3 rounded-2xl text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-300 focus:outline-none"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu"
                aria-label={mobileMenuOpen ? "Închide meniul" : "Deschide meniul"}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Menu className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div 
            id="mobile-menu"
            className="md:hidden border-t border-premium bg-glass backdrop-blur-xl animate-slide-down"
            role="navigation"
            aria-label="Navigare mobilă"
            onKeyDown={handleMobileMenuKeyDown}
          >
            <div className="px-4 py-4 space-y-2">
              {/* Mobile Notification Bell */}
              <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-glass border border-premium">
                <span className="text-base font-medium text-gray-300">Notificări</span>
                <NotificationBell
                  notifications={notifications}
                  unreadCount={unreadCount}
                  onNotificationClick={handleNotificationClick}
                  onMarkAsRead={markAsRead}
                  onMarkAllAsRead={markAllAsRead}
                  onClearAll={clearAll}
                />
              </div>

              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 border border-transparent',
                    isActive(item.href)
                      ? 'text-white bg-white/5 border-premium'
                      : 'text-gray-300 hover:text-white hover:bg-white/5 hover:border-premium'
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                >
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                  {item.name}
                </Link>
              ))}

              <div className="pt-4 border-t border-premium">
                <Link to="/create-listing">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full bg-gold-gradient text-secondary-900 shadow-glow hover:shadow-lg transition-all duration-300"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adaugă anunț
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main 
        id="main-content"
        className="flex-1"
        role="main"
        tabIndex={-1}
      >
        {children}
      </main>

      {/* Footer */}
      <PremiumFooter navigation={navigation} />
    </div>
    
  );
}