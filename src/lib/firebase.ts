import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { courseData as defaultData } from '../data';

const firebaseConfig = {
  apiKey: "AIzaSyCXrNcoBX4yqK-PCZsc_Qf2GbbI-7nMbDo",
  authDomain: "asistenciasena-78819.firebaseapp.com",
  projectId: "asistenciasena-78819",
  storageBucket: "asistenciasena-78819.firebasestorage.app",
  messagingSenderId: "842202356335",
  appId: "1:842202356335:web:148076f83f5e342e6c8b9a",
  measurementId: "G-DHS61ZMT5N"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const auth = getAuth(app);

// Ficha por defecto inicial
const DEFAULT_FICHA_ID = "3387401";

export const subscribeToFichaData = async (callback: (data: typeof defaultData) => void, fichaId: string = DEFAULT_FICHA_ID) => {
  const docRef = doc(db, "fichas", fichaId);
  try {
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      await setDoc(docRef, defaultData);
    }
  } catch (error) {
    console.error("Error al inicializar datos:", error);
  }

  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as typeof defaultData);
    }
  });
};

export const saveAttendanceData = async (
  fechas_asistencia: string[],
  asistencias_aprendices: typeof defaultData['asistencias_aprendices'],
  fechas_por_instructor?: Record<string, string[]>,
  fichaId: string = DEFAULT_FICHA_ID
) => {
  try {
    const docRef = doc(db, "fichas", fichaId);
    await updateDoc(docRef, {
      fechas_asistencia,
      asistencias_aprendices,
      ...(fechas_por_instructor && { fechas_por_instructor })
    });
  } catch (error) {
    console.error("Error al guardar asistencia:", error);
    throw error;
  }
};

/**
 * Actualiza la ficha completa asegurando que se respete la ficha activa (fichaId),
 * evitando que un archivo externo sobrescriba una ficha que no corresponde.
 */
export const updateFichaCompleteData = async (newData: typeof defaultData, fichaId?: string) => {
  try {
    // Usamos prioritariamente el ID de la ficha activa en la UI para proteger los datos
    const targetFichaId = String(fichaId || newData.ficha_de_caracterizacion || DEFAULT_FICHA_ID);
    const docRef = doc(db, "fichas", targetFichaId);
    
    await setDoc(docRef, {
      ...newData,
      ficha_de_caracterizacion: targetFichaId // Forzamos que la ficha coincida con el documento de Firestore
    }, { merge: true });
  } catch (error) {
    console.error("Error al actualizar ficha:", error);
    throw error;
  }
};
