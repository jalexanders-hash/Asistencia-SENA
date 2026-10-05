import * as XLSX from 'xlsx';
import { courseData as initialCourseData } from '../data';

export interface ParsedTemplateResult {
  success: boolean;
  message: string;
  data?: typeof initialCourseData;
  counts?: {
    aprendices: number;
  };
}

/**
 * Convierte cualquier fecha, texto, número serial de Excel o formato YYYY-MM-DD
 * al formato estricto colombiano DD/MM/YYYY
 */
function toStrictDDMMYYYY(key: string | number): string {
  if (key === null || key === undefined || key === "") return "";

  // Limpiar sufijos duplicados generados por Excel (ej: "2026-04-13.1" -> "2026-04-13")
  const cleanKey = String(key).replace(/\.\d+$/, '').trim();

  if (typeof key === 'number' || /^\d{5}$/.test(cleanKey)) {
    const excelEpoch = new Date(1899, 11, 30);
    const dateObj = new Date(excelEpoch.getTime() + Number(cleanKey) * 24 * 60 * 60 * 1000);
    if (!isNaN(dateObj.getTime())) {
      const d = String(dateObj.getDate()).padStart(2, '0');
      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
      const y = dateObj.getFullYear();
      return `${d}/${m}/${y}`;
    }
  }

  const parts = cleanKey.split(/[\/\-\.]/);
  
  if (parts.length === 3) {
    let day: number, month: number, year: number;
    
    // Si viene en formato YYYY-MM-DD
    if (parts[0].length === 4) {
      year = Number(parts[0]);
      month = Number(parts[1]);
      day = Number(parts[2]);
    } else {
      // Si viene en formato DD/MM/YYYY o DD-MM-YYYY
      day = Number(parts[0]);
      month = Number(parts[1]);
      year = Number(parts[2]);
      if (year < 100) year += 2000;
    }

    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      const dStr = String(day).padStart(2, '0');
      const mStr = String(month).padStart(2, '0');
      return `${dStr}/${mStr}/${year}`;
    }
  }

  return cleanKey;
}

/**
 * 1. Genera la Plantilla Simplificada (Ficha y Aprendices con fechas de asistencia)
 */
export function generateGoogleSheetsTemplate(): Uint8Array {
  const wb = XLSX.utils.book_new();

  const fichaHeaders = [
    "ficha_de_caracterizacion", 
    "programa", 
    "centro", 
    "denominacion", 
    "instructor_titular", 
    "competencia_activa"
  ];
  const fichaRows = [
    fichaHeaders, 
    ["", "", "Complejo Tecnológico Agroindustrial, Pecuario y Turístico", "", "", ""]
  ];
  const wsFicha = XLSX.utils.aoa_to_sheet(fichaRows);
  XLSX.utils.book_append_sheet(wb, wsFicha, "Ficha");

  const aprendicesHeaders = [
    "tipo_documento", 
    "numero_documento", 
    "nombres", 
    "apellidos", 
    "correo_electronico", 
    "telefono", 
    "estado",
    "20/01/2026",
    "21/01/2026"
  ];
  const aprendicesRows = [
    aprendicesHeaders, 
    ["CC", "", "", "", "", "", "En formación", "Presente", "Presente"]
  ];
  const wsAprendices = XLSX.utils.aoa_to_sheet(aprendicesRows);
  XLSX.utils.book_append_sheet(wb, wsAprendices, "Aprendices");

  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
}

/**
 * 2. Genera el Formato Completo de Configuración Inicial (Ficha, Equipo_Ejecutor y Aprendices)
 */
export function generateCompleteConfigurationTemplate(): Uint8Array {
  const wb = XLSX.utils.book_new();

  const fichaHeaders = ["ficha_de_caracterizacion", "programa", "centro", "denominacion", "fecha_inicio", "fecha_terminacion", "jornada"];
  const fichaRows = [fichaHeaders, ["", "", "Complejo Tecnológico Agroindustrial, Pecuario y Turístico", "", "", "", ""]];
  const wsFicha = XLSX.utils.aoa_to_sheet(fichaRows);
  XLSX.utils.book_append_sheet(wb, wsFicha, "Ficha");

  const equipoHeaders = [
    "competencia", 
    "nombre_del_instructor", 
    "correo_google", 
    "correo_institucional_sena", 
    "dia", 
    "rol"
  ];
  const equipoRows = [
    equipoHeaders, 
    ["", "", "", "", "", ""]
  ];
  const wsEquipo = XLSX.utils.aoa_to_sheet(equipoRows);
  XLSX.utils.book_append_sheet(wb, wsEquipo, "Equipo_Ejecutor");

  const aprendicesHeaders = ["tipo_documento", "numero_documento", "nombres", "apellidos", "correo_electronico", "telefono", "estado", "2026-02-09"];
  const aprendicesRows = [
    aprendicesHeaders, 
    ["CC", "", "", "", "", "", "En formación", ""]
  ];
  const wsAprendices = XLSX.utils.aoa_to_sheet(aprendicesRows);
  XLSX.utils.book_append_sheet(wb, wsAprendices, "Aprendices");

  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
}

export function downloadGoogleSheetsTemplate() {
  const data = generateGoogleSheetsTemplate();
  const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Plantilla_Asistencia_SENA_Simplificada.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadCompleteConfigurationTemplate() {
  const data = generateCompleteConfigurationTemplate();
  const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Formato_Completo_Configuracion_SENA.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadAprendicesCSVTemplate() {
  const csvContent = "tipo_documento,numero_documento,nombres,apellidos,correo_electronico,telefono,estado\n";
  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = "Plantilla_Aprendices_En_Blanco.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parsea el archivo de configuración inicial o asistencia con blindaje completo de fechas y registros.
 */
export async function parseUploadedTemplate(file: File, baseData: typeof initialCourseData): Promise<ParsedTemplateResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const wb = XLSX.read(arrayBuffer, { type: 'array' });

    const sheetNames = wb.SheetNames;
    const findSheet = (keywords: string[]) => {
      return sheetNames.find(s => keywords.some(k => s.toLowerCase().includes(k.toLowerCase())));
    };

    const fichaSheetName = findSheet(['ficha']);
    const equipoSheetName = findSheet(['equipo', 'instructor']);
    const aprendicesSheetName = findSheet(['aprendiz', 'aprendices', 'alumnos', 'estudiantes', 'asistencia']);

    if (!aprendicesSheetName && !fichaSheetName) {
      return {
        success: false,
        message: "No se encontraron las hojas requeridas en el archivo."
      };
    }

    const updatedData = JSON.parse(JSON.stringify(baseData || {}));

    updatedData.asistencias_aprendices = [];
    updatedData.fechas_asistencia = [];
    updatedData.equipo_instructores = Array.isArray(baseData?.equipo_instructores) ? baseData.equipo_instructores : [];
    updatedData.competencias = Array.isArray(baseData?.competencias) ? baseData.competencias : [];
    updatedData.aprendices = Array.isArray(baseData?.aprendices) ? baseData.aprendices : [];
    
    updatedData.ficha_de_caracterizacion = updatedData.ficha_de_caracterizacion || "";
    updatedData.programa = updatedData.programa || "";
    updatedData.centro = updatedData.centro || "Complejo Tecnológico Agroindustrial, Pecuario y Turístico";
    updatedData.denominacion = updatedData.denominacion || "";
    updatedData.instructor_titular = updatedData.instructor_titular || "";
    updatedData.competencia_activa = updatedData.competencia_activa || "";

    // 1. Parsear Ficha
    if (fichaSheetName) {
      const ws = wb.Sheets[fichaSheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
      if (rows.length > 0) {
        const first = rows[0];
        const fichaDetectada = first.ficha_de_caracterizacion || first.ficha || first.numero_ficha;
        if (fichaDetectada) updatedData.ficha_de_caracterizacion = String(fichaDetectada).trim();
        if (first.programa) updatedData.programa = String(first.programa).trim();
        if (first.centro) updatedData.centro = String(first.centro).trim();
        if (first.denominacion) updatedData.denominacion = String(first.denominacion).trim();
        if (first.instructor_titular) updatedData.instructor_titular = String(first.instructor_titular).trim();
        if (first.competencia_activa) updatedData.competencia_activa = String(first.competencia_activa).trim();
      }
    }

    // 2. Parsear Equipo Ejecutor
    if (equipoSheetName) {
      const ws = wb.Sheets[equipoSheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
      if (rows.length > 0) {
        const newInstructors = rows
          .filter(r => r && (r.nombre_del_instructor || r.nombre || r.instructor) && r.competencia)
          .map(r => ({
            competencia: String(r.competencia).trim(),
            nombre_del_instructor: String(r.nombre_del_instructor || r.nombre || r.instructor).trim(),
            correo_google: String(r.correo_google || r.correo || "").trim(),
            correo_institucional_sena: String(r.correo_institucional_sena || "").trim(),
            dia: String(r.dia || "Lunes").trim(),
            rol: String(r.rol || "Instructor").trim(),
            fecha_de_inicio: "20/01/2026",
            fecha_terminacion: "03/12/2026"
          }));

        if (newInstructors.length > 0) {
          updatedData.equipo_instructores = newInstructors;
        }
      }
    }

    // 3. Parsear Aprendices, fechas y asistencias
    if (aprendicesSheetName) {
      const ws = wb.Sheets[aprendicesSheetName];
      const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
      
      if (rawRows.length > 0) {
        const sampleRow = rawRows[0] || {};
        const fixedKeys = [
          'tipo_documento', 'numero_documento', 'documento', 
          'nombres', 'nombre', 'apellidos', 'apellido', 
          'correo_electronico', 'correo', 'telefono', 'estado', 
          'fallas', 'tardanzas', 'm/d/yyyy', 'instructor_titular', 'competencia_activa'
        ];
        
        const rawDateColumns = Object.keys(sampleRow).filter(key => {
          const lowerKey = key.toLowerCase().trim();
          return !fixedKeys.some(fk => lowerKey.includes(fk));
        });

        const dateMapping: { original: string; normalized: string }[] = rawDateColumns.map(col => ({
          original: col,
          normalized: toStrictDDMMYYYY(col)
        })).filter(d => d.normalized !== "");

        // Consolidar fechas únicas normalizadas cronológicamente
        const uniqueDatesMap = new Set<string>();
        dateMapping.forEach(d => uniqueDatesMap.add(d.normalized));
        const normalizedDates = Array.from(uniqueDatesMap);
        
        if (normalizedDates.length > 0) {
          updatedData.fechas_asistencia = normalizedDates;
        }

        const parsedAprendices = rawRows
          .filter(r => {
            if (!r) return false;
            const docRow = String(r.numero_documento || r.documento || "").trim();
            const nombresRow = String(r.nombres || r.nombre || "").trim();
            return docRow !== "" || nombresRow !== "";
          })
          .map(uploadedRow => {
            const docNum = String(uploadedRow.numero_documento || uploadedRow.documento || "").trim();
            const registrosActuales: Record<string, string> = {};

            dateMapping.forEach(({ original, normalized }) => {
              const val = uploadedRow[original];
              if (val !== null && val !== undefined) {
                const valStr = String(val).trim();
                if (valStr !== '' && valStr !== '·' && valStr !== '-') {
                  let finalVal = valStr;
                  const lowerVal = valStr.toLowerCase();
                  
                  if (lowerVal === 'x' || lowerVal.includes('falla') || lowerVal.includes('inasistencia')) {
                    finalVal = 'X';
                  } else if (lowerVal.includes('tarde') || lowerVal === 't') {
                    finalVal = 'Tarde';
                  } else if (lowerVal.includes('excusa') || lowerVal === 'e') {
                    finalVal = 'Excusa';
                  } else if (lowerVal.includes('presente') || lowerVal === 'p') {
                    finalVal = 'Presente';
                  }

                  // Si hay múltiples registros para el mismo día normalizado, priorizar fallas/tardanzas sobre nulos
                  if (finalVal !== 'Presente' || !registrosActuales[normalized]) {
                    registrosActuales[normalized] = finalVal;
                  }
                }
              }
            });

            return {
              tipo_documento: String(uploadedRow.tipo_documento || "CC").trim(),
              numero_documento: docNum,
              nombres: String(uploadedRow.nombres || uploadedRow.nombre || "").trim().toUpperCase(),
              apellidos: String(uploadedRow.apellidos || uploadedRow.apellido || "").trim().toUpperCase(),
              correo_electronico: String(uploadedRow.correo_electronico || uploadedRow.correo || "").trim().toLowerCase(),
              telefono: uploadedRow.telefono ? String(uploadedRow.telefono).trim() : "",
              estado: uploadedRow.estado ? String(uploadedRow.estado).trim() : "En formación",
              registros: registrosActuales
            };
          });

        updatedData.asistencias_aprendices = parsedAprendices;
      }
    }

    updatedData.asistencias_aprendices = Array.isArray(updatedData.asistencias_aprendices) ? updatedData.asistencias_aprendices : [];
    updatedData.fechas_asistencia = Array.isArray(updatedData.fechas_asistencia) ? updatedData.fechas_asistencia : [];
    updatedData.equipo_instructores = Array.isArray(updatedData.equipo_instructores) ? updatedData.equipo_instructores : [];

    return {
      success: true,
      message: `Configuración y asistencias cargadas con éxito para la Ficha ${updatedData.ficha_de_caracterizacion || "SENA"}: ${updatedData.asistencias_aprendices.length} aprendices sincronizados.`,
      data: updatedData,
      counts: {
        aprendices: updatedData.asistencias_aprendices.length
      }
    };

  } catch (error: any) {
    return {
      success: false,
      message: `Error al procesar el archivo Excel: ${error.message || error}`
    };
  }
}
