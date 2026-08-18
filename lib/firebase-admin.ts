import { applicationDefault, cert, getApp, getApps, initializeApp } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'

type FirebaseServiceAccount = {
  project_id: string
  client_email: string
  private_key: string
}

function loadServiceAccount(): FirebaseServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as FirebaseServiceAccount
    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) return null
    return parsed
  } catch {
    return null
  }
}

export function getFirebaseAdminMessaging() {
  const existing = getApps()[0]
  const app = existing ?? initializeFirebaseAdmin()
  if (!app) return null
  return getMessaging(app)
}

function initializeFirebaseAdmin() {
  const serviceAccount = loadServiceAccount()
  if (serviceAccount) {
    return initializeApp({
      credential: cert({
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key,
      }),
    })
  }

  try {
    return initializeApp({ credential: applicationDefault() })
  } catch {
    return null
  }
}
