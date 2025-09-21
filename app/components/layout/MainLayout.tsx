import { useState, useEffect } from 'react';
import { Link, useLocation, useRouteLoaderData } from 'react-router';
import { motion } from 'framer-motion';
import {
  Search,
  Heart,
  User,
  Menu,
  X,
  Plus,
  ChevronDown
} from 'lucide-react';
import { Button } from '~/components/ui/Button';
import { PremiumFooter } from '~/components/layout/PremiumFooter';
import { NotificationBell } from '~/components/ui/NotificationBell';
import { useNotifications } from '~/hooks/useNotifications';
import { useUser, useComparison } from '~/stores/useAppStore';
import { cn } from '~/lib/utils';
import React from 'react';

interface MainLayoutProps {
  children: React.ReactNode;
}

const baseNavigation = [
  { name: 'Acasă', href: '/', icon: Search },
  { name: 'Căutare', href: '/search', icon: Search },
  { name: 'Favorite', href: '/favorites', icon: Heart },
  { name: 'Contul meu', href: '/profile', icon: User },
];

export function MainLayout({ children }: MainLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
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

  // Auth from root loader (Supabase)
  const rootData = useRouteLoaderData('root') as
    | { user?: { id: string; email?: string; user_metadata?: Record<string, any> } | null, profile?: { role?: string, avatar_url?: string, email?: string, display_name?: string } | null }
    | undefined;
  const authUser = rootData?.user ?? null;
  const profile = (rootData as any)?.profile ?? null;
  const nextParam = encodeURIComponent(location.pathname || '/');

  // Handle mobile menu keyboard navigation
  const handleMobileMenuKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setMobileMenuOpen(false);
    }
  };

  // Close user menu on route change
  React.useEffect(() => {
    setUserMenuOpen(false);
  }, [location.pathname]);

  // Build navigation dynamically (hide "Contul meu" when logged out)
  const navigation = React.useMemo(() => {
    return baseNavigation.filter((item) => {
      if (item.href === '/profile') return !!authUser; // hide when not logged
      return true;
    });
  }, [authUser]);

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

              {/* Auth */}
              {authUser ? (
                <div className="relative">
                  <button
                    className="flex items-center gap-2 px-2 py-1 rounded-2xl hover:bg-white/5 transition"
                    onClick={() => setUserMenuOpen((v) => !v)}
                    aria-haspopup="menu"
                    aria-expanded={userMenuOpen}
                  >
                    {profile?.avatar_url || authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture ? (
                      <img
                        src={(profile?.avatar_url || authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture) as string}
                        alt="avatar"
                        className="h-7 w-7 rounded-full border border-white/20"
                      />
                    ) : (
                      <div className="h-7 w-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xs text-white">
                        {(authUser.email?.[0] || 'U').toUpperCase()}
                      </div>
                    )}
                    <span className="hidden sm:block text-sm text-gray-300 max-w-[160px] truncate">
                      {profile?.display_name || authUser.email}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </button>
                  {userMenuOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 mt-2 w-48 bg-secondary-900/90 border border-white/20 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden z-50"
                    >
                      {profile?.role === 'seller' && (
                        <Link to="/dashboard" className="block px-3 py-2 text-sm text-gray-200 hover:bg-white/5" role="menuitem">
                          Dashboard
                        </Link>
                      )}
                      <Link to="/profile" className="block px-3 py-2 text-sm text-gray-200 hover:bg-white/5" role="menuitem">
                        Profil
                      </Link>
                      <Link to="/favorites" className="block px-3 py-2 text-sm text-gray-200 hover:bg-white/5" role="menuitem">
                        Favorite
                      </Link>
                      <div className="my-1 h-px bg-white/10" />
                      <Link to="/logout" className="block px-3 py-2 text-sm text-gray-200 hover:bg-white/5" role="menuitem">
                        Ieșire
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <Link to={`/login?next=${nextParam}`}>
                  <Button variant="primary" size="sm" className="hidden sm:inline-flex">
                    Autentificare
                  </Button>
                </Link>
              )}

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
            className="md:hidden border-t border-white/20 bg-secondary-900/90 backdrop-blur-xl animate-slide-down"
            role="navigation"
            aria-label="Navigare mobilă"
            onKeyDown={handleMobileMenuKeyDown}
          >
            <div className="px-4 py-4 space-y-2">
              {/* Mobile Notification Bell */}
              <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-white/5 border border-white/20">
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
                      ? 'text-white bg-white/5 border-white/20'
                      : 'text-gray-300 hover:text-white hover:bg-white/5 hover:border-white/20'
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                >
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                  {item.name}
                </Link>
              ))}

              <div className="pt-4 border-t border-white/20">
                <Link to="/create-listing" onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full bg-gold-gradient text-secondary-900 shadow-glow hover:shadow-lg transition-all duration-300"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adaugă anunț
                  </Button>
                </Link>
                {/* Mobile auth actions */}
                <div className="mt-3">
                  {authUser ? (
                    <div className="grid grid-cols-2 gap-2">
                      <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" size="sm" className="w-full">
                          Profil
                        </Button>
                      </Link>
                      <Link to="/logout" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" size="sm" className="w-full">
                          Ieșire
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <Link to={`/login?next=${nextParam}`} onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="primary" size="sm" className="w-full bg-gold-gradient text-secondary-900 hover:shadow-lg transition-all duration-300">
                        Autentificare
                      </Button>
                    </Link>
                  )}
                </div>
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
