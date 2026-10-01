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
 * Convierte cualquier fecha, texto o número serial de Excel 
 * al formato estricto colombiano DD/MM/YYYY
 */
function toStrictDDMMYYYY(key: string | number): string {
  if (key === null || key === undefined || key === "") return "";

  // Si es un número serial de Excel (ej: 45700)
  if (typeof key === 'number' || /^\d{5}$/.test(String(key).trim())) {
    const excelEpoch = new Date(1899, 11, 30);
    const dateObj = new Date(excelEpoch.getTime() + Number(key) * 24 * 60 * 60 * 1000);
    if (!isNaN(dateObj.getTime())) {
      const d = String(dateObj.getDate()).padStart(2, '0');
      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
      const y = dateObj.getFullYear();
      return `${d}/${m}/${y}`;
    }
  }

  const trimmed = String(key).trim();
  const parts = trimmed.split(/[\/\-\.]/);
  
  if (parts.length === 3) {
    let day: number, month: number, year: number;
    
    // Si viene en formato YYYY/MM/DD o YYYY-MM-DD
    if (parts[0].length === 4) {
      year = Number(parts[0]);
      month = Number(parts[1]);
      day = Number(parts[2]);
    } else {
      // Si viene en formato DD/MM/YYYY, M/D/YYYY o variantes
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

  return trimmed;
}

/**
 * Genera la plantilla simplificada con solo dos pestañas: Ficha y Aprendices
 */
export function generateGoogleSheetsTemplate(): Uint8Array {
  const wb = XLSX.utils.book_new();

  // Pestaña 1: Ficha con los campos requeridos
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

  // Pestaña 2: Aprendices con datos básicos y columnas de fechas de ejemplo
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
 * Parsea el archivo Excel simplificado, sincroniza datos de Ficha y procesa Aprendices con fechas y registros
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
    const aprendicesSheetName = findSheet(['aprendiz', 'aprendices', 'alumnos', 'estudiantes', 'asistencia']);

    if (!aprendicesSheetName && !fichaSheetName) {
      return {
        success: false,
        message: "No se encontraron las hojas requeridas ('Ficha' o 'Aprendices') en el archivo."
      };
    }

    const updatedData = JSON.parse(JSON.stringify(baseData));

    // 1. Parsear Ficha Simplificada
    if (fichaSheetName) {
      const ws = wb.Sheets[fichaSheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
      if (rows.length > 0) {
        const first = rows[0];
        const fichaDetectada = first.ficha_de_caracterizacion || first.ficha || first.numero_ficha;
        if (fichaDetectada) {
          updatedData.ficha_de_caracterizacion = String(fichaDetectada).trim();
        }
        if (first.programa) updatedData.programa = String(first.programa).trim();
        if (first.centro) updatedData.centro = String(first.centro).trim();
        if (first.denominacion) updatedData.denominacion = String(first.denominacion).trim();
        if (first.instructor_titular) {
          updatedData.instructor_titular = String(first.instructor_titular).trim();
        }
        if (first.competencia_activa) {
          updatedData.competencia_activa = String(first.competencia_activa).trim();
        }
      }
    }

    // 2. Parsear Aprendices, fechas y registros de asistencia con espejos bidireccionales
    if (aprendicesSheetName) {
      const ws = wb.Sheets[aprendicesSheetName];
      const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
      
      if (rawRows.length > 0) {
        const sampleRow = rawRows[0];
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

        // Mapear columnas originales a formato DD/MM/YYYY estricto
        const dateMapping: { original: string; normalized: string }[] = rawDateColumns.map(col => ({
          original: col,
          normalized: toStrictDDMMYYYY(col)
        })).filter(d => d.normalized !== "");

        const normalizedDates = dateMapping.map(d => d.normalized);
        
        // Reemplazar el listado global de fechas para que la tabla pinte exactamente las columnas del Excel
        if (normalizedDates.length > 0) {
          updatedData.fechas_asistencia = normalizedDates;
        }

        // Mapear filas del Excel asegurando incluir todos los aprendices
        updatedData.asistencias_aprendices = rawRows
          .filter(r => {
            const docRow = String(r.numero_documento || r.documento || "").trim();
            const nombresRow = String(r.nombres || r.nombre || "").trim();
            return docRow !== "" || nombresRow !== "";
          })
          .map(uploadedRow => {
            const docNum = String(uploadedRow.numero_documento || uploadedRow.documento || "").trim();
            
            const cloudStudent = updatedData.asistencias_aprendices.find((s: any) => 
              String(s.numero_documento || "").trim() === docNum
            ) || {};

            const registrosActuales: Record<string, string> = {};

            dateMapping.forEach(({ original, normalized }) => {
              const val = uploadedRow[original];
              if (val !== null && val !== undefined) {
                const valStr = String(val).trim();
                if (valStr !== '' && valStr !== '·' && valStr !== '-') {
                  
                  // Normalizar estados comunes de asistencia y fallas ("X" como Inasistencia)
                  let finalVal = valStr;
                  const lowerVal = valStr.toLowerCase();
                  if (lowerVal === 'x' || lowerVal.includes('falla') || lowerVal.includes('inasistencia')) {
                    finalVal = 'Inasistencia';
                  } else if (lowerVal.includes('tarde') || lowerVal === 't') {
                    finalVal = 'Tardanza';
                  } else if (lowerVal.includes('excusa') || lowerVal === 'e') {
                    finalVal = 'Excusa';
                  } else if (lowerVal.includes('presente') || lowerVal === 'p') {
                    finalVal = 'Presente';
                  }

                  // 1. Guardar bajo la clave principal DD/MM/YYYY
                  registrosActuales[normalized] = finalVal;

                  // 2. Generar espejos en múltiples formatos para garantizar lectura interna
                  const parts = normalized.split('/');
                  if (parts.length === 3) {
                    const [d, m, yFull] = parts;
                    const dayNum = Number(d);
                    const monthNum = Number(m);
                    const yShort = yFull.slice(-2);

                    registrosActuales[`${dayNum}/${monthNum}/${yFull}`] = finalVal; 
                    registrosActuales[`${m}/${d}/${yFull}`]             = finalVal; 
                    registrosActuales[`${monthNum}/${dayNum}/${yFull}`]  = finalVal;
                    registrosActuales[`${d}/${m}/${yShort}`]             = finalVal; 
                  }
                }
              }
            });

            return {
              tipo_documento: String(uploadedRow.tipo_documento || cloudStudent.tipo_documento || "CC").trim(),
              numero_documento: docNum,
              nombres: String(uploadedRow.nombres || uploadedRow.nombre || cloudStudent.nombres || "").trim().toUpperCase(),
              apellidos: String(uploadedRow.apellidos || uploadedRow.apellido || cloudStudent.apellidos || "").trim().toUpperCase(),
              correo_electronico: String(uploadedRow.correo_electronico || uploadedRow.correo || cloudStudent.correo_electronico || "").trim().toLowerCase(),
              telefono: String(uploadedRow.telefono || cloudStudent.telefono || "").trim(),
              estado: String(uploadedRow.estado || cloudStudent.estado || "En formación").trim(),
              registros: registrosActuales
            };
          });
      }
    }

    return {
      success: true,
      message: `Plantilla simplificada procesada con éxito: ${updatedData.asistencias_aprendices.length} aprendices sincronizados.`,
      data: updatedData,
      counts: {
        aprendices: updatedData.asistencias_aprendices.length
      }
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Error al leer el archivo Excel: ${error.message || error}`
    };
  }
}
