import { initializeApp } from 'firebase/app';
import { 
  GoogleAuthProvider, 
  indexedDBLocalPersistence,
  browserPopupRedirectResolver,
  initializeAuth
} from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

console.info('[Firebase] Web app config loaded', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  appId: firebaseConfig.appId,
  apiKeyPresent: Boolean(firebaseConfig.apiKey),
});

// Initialize Auth with explicit persistence and resolver to avoid "Pending promise was never set" errors
export const auth = initializeAuth(app, {
  persistence: indexedDBLocalPersistence,
  popupRedirectResolver: browserPopupRedirectResolver,
});

// Use initializeFirestore with experimentalForceLongPolling: true to resolve connectivity issues in sandboxed environments
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// CRITICAL: Validate Connection to Firestore
import { getDocFromServer, doc } from 'firebase/firestore';
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client is reporting as offline.");
    } else {
      console.error("Firestore connection test failed:", error);
    }
  }
}
testConnection();
