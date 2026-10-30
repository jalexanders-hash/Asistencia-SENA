import * as XLSX from 'xlsx';
import { courseData as initialCourseData } from '../data';

export interface ParsedTemplateResult {
  success: boolean;
  message: string;
  data?: typeof initialCourseData;
  counts?: {
    aprendices: number;
    instructores?: number;
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
 * Convierte una fecha DD/MM/YYYY o YYYY-MM-DD a objeto Date para ordenamiento y rangos seguros
 */
function parseDateToObj(dateStr: string): Date {
  const clean = toStrictDDMMYYYY(dateStr);
  const parts = clean.split('/');
  if (parts.length === 3) {
    const d = Number(parts[0]);
    const m = Number(parts[1]) - 1;
    const y = Number(parts[2]);
    return new Date(y, m, d);
  }
  return new Date(0);
}

/**
 * Normaliza las fechas y las ordena estrictamente en orden cronológico ascendente
 */
function ordenarFechasCronologicamente(fechas: string[]): string[] {
  if (!Array.isArray(fechas)) return [];
  const unicas = Array.from(new Set(fechas.map(f => toStrictDDMMYYYY(f)).filter(Boolean)));
  return unicas.sort((a, b) => parseDateToObj(a).getTime() - parseDateToObj(b).getTime());
}

/**
 * 1. Genera la Plantilla Simplificada de Asistencia precargada con fechas en orden cronológico estricto
 */
export function generateGoogleSheetsTemplate(courseData?: typeof initialCourseData, instructorActual?: any): Uint8Array {
  const wb = XLSX.utils.book_new();

  // 0. Hoja LÉAME (Instrucciones visuales y guía rápida)
  const wsLeameData = [
    ["GUÍA RÁPIDA DE DILIGENCIAMIENTO - REGISTRO DE ASISTENCIAS"],
    ["1. No modifique las cabeceras de identificación del aprendiz (vienen protegidas)."],
    ["2. Las columnas de fecha se encuentran organizadas estrictamente en orden cronológico."],
    ["3. Valores permitidos para la asistencia: (Vacío) / Presente, X (Inasistencia), Tarde (Retardo), Excusa (Justificada)."],
    ["4. Entradas informales como 'falta' se normalizarán a 'X', y 'evento' u otras justificadas a 'Excusa'."]
  ];
  const wsLeame = XLSX.utils.aoa_to_sheet(wsLeameData);
  XLSX.utils.book_append_sheet(wb, wsLeame, "LÉAME");

  const fichaActual = courseData?.ficha_de_caracterizacion || "";
  const denominacionProg = courseData?.denominacion || courseData?.programa || "";
  const centroFormacion = courseData?.centro || "Complejo Tecnológico Agroindustrial, Pecuario y Turístico";
  
  const nombreInst = instructorActual?.nombre_del_instructor || courseData?.instructor_titular || courseData?.equipo_instructores?.[0]?.nombre_del_instructor || "";
  const compInst = instructorActual?.competencia || courseData?.competencia_activa || courseData?.equipo_instructores?.[0]?.competencia || "";

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
    [fichaActual, denominacionProg, centroFormacion, nombreInst, compInst]
  ];
  const wsFicha = XLSX.utils.aoa_to_sheet(fichaRows);
  XLSX.utils.book_append_sheet(wb, wsFicha, "Ficha");

  // Filtrado estricto de fechas para el instructor respetando su fecha de inicio
  const todasLasFechas = Array.isArray(courseData?.fechas_asistencia) && courseData.fechas_asistencia.length > 0
    ? courseData.fechas_asistencia
    : [];

  const fechaInicioInstStr = instructorActual?.fecha_de_inicio || instructorActual?.fecha_inicio || "";
  const fechaInicioInstObj = fechaInicioInstStr ? parseDateToObj(fechaInicioInstStr) : null;

  const fechasAsistencia = todasLasFechas.filter((fechaStr: string) => {
    if (fechaInicioInstObj && !isNaN(fechaInicioInstObj.getTime())) {
      const fechaItemObj = parseDateToObj(fechaStr);
      if (fechaItemObj < fechaInicioInstObj) {
        return false; 
      }
    }
    return true;
  });

  const fechasFinalesCrudas = fechasAsistencia.length > 0 ? fechasAsistencia : (todasLasFechas.length > 0 ? [todasLasFechas[todasLasFechas.length - 1]] : ["19/10/2026"]);
  
  // ORDEN CRONOLÓGICO ESTRICTO
  const fechasFinales = ordenarFechasCronologicamente(fechasFinalesCrudas);

  // Hoja de Aprendices precargada
  const aprendicesHeaders = [
    "tipo_documento", 
    "numero_documento", 
    "nombres", 
    "apellidos", 
    "correo_electronico", 
    "telefono", 
    "estado"
  ];

  const fullAprendicesHeaders = [...aprendicesHeaders, ...fechasFinales];
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

    fechasFinales.forEach((fecha: string) => {
      const estadoReg = instructorActual ? (aprendiz.registros?.[fecha] || "") : (aprendiz.registros?.[fecha] || "Presente");
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
 * 2. Genera el Formato Completo de Configuración Inicial (LÉAME, Ficha, Equipo_Ejecutor y Aprendices)
 */
export function generateCompleteConfigurationTemplate(courseData?: typeof initialCourseData): Uint8Array {
  const wb = XLSX.utils.book_new();

  // Hoja LÉAME para Configuración
  const wsLeameData = [
    ["GUÍA RÁPIDA DE DILIGENCIAMIENTO - CONFIGURACIÓN DE FICHA"],
    ["1. No modifique las cabeceras ni el orden de las columnas."],
    ["2. La primera fila de datos en Equipo_Ejecutor y Aprendices con etiqueta 'EJEMPLO' es de guía y el sistema la ignorará automáticamente."],
    ["3. Registre instructores activos sin traslapes en los días de la semana."],
    ["4. Dominios institucionales permitidos para instructores: @sena.edu.co y @gmail.com (correos de aprendices abiertos a cualquier servidor)."]
  ];
  const wsLeame = XLSX.utils.aoa_to_sheet(wsLeameData);
  XLSX.utils.book_append_sheet(wb, wsLeame, "LÉAME");

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
    "rol",
    "fecha_de_inicio"
  ];
  const equipoRows: any[][] = [
    equipoHeaders,
    ["EJEMPLO – NO SE IMPORTA", "JUAN PÉREZ", "instructor@gmail.com", "instructor@sena.edu.co", "Viernes", "Instructor / Tutor", "20/01/2026"]
  ];
  
  if (Array.isArray(courseData?.equipo_instructores) && courseData.equipo_instructores.length > 0) {
    courseData.equipo_instructores.forEach((inst: any) => {
      equipoRows.push([
        inst.competencia || "",
        inst.nombre_del_instructor || "",
        inst.correo_google || "",
        inst.correo_institucional_sena || "",
        inst.dia || "Lunes",
        inst.rol || "Instructor",
        inst.fecha_de_inicio || ""
      ]);
    });
  }

  const wsEquipo = XLSX.utils.aoa_to_sheet(equipoRows);
  XLSX.utils.book_append_sheet(wb, wsEquipo, "Equipo_Ejecutor");

  const aprendicesHeaders = ["tipo_documento", "numero_documento", "nombres", "apellidos", "correo_electronico", "telefono", "estado"];
  const aprendicesRows: any[][] = [
    aprendicesHeaders,
    ["EJEMPLO", "1001021491", "VALENTINA", "TORO", "valencia@outlook.com", "3001234567", "En Formación"]
  ];

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
  }

  const wsAprendices = XLSX.utils.aoa_to_sheet(aprendicesRows);
  XLSX.utils.book_append_sheet(wb, wsAprendices, "Aprendices");

  const sdata = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new Uint8Array(sdata);
}

export function downloadGoogleSheetsTemplate(courseData?: typeof initialCourseData, instructorActual?: any) {
  const data = generateGoogleSheetsTemplate(courseData, instructorActual);
  const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Plantilla_Asistencia_Ficha_${courseData?.ficha_de_caracterizacion || 'SENA'}_${instructorActual?.nombre_del_instructor || 'Instructor'}.xlsx`;
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
 * Parsea el archivo de configuración inicial o asistencia con normalización automática
 * (falta -> X, evento -> Excusa) y orden cronológico.
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
    const parseMetaFromSheet = (sheetNameVal: string) => {
      const ws = wb.Sheets[sheetNameVal];
      if (!ws) return;
      const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
      rows.forEach((row: any) => {
        const fichaDetectada = row.ficha_de_caracterizacion || row.ficha || row.numero_ficha;
        if (fichaDetectada) updatedData.ficha_de_caracterizacion = String(fichaDetectada).trim();
        
        const denomDetectada = row.denominacion || row.programa;
        if (denomDetectada) {
          updatedData.denominacion = String(denomDetectada).trim();
          updatedData.programa = String(denomDetectada).trim();
        }

        if (row.centro) updatedData.centro = String(row.centro).trim();
        if (row.instructor_titular) updatedData.instructor_titular = String(row.instructor_titular).trim();
        if (row.competencia_activa) updatedData.competencia_activa = String(row.competencia_activa).trim();

        const keys = Object.keys(row);
        if (keys.length >= 2) {
          const k = String(row[keys[0]] || '').trim().toLowerCase();
          const v = String(row[keys[1]] || '').trim();
          if (k.includes('ficha')) updatedData.ficha_de_caracterizacion = v;
          if (k.includes('denominacion') || k.includes('programa')) {
            updatedData.denominacion = v;
            updatedData.programa = v;
          }
          if (k.includes('centro')) updatedData.centro = v;
          if (k.includes('instructor')) updatedData.instructor_titular = v;
          if (k.includes('competencia')) updatedData.competencia_activa = v;
        }
      });
    };

    if (fichaSheetName) parseMetaFromSheet(fichaSheetName);
    if (aprendicesSheetName) parseMetaFromSheet(aprendicesSheetName);

    // 2. Parsear Equipo Ejecutor
    if (equipoSheetName) {
      const ws = wb.Sheets[equipoSheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
      if (rows.length > 0) {
        const newInstructors = rows
          .filter((r: any) => {
            if (!r) return false;
            const name = String(r.nombre_del_instructor || r.nombre || r.instructor || "").trim();
            return name !== "" && !name.toUpperCase().includes("EJEMPLO");
          })
          .map((r: any) => ({
            competencia: String(r.competencia || "").trim(),
            nombre_del_instructor: String(r.nombre_del_instructor || r.nombre || r.instructor).trim(),
            correo_google: String(r.correo_google || r.correo || "").trim().toLowerCase(),
            correo_institucional_sena: String(r.correo_institucional_sena || "").trim().toLowerCase(),
            dia: String(r.dia || "Lunes").trim(),
            rol: String(r.rol || "Instructor").trim(),
            fecha_de_inicio: String(r.fecha_de_inicio || r.fecha_inicio || "20/01/2026").trim(),
            fecha_terminacion: String(r.fecha_terminacion || "03/12/2026").trim()
          }));

        if (newInstructors.length > 0) {
          updatedData.equipo_instructores = newInstructors;
        }
      }
    }

    // 3. Parsear Aprendices, fechas en orden cronológico y normalización estricta de opciones de asistencia
    if (aprendicesSheetName) {
      const ws = wb.Sheets[aprendicesSheetName];
      const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
      
      if (rawRows.length > 0) {
        const sampleRow = rawRows[0] || {};
        const fixedKeys = [
          'tipo_documento', 'numero_documento', 'documento', 
          'nombres', 'nombre', 'apellidos', 'apellido', 
          'correo_electronico', 'correo', 'telefono', 'estado', 
          'fallas', 'tardanzas', 'm/d/yyyy', 'instructor_titular', 'competencia_activa',
          'ficha_de_caracterizacion', 'denominacion', 'centro', 'programa'
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
        
        // ORDEN CRONOLÓGICO ESTRICTO de las fechas parseadas
        const normalizedDates = ordenarFechasCronologicamente(Array.from(uniqueDatesMap));
        
        if (normalizedDates.length > 0) {
          updatedData.fechas_asistencia = normalizedDates;
        }

        const opcionesValidas = ['Presente', 'X', 'Tarde', 'Excusa'];

        const parsedAprendices = rawRows
          .filter((r: any) => {
            if (!r) return false;
            const docRow = String(r.numero_documento || r.documento || "").trim();
            const nombresRow = String(r.nombres || r.nombre || "").trim();
            if (nombresRow.toUpperCase().includes("EJEMPLO")) return false;
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
                  
                  // Normalización solicitada: falta -> X, evento -> Excusa
                  if (lowerVal === 'x' || lowerVal.includes('falla') || lowerVal.includes('inasistencia') || lowerVal === 'falta') {
                    finalVal = 'X';
                  } else if (lowerVal.includes('tarde') || lowerVal === 't') {
                    finalVal = 'Tarde';
                  } else if (lowerVal.includes('excusa') || lowerVal === 'e' || lowerVal.includes('evento') || lowerVal === 'evento institucional') {
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
