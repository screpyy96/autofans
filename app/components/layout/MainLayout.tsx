import { useState, useEffect } from 'react';
import { Link, useLocation, useRouteLoaderData } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Search,
  Heart,
  User,
  Menu,
  X,
  Plus,
  ChevronDown,
  LogOut,
  Bell,
  MessageCircle,
  LayoutDashboard,
  Newspaper
} from 'lucide-react';
import { PremiumFooter } from '~/components/layout/PremiumFooter';
import { NotificationBell } from '~/components/ui/NotificationBell';
import { useNotifications } from '~/hooks/useNotifications';
import { useSyncFavorites } from '~/hooks/useSyncFavorites';
import { useUser, useComparison, useCurrency } from '~/stores/useAppStore';
import { cn } from '~/lib/utils';
import React from 'react';

interface MainLayoutProps {
  children: React.ReactNode;
}

const baseNavigation = [
  { name: 'Acasă', href: '/', icon: Home },
  { name: 'Căutare', href: '/search', icon: Search },
  { name: 'Blog', href: '/blog', icon: Newspaper },
  { name: 'Favorite', href: '/favorites', icon: Heart },
  { name: 'Mesaje', href: '/messages', icon: MessageCircle },
  { name: 'Contul meu', href: '/profile', icon: User },
];

export function MainLayout({ children }: MainLayoutProps) {
  const [isBottomDrawerOpen, setIsBottomDrawerOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const { user } = useUser();
  const { comparisonCars } = useComparison();
  const { currency, toggleCurrency } = useCurrency();
  const [hasHydrated, setHasHydrated] = useState(false);
  useEffect(() => {
    setHasHydrated(true);
  }, []);
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
  const isCarDetailsPage = location.pathname.startsWith('/car/');

  // Sync favorites when user logs in
  useSyncFavorites(authUser?.id);

  // Handle mobile menu keyboard navigation
  const handleMobileMenuKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsBottomDrawerOpen(false);
    }
  };

  // Close menus and drawer on route change
  React.useEffect(() => {
    setUserMenuOpen(false);
    setIsBottomDrawerOpen(false);
  }, [location.pathname]);

  // Build navigation dynamically (hide "Contul meu" when logged out)
  const navigation = React.useMemo(() => {
    return baseNavigation.filter((item) => {
      if (item.href === '/profile') return !!authUser; // hide when not logged
      return true;
    });
  }, [authUser]);

  return (
    <div className="flex flex-col min-h-screen bg-premium-gradient">
      

      {/* Header */}
      <header 
        className="bg-glass backdrop-blur-xl shadow-modal border-premium sticky top-0 z-50"
        role="banner"
      >
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-18">
            {/* Logo */}
            <Link
              to="/"
              className="group flex items-center rounded-lg bg-white px-2 py-1 shadow-[0_6px_18px_rgba(0,0,0,0.22)]"
            >
              <motion.img
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                src="/logo-header.png"
                alt="AutoFans Logo"
                className="h-10 w-auto"
              />
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
              {/* Currency Toggle */}
              <button
                onClick={toggleCurrency}
                className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl bg-glass border border-white/10 hover:border-accent-gold/45 text-xs font-bold text-accent-gold shadow-md active:scale-95 transition-all select-none min-h-[32px] min-w-[50px]"
                title="Schimbă valuta (EUR / RON)"
                disabled={!hasHydrated}
              >
                {hasHydrated ? (
                  <>
                    <span>{currency}</span>
                    <span className="text-[10px] text-gray-400 font-normal ml-0.5">⇄</span>
                  </>
                ) : (
                  <div className="h-3.5 w-7 bg-white/10 rounded animate-pulse" />
                )}
              </button>

              {/* Notification Bell */}
              {authUser && (
                <NotificationBell
                  notifications={notifications}
                  unreadCount={unreadCount}
                  onNotificationClick={handleNotificationClick}
                  onMarkAsRead={markAsRead}
                  onMarkAllAsRead={markAllAsRead}
                  onClearAll={clearAll}
                  className="hidden sm:block"
                />
              )}

              <Link
                to="/create-listing"
                aria-label="Adaugă anunț"
                className="hidden sm:inline-flex items-center justify-center rounded-xl border-2 border-accent-gold/30 bg-glass px-3 py-1.5 text-sm font-medium text-accent-gold backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-transparent hover:bg-gold-gradient hover:text-secondary-900 hover:shadow-glow focus:outline-none focus:ring-2 focus:ring-accent-gold focus:ring-offset-2 focus:ring-offset-secondary-800"
              >
                <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                <span>Adaugă anunț</span>
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
                <Link
                  to={`/login?next=${nextParam}`}
                  className="hidden sm:inline-flex items-center justify-center rounded-xl bg-gold-gradient px-3 py-1.5 text-sm font-medium text-secondary-900 transition-transform hover:scale-[1.02] hover:shadow-glow focus:outline-none focus:ring-2 focus:ring-accent-gold focus:ring-offset-2 focus:ring-offset-secondary-800"
                >
                  Autentificare
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main 
        id="main-content"
        className="flex-1 pb-24 md:pb-0"
        role="main"
        tabIndex={-1}
      >
        {children}
      </main>

      {/* Bottom Navigation Bar (Mobile only) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-secondary-950/80 backdrop-blur-xl border-t border-white/10 px-4 py-2 pb-safe shadow-[0_-8px_30px_rgb(0,0,0,0.4)]">
        <div className="flex justify-around items-center h-12">
          {/* Acasă */}
          <Link
            to="/"
            className={cn(
              "flex flex-col items-center gap-1 text-[10px] font-medium transition-all duration-300",
              location.pathname === '/' ? "text-accent-gold" : "text-gray-400 hover:text-white"
            )}
          >
            <Home className="h-5 w-5" />
            <span>Acasă</span>
          </Link>

          {/* Căutare */}
          <Link
            to="/search"
            className={cn(
              "flex flex-col items-center gap-1 text-[10px] font-medium transition-all duration-300",
              location.pathname.startsWith('/search') ? "text-accent-gold" : "text-gray-400 hover:text-white"
            )}
          >
            <Search className="h-5 w-5" />
            <span>Căutare</span>
          </Link>

          {/* Adaugă (Floating Central button) */}
          <Link
            to="/create-listing"
            className="flex flex-col items-center justify-center -translate-y-4"
          >
            <div className="h-12 w-12 rounded-full bg-gold-gradient flex items-center justify-center shadow-glow border-2 border-secondary-950 text-secondary-900 active:scale-95 transition-transform duration-200">
              <Plus className="h-6 w-6 stroke-[3]" />
            </div>
            <span className="text-[10px] font-medium text-gray-400 mt-1">Adaugă</span>
          </Link>

          {/* Favorite */}
          <Link
            to="/favorites"
            className={cn(
              "flex flex-col items-center gap-1 text-[10px] font-medium transition-all duration-300",
              location.pathname.startsWith('/favorites') ? "text-accent-gold" : "text-gray-400 hover:text-white"
            )}
          >
            <Heart className="h-5 w-5" />
            <span>Favorite</span>
          </Link>

          {/* Meniu (Opens Drawer) */}
          <button
            onClick={() => setIsBottomDrawerOpen(true)}
            className={cn(
              "flex flex-col items-center gap-1 text-[10px] font-medium transition-all duration-300 focus:outline-none",
              isBottomDrawerOpen ? "text-accent-gold" : "text-gray-400 hover:text-white"
            )}
          >
            <Menu className="h-5 w-5" />
            <span>Meniu</span>
          </button>
        </div>
      </div>

      {/* Bottom Drawer Sheet (Mobile only) */}
      <AnimatePresence>
        {isBottomDrawerOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex items-end justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBottomDrawerOpen(false)}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            />

            {/* Drawer Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative w-full max-h-[85vh] bg-glass border-t border-white/10 rounded-t-[2rem] shadow-modal z-10 flex flex-col overflow-hidden animate-none"
            >
              {/* Drag Indicator Pill */}
              <div className="w-full flex justify-center py-3">
                <div className="w-12 h-1.5 rounded-full bg-white/20" />
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto px-6 pb-12 pt-2">

                {/* User Info / Auth Card */}
                <div className="mb-6 bg-glass border border-white/10 rounded-2xl p-4">
                  {authUser ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {profile?.avatar_url || authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture ? (
                          <img
                            src={(profile?.avatar_url || authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture) as string}
                            alt="avatar"
                            className="h-12 w-12 rounded-full border border-accent-gold/50"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-gold-gradient flex items-center justify-center text-lg font-bold text-secondary-900">
                            {(authUser.email?.[0] || 'U').toUpperCase()}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="text-base font-semibold text-white">
                            {profile?.display_name || 'Utilizator AutoFans'}
                          </span>
                          <span className="text-xs text-gray-400 truncate max-w-[180px]">
                            {authUser.email}
                          </span>
                        </div>
                      </div>
                      <Link
                        to="/logout"
                        onClick={() => setIsBottomDrawerOpen(false)}
                        className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
                        title="Deconectare"
                      >
                        <LogOut className="h-5 w-5" />
                      </Link>
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <p className="text-sm text-gray-400 mb-3">Conectează-te pentru a salva favorite și adăuga anunțuri.</p>
                      <Link
                        to={`/login?next=${nextParam}`}
                        onClick={() => setIsBottomDrawerOpen(false)}
                        className="inline-flex w-full items-center justify-center rounded-xl bg-gold-gradient px-3 py-2.5 text-sm font-bold text-secondary-900 transition-all hover:shadow-glow focus:outline-none focus:ring-2 focus:ring-accent-gold focus:ring-offset-2 focus:ring-offset-secondary-800"
                      >
                        Intră în cont
                      </Link>
                    </div>
                  )}
                </div>

                {/* Main Navigation Links in Drawer */}
                <div className="space-y-2 mb-6">
                  {/* Dashboard link if seller */}
                  {profile?.role === 'seller' && (
                    <Link
                      to="/dashboard"
                      onClick={() => setIsBottomDrawerOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium transition-all border border-transparent",
                        location.pathname.startsWith('/dashboard')
                          ? "text-white bg-white/5 border-white/20"
                          : "text-gray-300 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <LayoutDashboard className="h-5 w-5 text-accent-gold" />
                      Dashboard Vânzător
                    </Link>
                  )}

                  {/* Profil link if logged in */}
                  {authUser && (
                    <Link
                      to="/profile"
                      onClick={() => setIsBottomDrawerOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium transition-all border border-transparent",
                        location.pathname.startsWith('/profile')
                          ? "text-white bg-white/5 border-white/20"
                          : "text-gray-300 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <User className="h-5 w-5 text-accent-gold" />
                      Profilul meu
                    </Link>
                  )}

                  {/* Vinde anunt quick link */}
                  <Link
                    to="/create-listing"
                    onClick={() => setIsBottomDrawerOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium transition-all border border-transparent",
                      location.pathname.startsWith('/create-listing')
                        ? "text-white bg-white/5 border-white/20"
                        : "text-gray-300 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <Plus className="h-5 w-5 text-accent-gold" />
                    Adaugă Anunț Nou
                  </Link>
                </div>

                {/* Notifications segment inside drawer */}
                <div className="border-t border-white/10 pt-6">
                  <div className="flex items-center justify-between mb-4 px-2">
                    <div className="flex items-center gap-2">
                      <Bell className="h-5 w-5 text-accent-gold" />
                      <span className="text-base font-semibold text-white">Notificări</span>
                    </div>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 text-xs font-bold bg-accent-gold text-secondary-900 rounded-full shadow-glow">
                        {unreadCount} noi
                      </span>
                    )}
                  </div>
                  
                  {/* Direct link to notifications page for mobile */}
                  <Link 
                    to="/notifications"
                    onClick={() => setIsBottomDrawerOpen(false)}
                    className="flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl py-3 border border-white/5 transition-colors w-full"
                  >
                    <span className="text-sm text-gray-300 font-medium">Vezi toate notificările</span>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <PremiumFooter navigation={navigation} />
    </div>
    
  );
}
