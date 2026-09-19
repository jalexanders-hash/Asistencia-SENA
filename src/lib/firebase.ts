import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { courseData as defaultData } from '../data';

// Configuración directa del proyecto nuevo para evitar fallos de inyección en Vercel
const firebaseConfig = {
  apiKey: "AIzaSyCXrNcoBX4yqK-PCZsc_Qf2GbbI-7nMbDo",
  authDomain: "asistenciasena-78819.firebaseapp.com",
  projectId: "asistenciasena-78819",
  storageBucket: "asistenciasena-78819.firebasestorage.app",
  messagingSenderId: "842202356335",
  appId: "1:842202356335:web:148076f83f5e342e6c8b9a",
  measurementId: "G-DHS61ZMT5N"
};

// Inicializar Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const auth = getAuth(app);

const FICHA_ID = "3387401";
const docRef = doc(db, "fichas", FICHA_ID);

export const subscribeToFichaData = async (callback: (data: typeof defaultData) => void) => {
  try {
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      await setDoc(docRef, defaultData);
    }
  } catch (error) {
    console.error("Error al verificar/crear el documento inicial:", error);
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
  fechas_por_instructor?: Record<string, string[]>
) => {
  try {
    await updateDoc(docRef, {
      fechas_asistencia,
      asistencias_aprendices,
      ...(fechas_por_instructor && { fechas_por_instructor })
    });
    console.log("¡Asistencia guardada con éxito!");
  } catch (error) {
    console.error("Error al guardar la asistencia en Firestore:", error);
    throw error; // Libera el estado de carga en la interfaz
  }
};

export const updateFichaCompleteData = async (newData: typeof defaultData) => {
  try {
    await updateDoc(docRef, newData);
  } catch (error) {
    console.error("Error al actualizar la ficha completa:", error);
    throw error;
  }
};
