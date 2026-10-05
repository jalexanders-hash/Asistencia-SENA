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
 * Convierte cualquier fecha en formato YYYY-MM-DD o ISO a DD/MM/YYYY
 */
function normalizeDateToDDMMYYYY(dateStr: string): string {
  if (!dateStr) return "";
  const clean = String(dateStr).trim();
  
  // Si viene en formato YYYY-MM-DD
  if (/^\d{4}[\-\/]\d{1,2}[\-\/]\d{1,2}$/.test(clean)) {
    const [y, m, d] = clean.split(/[\-\/]/);
    return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
  }
  
  return clean;
}

/**
 * Normaliza las fechas de la estructura de la ficha para asegurar formato DD/MM/YYYY
 */
const sanitizeFichaDates = (data: any) => {
  if (!data) return data;

  // Normalizar array de fechas de asistencia
  const rawFechas = Array.isArray(data.fechas_asistencia) ? data.fechas_asistencia : [];
  const normalizedFechas = Array.from(new Set(rawFechas.map((f: string) => normalizeDateToDDMMYYYY(f))));

  // Normalizar registros dentro de cada aprendiz
  const normalizedAprendices = (Array.isArray(data.asistencias_aprendices) ? data.asistencias_aprendices : []).map((student: any) => {
    const oldRegistros = student.registros || {};
    const newRegistros: Record<string, string> = {};
    
    Object.keys(oldRegistros).forEach(dateKey => {
      const fixedDateKey = normalizeDateToDDMMYYYY(dateKey);
      newRegistros[fixedDateKey] = oldRegistros[dateKey];
    });

    return {
      ...student,
      registros: newRegistros
    };
  });

  return {
    ...data,
    fechas_asistencia: normalizedFechas,
    asistencias_aprendices: normalizedAprendices
  };
};

/**
 * Se suscribe en tiempo real a los cambios de una ficha específica en Firestore.
 */
export const subscribeToFichaData = (callback: (data: typeof defaultData) => void, fichaId: string = DEFAULT_FICHA_ID) => {
  const targetFichaId = String(fichaId || DEFAULT_FICHA_ID);
  const docRef = doc(db, "fichas", targetFichaId);

  getDoc(docRef).then((docSnap) => {
    if (!docSnap.exists()) {
      setDoc(docRef, {
        ...defaultData,
        ficha_de_caracterizacion: targetFichaId
      });
    }
  }).catch((error) => {
    console.error("Error al verificar datos iniciales:", error);
  });

  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      const sanitized = sanitizeFichaDates(data);
      const completeData = {
        ...defaultData,
        ...sanitized,
        ficha_de_caracterizacion: targetFichaId,
        asistencias_aprendices: sanitized.asistencias_aprendices || [],
        fechas_asistencia: sanitized.fechas_asistencia || [],
        equipo_instructores: sanitized.equipo_instructores || []
      };
      callback(completeData as typeof defaultData);
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

    const sanitized = sanitizeFichaDates({
      fechas_asistencia,
      asistencias_aprendices
    });

    await updateDoc(docRef, {
      fechas_asistencia: sanitized.fechas_asistencia,
      asistencias_aprendices: sanitized.asistencias_aprendices,
      ...(fechas_por_instructor && { fechas_por_instructor })
    });
  } catch (error) {
    console.error("Error al guardar asistencia:", error);
    throw error;
  }
};

/**
 * Actualiza la información completa de la ficha mediante fusión ({ merge: true }).
 */
export const updateFichaCompleteData = async (newData: typeof defaultData, fichaId?: string) => {
  try {
    const targetFichaId = String(fichaId || newData.ficha_de_caracterizacion || DEFAULT_FICHA_ID);
    
    if (!targetFichaId || targetFichaId === "undefined" || targetFichaId === "null") {
      throw new Error("No se pudo determinar un número de ficha válido para realizar el guardado en la base de datos.");
    }

    const docRef = doc(db, "fichas", targetFichaId);
    const sanitizedInput = sanitizeFichaDates(newData);
    
    const sanitizedData = {
      ...defaultData,
      ...sanitizedInput,
      ficha_de_caracterizacion: targetFichaId,
      asistencias_aprendices: sanitizedInput.asistencias_aprendices || defaultData.asistencias_aprendices,
      fechas_asistencia: sanitizedInput.fechas_asistencia || defaultData.fechas_asistencia,
      equipo_instructores: sanitizedInput.equipo_instructores || defaultData.equipo_instructores
    };

    await setDoc(docRef, sanitizedData, { merge: true });
    console.log(`Ficha ${targetFichaId} actualizada exitosamente en Firestore.`);
  } catch (error) {
    console.error("Error al actualizar la ficha completa en Firebase:", error);
    throw error;
  }
};

/**
 * REEMPLAZA por completo la información de la ficha en Firestore garantizando una estructura sana.
 */
export const replaceFichaCompleteData = async (newData: typeof defaultData, fichaId?: string) => {
  try {
    const targetFichaId = String(fichaId || newData.ficha_de_caracterizacion || DEFAULT_FICHA_ID);
    
    if (!targetFichaId || targetFichaId === "undefined" || targetFichaId === "null") {
      throw new Error("No se pudo determinar un número de ficha válido para realizar el reemplazo en la base de datos.");
    }

    const docRef = doc(db, "fichas", targetFichaId);
    const sanitizedInput = sanitizeFichaDates(newData);
    
    const sanitizedData = {
      ...defaultData,
      ...sanitizedInput,
      ficha_de_caracterizacion: targetFichaId,
      asistencias_aprendices: sanitizedInput.asistencias_aprendices || [],
      fechas_asistencia: sanitizedInput.fechas_asistencia || [],
      equipo_instructores: sanitizedInput.equipo_instructores || []
    };

    await setDoc(docRef, sanitizedData);
    console.log(`Ficha ${targetFichaId} reemplazada y limpiada exitosamente en Firestore con los datos del Excel.`);
  } catch (error) {
    console.error("Error al reemplazar la ficha completa en Firebase:", error);
    throw error;
  }
};
