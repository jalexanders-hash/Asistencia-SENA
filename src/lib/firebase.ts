import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { courseData as defaultData } from '../data';

// Usar las variables de entorno configuradas en Vercel
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore
export const db = getFirestore(app);

// Initialize Firebase Auth
export const auth = getAuth(app);

const FICHA_ID = "3387401";
const docRef = doc(db, "fichas", FICHA_ID);

export const subscribeToFichaData = async (callback: (data: typeof defaultData) => void) => {
  // Ensure the document exists before subscribing
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    await setDoc(docRef, defaultData);
  }
  
  // Real-time listener
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as typeof defaultData);
    }
  });
};

export const saveAttendanceData = async (fechas_asistencia: string[], asistencias_aprendices: typeof defaultData['asistencias_aprendices'], fechas_por_instructor?: Record<string, string[]>) => {
  await updateDoc(docRef, {
    fechas_asistencia,
    asistencias_aprendices,
    ...(fechas_por_instructor && { fechas_por_instructor })
  });
};

export const updateFichaCompleteData = async (newData: typeof defaultData) => {
  await updateDoc(docRef, newData);
};
