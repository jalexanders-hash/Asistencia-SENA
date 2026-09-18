import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { courseData as defaultData } from '../data';

// Configuración utilizando estrictamente las variables de entorno de Vercel (Vite)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validación de seguridad para desarrollo/producción
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error("⚠️ [Firebase] Faltan variables de entorno en Vercel. Revisa que comiencen por VITE_ y estén activas en producción.");
}

// Inicializar Firebase evitando duplicados si la app ya se cargó previamente
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Inicializar Cloud Firestore y Firebase Auth
export const db = getFirestore(app);
export const auth = getAuth(app);

const FICHA_ID = "3387401";
const docRef = doc(db, "fichas", FICHA_ID);

export const subscribeToFichaData = async (callback: (data: typeof defaultData) => void) => {
  // Asegurar que el documento exista antes de suscribirse en tiempo real
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    await setDoc(docRef, defaultData);
  }
  
  // Escucha en tiempo real
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as typeof defaultData);
    }
  });
};

export const saveAttendanceData = async (
  fechas_asistencia: string[], 
  asistencias_aprendices: typeof defaultData['asistencias_aprendices'], 
  fechas_por_instructor?: Record<string, string[]>
) => {
  await updateDoc(docRef, {
    fechas_asistencia,
    asistencias_aprendices,
    ...(fechas_por_instructor && { fechas_por_instructor })
  });
};

export const updateFichaCompleteData = async (newData: typeof defaultData) => {
  await updateDoc(docRef, newData);
};
