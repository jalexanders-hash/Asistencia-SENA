import { useMemo } from 'react';

export interface AprendizNormalizado {
  tipo_documento: string;
  numero_documento: string;
  nombres: string;
  apellidos: string;
  nombre_completo: string;
  correo_electronico: string;
  telefono: string;
  estado: string;
  esActivo: boolean;
  registros: Record<string, string>;
}

/**
 * Normaliza y extrae el listado completo de aprendices de una ficha,
 * garantizando fallbacks entre múltiples fuentes y estructuras posibles.
 */
export function normalizarListadoAprendices(courseData: any, externalStudents?: any[]): AprendizNormalizado[] {
  if (!courseData && (!externalStudents || externalStudents.length === 0)) {
    return [];
  }

  // 1. Evaluación jerárquica de fuentes de datos (Fallbacks obligatorios)
  let rawList: any[] = [];

  if (Array.isArray(courseData?.asistencias_aprendices) && courseData.asistencias_aprendices.length > 0) {
    rawList = courseData.asistencias_aprendices;
  } else if (Array.isArray(courseData?.aprendices) && courseData.aprendices.length > 0) {
    rawList = courseData.aprendices;
  } else if (Array.isArray(courseData?.alumnos) && courseData.alumnos.length > 0) {
    rawList = courseData.alumnos;
  } else if (Array.isArray(courseData?.estudiantes) && courseData.estudiantes.length > 0) {
    rawList = courseData.estudiantes;
  } else if (Array.isArray(externalStudents) && externalStudents.length > 0) {
    rawList = externalStudents;
  }

  if (!Array.isArray(rawList) || rawList.length === 0) {
    return [];
  }

  // 2. Mapeo e inmunización de campos por aprendiz
  return rawList
    .filter((item: any) => item && typeof item === 'object')
    .map((item: any) => {
      const doc = String(
        item.numero_documento || item.documento || item.identificacion || item.cedula || ""
      ).trim();

      const nombres = String(
        item.nombres || item.nombre || item.first_name || ""
      ).trim();

      const apellidos = String(
        item.apellidos || item.apellido || item.last_name || ""
      ).trim();

      const tipoDoc = String(
        item.tipo_documento || item.tipo_doc || "CC"
      ).trim().toUpperCase();

      const correo = String(
        item.correo_electronico || item.correo || item.email || ""
      ).trim().toLowerCase();

      const tel = String(
        item.telefono || item.celular || item.phone || ""
      ).trim();

      const estadoRaw = String(
        item.estado || item.estado_aprendiz || "En formación"
      ).trim();

      // Normalización del estado activo/en formación
      const estadoNormLower = estadoRaw.toLowerCase();
      const esActivo = 
        estadoNormLower.includes("formacion") || 
        estadoNormLower.includes("formación") || 
        estadoNormLower.includes("activo") || 
        estadoNormLower === "en formación" ||
        estadoNormLower === "en formacion";

      // Preservación y blindaje del diccionario de registros de inasistencias
      const registros = (item.registros && typeof item.registros === 'object') ? item.registros : {};

      return {
        tipo_documento: tipoDoc,
        numero_documento: doc,
        nombres: nombres.toUpperCase(),
        apellidos: apellidos.toUpperCase(),
        nombre_completo: `${apellidos} ${nombres}`.trim() || `APRENDIZ DOC. ${doc}`,
        correo_electronico: correo,
        telefono: tel,
        estado: estadoRaw || "En formación",
        esActivo,
        registros
      };
    })
    .filter((aprendiz) => aprendiz.numero_documento !== "" || aprendiz.nombres !== "");
}

/**
 * Hook personalizado para consumo directo en componentes React.
 */
export function useFichaAprendices(courseData: any, externalStudents?: any[]) {
  const aprendices = useMemo(() => {
    return normalizarListadoAprendices(courseData, externalStudents);
  }, [courseData, externalStudents]);

  const activos = useMemo(() => {
    return aprendices.filter((a) => a.esActivo);
  }, [aprendices]);

  return {
    totalAprendices: aprendices.length,
    totalActivos: activos.length,
    aprendices,
    aprendicesActivos: activos
  };
}
