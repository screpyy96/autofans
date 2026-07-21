import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate, useRouteLoaderData } from 'react-router';
import {
  Home,
  Search,
  Car,
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
  Handshake,
  Newspaper,
  ShieldCheck,
  Flag
} from 'lucide-react';
import { PremiumFooter } from '~/components/layout/PremiumFooter';
import { useSyncFavorites } from '~/hooks/useSyncFavorites';
import { useCurrency } from '~/stores/useAppStore';
import { NotificationPriority, NotificationType, type Notification } from '~/types';
import React from 'react';

interface MainLayoutProps {
  children: React.ReactNode;
}

const baseNavigation = [
  { name: 'Acasă', href: '/', icon: Home },
  { name: 'Căutare', href: '/search', icon: Search },
  { name: 'Garaj 🏎️', href: '/garage', icon: Car },
  { name: 'Blog', href: '/blog', icon: Newspaper },
  { name: 'Dealeri', href: '/dealeri', icon: Handshake },
  { name: 'Favorite', href: '/favorites', icon: Heart },
  { name: 'Mesaje', href: '/messages', icon: MessageCircle },
  { name: 'Contul meu', href: '/profile', icon: User },
];

// The app shell is on every route. Keeping this tiny helper local prevents
// it from pulling a shared UI/animation chunk into the initial homepage load.
const cn = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(' ');
const NotificationBell = React.lazy(() =>
  import('~/components/ui/NotificationBell').then(({ NotificationBell: NotificationBellComponent }) => ({ default: NotificationBellComponent })),
);

export function MainLayout({ children }: MainLayoutProps) {
  const [isBottomDrawerOpen, setIsBottomDrawerOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const drawerDragStartY = useRef<number | null>(null);
  const restoreDrawerScroll = useRef(true);
  const drawerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { currency, toggleCurrency } = useCurrency();
  const [hasHydrated, setHasHydrated] = useState(false);
  useEffect(() => {
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!userMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  // A bottom sheet must never allow the page behind it to scroll on mobile.
  useEffect(() => {
    if (!isBottomDrawerOpen || typeof window === 'undefined') return;

    const scrollY = window.scrollY;
    const bodyStyle = document.body.style;
    const htmlStyle = document.documentElement.style;
    const previous = {
      bodyPosition: bodyStyle.position,
      bodyTop: bodyStyle.top,
      bodyWidth: bodyStyle.width,
      bodyOverflow: bodyStyle.overflow,
      htmlOverflow: htmlStyle.overflow,
    };

    bodyStyle.position = 'fixed';
    bodyStyle.top = `-${scrollY}px`;
    bodyStyle.width = '100%';
    bodyStyle.overflow = 'hidden';
    htmlStyle.overflow = 'hidden';

    return () => {
      bodyStyle.position = previous.bodyPosition;
      bodyStyle.top = previous.bodyTop;
      bodyStyle.width = previous.bodyWidth;
      bodyStyle.overflow = previous.bodyOverflow;
      htmlStyle.overflow = previous.htmlOverflow;
      if (restoreDrawerScroll.current) window.scrollTo(0, scrollY);
      restoreDrawerScroll.current = true;
    };
  }, [isBottomDrawerOpen]);

  useEffect(() => {
    if (!isBottomDrawerOpen) return;
    const focusFrame = window.requestAnimationFrame(() => drawerRef.current?.focus());
    return () => window.cancelAnimationFrame(focusFrame);
  }, [isBottomDrawerOpen]);

  const openBottomDrawer = useCallback(() => {
    restoreDrawerScroll.current = true;
    setIsBottomDrawerOpen(true);
  }, []);

  /** Do not restore a previous page's scroll position when a drawer link is
   * navigating to a new route. */
  const closeBottomDrawer = useCallback((restoreScroll = true) => {
    restoreDrawerScroll.current = restoreScroll;
    setIsBottomDrawerOpen(false);
  }, []);
  // Auth from root loader (Supabase)
  const rootData = useRouteLoaderData('root') as
    | { user?: { id: string; email?: string; user_metadata?: Record<string, any> } | null, profile?: { role?: string, avatar_url?: string, email?: string, display_name?: string } | null, unreadNotificationCount?: number }
    | undefined;
  const authUser = rootData?.user ?? null;
  const profile = (rootData as any)?.profile ?? null;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoaded, setNotificationsLoaded] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const initialUnreadNotificationCount = rootData?.unreadNotificationCount ?? 0;

  useEffect(() => {
    setNotifications([]);
    setNotificationsLoaded(false);
    setNotificationsLoading(false);
  }, [authUser?.id]);

  const unreadCount = notificationsLoaded
    ? notifications.filter((notification) => !notification.isRead).length
    : initialUnreadNotificationCount;
  const loadNotifications = useCallback((force = false) => {
    if (!authUser || (!force && (notificationsLoaded || notificationsLoading))) return;
    setNotificationsLoading(true);
    void import('~/lib/supabase.client')
      .then(async ({ getSupabaseBrowserClient }) => {
        const { data, error } = await getSupabaseBrowserClient()
          .from('alert_notifications')
          .select('id, kind, title, body, action_url, read_at, created_at')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false })
          .limit(10);
        if (error) throw error;
        const validTypes = new Set(Object.values(NotificationType));
        setNotifications((data || []).map((alert: any) => ({
          id: String(alert.id),
          type: validTypes.has(alert.kind) ? alert.kind as NotificationType : NotificationType.SYSTEM,
          priority: NotificationPriority.MEDIUM,
          title: alert.title,
          message: alert.body,
          actionUrl: alert.action_url,
          isRead: Boolean(alert.read_at),
          createdAt: new Date(alert.created_at),
          readAt: alert.read_at ? new Date(alert.read_at) : undefined,
          userId: authUser.id,
        })));
        setNotificationsLoaded(true);
      })
      .catch((error) => console.warn('Could not load alerts:', error))
      .finally(() => setNotificationsLoading(false));
  }, [authUser, notificationsLoaded, notificationsLoading]);

  useEffect(() => {
    if (!authUser) return;
    let active = true;
    let channel: { unsubscribe: () => unknown } | null = null;
    void import('~/lib/supabase.client').then(({ getSupabaseBrowserClient }) => {
      if (!active) return;
      const supabase = getSupabaseBrowserClient();
      channel = supabase.channel(`autofans-alerts-${authUser.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alert_notifications', filter: `user_id=eq.${authUser.id}` }, () => {
          loadNotifications(true);
        })
        .subscribe();
    }).catch((error) => console.warn('Could not subscribe to alerts:', error));
    return () => {
      active = false;
      if (channel) void channel.unsubscribe();
    };
  }, [authUser?.id, loadNotifications]);
  const persistNotificationUpdate = (id: string, readAt: string) => {
    void import('~/lib/supabase.client')
      .then(({ getSupabaseBrowserClient }) => getSupabaseBrowserClient().from('alert_notifications').update({ read_at: readAt }).eq('id', Number(id)))
      .then(({ error }) => { if (error) console.warn('Could not mark alert as read:', error); })
      .catch((error) => console.warn('Could not mark alert as read:', error));
  };
  const markAsRead = (id: string) => {
    const readAt = new Date().toISOString();
    setNotifications((current) => current.map((notification) => notification.id === id ? { ...notification, isRead: true, readAt: new Date(readAt) } : notification));
    persistNotificationUpdate(id, readAt);
  };
  const markAllAsRead = () => {
    const unreadIds = notifications.filter((notification) => !notification.isRead).map((notification) => notification.id);
    const readAt = new Date().toISOString();
    setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true, readAt: notification.readAt || new Date(readAt) })));
    unreadIds.forEach((id) => persistNotificationUpdate(id, readAt));
  };
  const clearAll = () => {
    const ids = notifications.map((notification) => Number(notification.id)).filter(Number.isInteger);
    setNotifications([]);
    if (!ids.length) return;
    void import('~/lib/supabase.client')
      .then(({ getSupabaseBrowserClient }) => getSupabaseBrowserClient().from('alert_notifications').delete().in('id', ids))
      .then(({ error }) => { if (error) console.warn('Could not clear alerts:', error); })
      .catch((error) => console.warn('Could not clear alerts:', error));
  };
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) markAsRead(notification.id);
    if (notification.actionUrl) navigate(notification.actionUrl);
  };

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };
  const nextParam = encodeURIComponent(location.pathname || '/');
  const isCarDetailsPage = location.pathname.startsWith('/car/');

  // Sync favorites when user logs in
  useSyncFavorites(authUser?.id);

  // Handle mobile menu keyboard navigation
  const handleMobileMenuKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeBottomDrawer();
    }
  };

  // Close menus and drawer on route change
  React.useEffect(() => {
    setUserMenuOpen(false);
    closeBottomDrawer(false);
  }, [location.pathname, closeBottomDrawer]);

  // Build navigation dynamically (when logged in, user-specific links like Favorite, Mesaje, Contul meu are accessible via the user profile dropdown)
  const navigation = React.useMemo(() => {
    return baseNavigation.filter((item) => {
      if (authUser) {
        if (item.href === '/profile' || item.href === '/messages' || item.href === '/favorites') return false;
      } else {
        if (item.href === '/profile' || item.href === '/messages') return false;
      }
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
              prefetch="intent"
              className="group flex items-center rounded-lg bg-white px-2 py-1 shadow-[0_6px_18px_rgba(0,0,0,0.22)]"
            >
              <picture>
                <source srcSet="/logo-header.webp" type="image/webp" />
                <img
                  src="/logo-header.png"
                  alt="AutoFans.ro"
                  width={900}
                  height={237}
                  className="h-10 w-auto transition-transform duration-200 group-hover:scale-105 group-active:scale-95"
                />
              </picture>
            </Link>

            {/* Desktop Navigation */}
            <nav 
              id="main-navigation"
              className="hidden md:flex items-center gap-6"
              role="navigation"
              aria-label="Navigare principală"
            >
              {navigation.map((item) => (
                <div key={item.name} className="transition-transform duration-200 hover:scale-105 active:scale-95">
                  <Link
                    to={item.href}
                    prefetch="intent"
                    className={cn(
                      'relative flex items-center gap-2 px-1 pt-2 pb-2 text-sm font-semibold transition-colors group border-b-2 border-transparent',
                      'focus:outline-none focus:ring-0',
                      isActive(item.href)
                        ? 'text-white border-accent-gold'
                        : 'text-gray-300 hover:text-white hover:border-accent-gold/60'
                    )}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                  >
                    <span className="transition-transform duration-200 group-hover:rotate-[5deg] group-hover:scale-110">
                      <item.icon 
                        className={cn(
                          "h-4 w-4 transition-colors duration-300",
                          isActive(item.href) ? "text-white" : ""
                        )}
                        aria-hidden="true"
                      />
                    </span>
                    <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                      {item.name}
                    </span>
                  </Link>
                </div>
              ))}
            </nav>

            {/* Right side actions */}
            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              {authUser && (
                <React.Suspense fallback={<span aria-hidden="true" className="hidden h-10 w-10 sm:block" />}>
                  <NotificationBell
                    notifications={notifications}
                    unreadCount={unreadCount}
                    onNotificationClick={handleNotificationClick}
                    onMarkAsRead={markAsRead}
                    onMarkAllAsRead={markAllAsRead}
                    onClearAll={clearAll}
                    onViewAll={() => navigate('/notifications')}
                    onOpenChange={(isOpen) => { if (isOpen) loadNotifications(); }}
                    loading={notificationsLoading}
                    className="hidden sm:block"
                  />
                </React.Suspense>
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
                <div className="relative" ref={userMenuRef}>
                  <button
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-2xl hover:bg-white/10 border border-transparent hover:border-white/10 transition"
                    onClick={() => setUserMenuOpen((v) => !v)}
                    aria-haspopup="menu"
                    aria-expanded={userMenuOpen}
                  >
                    {profile?.avatar_url || authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture ? (
                      <img
                        src={(profile?.avatar_url || authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture) as string}
                        alt="avatar"
                        className="h-7 w-7 rounded-full border border-accent-gold/40"
                      />
                    ) : (
                      <div className="h-7 w-7 rounded-full bg-accent-gold/20 border border-accent-gold/40 flex items-center justify-center text-xs font-bold text-accent-gold">
                        {(authUser.email?.[0] || 'U').toUpperCase()}
                      </div>
                    )}
                    <span className="hidden sm:block text-sm font-medium text-gray-200 max-w-[140px] truncate">
                      {profile?.display_name || authUser.email}
                    </span>
                    <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform duration-200", userMenuOpen && "rotate-180")} />
                  </button>
                  {userMenuOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 mt-2 w-52 bg-secondary-900/95 border border-white/20 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden z-50 py-1.5"
                    >
                      <div className="px-4 py-2 border-b border-white/10 mb-1">
                        <p className="text-[11px] font-medium text-gray-400">Conectat ca</p>
                        <p className="text-xs font-bold text-white truncate">
                          {profile?.display_name || authUser.email}
                        </p>
                      </div>

                      {profile?.role === 'seller' && (
                        <Link 
                          to="/dashboard" 
                          prefetch="intent" 
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-white/10 hover:text-white transition-colors" 
                          role="menuitem"
                        >
                          <LayoutDashboard className="h-4 w-4 text-accent-gold" />
                          Dashboard Vânzător
                        </Link>
                      )}
                      <Link 
                        to="/profile" 
                        prefetch="intent" 
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-white/10 hover:text-white transition-colors" 
                        role="menuitem"
                      >
                        <User className="h-4 w-4 text-accent-gold" />
                        Contul meu
                      </Link>
                      <Link 
                        to="/messages" 
                        prefetch="intent" 
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-white/10 hover:text-white transition-colors" 
                        role="menuitem"
                      >
                        <MessageCircle className="h-4 w-4 text-accent-gold" />
                        Mesajele mele
                      </Link>
                      <Link 
                        to="/favorites" 
                        prefetch="intent" 
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-white/10 hover:text-white transition-colors" 
                        role="menuitem"
                      >
                        <Heart className="h-4 w-4 text-accent-gold" />
                        Favorite
                      </Link>
                      <Link 
                        to="/reports" 
                        prefetch="intent" 
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-white/10 hover:text-white transition-colors" 
                        role="menuitem"
                      >
                        <Flag className="h-4 w-4 text-red-400" />
                        Rapoartele mele
                      </Link>

                      <div className="my-1.5 h-px bg-white/10" />

                      <Link 
                        to="/logout" 
                        prefetch="intent" 
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors" 
                        role="menuitem"
                      >
                        <LogOut className="h-4 w-4" />
                        Deconectare
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to={`/login?next=${nextParam}`}
                  prefetch="intent"
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
            prefetch="intent"
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
            prefetch="intent"
            className={cn(
              "flex flex-col items-center gap-1 text-[10px] font-medium transition-all duration-300",
              location.pathname.startsWith('/search') ? "text-accent-gold" : "text-gray-400 hover:text-white"
            )}
          >
            <Search className="h-5 w-5" />
            <span>Căutare</span>
          </Link>

          {/* Adaugă anunț — prominent central action */}
          <Link
            to="/create-listing"
            prefetch="intent"
            className={cn(
              "-mt-7 flex flex-col items-center gap-1 text-[10px] font-semibold transition-transform duration-200 hover:scale-105",
              location.pathname.startsWith('/create-listing') ? "text-white" : "text-accent-gold"
            )}
            aria-label="Adaugă anunț"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-secondary-950 bg-gold-gradient text-secondary-950 shadow-glow">
              <Plus className="h-6 w-6" aria-hidden="true" />
            </span>
            <span>Adaugă</span>
          </Link>

          {/* Dealeri — direct, because this is a core conversion route on mobile. */}
          <Link
            to="/dealeri"
            prefetch="intent"
            className={cn(
              "flex flex-col items-center gap-1 text-[10px] font-medium transition-all duration-300",
              location.pathname.startsWith('/dealeri') ? "text-accent-gold" : "text-gray-400 hover:text-white"
            )}
            aria-label="Pentru dealeri"
          >
            <Handshake className="h-5 w-5" />
            <span>Dealeri</span>
          </Link>

          {/* Meniu (Opens Drawer) */}
          <button
            onClick={openBottomDrawer}
            className={cn(
              "flex flex-col items-center gap-1 text-[10px] font-medium transition-all duration-300 focus:outline-none",
              isBottomDrawerOpen ? "text-accent-gold" : "text-gray-400 hover:text-white"
            )}
            aria-label="Deschide meniul"
            aria-expanded={isBottomDrawerOpen}
          >
            <Menu className="h-5 w-5" />
            <span>Meniu</span>
          </button>
        </div>
      </div>

      {/* Bottom Drawer Sheet (Mobile only) */}
      {isBottomDrawerOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex items-end justify-center">
            {/* Backdrop */}
            <div
              onClick={() => closeBottomDrawer()}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm motion-safe:animate-[autofans-fade-in_160ms_ease-out]"
            />

            {/* Drawer Sheet */}
            <div
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-label="Meniu principal"
              tabIndex={-1}
              onKeyDown={handleMobileMenuKeyDown}
              className="relative z-10 flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-[2rem] border-t border-white/10 bg-glass shadow-modal outline-none motion-safe:animate-[autofans-drawer-in_240ms_cubic-bezier(0.22,1,0.36,1)]"
            >
              {/* Drag handle: pull down to close without touching the page behind it. */}
              <button
                type="button"
                onClick={() => closeBottomDrawer()}
                onPointerDown={(event) => {
                  drawerDragStartY.current = event.clientY;
                  event.currentTarget.setPointerCapture(event.pointerId);
                }}
                onPointerUp={(event) => {
                  const startY = drawerDragStartY.current;
                  drawerDragStartY.current = null;
                  if (startY !== null && event.clientY - startY > 72) closeBottomDrawer();
                }}
                onPointerCancel={() => { drawerDragStartY.current = null; }}
                className="flex w-full justify-center py-3 touch-none cursor-grab active:cursor-grabbing"
                aria-label="Închide meniul. Poți trage în jos"
              >
                <div className="w-12 h-1.5 rounded-full bg-white/20" />
              </button>

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
                        onClick={() => closeBottomDrawer(false)}
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
                        onClick={() => closeBottomDrawer(false)}
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
                      prefetch="intent"
                      onClick={() => closeBottomDrawer(false)}
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
                    <>
                      <Link
                        to="/profile"
                        prefetch="intent"
                        onClick={() => closeBottomDrawer(false)}
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
                      <Link
                        to="/reports"
                        prefetch="intent"
                        onClick={() => closeBottomDrawer(false)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium transition-all border border-transparent",
                          location.pathname.startsWith('/reports')
                            ? "text-white bg-white/5 border-white/20"
                            : "text-gray-300 hover:text-white hover:bg-white/5"
                        )}
                      >
                        <Flag className="h-5 w-5 text-red-300" />
                        Rapoartele mele
                      </Link>
                    </>
                  )}

                  {/* Vinde anunt quick link */}
                  <Link
                    to="/create-listing"
                    prefetch="intent"
                    onClick={() => closeBottomDrawer(false)}
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

                  <Link
                    to="/dealeri"
                    prefetch="intent"
                    onClick={() => closeBottomDrawer(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium transition-all border border-transparent",
                      location.pathname.startsWith('/dealeri')
                        ? "text-white bg-white/5 border-white/20"
                        : "text-gray-300 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <Handshake className="h-5 w-5 text-accent-gold" />
                    Soluții pentru dealeri
                  </Link>

                  <Link
                    to="/blog"
                    prefetch="intent"
                    onClick={() => closeBottomDrawer(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium transition-all border border-transparent",
                      location.pathname.startsWith('/blog')
                        ? "text-white bg-white/5 border-white/20"
                        : "text-gray-300 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <Newspaper className="h-5 w-5 text-accent-gold" />
                    Blog AutoFans
                  </Link>

                  <Link
                    to="/favorites"
                    prefetch="intent"
                    onClick={() => closeBottomDrawer(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium transition-all border border-transparent",
                      location.pathname.startsWith('/favorites')
                        ? "text-white bg-white/5 border-white/20"
                        : "text-gray-300 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <Heart className="h-5 w-5 text-accent-gold" />
                    Favorite
                  </Link>

                  {authUser && (
                    <Link
                      to="/messages"
                      prefetch="intent"
                      onClick={() => closeBottomDrawer(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium transition-all border border-transparent",
                        location.pathname.startsWith('/messages')
                          ? "text-white bg-white/5 border-white/20"
                          : "text-gray-300 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <MessageCircle className="h-5 w-5 text-accent-gold" />
                      Mesajele mele
                    </Link>
                  )}

                  <Link
                    to="/help"
                    prefetch="intent"
                    onClick={() => closeBottomDrawer(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium transition-all border border-transparent",
                      location.pathname.startsWith('/help')
                        ? "text-white bg-white/5 border-white/20"
                        : "text-gray-300 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <ShieldCheck className="h-5 w-5 text-accent-gold" />
                    Ajutor și siguranță
                  </Link>

                  <Link
                    to="/contact"
                    prefetch="intent"
                    onClick={() => closeBottomDrawer(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium transition-all border border-transparent",
                      location.pathname.startsWith('/contact')
                        ? "text-white bg-white/5 border-white/20"
                        : "text-gray-300 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <MessageCircle className="h-5 w-5 text-accent-gold" />
                    Contactează AutoFans
                  </Link>
                </div>

                {/* Notifications are account-specific, so guests never see this entry point. */}
                {authUser && (
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
                    <Link
                      to="/notifications"
                      onClick={() => closeBottomDrawer(false)}
                      className="flex w-full items-center justify-center rounded-2xl border border-white/5 bg-white/5 py-3 transition-colors hover:bg-white/10"
                    >
                      <span className="text-sm font-medium text-gray-300">Vezi toate notificările</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      {/* Footer */}
      <PremiumFooter navigation={navigation} />
    </div>
    
  );
}
