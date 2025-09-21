# State Management cu Zustand

## De ce Zustand?

Am migrat de la Context API la **Zustand** pentru următoarele motive:

### ✅ Avantaje
- **Performanță**: Nu cauzează re-renders inutile
- **Simplitate**: Mult mai simplu decât Redux
- **TypeScript**: Excelent suport pentru TypeScript
- **Mărimea bundle-ului**: Foarte mic (~2KB)
- **Persistence**: Built-in localStorage persistence
- **DevTools**: Suport pentru Redux DevTools
- **Immer**: Suport pentru immutable updates

### ❌ Problemele Context API-ului
- Re-renders inutile la fiecare schimbare de state
- Complexitate crescută pentru state complex
- Probleme de timing cu provider-ii
- Boilerplate code excesiv

## Cum să folosești Zustand în proiect

### 1. Importă hook-urile necesare

```typescript
import { useFavorites, useComparison, useUser, useNotifications } from '~/stores/useAppStore';
```

### 2. Folosește hook-urile în componente

```typescript
function MyComponent() {
  const { favorites, addToFavorites, removeFromFavorites, isFavorited } = useFavorites();
  const { user, isAuthenticated, login, logout } = useUser();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  
  return (
    <div>
      <p>Favorite: {favorites.length}</p>
      <p>User: {user?.name}</p>
      <p>Notifications: {unreadCount}</p>
    </div>
  );
}
```

### 3. Hook-uri disponibile

#### `useUser()`
```typescript
const { user, isAuthenticated, setUser, login, logout } = useUser();
```

#### `useFavorites()`
```typescript
const { favorites, addToFavorites, removeFromFavorites, isFavorited } = useFavorites();
```

#### `useComparison()`
```typescript
const { comparisonCars, addToComparison, removeFromComparison, clearComparison, isInComparison, canAddToComparison } = useComparison();
```

#### `useNotifications()`
```typescript
const { notifications, unreadCount, addNotification, markAsRead, markAllAsRead, clearAll } = useNotifications();
```

#### `useFilters()`
```typescript
const { currentFilters, setCurrentFilters, updateCurrentFilters, resetCurrentFilters } = useFilters();
```

#### `useAppInitialization()`
```typescript
const { isLoading, error, initializeApp, setLoading, setError } = useAppInitialization();
```

#### `useTheme()`
```typescript
const { theme, setTheme } = useTheme();
```

## Structura Store-ului

### State
```typescript
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
```

### Actions
Toate acțiunile sunt disponibile prin hook-urile de mai sus. Store-ul folosește **Immer** pentru updates immutable.

## Persistence

Store-ul salvează automat în localStorage:
- `user` și `isAuthenticated`
- `theme`
- `favorites`
- `savedSearches`
- `recentSearches`

## DevTools

Store-ul este configurat cu Redux DevTools pentru debugging:
- Nume: `autofans-store`
- Suport pentru time-travel debugging
- Action logging

## Migrarea de la Context API

### Înainte (Context API - ȘTERS)
```typescript
// Acest cod nu mai există - a fost înlocuit cu Zustand
import { useAppContext } from '~/contexts/AppContext';

function MyComponent() {
  const { state, dispatch } = useAppContext();
  
  const handleAddFavorite = (carId: string) => {
    dispatch({ type: 'ADD_TO_FAVORITES', payload: carId });
  };
  
  return <div>Favorites: {state.favorites.length}</div>;
}
```

### Acum (Zustand)
```typescript
import { useFavorites } from '~/stores/useAppStore';

function MyComponent() {
  const { favorites, addToFavorites } = useFavorites();
  
  const handleAddFavorite = (carId: string) => {
    addToFavorites(carId);
  };
  
  return <div>Favorites: {favorites.length}</div>;
}
```

## Best Practices

1. **Folosește hook-urile specifice** în loc de `useAppStore()` direct
2. **Nu muta state-ul direct** - folosește acțiunile
3. **Folosește selectors** pentru performanță optimă
4. **Testează acțiunile** cu unit tests
5. **Folosește DevTools** pentru debugging

## Exemple de utilizare

### Adăugare la favorite
```typescript
const { addToFavorites, isFavorited } = useFavorites();

<button 
  onClick={() => addToFavorites(car.id)}
  disabled={isFavorited(car.id)}
>
  {isFavorited(car.id) ? 'În favorite' : 'Adaugă la favorite'}
</button>
```

### Gestionarea notificărilor
```typescript
const { addNotification, markAsRead } = useNotifications();

// Adaugă notificare
addNotification({
  title: 'Mașină nouă',
  message: 'O mașină nouă a fost adăugată',
  type: 'new_listing',
  priority: 'medium',
  userId: 'user1'
});

// Marchează ca citită
markAsRead(notificationId);
```

### Gestionarea temei
```typescript
const { theme, setTheme } = useTheme();

<select value={theme} onChange={(e) => setTheme(e.target.value)}>
  <option value="light">Luminos</option>
  <option value="dark">Întunecat</option>
  <option value="auto">Automat</option>
</select>
```

## Concluzie

Zustand oferă o experiență mult mai bună pentru state management în aplicația AutoFans:
- Cod mai curat și mai ușor de înțeles
- Performanță superioară
- Mai puține bug-uri
- Dezvoltare mai rapidă
- Debugging mai ușor

Store-ul este complet tipizat cu TypeScript și oferă toate funcționalitățile necesare pentru aplicația de mașini second-hand.
