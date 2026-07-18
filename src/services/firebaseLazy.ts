let _mod: any = null;
let _promise: Promise<any> | null = null;

export const DB_ROOT_PATH = 'hunting';

export async function getFirebase() {
  if (_mod) return _mod;
  if (!_promise) {
    _promise = (async () => {
      const firebaseApp = await import('firebase/app');
      const firebaseDb = await import('firebase/database');

      const firebaseConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
        measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
      };

      const app = firebaseApp.initializeApp(firebaseConfig);
      const database = firebaseDb.getDatabase(app);

      _mod = {
        database,
        ref: firebaseDb.ref,
        set: firebaseDb.set,
        get: firebaseDb.get,
        remove: firebaseDb.remove,
        onValue: firebaseDb.onValue,
        off: firebaseDb.off,
        push: firebaseDb.push,
        query: firebaseDb.query,
        limitToLast: firebaseDb.limitToLast,
        update: firebaseDb.update,
      };
      return _mod;
    })();
  }
  return _promise;
}
