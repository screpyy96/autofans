import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Car, User, FilterState, SavedSearch, Notification, NotificationType, NotificationPriority } from '~/types';

interface AppState {
  // User state
  user: User | null;
  isAuthenticated: boolean;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  theme: 'light' | 'dark' | 'auto';
  
  // Data state
  favorites: string[];
  comparisonCars: string[];
  savedSearches: SavedSearch[];
  recentSearches: string[];
  
  // Notifications
  notifications: Notification[];
  unreadNotificationCount: number;
  
  // Search state
  currentFilters: FilterState;
  searchHistory: string[];
}

interface AppActions {
  // User actions
  setUser: (user: User | null) => void;
  login: (user: User) => void;
  logout: () => void;
  
  // UI actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  
  // Favorites actions
  addToFavorites: (carId: string) => void;
  removeFromFavorites: (carId: string) => void;
  isFavorited: (carId: string) => boolean;
  
  // Comparison actions
  addToComparison: (carId: string) => void;
  removeFromComparison: (carId: string) => void;
  clearComparison: () => void;
  isInComparison: (carId: string) => boolean;
  canAddToComparison: () => boolean;
  
  // Search actions
  addSavedSearch: (search: SavedSearch) => void;
  removeSavedSearch: (searchId: string) => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  
  // Filter actions
  setCurrentFilters: (filters: FilterState) => void;
  updateCurrentFilters: (filters: Partial<FilterState>) => void;
  resetCurrentFilters: () => void;
  
  // Notification actions
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void;
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;
  removeNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
  
  // App initialization
  initializeApp: () => Promise<void>;
  resetApp: () => void;
}

type AppStore = AppState & AppActions;

// Initial state
const initialState: AppState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  theme: 'auto',
  favorites: [],
  comparisonCars: [],
  savedSearches: [],
  recentSearches: [],
  notifications: [],
  unreadNotificationCount: 0,
  currentFilters: {},
  searchHistory: [],
};

// Create the store
export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          ...initialState,

          // User actions
          setUser: (user) =>
            set((state) => {
              state.user = user;
              state.isAuthenticated = !!user;
            }),

          login: (user) =>
            set((state) => {
              state.user = user;
              state.isAuthenticated = true;
              state.error = null;
            }),

          logout: () =>
            set((state) => {
              state.user = null;
              state.isAuthenticated = false;
              state.favorites = [];
              state.comparisonCars = [];
              state.savedSearches = [];
              state.recentSearches = [];
              state.notifications = [];
              state.unreadNotificationCount = 0;
            }),

          // UI actions
          setLoading: (loading) =>
            set((state) => {
              state.isLoading = loading;
            }),

          setError: (error) =>
            set((state) => {
              state.error = error;
            }),

          setTheme: (theme) =>
            set((state) => {
              state.theme = theme;
              // Apply theme to document
              if (typeof window !== 'undefined') {
                const root = document.documentElement;
                if (theme === 'auto') {
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  root.classList.toggle('dark', prefersDark);
                } else {
                  root.classList.toggle('dark', theme === 'dark');
                }
              }
            }),

          // Favorites actions
          addToFavorites: (carId) =>
            set((state) => {
              if (!state.favorites.includes(carId)) {
                state.favorites.push(carId);
              }
            }),

          removeFromFavorites: (carId) =>
            set((state) => {
              state.favorites = state.favorites.filter(id => id !== carId);
            }),

          isFavorited: (carId) => {
            return get().favorites.includes(carId);
          },

          // Comparison actions
          addToComparison: (carId) =>
            set((state) => {
              if (!state.comparisonCars.includes(carId) && state.comparisonCars.length < 3) {
                state.comparisonCars.push(carId);
              }
            }),

          removeFromComparison: (carId) =>
            set((state) => {
              state.comparisonCars = state.comparisonCars.filter(id => id !== carId);
            }),

          clearComparison: () =>
            set((state) => {
              state.comparisonCars = [];
            }),

          isInComparison: (carId) => {
            return get().comparisonCars.includes(carId);
          },

          canAddToComparison: () => {
            return get().comparisonCars.length < 3;
          },

          // Search actions
          addSavedSearch: (search) =>
            set((state) => {
              state.savedSearches.push(search);
            }),

          removeSavedSearch: (searchId) =>
            set((state) => {
              state.savedSearches = state.savedSearches.filter(search => search.id !== searchId);
            }),

          addRecentSearch: (query) =>
            set((state) => {
              // Remove if already exists and add to beginning
              state.recentSearches = state.recentSearches.filter(search => search !== query);
              state.recentSearches.unshift(query);
              // Keep only last 10 searches
              state.recentSearches = state.recentSearches.slice(0, 10);
            }),

          clearRecentSearches: () =>
            set((state) => {
              state.recentSearches = [];
            }),

          // Filter actions
          setCurrentFilters: (filters) =>
            set((state) => {
              state.currentFilters = filters;
            }),

          updateCurrentFilters: (filters) =>
            set((state) => {
              state.currentFilters = { ...state.currentFilters, ...filters };
            }),

          resetCurrentFilters: () =>
            set((state) => {
              state.currentFilters = {};
            }),

          // Notification actions
          addNotification: (notification) =>
            set((state) => {
              const newNotification: Notification = {
                ...notification,
                id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                createdAt: new Date(),
                isRead: false,
              };
              state.notifications.unshift(newNotification);
              state.unreadNotificationCount += 1;
              // Keep only last 50 notifications
              if (state.notifications.length > 50) {
                state.notifications = state.notifications.slice(0, 50);
              }
            }),

          markNotificationAsRead: (notificationId) =>
            set((state) => {
              const notification = state.notifications.find(n => n.id === notificationId);
              if (notification && !notification.isRead) {
                notification.isRead = true;
                notification.readAt = new Date();
                state.unreadNotificationCount = Math.max(0, state.unreadNotificationCount - 1);
              }
            }),

          markAllNotificationsAsRead: () =>
            set((state) => {
              const now = new Date();
              state.notifications.forEach(notification => {
                notification.isRead = true;
                notification.readAt = now;
              });
              state.unreadNotificationCount = 0;
            }),

          removeNotification: (notificationId) =>
            set((state) => {
              const notification = state.notifications.find(n => n.id === notificationId);
              if (notification && !notification.isRead) {
                state.unreadNotificationCount = Math.max(0, state.unreadNotificationCount - 1);
              }
              state.notifications = state.notifications.filter(n => n.id !== notificationId);
            }),

          clearAllNotifications: () =>
            set((state) => {
              state.notifications = [];
              state.unreadNotificationCount = 0;
            }),

          // App initialization
          initializeApp: async () => {
            const currentState = get();
            
            // Prevent multiple simultaneous initializations
            if (currentState.isLoading) {
              return;
            }

            set((state) => {
              state.isLoading = true;
              state.error = null;
            });

            try {
              // Simulate initialization delay
              await new Promise(resolve => setTimeout(resolve, 800));

              // Load user data if authenticated
              if (typeof window !== 'undefined') {
                const userData = localStorage.getItem('autofans_user');
                if (userData) {
                  try {
                    const user = JSON.parse(userData);
                    set((state) => {
                      state.user = user;
                      state.isAuthenticated = true;
                    });
                  } catch (error) {
                    console.error('Failed to parse user data:', error);
                    localStorage.removeItem('autofans_user');
                  }
                }
              }

              // Add some mock notifications only if not already added
              const currentNotifications = get().notifications;
              if (currentNotifications.length === 0) {
                const mockNotifications = [
                  {
                    title: 'Mașină nouă adăugată',
                    message: 'O mașină care îți place a fost adăugată în zona ta',
                    type: 'new_listing' as NotificationType,
                    priority: 'medium' as NotificationPriority,
                    userId: 'user1',
                  },
                  {
                    title: 'Reducere de preț',
                    message: 'BMW X5 din favoritele tale a fost redus cu 2,000€',
                    type: 'price_drop' as NotificationType,
                    priority: 'high' as NotificationPriority,
                    userId: 'user1',
                  },
                  {
                    title: 'Mesaj nou',
                    message: 'Ai primit un mesaj pentru anunțul tău',
                    type: 'message' as NotificationType,
                    priority: 'medium' as NotificationPriority,
                    userId: 'user1',
                  },
                ];

                mockNotifications.forEach(notification => {
                  get().addNotification(notification);
                });
              }

              set((state) => {
                state.isLoading = false;
              });
            } catch (error) {
              console.error('App initialization failed:', error);
              set((state) => {
                state.isLoading = false;
                state.error = 'Failed to initialize app';
              });
            }
          },

          resetApp: () =>
            set(() => ({
              ...initialState,
            })),
        }))
      ),
      {
        name: 'autofans-store',
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          theme: state.theme,
          favorites: state.favorites,
          comparisonCars: state.comparisonCars,
          savedSearches: state.savedSearches,
          recentSearches: state.recentSearches,
        }),
        // Add server-side rendering support
        skipHydration: true,
      }
    ),
    {
      name: 'autofans-store',
    }
  )
);

// Hydration function for SSR
export const hydrateStore = () => {
  if (typeof window !== 'undefined') {
    useAppStore.persist.rehydrate();
  }
};

// Individual selectors to prevent infinite loops
export const useUser = () => {
  const user = useAppStore((state) => state.user);
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const setUser = useAppStore((state) => state.setUser);
  const login = useAppStore((state) => state.login);
  const logout = useAppStore((state) => state.logout);
  
  return { user, isAuthenticated, setUser, login, logout };
};

export const useFavorites = () => {
  const favorites = useAppStore((state) => state.favorites);
  const addToFavorites = useAppStore((state) => state.addToFavorites);
  const removeFromFavorites = useAppStore((state) => state.removeFromFavorites);
  const isFavorited = useAppStore((state) => state.isFavorited);

  // Debug logging - only in development
  if (process.env.NODE_ENV === 'development') {
    useAppStore.subscribe((state) => {
      console.log('❤️ Favorites state changed:', state.favorites);
    });
  }

  return { favorites, addToFavorites, removeFromFavorites, isFavorited };
};

export const useComparison = () => {
  const comparisonCars = useAppStore((state) => state.comparisonCars);
  const addToComparison = useAppStore((state) => state.addToComparison);
  const removeFromComparison = useAppStore((state) => state.removeFromComparison);
  const clearComparison = useAppStore((state) => state.clearComparison);
  const isInComparison = useAppStore((state) => state.isInComparison);
  const canAddToComparison = useAppStore((state) => state.canAddToComparison);

  // Debug logging - only in development
  if (process.env.NODE_ENV === 'development') {
    useAppStore.subscribe((state) => {
      console.log('🔄 Comparison state changed:', state.comparisonCars);
    });
  }

  return { comparisonCars, addToComparison, removeFromComparison, clearComparison, isInComparison, canAddToComparison };
};

export const useNotifications = () => {
  const notifications = useAppStore((state) => state.notifications);
  const unreadCount = useAppStore((state) => state.unreadNotificationCount);
  const addNotification = useAppStore((state) => state.addNotification);
  const markAsRead = useAppStore((state) => state.markNotificationAsRead);
  const markAllAsRead = useAppStore((state) => state.markAllNotificationsAsRead);
  const removeNotification = useAppStore((state) => state.removeNotification);
  const clearAll = useAppStore((state) => state.clearAllNotifications);
  
  return { notifications, unreadCount, addNotification, markAsRead, markAllAsRead, removeNotification, clearAll };
};

export const useFilters = () => {
  const currentFilters = useAppStore((state) => state.currentFilters);
  const setCurrentFilters = useAppStore((state) => state.setCurrentFilters);
  const updateCurrentFilters = useAppStore((state) => state.updateCurrentFilters);
  const resetCurrentFilters = useAppStore((state) => state.resetCurrentFilters);
  
  return { currentFilters, setCurrentFilters, updateCurrentFilters, resetCurrentFilters };
};

export const useAppInitialization = () => {
  const isLoading = useAppStore((state) => state.isLoading);
  const error = useAppStore((state) => state.error);
  const initializeApp = useAppStore((state) => state.initializeApp);
  const setLoading = useAppStore((state) => state.setLoading);
  const setError = useAppStore((state) => state.setError);
  
  return { isLoading, error, initializeApp, setLoading, setError };
};

export const useTheme = () => {
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  
  return { theme, setTheme };
};
