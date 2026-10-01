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
 * Genera el libro de trabajo oficial para Google Sheets / Excel
 */
export function generateGoogleSheetsTemplate(): Uint8Array {
  const wb = XLSX.utils.book_new();

  const fichaHeaders = ["ficha_de_caracterizacion", "programa", "centro", "denominacion", "fecha_inicio", "fecha_terminacion", "jornada"];
  const fichaRows = [fichaHeaders, ["", "", "Complejo Tecnológico Agroindustrial, Pecuario y Turístico", "", "", "", ""]];
  const wsFicha = XLSX.utils.aoa_to_sheet(fichaRows);
  wsFicha['!cols'] = [{ wch: 25 }, { wch: 38 }, { wch: 45 }, { wch: 30 }, { wch: 15 }, { wch: 18 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsFicha, "Ficha");

  const equipoHeaders = ["competencia", "nombre_del_instructor", "correo_google", "correo_institucional_sena", "dia", "fecha_de_inicio", "fecha_terminacion", "rol"];
  const equipoRows = [equipoHeaders, ["", "", "", "", "", "", "", ""]];
  const wsEquipo = XLSX.utils.aoa_to_sheet(equipoRows);
  wsEquipo['!cols'] = [{ wch: 55 }, { wch: 32 }, { wch: 30 }, { wch: 30 }, { wch: 14 }, { wch: 16 }, { wch: 18 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, wsEquipo, "Equipo_Ejecutor");

  const aprendicesHeaders = ["tipo_documento", "numero_documento", "nombres", "apellidos", "correo_electronico", "telefono", "estado"];
  const aprendicesRows = [aprendicesHeaders, ["", "", "", "", "", "", ""]];
  const wsAprendices = XLSX.utils.aoa_to_sheet(aprendicesRows);
  wsAprendices['!cols'] = [{ wch: 16 }, { wch: 20 }, { wch: 26 }, { wch: 26 }, { wch: 35 }, { wch: 16 }, { wch: 16 }];
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
 * Parsea el archivo de Excel asegurando que todas las columnas de fechas se capturen 
 * y se dupliquen en variantes de texto para garantizar compatibilidad total con la interfaz.
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

    // 3. Parsear Aprendices y extraer columnas de fechas dinámicamente
    let totalAprendices = updatedData.asistencias_aprendices.length;
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
        
        // Extraer todas las columnas que no sean campos fijos del sistema
        const detectedDateColumns = Object.keys(sampleRow).filter(key => {
          const lowerKey = key.toLowerCase().trim();
          return !fixedKeys.some(fk => lowerKey.includes(fk));
        });

        if (detectedDateColumns.length > 0) {
          const existingDates = updatedData.fechas_asistencia || [];
          updatedData.fechas_asistencia = Array.from(new Set([...existingDates, ...detectedDateColumns]));
        }

        const newAprendices = rawRows
          .filter(r => (r.numero_documento || r.documento) && (r.nombres || r.nombre))
          .map(r => {
            const docNum = String(r.numero_documento || r.documento).trim();
            const existing = baseData.asistencias_aprendices.find(
              (a: any) => String(a.numero_documento).trim() === docNum
            );
            
            const registros: Record<string, string> = existing?.registros ? { ...existing.registros } : {};
            
            // Registrar las marcas de asistencia usando el nombre exacto de la columna 
            // y además variantes comunes para asegurar que la UI las dibuje
            detectedDateColumns.forEach(colName => {
              const val = r[colName];
              if (val !== null && val !== undefined) {
                const valStr = String(val).trim();
                if (valStr !== '' && valStr !== '·' && valStr !== '-') {
                  // 1. Guardar con el nombre exacto de la columna del Excel
                  registros[colName] = valStr;
                  
                  // 2. Si la columna es una fecha en serie de Excel o texto, generar también variantes normalizadas
                  if (/^\d{5}$/.test(colName)) {
                    const excelEpoch = new Date(1899, 11, 30);
                    const dateObj = new Date(excelEpoch.getTime() + Number(colName) * 24 * 60 * 60 * 1000);
                    if (!isNaN(dateObj.getTime())) {
                      const d = dateObj.getDate();
                      const m = dateObj.getMonth() + 1;
                      const y = dateObj.getFullYear();
                      registros[`${d}/${m}/${y}`] = valStr;
                      registros[`${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`] = valStr;
                      registros[`${m}/${d}/${y}`] = valStr;
                    }
                  } else {
                    // Si es texto, registrar variantes con y sin ceros a la izquierda
                    const parts = colName.split(/[\/\-\.]/);
                    if (parts.length === 3) {
                      const [p1, p2, p3] = parts;
                      if (p3.length === 4) {
                        registros[`${Number(p1)}/${Number(p2)}/${p3}`] = valStr;
                        registros[`${p1.padStart(2, '0')}/${p2.padStart(2, '0')}/${p3}`] = valStr;
                        registros[`${p2}/${p1}/${p3}`] = valStr; // por si acaso invierten mes/día
                      }
                    }
                  }
                } else {
                  delete registros[colName];
                }
              }
            });

            return {
              tipo_documento: String(r.tipo_documento || existing?.tipo_documento || "CC").trim(),
              numero_documento: docNum,
              nombres: String(r.nombres || r.nombre || "").trim().toUpperCase(),
              apellidos: String(r.apellidos || r.apellido || "").trim().toUpperCase(),
              correo_electronico: String(r.correo_electronico || r.correo || "").trim().toLowerCase(),
              telefono: String(r.telefono || existing?.telefono || "").trim(),
              estado: String(r.estado || existing?.estado || "En formación").trim(),
              registros: registros
            };
          });

        if (newAprendices.length > 0) {
          updatedData.asistencias_aprendices = newAprendices;
          totalAprendices = newAprendices.length;
        }
      }
    }

    return {
      success: true,
      message: `Formato procesado con éxito: ${totalAprendices} aprendices y registros de asistencia sincronizados.`,
      data: updatedData,
      counts: {
        instructores: totalInstructores,
        aprendices: totalAprendices
      }
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Error al leer el archivo Excel: ${error.message || error}`
    };
  }
}
