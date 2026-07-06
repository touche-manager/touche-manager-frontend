// Firebase Messaging Service Worker — Touché Manager
// Config hardcoded here: the SW wakes up with no open clients when a background push arrives
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Firebase web keys are intentionally public — security is handled via Firebase Security Rules
firebase.initializeApp({
  apiKey:            'AIzaSyBRqdJQcb8c0VrQAm_Lrg88pt2Cm1-csks',
  authDomain:        'touche-manager.firebaseapp.com',
  projectId:         'touche-manager',
  storageBucket:     'touche-manager.firebasestorage.app',
  messagingSenderId: '415393318142',
  appId:             '1:415393318142:web:39e7c207cba66f493291af'
});

const messaging = firebase.messaging();

function getEmoji(type) {
  const map = {
    UPCOMING_BOUT:     '⚔️',
    YOUR_TURN:         '🎯',
    NEXT_UP:           '⏰',
    PAYMENT_CONFIRMED: '✅',
  };
  return map[type] || '🏆';
}

// Called when app is closed or in background
messaging.onBackgroundMessage((payload) => {
  const data  = payload.data  || {};
  const type  = data.type     || '';
  const emoji = getEmoji(type);

  // Use data fields instead of notification fields to support custom data-only messages
  const title = `${emoji} ${data.title || 'Touché Manager'}`;
  const body  = data.body  || '';
  const targetUrl = '/athlete/enrollments';

  self.registration.showNotification(title, {
    body,
    icon:               '/logo.png',
    badge:              '/logo.png',
    data:               { ...data, targetUrl },
    tag:                `touche-${type}-${data.boutId || data.tournamentId || Date.now()}`,
    renotify:           true,
    requireInteraction: true,
    vibrate:            [200, 100, 200],
    actions: [
      { action: 'open',    title: '📋 Ver detalle' },
      { action: 'dismiss', title: 'Cerrar' }
    ]
  });
});

// Handle tap on notification body or action buttons
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.targetUrl || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      return clients.openWindow(targetUrl);
    })
  );
});
