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
    
    if (parts[0].length === 4) {
      year = Number(parts[0]);
      month = Number(parts[1]);
      day = Number(parts[2]);
    } else {
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
 * 1. Genera la Plantilla Simplificada con datos precargados del instructor y listado de aprendices de la ficha.
 */
export function generateGoogleSheetsTemplate(courseData?: typeof initialCourseData): Uint8Array {
  const wb = XLSX.utils.book_new();

  const fichaActual = courseData?.ficha_de_caracterizacion || "";
  const denominacionProg = courseData?.denominacion || courseData?.programa || "";
  const centroFormacion = courseData?.centro || "Complejo Tecnológico Agroindustrial, Pecuario y Turístico";
  const instructorTitular = courseData?.instructor_titular || courseData?.equipo_instructores?.[0]?.nombre_del_instructor || "";
  const competenciaActiva = courseData?.competencia_activa || courseData?.equipo_instructores?.[0]?.competencia || "";

  // Hoja de Ficha y Metadatos Institucionales unificados
  const fichaHeaders = [
    "ficha_de_caracterizacion", 
    "denominacion", 
    "centro", 
    "instructor_titular", 
    "competencia_activa"
  ];
  const fichaRows = [
    fichaHeaders, 
    [fichaActual, denominacionProg, centroFormacion, instructorTitular, competenciaActiva]
  ];
  const wsFicha = XLSX.utils.aoa_to_sheet(fichaRows);
  XLSX.utils.book_append_sheet(wb, wsFicha, "Ficha");

  // Hoja de Aprendices precargada con la base de datos de la ficha y fechas existentes
  const aprendicesHeaders = [
    "tipo_documento", 
    "numero_documento", 
    "nombres", 
    "apellidos", 
    "correo_electronico", 
    "telefono", 
    "estado"
  ];

  const fechasAsistencia: string[] = Array.isArray(courseData?.fechas_asistencia) && courseData.fechas_asistencia.length > 0
    ? courseData.fechas_asistencia
    : ["20/01/2026", "21/01/2026"];

  const fullAprendicesHeaders = [...aprendicesHeaders, ...fechasAsistencia];
  const aprendicesRows: any[][] = [fullAprendicesHeaders];

  const listadoAprendices: any[] = Array.isArray(courseData?.asistencias_aprendices) && courseData.asistencias_aprendices.length > 0
    ? courseData.asistencias_aprendices
    : [
        {
          tipo_documento: "CC",
          numero_documento: "",
          nombres: "EJEMPLO APRENDIZ",
          apellidos: "APELLIDO",
          correo_electronico: "",
          telefono: "",
          estado: "En formación",
          registros: {}
        }
      ];

  listadoAprendices.forEach((aprendiz: any) => {
    const row: any[] = [
      aprendiz.tipo_documento || "CC",
      String(aprendiz.numero_documento || ""),
      aprendiz.nombres || "",
      aprendiz.apellidos || "",
      aprendiz.correo_electronico || "",
      aprendiz.telefono || "",
      aprendiz.estado || "En formación"
    ];

    fechasAsistencia.forEach((fecha: string) => {
      const estadoReg = aprendiz.registros?.[fecha] || "Presente";
      row.push(estadoReg);
    });

    aprendicesRows.push(row);
  });

  const wsAprendices = XLSX.utils.aoa_to_sheet(aprendicesRows);
  XLSX.utils.book_append_sheet(wb, wsAprendices, "Aprendices");

  const sdata = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new Uint8Array(sdata);
}

/**
 * 2. Genera el Formato Completo de Configuración Inicial (Ficha, Equipo_Ejecutor y Aprendices)
 */
export function generateCompleteConfigurationTemplate(courseData?: typeof initialCourseData): Uint8Array {
  const wb = XLSX.utils.book_new();

  const fichaActual = courseData?.ficha_de_caracterizacion || "";
  const denominacionProg = courseData?.denominacion || courseData?.programa || "";
  const centroFormacion = courseData?.centro || "Complejo Tecnológico Agroindustrial, Pecuario y Turístico";

  const fichaHeaders = ["ficha_de_caracterizacion", "denominacion", "centro", "fecha_inicio", "fecha_terminacion", "jornada"];
  const fichaRows = [fichaHeaders, [fichaActual, denominacionProg, centroFormacion, "", "", ""]];
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
  const equipoRows: any[][] = [equipoHeaders];
  
  if (Array.isArray(courseData?.equipo_instructores) && courseData.equipo_instructores.length > 0) {
    courseData.equipo_instructores.forEach((inst: any) => {
      equipoRows.push([
        inst.competencia || "",
        inst.nombre_del_instructor || "",
        inst.correo_google || "",
        inst.correo_institucional_sena || "",
        inst.dia || "Lunes",
        inst.rol || "Instructor"
      ]);
    });
  } else {
    equipoRows.push(["", "", "", "", "", ""]);
  }

  const wsEquipo = XLSX.utils.aoa_to_sheet(equipoRows);
  XLSX.utils.book_append_sheet(wb, wsEquipo, "Equipo_Ejecutor");

  const aprendicesHeaders = ["tipo_documento", "numero_documento", "nombres", "apellidos", "correo_electronico", "telefono", "estado"];
  const aprendicesRows: any[][] = [aprendicesHeaders];

  const listadoAprendices = Array.isArray(courseData?.asistencias_aprendices) ? courseData.asistencias_aprendices : [];
  if (listadoAprendices.length > 0) {
    listadoAprendices.forEach((aprendiz: any) => {
      aprendicesRows.push([
        aprendiz.tipo_documento || "CC",
        String(aprendiz.numero_documento || ""),
        aprendiz.nombres || "",
        aprendiz.apellidos || "",
        aprendiz.correo_electronico || "",
        aprendiz.telefono || "",
        aprendiz.estado || "En formación"
      ]);
    });
  } else {
    aprendicesRows.push(["CC", "", "", "", "", "", "En formación"]);
  }

  const wsAprendices = XLSX.utils.aoa_to_sheet(aprendicesRows);
  XLSX.utils.book_append_sheet(wb, wsAprendices, "Aprendices");

  const sdata = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new Uint8Array(sdata);
}

export function downloadGoogleSheetsTemplate(courseData?: typeof initialCourseData) {
  const data = generateGoogleSheetsTemplate(courseData);
  const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Plantilla_Asistencia_Ficha_${courseData?.ficha_de_caracterizacion || 'SENA'}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadCompleteConfigurationTemplate(courseData?: typeof initialCourseData) {
  const data = generateCompleteConfigurationTemplate(courseData);
  const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Formato_Completo_Configuracion_Ficha_${courseData?.ficha_de_caracterizacion || 'SENA'}.xlsx`;
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

    const updatedData: any = JSON.parse(JSON.stringify(baseData || {}));

    updatedData.asistencias_aprendices = [];
    updatedData.fechas_asistencia = [];
    updatedData.equipo_instructores = Array.isArray(baseData?.equipo_instructores) ? baseData.equipo_instructores : [];
    updatedData.competencias = Array.isArray(baseData?.competencias) ? baseData.competencias : [];
    updatedData.aprendices = Array.isArray(baseData?.aprendices) ? baseData.aprendices : [];
    
    updatedData.ficha_de_caracterizacion = updatedData.ficha_de_caracterizacion || "";
    updatedData.centro = updatedData.centro || "Complejo Tecnológico Agroindustrial, Pecuario y Turístico";
    updatedData.denominacion = updatedData.denominacion || "";
    updatedData.programa = updatedData.programa || "";
    updatedData.instructor_titular = updatedData.instructor_titular || "";
    updatedData.competencia_activa = updatedData.competencia_activa || "";

    // 1. Parsear Ficha y Denominación unificada
    if (fichaSheetName) {
      const ws = wb.Sheets[fichaSheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
      if (rows.length > 0) {
        const first = rows[0];
        const fichaDetectada = first.ficha_de_caracterizacion || first.ficha || first.numero_ficha;
        if (fichaDetectada) updatedData.ficha_de_caracterizacion = String(fichaDetectada).trim();
        
        const denomDetectada = first.denominacion || first.programa;
        if (denomDetectada) {
          updatedData.denominacion = String(denomDetectada).trim();
          updatedData.programa = String(denomDetectada).trim();
        }

        if (first.centro) updatedData.centro = String(first.centro).trim();
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
          .filter((r: any) => r && (r.nombre_del_instructor || r.nombre || r.instructor) && r.competencia)
          .map((r: any) => ({
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

    // 3. Parsear Aprendices, fechas y validación estricta de opciones de asistencia
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

        const uniqueDatesMap = new Set<string>();
        dateMapping.forEach(d => uniqueDatesMap.add(d.normalized));
        const normalizedDates = Array.from(uniqueDatesMap);
        
        if (normalizedDates.length > 0) {
          updatedData.fechas_asistencia = normalizedDates;
        }

        const opcionesValidas = ['Presente', 'X', 'Tarde', 'Excusa'];

        const parsedAprendices = rawRows
          .filter((r: any) => {
            if (!r) return false;
            const docRow = String(r.numero_documento || r.documento || "").trim();
            const nombresRow = String(r.nombres || r.nombre || "").trim();
            return docRow !== "" || nombresRow !== "";
          })
          .map((uploadedRow: any) => {
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

                  if (opcionesValidas.includes(finalVal)) {
                    if (finalVal !== 'Presente' || !registrosActuales[normalized]) {
                      registrosActuales[normalized] = finalVal;
                    }
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
