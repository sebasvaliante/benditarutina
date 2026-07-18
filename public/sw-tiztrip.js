// Service worker de TizTrip: solo maneja notificaciones.
// No intercepta fetch, así no afecta a Bendita Rutina (comparten origen).

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes('tiztrip') && 'focus' in client) return client.focus();
      }
      if (clients.length > 0 && 'focus' in clients[0]) return clients[0].focus();
      return self.clients.openWindow('/tiztrip.html');
    })
  );
});
