import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase'; // Ajusta la ruta si tu archivo firebase.ts está en otra ubicación
import jsonData from '../data/backup_ficha_3387401.json';

export async function migrarJsonAFirebase() {
  try {
    const fichaId = "3387401";
    
    // 1. Convertimos los aprendices del JSON al formato que consume tu aplicativo
    const asistencias_aprendices = jsonData.aprendices.map((ap: any) => {
      const registros: Record<string, string> = {};

      // Mapeamos inasistencias ('X')
      ap.detalle_inasistencias?.forEach((item: any) => {
        registros[item.fecha] = item.estado; // 'X'
      });

      // Mapeamos retardos ('Tarde')
      ap.detalle_retardos?.forEach((item: any) => {
        registros[item.fecha] = item.estado; // 'Tarde'
      });

      // Mapeamos justificaciones ('Excusa')
      ap.detalle_justificaciones?.forEach((item: any) => {
        registros[item.fecha] = item.estado; // 'Excusa'
      });

      const partesNombre = ap.nombre_completo.split(" ");
      const nombres = ap.nombres || partesNombre.slice(0, 2).join(" ");
      const apellidos = ap.apellidos || partesNombre.slice(2).join(" ");

      return {
        tipo_documento: "CC",
        numero_documento: String(ap.numero_documento).trim(),
        nombres: nombres.toUpperCase(),
        apellidos: apellidos.toUpperCase(),
        correo_electronico: (ap.correo_electronico || "").toLowerCase(),
        telefono: "",
        registros: registros // Inyecta las inasistencias históricas
      };
    });

    // 2. Extraemos todas las fechas únicas de asistencia de los instructores
    const todasLasFechasSet = new Set<string>();
    jsonData.equipo_instructores_consolidado.forEach((inst: any) => {
      inst.fechas_sesiones?.forEach((f: string) => todasLasFechasSet.add(f));
    });
    const fechas_asistencia = Array.from(todasLasFechasSet);

    // 3. Mapeamos el equipo de instructores
    const equipo_instructores = jsonData.equipo_instructores_consolidado.map((inst: any) => ({
      competencia: inst.competencia,
      nombre_del_instructor: inst.instructor,
      correo_google: inst.correo_acceso,
      correo_institucional_sena: inst.correo_institucional,
      dia: inst.dia_formacion,
      fecha_de_inicio: inst.fechas_sesiones?.[0] || "20/01/26",
      fecha_terminacion: inst.fechas_sesiones?.[inst.fechas_sesiones.length - 1] || "03/12/26",
      rol: "Instructor"
    }));

    // 4. Armamos la estructura completa que tu aplicativo lee
    const courseDataCompleto = {
      ficha_de_caracterizacion: fichaId,
      programa: jsonData.metadata.ficha.programa,
      centro: jsonData.metadata.ficha.centro_formacion,
      denominacion: jsonData.metadata.ficha.denominacion,
      fechas_asistencia: fechas_asistencia,
      asistencias_aprendices: asistencias_aprendices,
      equipo_instructores: equipo_instructores
    };

    // 5. Guardamos todo en Firestore bajo el documento exacto de la ficha 3387401
    const docRef = doc(db, "fichas", fichaId);
    await setDoc(docRef, courseDataCompleto);

    alert("¡Ficha 3387401 restaurada y sincronizada exitosamente con todas sus inasistencias!");
  } catch (error: any) {
    console.error("Error al migrar el JSON:", error);
    alert(`Error en la migración: ${error.message || error}`);
  }
}
