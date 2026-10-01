import * as XLSX from 'xlsx';
import { courseData as initialCourseData } from '../data';

export interface ParsedTemplateResult {
  success: boolean;
  message: string;
  data?: typeof initialCourseData;
  counts?: {
    instructores: number;
    aprendices: number;
  };
}

/**
 * Convierte cualquier fecha, texto o número serial de Excel 
 * al formato estándar colombiano: DD/MM/YYYY
 */
function standardizeDateToDDMMYYYY(key: string | number): string {
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
    
    if (parts[0].length === 4) {
      // Formato YYYY/MM/DD
      year = Number(parts[0]);
      month = Number(parts[1]);
      day = Number(parts[2]);
    } else {
      // Formato DD/MM/YYYY o M/D/YYYY
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
 * Genera el libro de trabajo oficial para Google Sheets / Excel
 */
export function generateGoogleSheetsTemplate(): Uint8Array {
  const wb = XLSX.utils.book_new();

  const fichaHeaders = ["ficha_de_caracterizacion", "programa", "centro", "denominacion", "fecha_inicio", "fecha_terminacion", "jornada"];
  const fichaRows = [fichaHeaders, ["", "", "Complejo Tecnológico Agroindustrial, Pecuario y Turístico", "", "", "", ""]];
  const wsFicha = XLSX.utils.aoa_to_sheet(fichaRows);
  XLSX.utils.book_append_sheet(wb, wsFicha, "Ficha");

  const equipoHeaders = ["competencia", "nombre_del_instructor", "correo_google", "correo_institucional_sena", "dia", "fecha_de_inicio", "fecha_terminacion", "rol"];
  const equipoRows = [equipoHeaders, ["", "", "", "", "", "", "", ""]];
  const wsEquipo = XLSX.utils.aoa_to_sheet(equipoRows);
  XLSX.utils.book_append_sheet(wb, wsEquipo, "Equipo_Ejecutor");

  const aprendicesHeaders = ["tipo_documento", "numero_documento", "nombres", "apellidos", "correo_electronico", "telefono", "estado"];
  const aprendicesRows = [aprendicesHeaders, ["", "", "", "", "", "", ""]];
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
  a.download = `Plantilla_Oficial_Asistencia_SENA.xlsx`;
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
 * Parsea el archivo Excel estandarizando todas las fechas a DD/MM/YYYY con índices espejo
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

    if (!aprendicesSheetName && !fichaSheetName && !equipoSheetName) {
      return {
        success: false,
        message: "No se encontraron las hojas requeridas en el archivo."
      };
    }

    const updatedData = JSON.parse(JSON.stringify(baseData));

    // 1. Parsear Ficha
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
          (updatedData as any).instructor_titular = String(first.instructor_titular).trim();
        }
      }
    }

    // 2. Parsear Equipo Ejecutor
    let totalInstructores = updatedData.equipo_instructores.length;
    if (equipoSheetName) {
      const ws = wb.Sheets[equipoSheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
      if (rows.length > 0) {
        const newInstructors = rows
          .filter(r => (r.nombre_del_instructor || r.nombre || r.instructor) && (r.competencia))
          .map(r => ({
            competencia: String(r.competencia).trim(),
            nombre_del_instructor: String(r.nombre_del_instructor || r.nombre || r.instructor).trim(),
            fecha_de_inicio: String(r.fecha_de_inicio || r.fecha_inicio || "20/01/26").trim(),
            fecha_terminacion: String(r.fecha_terminacion || r.fecha_fin || "03/12/26").trim(),
            dia: String(r.dia || "Lunes").trim(),
            correo: String(r.correo_google || r.correo_institucional_sena || r.correo || "").trim()
          }));

        if (newInstructors.length > 0) {
          updatedData.equipo_instructores = newInstructors;
          totalInstructores = newInstructors.length;
        }
      }
    }

    // 3. Parsear Aprendices y estandarizar asistencias a formato DD/MM/YYYY con espejos
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

        // Mapear columnas originales a formato estándar DD/MM/YYYY
        const dateMapping: { original: string; normalized: string }[] = rawDateColumns.map(col => ({
          original: col,
          normalized: standardizeDateToDDMMYYYY(col)
        })).filter(d => d.normalized !== "");

        const normalizedDates = dateMapping.map(d => d.normalized);
        if (normalizedDates.length > 0) {
          const existingDates = updatedData.fechas_asistencia || [];
          updatedData.fechas_asistencia = Array.from(new Set([...existingDates, ...normalizedDates]));
        }

        updatedData.asistencias_aprendices = updatedData.asistencias_aprendices.map((cloudStudent: any) => {
          const docCloud = String(cloudStudent.numero_documento || "").trim();
          const uploadedRow = rawRows.find(r => {
            const docRow = String(r.numero_documento || r.documento || "").trim();
            return docRow === docCloud;
          });

          if (!uploadedRow) return cloudStudent;

          const registrosActuales = cloudStudent.registros ? { ...cloudStudent.registros } : {};

          dateMapping.forEach(({ original, normalized }) => {
            const val = uploadedRow[original];
            if (val !== null && val !== undefined) {
              const valStr = String(val).trim();
              if (valStr !== '' && valStr !== '·' && valStr !== '-') {
                // 1. Guardar con formato DD/MM/YYYY estándar
                registrosActuales[normalized] = valStr;

                // 2. Generar copias espejo (ej: sin ceros iniciales o con año corto) para garantizar renderizado en cualquier vista
                const parts = normalized.split('/');
                if (parts.length === 3) {
                  const [d, m, yFull] = parts;
                  const dayNum = Number(d);
                  const monthNum = Number(m);
                  const yShort = yFull.slice(-2);

                  registrosActuales[`${dayNum}/${monthNum}/${yFull}`] = valStr; // Ej: 1/29/2026 o 29/1/2026
                  registrosActuales[`${d}/${m}/${yShort}`]             = valStr; // Ej: 29/01/26
                  registrosActuales[`${dayNum}/${monthNum}/${yShort}`] = valStr; // Ej: 29/1/26
                }
              } else {
                delete registrosActuales[normalized];
              }
            }
          });

          return {
            ...cloudStudent,
            nombres: String(uploadedRow.nombres || uploadedRow.nombre || cloudStudent.nombres).trim().toUpperCase(),
            apellidos: String(uploadedRow.apellidos || uploadedRow.apellido || cloudStudent.apellidos).trim().toUpperCase(),
            correo_electronico: String(uploadedRow.correo_electronico || uploadedRow.correo || cloudStudent.correo_electronico).trim().toLowerCase(),
            telefono: String(uploadedRow.telefono || cloudStudent.telefono || "").trim(),
            estado: String(uploadedRow.estado || cloudStudent.estado || "En formación").trim(),
            registros: registrosActuales
          };
        });
      }
    }

    return {
      success: true,
      message: `Formato procesado con éxito: ${updatedData.asistencias_aprendices.length} aprendices sincronizados en formato DD/MM/YYYY.`,
      data: updatedData,
      counts: {
        instructores: totalInstructores,
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
