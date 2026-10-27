import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, 
  Download, 
  ExternalLink, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Loader2,
  Table,
  Settings,
  ClipboardList,
  AlertTriangle
} from 'lucide-react';
import { getInstructorFromSession } from '../lib/authSession';
import { replaceFichaCompleteData, db } from '../lib/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { courseData as initialCourseData } from '../data';

// ==========================================
// TIPOS Y MOTOR DE VALIDACIÓN PREVIA (PRE-PARSING)
// ==========================================

export interface ParsedTemplateResult {
  success: boolean;
  message: string;
  errors?: string[];
  counts?: {
    aprendices: number;
    instructores: number;
  };
  data?: any;
}

const EMAIL_INSTRUCTOR_REGEX = /^[\w\.-]+@(sena\.edu\.co|misena\.edu\.co|gmail\.com)$/;
const EMAIL_APRENDIZ_REGEX = /^[\w\.-]+@[\w\.-]+\.\w+$/; // Permite cualquier proveedor para aprendices (Gmail, Hotmail, Outlook, Yahoo, etc.)

const ESTADOS_VALIDOS_MODAL = ['En Formación', 'Retiro Voluntario', 'Cancelado', 'Aplazado', 'Trasladado', 'Desercion', 'En formacion'];
const TIPOS_DOC_VALIDOS = ['CC', 'TI', 'CE', 'PP', 'PPT'];

const sanitizarTextoPreParser = (texto: string): string => {
  if (!texto) return '';
  const limpio = String(texto).trim().replace(/_/g, ' ');
  return limpio
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const procesarArchivoExcelPreParsing = async (file: File, instructoresExistentes: any[]): Promise<ParsedTemplateResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const errores: string[] = [];
        const instructoresProcesados: any[] = [];
        const aprendicesProcesados: any[] = [];

        // 1. Procesar Hoja 'Aprendices'
        const hojaAprendicesName = workbook.SheetNames.find(s => s.toLowerCase().includes('aprendiz')) || workbook.SheetNames[2] || workbook.SheetNames[0];
        const sheetAprendices = workbook.Sheets[hojaAprendicesName];
        if (sheetAprendices) {
          const rowsAprendices: any[] = XLSX.utils.sheet_to_json(sheetAprendices);
          rowsAprendices.forEach((row, index) => {
            const filaNum = index + 2;
            const nombres = sanitizarTextoPreParser(row['nombres'] || row['nombre'] || '');
            const apellidos = sanitizarTextoPreParser(row['apellidos'] || row['apellido'] || '');
            const tipoDoc = String(row['tipo_documento'] || row['tipo_doc'] || 'CC').trim().toUpperCase();
            const numDoc = String(row['numero_documento'] || row['documento'] || '').trim();
            const correo = String(row['correo_electronico'] || row['correo'] || row['email'] || '').trim().toLowerCase();
            const estadoRaw = String(row['estado'] || row['estado_aprendiz'] || 'En Formación').trim();
            const estado = estadoRaw === 'En formacion' ? 'En Formación' : estadoRaw;

            if (!TIPOS_DOC_VALIDOS.includes(tipoDoc)) {
              errores.push(`Fila ${filaNum} [Aprendiz]: Tipo de documento inválido: "${tipoDoc}".`);
            }
            if (!numDoc) {
              errores.push(`Fila ${filaNum} [Aprendiz]: El número de documento es obligatorio.`);
            }
            if (!ESTADOS_VALIDOS_MODAL.includes(estado)) {
              errores.push(`Fila ${filaNum} [Aprendiz]: Estado inválido o mal escrito: "${estado}".`);
            }
            if (correo && !EMAIL_APRENDIZ_REGEX.test(correo)) {
              errores.push(`Fila ${filaNum} [Aprendiz]: Estructura de correo electrónico inválida: "${correo}".`);
            }

            aprendicesProcesados.push({
              tipo_documento: tipoDoc,
              numero_documento: numDoc,
              nombres,
              apellidos,
              correo: correo,
              telefono: String(row['telefono'] || ''),
              estado: ESTADOS_VALIDOS_MODAL.includes(estado) ? (estado === 'En formacion' ? 'En Formación' : estado) : 'En Formación',
              registros: {}
            });
          });
        }

        // 2. Procesar Hoja 'Equipo_Ejecutor' (Instructores con validación estricta de dominios institucionales/Gmail)
        const hojaEquipoName = workbook.SheetNames.find(s => s.toLowerCase().includes('equipo') || s.toLowerCase().includes('instructor')) || workbook.SheetNames[1];
        const sheetEquipo = workbook.Sheets[hojaEquipoName];
        if (sheetEquipo) {
          const rowsEquipo: any[] = XLSX.utils.sheet_to_json(sheetEquipo);
          rowsEquipo.forEach((row, index) => {
            const filaNum = index + 2;
            const seleccionInstructor = String(row['nombre_del_instructor'] || row['nombre'] || '').trim();
            const correoGoogle = String(row['correo_google'] || '').trim().toLowerCase();
            const correoSena = String(row['correo_institucional_sena'] || row['correo_institucional'] || '').trim().toLowerCase();

            if (correoGoogle && !EMAIL_INSTRUCTOR_REGEX.test(correoGoogle)) {
              errores.push(`Fila ${filaNum} [Instructor]: El correo Google debe ser @gmail.com autorizado: "${correoGoogle}".`);
            }
            if (correoSena && !EMAIL_INSTRUCTOR_REGEX.test(correoSena)) {
              errores.push(`Fila ${filaNum} [Instructor]: El correo institucional debe ser @sena.edu.co o @misena.edu.co: "${correoSena}".`);
            }

            if (seleccionInstructor.toLowerCase().includes('instructor nuevo') || seleccionInstructor.includes('+ Instructor Nuevo')) {
              const docNuevo = String(row['nuevo_documento'] || row['numero_documento'] || '').trim();
              const nombreNuevo = sanitizarTextoPreParser(row['nuevo_nombre'] || row['nombre_del_instructor'] || '');

              if (!docNuevo || !nombreNuevo) {
                errores.push(`Fila ${filaNum} [Instructor]: Se seleccionó Instructor Nuevo pero faltan Documento o Nombre.`);
              }

              instructoresProcesados.push({
                numeroDocumento: docNuevo,
                nombreCompleto: nombreNuevo,
                correoSena: correoSena,
                correoGmail: correoGoogle,
                activo: true
              });
            } else if (seleccionInstructor) {
              const instructorEncontrado = instructoresExistentes.find(i => (i.nombreCompleto || i.nombre_del_instructor || '').toLowerCase() === seleccionInstructor.toLowerCase());
              if (!instructorEncontrado) {
                instructoresProcesados.push({
                  numeroDocumento: String(row['numero_documento'] || '000000'),
                  nombreCompleto: sanitizarTextoPreParser(seleccionInstructor),
                  correoSena: correoSena,
                  correoGmail: correoGoogle,
                  activo: true
                });
              } else {
                instructoresProcesados.push({
                  nombre_del_instructor: instructorEncontrado.nombreCompleto || instructorEncontrado.nombre_del_instructor,
                  correo_institucional_sena: instructorEncontrado.correoSena || instructorEncontrado.correo_institucional_sena,
                  correo_gmail: instructorEncontrado.correoGmail || instructorEncontrado.correo_gmail
                });
              }
            }
          });
        }

        if (errores.length > 0) {
          resolve({
            success: false,
            message: `Se encontraron ${errores.length} errores de validación en el archivo. Corríjalos e intente de nuevo.`,
            errors: errores
          });
        } else {
          resolve({
            success: true,
            message: "Archivo validado y sanitizado correctamente.",
            counts: {
              aprendices: aprendicesProcesados.length,
              instructores: instructoresProcesados.length
            },
            data: {
              ...initialCourseData,
              asistencias_aprendices: aprendicesProcesados,
              equipo_instructores: instructoresProcesados.length > 0 ? instructoresProcesados : initialCourseData.equipo_instructores
            }
          });
        }

      } catch (error: any) {
        resolve({
          success: false,
          message: `Error al procesar el archivo Excel: ${error.message || error.toString()}`
        });
      }
    };

    reader.readAsArrayBuffer(file);
  });
};

const displayAsDDMMYYYY = (dateStr: string) => {
  if (!dateStr) return "";
  let cleanStr = String(dateStr).trim().replace(/['"]/g, '');
  let parts: string[] = [];
  if (cleanStr.includes('/')) {
    parts = cleanStr.split('/');
  } else if (cleanStr.includes('-')) {
    parts = cleanStr.split('-');
  }

  if (parts.length === 3) {
    let p1 = parts[0].trim();
    let p2 = parts[1].trim();
    let p3 = parts[2].trim();

    if (p1.length === 4) {
      return `${String(p3).padStart(2, '0')}/${String(p2).padStart(2, '0')}/${p1}`;
    }

    if (p3.length === 4) {
      return `${String(p1).padStart(2, '0')}/${String(p2).padStart(2, '0')}/${p3}`;
    }
  }
  return cleanStr;
};

interface SheetsTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFicha: string;
  courseData: typeof initialCourseData;
  onDataLoaded: (newData: typeof initialCourseData, targetFichaId?: string) => void;
  currentUser?: any;
}

function mergeInstructorAttendance(
  currentCloudData: typeof initialCourseData,
  uploadedData: typeof initialCourseData,
  currentInstructorName: string,
  currentCompetencia: string
): typeof initialCourseData {
  const cloudFicha = String(currentCloudData.ficha_de_caracterizacion || '').trim();
  const uploadedFicha = String(uploadedData.ficha_de_caracterizacion || '').trim();
  
  const isDifferentFicha = uploadedFicha && cloudFicha && uploadedFicha !== cloudFicha;

  const baseData = isDifferentFicha ? {
    ...initialCourseData,
    ficha_de_caracterizacion: uploadedFicha,
    fechas_asistencia: [],
    fechas_por_instructor: {},
    asistencias_aprendices: uploadedData.asistencias_aprendices || []
  } : JSON.parse(JSON.stringify(currentCloudData));

  const rawFechasDelInstructor = uploadedData.fechas_por_instructor?.[currentInstructorName] 
    || uploadedData.fechas_asistencia 
    || [];
  
  const fechasSubidasInstructor = rawFechasDelInstructor.map((f: string) => displayAsDDMMYYYY(f));

  const mergedData = baseData;

  if (!mergedData.fechas_asistencia) {
    mergedData.fechas_asistencia = [];
  }

  const setFechasGenerales = new Set([...mergedData.fechas_asistencia, ...fechasSubidasInstructor]);
  mergedData.fechas_asistencia = Array.from(setFechasGenerales);

  if (!mergedData.fechas_por_instructor) {
    mergedData.fechas_por_instructor = {};
  }

  if (currentInstructorName) {
    const fechasPreviasInstructor = mergedData.fechas_por_instructor[currentInstructorName] || [];
    const setFechasInstructor = new Set([
      ...fechasPreviasInstructor.map((f: string) => displayAsDDMMYYYY(f)), 
      ...fechasSubidasInstructor
    ]);
    
    mergedData.fechas_por_instructor[currentInstructorName] = Array.from(setFechasInstructor);
  }

  if (!mergedData.asistencias_aprendices) {
    mergedData.asistencias_aprendices = [];
  }

  const opcionesValidas = ['Presente', 'X', 'Tarde', 'Excusa'];

  if (!isDifferentFicha) {
    mergedData.asistencias_aprendices = mergedData.asistencias_aprendices.map((cloudStudent: any) => {
      const uploadedStudent = uploadedData.asistencias_aprendices?.find(
        (s: any) => String(s.numero_documento).trim() === String(cloudStudent.numero_documento).trim()
      );

      if (!uploadedStudent) return cloudStudent;

      const cloudRegistros = { ...(cloudStudent.registros || {}) };
      const normalizedCloudRegistros: Record<string, string> = {};
      
      Object.keys(cloudRegistros).forEach(k => {
        normalizedCloudRegistros[displayAsDDMMYYYY(k)] = cloudRegistros[k];
      });

      fechasSubidasInstructor.forEach((fecha: string) => {
        const rawUploadedRegs = uploadedStudent.registros || {};
        let val = undefined;
        
        Object.keys(rawUploadedRegs).forEach(rk => {
          if (displayAsDDMMYYYY(rk) === fecha) {
            val = rawUploadedRegs[rk];
          }
        });

        const trimmedVal = val !== null && val !== undefined ? String(val).trim() : '';
        
        if (opcionesValidas.includes(trimmedVal) && trimmedVal !== 'Presente') {
          normalizedCloudRegistros[fecha] = trimmedVal;
        } else {
          if (!normalizedCloudRegistros[fecha]) {
            delete normalizedCloudRegistros[fecha];
          }
        }
      });

      return {
        ...cloudStudent,
        registros: normalizedCloudRegistros
      };
    });
  }

  return mergedData;
}

export function SheetsTemplateModal({
  isOpen,
  onClose,
  currentFicha,
  courseData,
  onDataLoaded,
  currentUser
}: SheetsTemplateModalProps) {
  const [activeTab, setActiveTab] = useState<'descargar' | 'estructura' | 'cargar'>('descargar');
  const [uploadType, setUploadType] = useState<'configuracion' | 'inasistencias' | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadResult, setUploadResult] = useState<ParsedTemplateResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Catálogo dinámico sincronizado en tiempo real con Firebase
  const [instructoresCatalogo, setInstructoresCatalogo] = useState<any[]>([]);

  useEffect(() => {
    const fetchInstructoresMaestros = async () => {
      try {
        const snap = await getDocs(collection(db, 'instructores_maestros'));
        const lista: any[] = [];
        snap.forEach(d => lista.push({ id: d.id, ...d.data() }));
        setInstructoresCatalogo(lista);
      } catch (e) {
        console.error("Error al obtener instructores maestros en tiempo real:", e);
      }
    };
    if (isOpen) {
      fetchInstructoresMaestros();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const instructorActual = getInstructorFromSession(currentUser || { email: localStorage.getItem('userEmail') }, courseData);

  const courseDataFiltradoPorInstructor = {
    ...courseData,
    equipo_instructores: [instructorActual],
    competencias: instructorActual.competencia ? [instructorActual.competencia] : courseData.competencias
  };

  // Generación de plantilla con datos en tiempo real de Firebase y Listas Desplegables de Excel (Data Validation)
  const handleDownloadTemplateWithRealtimeCatalog = (type: 'configuracion' | 'inasistencias') => {
    const wb = XLSX.utils.book_new();

    if (type === 'configuracion') {
      // 1. Hoja Ficha
      const wsFichaData = [
        ["ficha_de_caracterizacion", "denominacion", "centro", "fecha_inicio", "fecha_terminacion", "jornada"],
        [currentFicha, courseData.denominacion || "GESTIÓN ADMINISTRATIVA", courseData.centro || "Complejo Tecnológico Agroindustrial, Pecuario y Turístico", "", "", "Diurna"]
      ];
      const wsFicha = XLSX.utils.aoa_to_sheet(wsFichaData);
      XLSX.utils.book_append_sheet(wb, wsFicha, "Ficha");

      // 2. Hoja Equipo_Ejecutor con instructores de Firebase en tiempo real + Instructor Nuevo
      const nombresInstructores = instructoresCatalogo.map(i => i.nombreCompleto || i.nombre_del_instructor).filter(Boolean);
      if (nombresInstructores.length === 0) {
        nombresInstructores.push(instructorActual.nombre_del_instructor || "JORGE ALEXANDER SEPULVEDA");
      }
      nombresInstructores.push("[ + Instructor Nuevo ]");

      const wsEquipoData = [
        ["competencia", "nombre_del_instructor", "correo_google", "correo_institucional_sena", "dia", "rol", "fecha_de_inicio", "nuevo_documento", "nuevo_nombre"],
        [
          "Competencia General de Formación",
          nombresInstructores[0],
          "instructor@gmail.com",
          "instructor@sena.edu.co",
          "Viernes",
          "Instructor / Tutor",
          "20/01/2026",
          "", ""
        ]
      ];
      const wsEquipo = XLSX.utils.aoa_to_sheet(wsEquipoData);

      // Aplicar validación de lista desplegable en la columna de nombres de instructor (Columna B / Índice 1)
      const rangeEquipo = XLSX.utils.decode_range(wsEquipo['!ref'] || "A1:I2");
      wsEquipo['!dataValidation'] = wsEquipo['!dataValidation'] || [];
      wsEquipo['!dataValidation'].push({
        sqref: `B2:B${rangeEquipo.e.r + 100}`,
        type: 'list',
        formula1: `"${nombresInstructores.join(',')}"`
      });

      XLSX.utils.book_append_sheet(wb, wsEquipo, "Equipo_Ejecutor");

      // 3. Hoja Aprendices con listas desplegables para Tipo de Documento y Estado
      const wsAprendicesData = [
        ["tipo_documento", "numero_documento", "nombres", "apellidos", "correo_electronico", "telefono", "estado"],
        ["CC", "1001021491", "VALENTINA", "TORO SALGADO", "valencia@outlook.com", "3001234567", "En Formación"],
        ["CC", "1001153239", "JUAN JOSE", "CANO RUA", "juancano@gmail.com", "3007654321", "En Formación"]
      ];
      const wsAprendices = XLSX.utils.aoa_to_sheet(wsAprendicesData);
      
      const rangeAprendices = XLSX.utils.decode_range(wsAprendices['!ref'] || "A1:G3");
      wsAprendices['!dataValidation'] = wsAprendices['!dataValidation'] || [];
      // Lista desplegable para Tipo de Documento (Columna A)
      wsAprendices['!dataValidation'].push({
        sqref: `A2:A${rangeAprendices.e.r + 100}`,
        type: 'list',
        formula1: `"CC,TI,CE,PP,PPT"`
      });
      // Lista desplegable para Estado (Columna G)
      wsAprendices['!dataValidation'].push({
        sqref: `G2:G${rangeAprendices.e.r + 100}`,
        type: 'list',
        formula1: `"En Formación,Retiro Voluntario,Cancelado,Aplazado,Trasladado,Desercion"`
      });

      XLSX.utils.book_append_sheet(wb, wsAprendices, "Aprendices");
      XLSX.writeFile(wb, `Plantilla_Configuracion_Ficha_${currentFicha}.xlsx`);

    } else {
      // Plantilla de Inasistencias
      const wbInas = XLSX.utils.book_new();
      const aprendicesList = courseData.asistencias_aprendices || [];
      const rowsInas = [
        ["ficha_de_caracterizacion", "instructor_titular", "numero_documento", "nombres", "apellidos", "fecha_sesion", "estado_asistencia"],
        [currentFicha, instructorActual.nombre_del_instructor, "1001021491", "VALENTINA", "TORO SALGADO", "20/01/2026", "Presente"]
      ];
      const wsInas = XLSX.utils.aoa_to_sheet(rowsInas);
      XLSX.utils.book_append_sheet(wbInas, wsInas, "Inasistencias");
      XLSX.writeFile(wbInas, `Plantilla_Inasistencias_Ficha_${currentFicha}.xlsx`);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsParsing(true);
    setUploadResult(null);

    try {
      if (uploadType === 'configuracion') {
        const result = await procesarArchivoExcelPreParsing(file, instructoresCatalogo);
        setUploadResult(result);
      } else {
        const result = await (await import('../lib/templateGenerator')).parseUploadedTemplate(file, courseDataFiltradoPorInstructor);
        setUploadResult(result);
      }
    } catch (err: any) {
      console.error("Error al procesar plantilla Excel:", err);
      setUploadResult({
        success: false,
        message: `Error al procesar el archivo: ${err.message || err.toString()}`
      });
    } finally {
      setIsParsing(false);
    }
  };

  const handleApplyData = async () => {
    if (!uploadResult?.data) return;

    let excelFichaId = '';
  
    if (uploadResult.data.ficha_de_caracterizacion) {
      excelFichaId = String(uploadResult.data.ficha_de_caracterizacion).trim();
    }

    if ((!excelFichaId || excelFichaId === 'undefined' || excelFichaId === 'null') && selectedFile) {
      const match = selectedFile.name.match(/\b\d{7}\b/);
      if (match) {
        excelFichaId = match[0];
      }
    }

    if (!excelFichaId || excelFichaId === 'undefined' || excelFichaId === 'null') {
      excelFichaId = currentFicha;
    }

    setIsSaving(true);
    try {
      let finalDataToSave;

      if (uploadType === 'inasistencias') {
        const currentInstructorName = uploadResult.data.instructor_titular || instructorActual.nombre_del_instructor || "";
        const currentCompetencia = instructorActual.competencia || "";
        
        finalDataToSave = mergeInstructorAttendance(
          courseData,
          uploadResult.data,
          currentInstructorName,
          currentCompetencia
        );
      } else {
        finalDataToSave = {
          ...uploadResult.data,
          ficha_de_caracterizacion: excelFichaId
        };
      }

      finalDataToSave.ficha_de_caracterizacion = excelFichaId;

      // Registrar instructores nuevos ("Instructor Nuevo") en Firebase si aplica
      if (uploadType === 'configuracion' && uploadResult.data.equipo_instructores) {
        for (const inst of uploadResult.data.equipo_instructores) {
          if (inst.numeroDocumento && !instructoresCatalogo.some(existing => (existing.nombreCompleto || '').toLowerCase() === (inst.nombreCompleto || '').toLowerCase())) {
            try {
              await addDoc(collection(db, 'instructores_maestros'), {
                numeroDocumento: inst.numeroDocumento,
                nombreCompleto: inst.nombreCompleto,
                correoSena: inst.correoSena || '',
                correoGmail: inst.correoGmail || '',
                activo: true
              });
            } catch (err) {}
          }
        }
      }

      await replaceFichaCompleteData(finalDataToSave, excelFichaId);

      const refreshedData = JSON.parse(JSON.stringify(finalDataToSave));
      onDataLoaded(refreshedData, excelFichaId);
     
      const mensajeExito = uploadType === 'inasistencias' 
        ? `¡Inasistencias de la Ficha N° ${excelFichaId} cargadas y aplicadas con éxito!`
        : `¡Configuración general de la Ficha N° ${excelFichaId} actualizada con éxito mediante Pasarela de Validación Previa!`;

      alert(mensajeExito);
      onClose();

      setTimeout(() => {
        window.location.reload();
      }, 500);

    } catch (err: any) {
      console.error("Error al guardar en Firebase desde el modal:", err);
      alert(`Error al guardar en la base de datos: ${err.message || err.toString()}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Institucional */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-800 via-emerald-700 to-sena text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20 shadow-inner">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                Formato de Datos Google Sheets & Excel
              </h2>
              <p className="text-emerald-100 text-xs mt-0.5">
                Plantilla filtrada para: <strong className="text-white underline">{instructorActual.nombre_del_instructor}</strong> ({instructorActual.competencia || 'Competencia General'})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('descargar')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'descargar'
                ? 'border-sena text-sena bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-4 h-4" />
            Descargar y Abrir Formato
          </button>
          <button
            onClick={() => setActiveTab('estructura')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'estructura'
                ? 'border-sena text-sena bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Table className="w-4 h-4" />
            Estructura y Opciones Válidas
          </button>
          <button
            onClick={() => setActiveTab('cargar')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'cargar'
                ? 'border-sena text-sena bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            Cargar al Aplicativo
          </button>
        </div>

        {/* Tab Content Container */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          
          {/* TAB 1: DESCARGAR Y ABRIR */}
          {activeTab === 'descargar' && (
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-900 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-emerald-950">
                    Formato oficial con Catálogo en Tiempo Real y Listas Desplegables
                  </p>
                  <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                    Las plantillas descargadas consultan de forma síncrona los instructores vigentes en Firebase. Incluyen validación de datos en listas desplegables para tipos de documento, estados y nombres del equipo ejecutor.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-emerald-300 transition-all group">
                  <div>
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-base">
                      Plantilla Configuración General (.xlsx)
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      Estructura completa con listas desplegables y catálogo sincronizado de instructores.
                    </p>
                  </div>
                  <div className="mt-5">
                    <button
                      onClick={() => handleDownloadTemplateWithRealtimeCatalog('configuracion')}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-sena hover:bg-sena-dark text-white rounded-lg font-medium text-sm transition-colors shadow-sm cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      Descargar Plantilla con Catálogo Real
                    </button>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-blue-300 transition-all group">
                  <div>
                    <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
                      <ExternalLink className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-base">
                      Plantilla para Inasistencias (.xlsx)
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      Descarga el formato simplificado para registrar asistencia bajo las opciones permitidas.
                    </p>
                  </div>
                  <div className="mt-5">
                    <button
                      onClick={() => handleDownloadTemplateWithRealtimeCatalog('inasistencias')}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      Descargar Formato Inasistencias
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ESTRUCTURA Y OPCIONES */}
          {activeTab === 'estructura' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs p-5 space-y-4">
                <h4 className="font-bold text-sm text-slate-800">Reglas y Opciones Válidas</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Para mantener la integridad de la base de datos, la pasarela de validación previa aplica filtros estrictos en los correos de instructores y permite flexibilidad en correos de aprendices.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-semibold">
                  <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 text-center">
                    Presente
                  </div>
                  <div className="p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 text-center">
                    X (Inasistencia)
                  </div>
                  <div className="p-3 bg-amber-50 text-amber-700 rounded-lg border border-amber-200 text-center">
                    Tarde (Retardo)
                  </div>
                  <div className="p-3 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 text-center">
                    Excusa (Justificada)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CARGAR AL APLICATIVO */}
          {activeTab === 'cargar' && (
            <div className="space-y-5">
              {!uploadType ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div 
                    onClick={() => setUploadType('configuracion')}
                    className="bg-white p-6 rounded-xl border-2 border-slate-200 hover:border-emerald-600 cursor-pointer transition-all shadow-sm flex flex-col items-center text-center group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Settings className="w-7 h-7" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-base">Cargar Configuración General (Pre-Parsing)</h3>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                      Actualiza la estructura base, aprendices e instructores con semáforo de errores en tiempo real.
                    </p>
                  </div>

                  <div 
                    onClick={() => setUploadType('inasistencias')}
                    className="bg-white p-6 rounded-xl border-2 border-slate-200 hover:border-emerald-600 cursor-pointer transition-all shadow-sm flex flex-col items-center text-center group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <ClipboardList className="w-7 h-7" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-base">Cargar Registro de Inasistencias</h3>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                      Actualiza únicamente las novedades de asistencia marcadas en el formato simplificado para tu competencia.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl">
                    <span className="text-xs font-bold text-emerald-900">
                      Modo seleccionado: {uploadType === 'configuracion' ? '⚙️ Configuración General (Pasarela Pre-Parsing)' : `📋 Registro de Inasistencias (${instructorActual.nombre_del_instructor})`}
                    </span>
                    <button 
                      onClick={() => { setUploadType(null); setSelectedFile(null); setUploadResult(null); }}
                      className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
                    >
                      Cambiar modo
                    </button>
                  </div>

                  <div className="bg-white p-6 rounded-xl border border-slate-200 text-center space-y-4 shadow-xs">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                      <Upload className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-800">
                        Selecciona tu archivo Excel (.xlsx) diligenciado
                      </h3>
                      <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                        Ficha activa actual: <strong>{currentFicha}</strong> | Instructor: <strong>{instructorActual.nombre_del_instructor}</strong>
                      </p>
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".xlsx, .xls"
                      className="hidden"
                    />

                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isParsing}
                        className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
                      >
                        {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {selectedFile ? 'Cambiar archivo' : 'Elegir archivo (.xlsx)'}
                      </button>
                      {selectedFile && (
                        <button
                          onClick={() => {
                            setSelectedFile(null);
                            setUploadResult(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="px-4 py-2.5 text-xs text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
                        >
                          Limpiar
                        </button>
                      )}
                    </div>

                    {selectedFile && (
                      <p className="text-xs text-slate-600 font-mono bg-slate-50 py-1.5 px-3 rounded-md inline-block border border-slate-200">
                        Archivo seleccionado: <strong>{selectedFile.name}</strong> ({Math.round(selectedFile.size / 1024)} KB)
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Resultado de la validación */}
              {uploadResult && (
                <div className={`p-5 rounded-xl border ${uploadResult.success ? 'bg-emerald-50/70 border-emerald-200' : 'bg-red-50/70 border-red-200'} space-y-4`}>
                  <div className="flex items-start gap-3">
                    {uploadResult.success ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h4 className={`text-sm font-bold ${uploadResult.success ? 'text-emerald-950' : 'text-red-950'}`}>
                        {uploadResult.success ? '¡Archivo validado correctamente!' : 'Error en la validación'}
                      </h4>
                      <p className={`text-xs mt-0.5 ${uploadResult.success ? 'text-emerald-800' : 'text-red-800'}`}>
                        {uploadResult.message}
                      </p>
                    </div>
                  </div>

                  {!uploadResult.success && uploadResult.errors && (
                    <div className="bg-white p-3 rounded-lg border border-red-100 max-h-40 overflow-y-auto space-y-1 text-xs text-red-700 font-medium">
                      {uploadResult.errors.map((errStr, idx) => (
                        <div key={idx} className="border-b border-red-50 pb-1 last:border-0">
                          {errStr}
                        </div>
                      ))}
                    </div>
                  )}

                  {uploadResult.success && uploadResult.counts && (
                    <div className="grid grid-cols-2 gap-3 bg-white p-3.5 rounded-lg border border-emerald-100 text-xs">
                      <div>
                        <span className="text-slate-400 block font-medium">Ficha detectada:</span>
                        <span className="font-bold text-slate-800 text-sm">
                          {uploadResult.data?.ficha_de_caracterizacion || currentFicha}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Total Aprendices:</span>
                        <span className="font-bold text-emerald-700 text-sm">
                          {uploadResult.counts.aprendices} alumnos
                        </span>
                      </div>
                    </div>
                  )}

                  {uploadResult.success && (
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={handleApplyData}
                        disabled={isSaving}
                        className="px-5 py-2.5 bg-sena hover:bg-sena-dark text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm disabled:opacity-60 cursor-pointer"
                      >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        {isSaving ? 'Sincronizando con la nube...' : 'Confirmar y Actualizar Aplicativo'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-100/80 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Instructor Titular: <strong className="text-slate-700">{instructorActual.nombre_del_instructor}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-md font-medium transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
