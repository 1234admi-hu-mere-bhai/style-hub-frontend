// MUFFIGOUT push notification service worker
// Branded theme + delivery & click tracking
const TRACK_URL = 'https://zybjzfffkylezzvotcnn.supabase.co/functions/v1/push-track';

function track(event, data) {
  try {
    return fetch(TRACK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        dedupeKey: data?.dedupeKey || null,
        tag: data?.tag || null,
      }),
      keepalive: true,
    }).catch(() => {});
  } catch (e) { /* noop */ }
}

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'MUFFIGOUT', message: event.data ? event.data.text() : 'New notification' };
  }
  const title = data.title || 'MUFFIGOUT APPAREL HUB';
  const options = {
    body: data.message || data.body || 'You have a new update',
    icon: '/notification-icon.png',         // brand MG monogram on left
    badge: '/notification-icon.png',        // small badge (Android status bar)
    image: data.image || undefined,         // optional hero image (Android big-picture)
    data: {
      url: data.url || '/',
      dedupeKey: data.dedupeKey || null,
      tag: data.tag || null,
    },
    vibrate: [200, 100, 200],               // brand cadence
    tag: data.tag || 'muffigout',
    renotify: true,
    requireInteraction: true,               // stays on screen until user acts
    silent: false,
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };
  event.waitUntil(Promise.all([
    self.registration.showNotification(title, options),
    track('delivered', options.data),
  ]));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const url = data.url || '/';

  if (event.action === 'dismiss') {
    event.waitUntil(track('dismissed', data));
    return;
  }

  event.waitUntil(Promise.all([
    track('clicked', data),
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    }),
  ]));
});

self.addEventListener('notificationclose', (event) => {
  const data = event.notification.data || {};
  event.waitUntil(track('dismissed', data));
});
