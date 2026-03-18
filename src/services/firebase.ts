import { initializeApp } from 'firebase/app';
import { 
  getDatabase, ref, set, get, remove, onValue, 
  off, push, query, limitToLast, update, 
  DatabaseReference 
} from 'firebase/database';

// 1. ดึงค่ามาพักไว้เพื่อทำความสะอาด (Sanitize)
const rawDbUrl = import.meta.env.VITE_FIREBASE_DATABASE_URL;

// ลบช่องว่าง และตัดเครื่องหมาย "/" ที่อาจหลุดมาท้าย URL ออก
// เพราะ Firebase SDK จะมองว่า URL ที่มี "/" ต่อท้ายเป็น Invalid URL
const sanitizedDbUrl = rawDbUrl?.trim().replace(/\/$/, "");

// 2. Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: sanitizedDbUrl, 
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// 3. ป้องกัน App พังเบื้องต้นด้วยการแจ้งเตือนหาก Config หาย
if (!sanitizedDbUrl) {
  console.warn("⚠️ Firebase Database URL is missing! Check your .env file.");
}

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Export ทุกอย่างตามเดิม
export { database, ref, set, get, remove, onValue, off, push, query, limitToLast, update };
export type { DatabaseReference };