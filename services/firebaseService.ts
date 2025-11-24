import { initializeApp, getApps, getApp, deleteApp, FirebaseApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, get, Database } from 'firebase/database';
import { CloudConfig, NewsItem, AppSettings, ExamResult, UserProgress } from '../types';

let app: FirebaseApp | undefined;
let db: Database | undefined;
let isConnected = false;
let lastError = "";

// Initialize Firebase with user provided config
// Now Async to handle deleteApp promise
export const initFirebase = async (config: CloudConfig): Promise<boolean> => {
  if (!config || !config.apiKey || !config.databaseURL) {
      lastError = "بيانات الإعدادات ناقصة (API Key or Database URL missing)";
      isConnected = false;
      return false;
  }
  
  try {
    // Check if any app is already initialized to avoid "App named '[DEFAULT]' already exists"
    if (getApps().length > 0) {
      try {
        const existingApp = getApp();
        // We must await app deletion before creating a new one
        await deleteApp(existingApp);
      } catch (deleteError) {
        console.warn("Warning: Failed to delete existing app instance", deleteError);
      }
    }

    app = initializeApp(config);
    db = getDatabase(app);
    isConnected = true;
    lastError = "";
    console.log("Firebase Initialized Successfully");
    return true;
  } catch (error: any) {
    console.error("Firebase Init Error:", error);
    isConnected = false;
    // Provide user-friendly error messages
    if (error.code === 'app/duplicate-app') {
         lastError = "يوجد جلسة اتصال نشطة بالفعل. جاري إعادة التعيين...";
    } else if (error.message && error.message.includes('API key')) {
         lastError = "مفتاح API غير صحيح (Invalid API Key).";
    } else if (error.code === 'auth/network-request-failed') {
         lastError = "فشل الاتصال بالشبكة. تحقق من الإنترنت.";
    } else {
         lastError = error.message || "حدث خطأ غير معروف أثناء الاتصال";
    }
    return false;
  }
};

export const isFirebaseConnected = () => isConnected;
export const getFirebaseError = () => lastError;

// --- WRITE FUNCTIONS ---

export const syncNewsToCloud = async (news: NewsItem[]) => {
  if (!db || !isConnected) return;
  try {
    await set(ref(db, 'news'), news);
  } catch (e) { console.error("Sync News Error", e); }
};

export const syncSettingsToCloud = async (settings: AppSettings) => {
  if (!db || !isConnected) return;
  try {
    await set(ref(db, 'settings'), settings);
  } catch (e) { console.error("Sync Settings Error", e); }
};

export const syncHistoryToCloud = async (history: ExamResult[]) => {
  if (!db || !isConnected) return;
  try {
    // We only keep the last 500 results to avoid massive payloads in this simple implementation
    const limitedHistory = history.slice(0, 500); 
    await set(ref(db, 'history'), limitedHistory);
  } catch (e) { console.error("Sync History Error", e); }
};

export const syncProgressToCloud = async (type: 'ar' | 'en', progress: UserProgress) => {
    // Placeholder for future user-specific sync
};

// --- READ / LISTEN FUNCTIONS ---

export const listenToNews = (callback: (news: NewsItem[]) => void) => {
  if (!db || !isConnected) return () => {};
  const newsRef = ref(db, 'news');
  return onValue(newsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) callback(data);
  });
};

export const listenToSettings = (callback: (settings: AppSettings) => void) => {
  if (!db || !isConnected) return () => {};
  const settingsRef = ref(db, 'settings');
  return onValue(settingsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) callback(data);
  });
};

export const listenToHistory = (callback: (history: ExamResult[]) => void) => {
  if (!db || !isConnected) return () => {};
  const historyRef = ref(db, 'history');
  return onValue(historyRef, (snapshot) => {
    const data = snapshot.val();
    if (data) callback(data);
  });
};