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

/**
 * Se suscribe en tiempo real a los cambios de una ficha específica en Firestore.
 * Si el documento no existe, lo inicializa con los datos por defecto.
 */
export const subscribeToFichaData = (callback: (data: typeof defaultData) => void, fichaId: string = DEFAULT_FICHA_ID) => {
  const targetFichaId = String(fichaId || DEFAULT_FICHA_ID);
  const docRef = doc(db, "fichas", targetFichaId);

  // Verificamos de forma asíncrona si el documento existe para inicializarlo si es necesario
  getDoc(docRef).then((docSnap) => {
    if (!docSnap.exists()) {
      setDoc(docRef, defaultData);
    }
  }).catch((error) => {
    console.error("Error al verificar datos iniciales:", error);
  });

  // Retornamos directamente la función de limpieza del onSnapshot
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as typeof defaultData);
    }
  }, (error) => {
    console.error("Error en la suscripción en tiempo real:", error);
  });
};

/**
 * Guarda o actualiza únicamente los registros de asistencia de una ficha específica.
 */
export const saveAttendanceData = async (
  fechas_asistencia: string[],
  asistencias_aprendices: typeof defaultData['asistencias_aprendices'],
  fechas_por_instructor?: Record<string, string[]>,
  fichaId: string = DEFAULT_FICHA_ID
) => {
  try {
    const targetFichaId = String(fichaId || DEFAULT_FICHA_ID);
    const docRef = doc(db, "fichas", targetFichaId);
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
 * Actualiza la información completa de la ficha garantizando un almacenamiento aislado por ID.
 * Da prioridad absoluta a la ficha detectada en el archivo o pasada por parámetro,
 * previniendo cruces de información o modificaciones en otras fichas.
 */
export const updateFichaCompleteData = async (newData: typeof defaultData, fichaId?: string) => {
  try {
    // Determinación estricta y segura del ID de la ficha de destino
    const targetFichaId = String(fichaId || newData.ficha_de_caracterizacion || DEFAULT_FICHA_ID);
    
    if (!targetFichaId || targetFichaId === "undefined" || targetFichaId === "null") {
      throw new Error("No se pudo determinar un número de ficha válido para realizar el guardado en la base de datos.");
    }

    const docRef = doc(db, "fichas", targetFichaId);
    
    await setDoc(docRef, {
      ...newData,
      ficha_de_caracterizacion: targetFichaId // Asegura consistencia interna en el documento
    }, { merge: true });

    console.log(`Ficha ${targetFichaId} actualizada y protegida exitosamente en Firestore.`);
  } catch (error) {
    console.error("Error al actualizar la ficha completa en Firebase:", error);
    throw error;
  }
};
