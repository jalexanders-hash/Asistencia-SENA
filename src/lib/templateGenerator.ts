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
 * con todas las hojas y campos requeridos para la carga en el aplicativo.
 */
export function generateGoogleSheetsTemplate(): Uint8Array {
  const wb = XLSX.utils.book_new();

  // 1. Hoja Ficha
  const fichaHeaders = [
    "ficha_de_caracterizacion",
    "programa",
    "centro",
    "denominacion",
    "fecha_inicio",
    "fecha_terminacion",
    "jornada"
  ];
  const fichaRows = [
    fichaHeaders,
    [
      "3387401",
      "Tecnología en Gestión Administrativa",
      "Complejo Tecnológico Agroindustrial, Pecuario y Turístico",
      "GESTIÓN ADMINISTRATIVA",
      "20/01/2026",
      "03/12/2026",
      "Diurna"
    ]
  ];
  const wsFicha = XLSX.utils.aoa_to_sheet(fichaRows);
  // Auto col widths
  wsFicha['!cols'] = [
    { wch: 25 },
    { wch: 38 },
    { wch: 45 },
    { wch: 30 },
    { wch: 15 },
    { wch: 18 },
    { wch: 15 }
  ];
  XLSX.utils.book_append_sheet(wb, wsFicha, "Ficha");

  // 2. Hoja Equipo Ejecutor
  const equipoHeaders = [
    "competencia",
    "nombre_del_instructor",
    "correo_google",
    "correo_institucional_sena",
    "dia",
    "fecha_de_inicio",
    "fecha_terminacion",
    "rol"
  ];
  const equipoRows = [
    equipoHeaders,
    [
      "Producir los documentos que se originen de las funciones administrativas, siguiendo la norma técnica y la legislación vigente",
      "Jorge Alexander Sepúlveda Vélez",
      "jalexanders@gmail.com",
      "jasepulveda@sena.edu.co",
      "Jueves",
      "20/01/2026",
      "03/12/2026",
      "Instructor Técnico"
    ],
    [
      "Intervenir en el desarrollo de los programas de mejoramiento organizacional que se deriven de la función administrativa",
      "Xalima De Jesús Ruiz Doria",
      "xaruiz@sena.edu.co",
      "xaruiz@sena.edu.co",
      "Martes",
      "21/07/2026",
      "01/12/2026",
      "Líder de Ficha"
    ],
    [
      "Comprender textos en inglés en forma escrita y auditiva",
      "Leidy Carolina Cano Muñoz",
      "carolinamunoz901@gmail.com",
      "lccano@sena.edu.co",
      "Viernes",
      "13/02/2026",
      "04/12/2026",
      "Instructor Transversal"
    ],
    [
      "Aplicar tecnologías de la información teniendo en cuenta las necesidades de la unidad administrativa",
      "Dayana Marcela Diaz Dager",
      "dayanadager@gmail.com",
      "dayanadiaz@sena.edu.co",
      "Miércoles",
      "10/02/2026",
      "02/12/2026",
      "Instructor Técnico"
    ]
  ];
  const wsEquipo = XLSX.utils.aoa_to_sheet(equipoRows);
  wsEquipo['!cols'] = [
    { wch: 55 },
    { wch: 32 },
    { wch: 30 },
    { wch: 30 },
    { wch: 14 },
    { wch: 16 },
    { wch: 18 },
    { wch: 22 }
  ];
  XLSX.utils.book_append_sheet(wb, wsEquipo, "Equipo_Ejecutor");

  // 3. Hoja Aprendices
  const aprendicesHeaders = [
    "tipo_documento",
    "numero_documento",
    "nombres",
    "apellidos",
    "correo_electronico",
    "telefono",
    "estado"
  ];
  const aprendicesRows = [
    aprendicesHeaders,
    [
      "CC",
      "1001035388",
      "MARYIS LEIDYS",
      "ALMAIRO TAPIAS",
      "MLAT28066845@soy.sena.edu.co",
      "3105550101",
      "En Formación"
    ],
    [
      "CC",
      "1007607693",
      "SONIA YOHANA",
      "JARAMILLO SALAS",
      "SYJS26738888@soy.sena.edu.co",
      "3125550202",
      "En Formación"
    ],
    [
      "TI",
      "1003456789",
      "JUAN CARLOS",
      "PEREZ GOMEZ",
      "jcperez@soy.sena.edu.co",
      "3205550303",
      "En Formación"
    ]
  ];
  const wsAprendices = XLSX.utils.aoa_to_sheet(aprendicesRows);
  wsAprendices['!cols'] = [
    { wch: 16 },
    { wch: 20 },
    { wch: 26 },
    { wch: 26 },
    { wch: 35 },
    { wch: 16 },
    { wch: 16 }
  ];
  XLSX.utils.book_append_sheet(wb, wsAprendices, "Aprendices");

  // 4. Hoja Guía y Convenciones
  const guiaRows = [
    ["GUÍA Y CONVENCIONES PARA LA CARGA DE DATOS EN EL APLICATIVO SENA"],
    [""],
    ["1. ESTRUCTURA DE HOJAS DEL ARCHIVO:"],
    ["- Ficha:", "Contiene los datos generales del programa, centro y número de ficha."],
    ["- Equipo_Ejecutor:", "Listado de instructores responsables de cada competencia formativa."],
    ["- Aprendices:", "Listado oficial de aprendices matriculados en la ficha."],
    [""],
    ["2. CONVENCIONES DE ESTADO DE ASISTENCIA:"],
    ["Símbolo / Texto", "Significado", "Impacto en Alertas"],
    ["•", "Presente (Asistencia normal)", "Ninguno"],
    ["X", "Inasistencia injustificada", "Genera alerta automática al acumular 3 o más fallas"],
    ["Tarde", "Retardo / Llegada tarde", "Genera llamado de atención escrito al 3er retardo"],
    ["Excusa", "Falla justificada con incapacidad o soporte", "No computa para deserción injustificada"],
    ["Evento", "Actividad o evento institucional autorizado", "No computa como falla"],
    [""],
    ["3. INSTRUCCIONES PARA GOOGLE SHEETS:"],
    ["Paso 1:", "Sube este archivo a tu Google Drive ( drive.google.com )."],
    ["Paso 2:", "Haz doble clic y ábrelo con Google Sheets."],
    ["Paso 3:", "Diligencia la información de tu ficha y guarda los cambios."],
    ["Paso 4:", "Descárgalo en Archivo > Descargar > Microsoft Excel (.xlsx) y cárgalo en el aplicativo."]
  ];
  const wsGuia = XLSX.utils.aoa_to_sheet(guiaRows);
  wsGuia['!cols'] = [{ wch: 25 }, { wch: 45 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, wsGuia, "Guia_y_Convenciones");

  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
}

/**
 * Descarga directamente el archivo .xlsx en el navegador del usuario
 */
export function downloadGoogleSheetsTemplate(fichaNumber = "3387401") {
  const data = generateGoogleSheetsTemplate();
  const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Formato_Carga_GoogleSheets_Ficha_${fichaNumber}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Descarga una plantilla CSV rápida de Aprendices
 */
export function downloadAprendicesCSVTemplate() {
  const csvContent = "tipo_documento,numero_documento,nombres,apellidos,correo_electronico,telefono,estado\n" +
    "CC,1001035388,MARYIS LEIDYS,ALMAIRO TAPIAS,MLAT28066845@soy.sena.edu.co,3105550101,En Formación\n" +
    "CC,1007607693,SONIA YOHANA,JARAMILLO SALAS,SYJS26738888@soy.sena.edu.co,3125550202,En Formación\n" +
    "TI,1003456789,JUAN CARLOS,PEREZ GOMEZ,jcperez@soy.sena.edu.co,3205550303,En Formación\n";

  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = "Plantilla_Aprendices_SENA.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parsea un archivo .xlsx cargado por el usuario y valida los campos requeridos
 */
export async function parseUploadedTemplate(file: File, baseData: typeof initialCourseData): Promise<ParsedTemplateResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const wb = XLSX.read(arrayBuffer, { type: 'array' });

    // Buscar nombres de hojas flexibles
    const sheetNames = wb.SheetNames;
    const findSheet = (keywords: string[]) => {
      return sheetNames.find(s => keywords.some(k => s.toLowerCase().includes(k.toLowerCase())));
    };

    const fichaSheetName = findSheet(['ficha']);
    const equipoSheetName = findSheet(['equipo', 'instructor']);
    const aprendicesSheetName = findSheet(['aprendiz', 'aprendices', 'alumnos', 'estudiantes']);

    if (!aprendicesSheetName && !fichaSheetName && !equipoSheetName) {
      return {
        success: false,
        message: "No se encontraron las hojas requeridas ('Ficha', 'Equipo_Ejecutor' o 'Aprendices') en el archivo."
      };
    }

    const updatedData = { ...baseData };

    // 1. Parsear Ficha
    if (fichaSheetName) {
      const ws = wb.Sheets[fichaSheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
      if (rows.length > 0) {
        const first = rows[0];
        if (first.ficha_de_caracterizacion || first.ficha) {
          updatedData.ficha_de_caracterizacion = String(first.ficha_de_caracterizacion || first.ficha).trim();
        }
        if (first.programa) updatedData.programa = String(first.programa).trim();
        if (first.centro) updatedData.centro = String(first.centro).trim();
        if (first.denominacion) updatedData.denominacion = String(first.denominacion).trim();
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

    // 3. Parsear Aprendices
    let totalAprendices = updatedData.asistencias_aprendices.length;
    if (aprendicesSheetName) {
      const ws = wb.Sheets[aprendicesSheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
      if (rows.length > 0) {
        const newAprendices = rows
          .filter(r => (r.numero_documento || r.documento) && (r.nombres || r.nombre))
          .map(r => {
            const docNum = String(r.numero_documento || r.documento).trim();
            // Preservar asistencias previas si ya existía el aprendiz
            const existing = baseData.asistencias_aprendices.find(a => a.numero_documento === docNum);
            return {
              numero_documento: docNum,
              nombres: String(r.nombres || r.nombre).trim().toUpperCase(),
              apellidos: String(r.apellidos || r.apellido || "").trim().toUpperCase(),
              correo_electronico: String(r.correo_electronico || r.correo || "").trim().toLowerCase(),
              registros: existing ? existing.registros : {}
            };
          });

        if (newAprendices.length > 0) {
          updatedData.asistencias_aprendices = newAprendices as any;
          totalAprendices = newAprendices.length;
        }
      }
    }

    return {
      success: true,
      message: `Formato procesado con éxito: ${totalAprendices} aprendices y ${totalInstructores} instructores listos.`,
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
