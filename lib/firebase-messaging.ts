import { deleteToken, getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging'
import { getApp, getApps, initializeApp } from 'firebase/app'
import { api } from '@/lib/api-client'

const TOKEN_KEY = 'unimart_fcm_token'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

function getFirebaseApp() {
  return getApps().length ? getApp() : initializeApp(firebaseConfig)
}

export async function isFirebasePushSupported() {
  if (typeof window === 'undefined') return false
  return isSupported().catch(() => false)
}

export async function enableFirebasePushNotifications() {
  if (!(await isFirebasePushSupported())) throw new Error('Push notifications are not supported in this browser.')
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
  if (!vapidKey) throw new Error('NEXT_PUBLIC_FIREBASE_VAPID_KEY is not configured.')

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Notification permission was not granted.')

  const registration = await navigator.serviceWorker.register('/push-worker', { scope: '/' })
  const messaging = getMessaging(getFirebaseApp())
  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  })

  if (!token) throw new Error('Unable to create a Firebase push token.')
  await api.saveDeviceToken(token, 'web')
  window.localStorage.setItem(TOKEN_KEY, token)
  return token
}

export async function disableFirebasePushNotifications() {
  if (!(await isFirebasePushSupported())) return
  const messaging = getMessaging(getFirebaseApp())
  const token = window.localStorage.getItem(TOKEN_KEY)
  if (token) {
    await api.removeDeviceToken(token).catch(() => undefined)
    window.localStorage.removeItem(TOKEN_KEY)
  }
  await deleteToken(messaging).catch(() => false)
}

export async function subscribeToFirebaseForegroundMessages(onReceive: (payload: { title?: string; body?: string }) => void) {
  if (!(await isFirebasePushSupported())) return () => undefined
  const messaging = getMessaging(getFirebaseApp())
  return onMessage(messaging, (payload) => {
    onReceive({
      title: payload.notification?.title,
      body: payload.notification?.body,
    })
  })
}
