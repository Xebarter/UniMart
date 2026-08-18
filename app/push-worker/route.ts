export const runtime = 'nodejs'

function quoted(value?: string) {
  return JSON.stringify(value ?? '')
}

export async function GET() {
  const script = `
importScripts('https://www.gstatic.com/firebasejs/12.17.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.17.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: ${quoted(process.env.NEXT_PUBLIC_FIREBASE_API_KEY)},
  authDomain: ${quoted(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN)},
  projectId: ${quoted(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)},
  storageBucket: ${quoted(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET)},
  messagingSenderId: ${quoted(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID)},
  appId: ${quoted(process.env.NEXT_PUBLIC_FIREBASE_APP_ID)},
  measurementId: ${quoted(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID)},
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notification = payload.notification || {};
  const data = payload.data || {};
  self.registration.showNotification(notification.title || 'UniMart', {
    body: notification.body || '',
    icon: '/favicon.ico',
    data,
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification?.data?.path || '/messages?tab=alerts';
  event.waitUntil(clients.openWindow(target));
});
`.trim()

  return new Response(script, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-store',
      'Service-Worker-Allowed': '/',
    },
  })
}
