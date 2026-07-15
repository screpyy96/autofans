// Service Worker for caching strategies
const STATIC_CACHE = 'autofans-static-v3';
const IMAGE_CACHE = 'autofans-images-v3';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/manifest.json',
  '/autofans-logo-pack/icons/favicon.ico',
  '/autofans-logo-pack/icons/android-chrome-192x192.png',
  '/autofans-logo-pack/icons/autofans-icon-512.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => 
              cacheName !== STATIC_CACHE && 
              cacheName !== IMAGE_CACHE
            )
            .map(cacheName => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Updates wait until the in-app prompt asks for them. This prevents a seller
// from losing a draft or a buyer from being interrupted mid-conversation.
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Never cache third-party, extension, authenticated document, or API traffic.
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith('/api/') || request.destination === 'document') {
    event.respondWith(fetch(request));
  } else if (request.destination === 'image') {
    event.respondWith(handleImageRequest(request));
  } else {
    event.respondWith(handleStaticRequest(request));
  }
});

// Image caching strategy - Cache First for public first-party assets only.
async function handleImageRequest(request) {
  try {
    const cache = await caches.open(IMAGE_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    if (canCache(networkResponse) && !request.url.includes('token=')) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    return new Response('Image not available', { status: 404 });
  }
}

function canCache(response) {
  if (!response.ok || response.type === 'opaque') return false;
  const cacheControl = response.headers.get('Cache-Control') || '';
  return !cacheControl.includes('no-store') && !cacheControl.includes('private');
}

// Static assets caching strategy - Cache First
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (canCache(networkResponse)) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    return new Response('Resource not available', { status: 404 });
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  let data;
  try {
    data = event.data.json();
  } catch {
    return;
  }
  
  const options = {
    body: data.body,
    icon: '/autofans-logo-pack/icons/android-chrome-192x192.png',
    badge: '/autofans-logo-pack/icons/android-chrome-192x192.png',
    data: data.data,
    actions: data.actions || []
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(handleNotificationAction(event.action, event.notification.data));
});

function handleNotificationAction(action, data) {
  switch (action) {
    case 'view':
      return clients.openWindow(data?.url || '/');
    case 'dismiss':
      return Promise.resolve();
    default:
      return clients.openWindow(data?.url || '/');
  }
}
