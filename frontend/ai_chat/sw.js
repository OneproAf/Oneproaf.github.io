// Service Worker for AI Chat
const CACHE_NAME = 'ai-chat-v1.0.0';
const urlsToCache = [
    './',
    './index.html',
    './css/style.css',
    './js/script.js',
    '../config.js',
    '../models/icon-192.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version or fetch from network
                return response || fetch(event.request);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Handle push notifications (for future use)
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'New message from AI Psychologist',
        icon: '../models/icon-192.png',
        badge: '../models/icon-192.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Open Chat',
                icon: '../models/icon-192.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '../models/icon-192.png'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('AI Psychologist', options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('./')
        );
    }
}); 