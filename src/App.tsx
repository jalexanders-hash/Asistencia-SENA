import React, { useMemo, useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { courseData as initialCourseData } from './data';
import { subscribeToFichaData, saveAttendanceData, updateFichaCompleteData } from './lib/firebase';
import { SheetsTemplateModal } from './components/SheetsTemplateModal';
import ExportReportModal from './components/ExportReportModal';
import { auth, db } from "./lib/firebase";
import { collection, getDocs, addDoc, serverTimestamp, doc, setDoc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { Login } from "./components/Login";
import { getUserSystemRole } from './lib/securityRoles';
import { getInstructorFromSession } from './lib/authSession';
import { 
  Users, 
  XCircle,
  Clock,
  AlertCircle,
  Search,
  AlertTriangle,
  Loader2,
  ClipboardList,
  FileSpreadsheet,
  Bell,
  CheckCircle2,
  Layers,
  X,
  LayoutDashboard,
  Printer,
  Copy,
  Check,
  Wifi,
  WifiOff,
  BookOpen,
  UserPlus,
  LogOut,
  Edit3,
  Save,
  ShieldAlert
} from 'lucide-react';

const LOGO_SENA_SVG = `data:image/svg+xml,%3c?xml%20version=%271.0%27%20encoding=%27utf-8%27?%3e%3c!--%20Generator:%20Adobe%20Illustrator%2026.0.1,%20SVG%20Export%20Plug-In%20.%20SVG%20Version:%206.00%20Build%200)%20--%3e%3csvg%20version=%271.1%27%20id=%27Capa_1%27%20xmlns=%27http://www.w3.org/2000/svg%27%20xmlns:xlink=%27http://www.w3.org/1999/xlink%27%20x=%270px%27%20y=%270px%27%20viewBox=%270%200%201000%201000%27%20style=%27enable-background:new%200%200%201000%201000;%27%20xml:space=%27preserve%27%3e%3cstyle%20type=%27text/css%27%3e%20.st0{fill:%2339a900;}%20%3c/style%3e%3cpath%20id=%27path47-5%27%20class=%27st0%27%20d=%27M504.2,20.5c-58.3,0.1-105.6,47.4-105.5,105.8c0.1,58.3,47.4,105.6,105.7,105.6%20c58.3,0,105.6-47.3,105.6-105.7V126C609.9,67.6,562.6,20.4,504.2,20.5z%20M155.6,264.6c-18.6,0.1-37.5,1.1-55.2,5.6%20c-11.7,3-23,7.8-30.3,15.4c-9.2,9.5-10.4,22.3-5.9,33.3c4,9.7,14.8,16.9,26.8,21.1c25.9,8.9,54.6,10.7,81.8,16.3%20c5,1.2,10.6,2.6,13.7,6c3.2,4.1,1.3,9.7-4,12.2c-8.8,4.5-20.1,4.5-30.4,4.4c-9.4-0.4-19.7-1.2-27.2-5.9c-5.5-3.4-6.5-9.1-5.2-14.1%20l-60.6,0c-0.2,9.2,1.6,18.9,8.4,26.8c5.6,6.8,14.8,11.5,24.6,14.4c15.7,4.6,32.7,6,49.4,6.4c22.7,0.4,45.8-0.3,67.6-5.4%20c13-3.2,25.8-8.3,34.1-16.6c14.8-14.8,11.3-38.3-8.3-49.8c-9.8-5.7-21.5-9.2-33.4-11.5c-17.5-3.6-35.3-6.3-52.9-9.2%20c-6.2-1.2-12.8-2.3-18-5.2c-5.5-2.9-5.9-9.8-0.3-12.9c7.2-4.1,16.8-4,25.4-4c9.1,0.2,19,0.7,26.5,5c4.2,2.3,5.9,6.3,5.9,10.1%20l57.6-0.1c-0.2-7.3-1.6-14.9-6.9-21.2c-6.2-7.8-17.1-12.7-28.3-15.5C192.8,265.6,174.1,264.7,155.6,264.6L155.6,264.6z%20M280.6,268.9%20l0,137.7l168.1,0l0-30H342.3v-26.7h94.9v-29.3h-94.9l0-21.9l102.6,0l-0.1-29.7L280.6,268.9z%20M557.5,269c0,0-51.9,0-77.9,0l0,137.7%20l59,0l0-92.7l80.8,92.6l81,0.1l0-137.7l-59.1,0l0.1,92L557.5,269z%20M805.6,269.2c0,0-63.6,91.9-95.6,137.7l61.9,0l14.9-24.8h95.7%20l13.9,24.9l68.8,0L874,269.2L805.6,269.2z%20M836.6,302.1l29.4,49.9l-60.7,0.1L836.6,302.1z%20M10.6,445.6l0.5,75l280.1-1%20c14.3,3.1,22.6,12.4,19.7,33.5L138.6,854.7l56.1,52.5l266.9-461.6L10.6,445.6z%20M545.2,446.2l262.4,459.6l58-52.1L691.3,552.9%20c-2.9-21.2,5.4-30.6,19.7-33.7l280.2,1l-0.1-73.7L545.2,446.2z%20M500.9,522.3L254.8,944.7l65.4,31.9L484.4,699%20c5.7-4.6,11.4-7.1,17.1-7.3c6-0.2,12.2,2,18.3,6.8l163.8,278.4l67.4-35.2L500.9,522.3z%27/%3e%3cg%20id=%27_x23_000000ff-2%27%20transform=%27matrix(0.31570611,0,0,0.23560774,-391.49698,-10.601126)%27%3e%3c/g%3e%3c/svg%3e`;

const ADMIN_EMAIL = "jalexanders@gmail.com";

// ==========================================
// MÓDULO DE HABEAS DATA Y PRE-PARSING DE EXCEL
// ==========================================

export interface InstructorMaestro {
  id?: string;
  numeroDocumento: string;
  nombreCompleto: string;
  correoSena: string;
  correoGmail: string;
  activo: boolean;
}

export interface ValidationError {
  fila: number;
  seccion: 'Ficha' | 'Instructor' | 'Aprendiz';
  campo: string;
  mensaje: string;
}

export interface ParseResult {
  valido: boolean;
  errores: ValidationError[];
  instructores: InstructorMaestro[];
  aprendices: any[];
}

const EMAIL_REGEX = /^[\w\.-]+@(sena\.edu\.co|misena\.edu\.co|gmail\.com)$/;
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

export const procesarArchivoExcelPreParsing = async (file: File, instructoresExistentes: InstructorMaestro[]): Promise<ParseResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const errores: ValidationError[] = [];
        const instructoresProcesados: InstructorMaestro[] = [];
        const aprendicesProcesados: any[] = [];

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
            const correo = sanitizarEmail(row['correo_electronico'] || row['correo'] || row['email'] || '');
            const estadoRaw = String(row['estado'] || row['estado_aprendiz'] || 'En Formación').trim();
            const estado = estadoRaw === 'En formacion' ? 'En Formación' : estadoRaw;

            if (!TIPOS_DOC_VALIDOS.includes(tipoDoc)) {
              errores.push({ fila: filaNum, seccion: 'Aprendiz', campo: 'tipo_documento', mensaje: `Tipo de documento inválido: "${tipoDoc}".` });
            }
            if (!numDoc) {
              errores.push({ fila: filaNum, seccion: 'Aprendiz', campo: 'numero_documento', mensaje: `El número de documento es obligatorio.` });
            }
            if (!ESTADOS_VALIDOS_MODAL.includes(estado)) {
              errores.push({ fila: filaNum, seccion: 'Aprendiz', campo: 'estado', mensaje: `Estado inválido o mal escrito: "${estado}". Use la lista desplegable.` });
            }
            if (correo && !EMAIL_REGEX.test(correo)) {
              errores.push({ fila: filaNum, seccion: 'Aprendiz', campo: 'correo_electronico', mensaje: `Dominio de correo no permitido: "${correo}".` });
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

        const hojaEquipoName = workbook.SheetNames.find(s => s.toLowerCase().includes('equipo') || s.toLowerCase().includes('instructor')) || workbook.SheetNames[1];
        const sheetEquipo = workbook.Sheets[hojaEquipoName];
        if (sheetEquipo) {
          const rowsEquipo: any[] = XLSX.utils.sheet_to_json(sheetEquipo);
          rowsEquipo.forEach((row, index) => {
            const filaNum = index + 2;
            const seleccionInstructor = String(row['nombre_del_instructor'] || row['nombre'] || '').trim();

            if (seleccionInstructor.toLowerCase().includes('instructor nuevo') || seleccionInstructor.includes('+ Instructor Nuevo')) {
              const docNuevo = String(row['nuevo_documento'] || row['numero_documento'] || '').trim();
              const nombreNuevo = sanitizarTextoPreParser(row['nuevo_nombre'] || row['nombre_del_instructor'] || '');
              const correoSenaNuevo = sanitizarEmail(row['nuevo_correo_sena'] || row['correo_sena'] || '');
              const correoGmailNuevo = sanitizarEmail(row['nuevo_correo_gmail'] || row['correo_gmail'] || '');

              if (!docNuevo || !nombreNuevo) {
                errores.push({ fila: filaNum, seccion: 'Instructor', campo: 'Instructor Nuevo', mensaje: `Se seleccionó Instructor Nuevo pero faltan Documento o Nombre.` });
              }
              if (correoSenaNuevo && !EMAIL_REGEX.test(correoSenaNuevo)) {
                errores.push({ fila: filaNum, seccion: 'Instructor', campo: 'nuevo_correo_sena', mensaje: `Correo SENA inválido para nuevo instructor: "${correoSenaNuevo}".` });
              }

              instructoresProcesados.push({
                numeroDocumento: docNuevo,
                nombreCompleto: nombreNuevo,
                correoSena: correoSenaNuevo,
                correoGmail: correoGmailNuevo,
                activo: true
              });
            } else if (seleccionInstructor) {
              const instructorEncontrado = instructoresExistentes.find(i => i.nombreCompleto.toLowerCase() === seleccionInstructor.toLowerCase());
              if (!instructorEncontrado) {
                instructoresProcesados.push({
                  numeroDocumento: String(row['numero_documento'] || '000000'),
                  nombreCompleto: sanitizarTextoPreParser(seleccionInstructor),
                  correoSena: sanitizarEmail(row['correo_institucional_sena'] || row['correo'] || ''),
                  correoGmail: sanitizarEmail(row['correo_gmail'] || ''),
                  activo: true
                });
              } else {
                instructoresProcesados.push(instructorEncontrado);
              }
            }
          });
        }

        resolve({
          valido: errores.length === 0,
          errores,
          instructores: instructoresProcesados,
          aprendices: aprendicesProcesados
        });

      } catch (error) {
        resolve({
          valido: false,
          errores: [{ fila: 0, seccion: 'Ficha', campo: 'Archivo', mensaje: 'Error al leer el archivo Excel. Verifique que el formato sea correcto.' }],
          instructores: [],
          aprendices: []
        });
      }
    };

    reader.readAsArrayBuffer(file);
  });
};

export const HabeasDataModalComponent: React.FC<{ userUid: string; userEmail: string }> = ({ userUid, userEmail }) => {
  const [requiereAceptacion, setRequiereAceptacion] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const verificarConsentimiento = async () => {
      if (!userUid) return;
      try {
        const ref = doc(db, 'consentimientos_habeas_data', userUid);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          setRequiereAceptacion(true);
        }
      } catch (e) {
        const localConsent = localStorage.getItem(`habeas_data_${userUid}`);
        if (!localConsent) setRequiereAceptacion(true);
      }
      setCargando(false);
    };
    verificarConsentimiento();
  }, [userUid]);

  const handleAceptar = async () => {
    try {
      const ref = doc(db, 'consentimientos_habeas_data', userUid);
      await setDoc(ref, {
        uid: userUid,
        email: userEmail,
        timestamp: new Date().toISOString(),
        leyAplicada: 'Ley 1581 de 2012 - Colombia'
      });
    } catch (e) {}
    localStorage.setItem(`habeas_data_${userUid}`, 'true');
    setRequiereAceptacion(false);
  };

  if (cargando || !requiereAceptacion) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-lg w-full p-6 rounded-2xl shadow-2xl space-y-4 border border-slate-200">
        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          🛡️ Política de Tratamiento de Datos (Habeas Data)
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          De conformidad con la <strong>Ley 1581 de 2012</strong> de protección de datos personales en Colombia, le informamos que los datos recolectados en esta aplicación académica interna serán tratados exclusivamente para fines de gestión de asistencia, control pedagógico y seguimiento de fichas de caracterización.
        </p>
        <p className="text-xs text-slate-600">
          Usted tiene derecho a conocer, actualizar y rectificar sus datos personales. Al hacer clic en "Aceptar", otorga su autorización expresa para el tratamiento de su información.
        </p>
        <button
          onClick={handleAceptar}
          className="w-full bg-[#39a900] text-white py-3 rounded-xl font-bold hover:bg-[#329600] transition cursor-pointer shadow-md text-sm"
        >
          Acepto los Términos y Autorizo el Tratamiento
        </button>
      </div>
    </div>
  );
};

export const FileUploaderPasarelaSection: React.FC<{ currentFichaId: string; onDataLoaded: (data: any, fichaId: string) => void }> = ({ currentFichaId, onDataLoaded }) => {
  const [analizando, setAnalizando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [resultadoParse, setResultadoParse] = useState<ParseResult | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAnalizando(true);
      let instructoresCatalogo: InstructorMaestro[] = [];
      try {
        const snap = await getDocs(collection(db, 'instructores_maestros'));
        snap.forEach(d => instructoresCatalogo.push(d.data() as InstructorMaestro));
      } catch (err) {}

      const resultado = await procesarArchivoExcelPreParsing(file, instructoresCatalogo);
      setResultadoParse(resultado);
      setAnalizando(false);
    }
  };

  const handleCommit = async () => {
    if (!resultadoParse || !resultadoParse.valido) return;
    setGuardando(true);
    try {
      for (const inst of resultadoParse.instructores) {
        if (!inst.id && inst.numeroDocumento) {
          try {
            await addDoc(collection(db, 'instructores_maestros'), inst);
          } catch (e) {}
        }
      }

      const baseData = {
        ficha_de_caracterizacion: currentFichaId,
        denominacion: "GESTIÓN ADMINISTRATIVA",
        centro: "Complejo Tecnológico Agroindustrial, Pecuario y Turístico",
        asistencias_aprendices: resultadoParse.aprendices,
        equipo_instructores: resultadoParse.instructores.map(i => ({
          nombre_del_instructor: i.nombreCompleto,
          correo_institucional_sena: i.correoSena,
          correo_gmail: i.correoGmail,
          competencia: "Competencia General Formación",
          dia: "Viernes",
          rol: "Instructor / Tutor"
        }))
      };

      await updateFichaCompleteData(baseData, currentFichaId);
      onDataLoaded(baseData, currentFichaId);
      alert("¡Cargue validado y exitoso! Los datos se han guardado depurados.");
      setResultadoParse(null);
    } catch (e) {
      alert("Error al guardar en base de datos.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="p-5 bg-white rounded-xl border border-emerald-200 shadow-sm space-y-4 my-4">
      <div className="flex items-center gap-2">
        <span className="p-2 bg-emerald-100 text-[#39a900] rounded-lg font-bold">🛡️</span>
        <div>
          <h4 className="font-bold text-slate-800 text-sm">Pasarela de Validación Previa (Pre-Parsing) & Catálogo Dinámico</h4>
          <p className="text-xs text-slate-500">Sube tu archivo Excel con validación estricta, sanitización automática y soporte para "[ + Instructor Nuevo ]".</p>
        </div>
      </div>

      <input 
        type="file" 
        accept=".xlsx, .xls" 
        onChange={handleFileChange}
        className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-[#39a900] hover:file:bg-emerald-100 cursor-pointer"
      />

      {analizando && <p className="text-xs text-blue-600 animate-pulse font-medium">Analizando y sanitizando archivo en memoria...</p>}

      {resultadoParse && (
        <div className="mt-3">
          {resultadoParse.valido ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-emerald-800 font-bold text-xs block">🟢 Archivo Aprobado y Limpio</span>
                <p className="text-[11px] text-emerald-600">{resultadoParse.aprendices.length} aprendices y {resultadoParse.instructores.length} instructores validados.</p>
              </div>
              <button 
                onClick={handleCommit}
                disabled={guardando}
                className="bg-[#39a900] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#329600] transition cursor-pointer"
              >
                {guardando ? 'Guardando...' : 'Confirmar e Importar'}
              </button>
            </div>
          ) : (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-2">
              <span className="text-red-800 font-bold text-xs block">🔴 Archivo Rechazado (Errores Encontrados)</span>
              <ul className="max-h-40 overflow-y-auto space-y-1 text-[11px]">
                {resultadoParse.errores.map((err, idx) => (
                  <li key={idx} className="bg-white p-1.5 rounded border border-red-100 text-red-700">
                    <strong>Fila {err.fila}</strong> [{err.seccion} - {err.campo}]: {err.mensaje}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export type EstadoAprendiz = 
  | 'En Formación' 
  | 'Retiro Voluntario' 
  | 'Cancelado' 
  | 'Aplazado' 
  | 'Trasladado' 
  | 'Desercion';

export type TipoMovimiento = 
  | 'Ingreso_Nuevo' 
  | 'Reingreso' 
  | 'Traslado_Entrada' 
  | 'Traslado_Salida' 
  | 'Ninguno';

export interface Aprendiz {
  tipo_documento?: string;
  numero_documento: string;
  nombres: string;
  apellidos: string;
  correo?: string;
  telefono?: string;
  estado?: EstadoAprendiz;
  fecha_ingreso?: string;
  fecha_novedad?: string;
  tipo_movimiento?: TipoMovimiento;
  observacion_novedad?: string;
  registros: Record<string, string>;
}

export const sanitizarEmail = (email: string): string => {
  if (!email) return "";
  return String(email).trim().toLowerCase();
};

export const sanitizarDocumento = (doc: string): string => {
  if (!doc) return "";
  return String(doc).trim().replace(/[.,\s]/g, '');
};

export const sanitizarTextoNombre = (texto: string): string => {
  if (!texto) return "";
  return String(texto).trim().replace(/\s+/g, ' ').toUpperCase();
};

export const canUserEditFicha = (user: User | null, equipoInstructores: any[] = []): boolean => {
  const role = getUserSystemRole(user, equipoInstructores);
  return role === 'ADMIN' || role === 'COORDINADOR' || role === 'INSTRUCTOR_LIDER' || role === 'INSTRUCTOR';
};

export const canManageFichasAndSheets = (user: User | null, equipoInstructores: any[] = []): boolean => {
  const role = getUserSystemRole(user, equipoInstructores);
  return role === 'ADMIN' || role === 'COORDINADOR' || role === 'INSTRUCTOR_LIDER' || role === 'INSTRUCTOR';
};

export const normalizarListadoAprendices = (courseData: any, externalStudents?: any[]): any[] => {
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

  const mapaUnico = new Map<string, any>();

  rawList
    .filter((item: any) => item && typeof item === 'object')
    .forEach((item: any) => {
      const doc = sanitizarDocumento(item.numero_documento || item.documento || item.identificacion || item.cedula || "");
      const nombres = sanitizarTextoNombre(item.nombres || item.nombre || item.first_name || "");
      const apellidos = sanitizarTextoNombre(item.apellidos || item.apellido || item.last_name || "");
      const tipoDoc = String(item.tipo_documento || item.tipo_doc || "CC").trim().toUpperCase();
      const correo = sanitizarEmail(item.correo_electronico || item.correo || item.email || "");
      const telefono = String(item.telefono || item.celular || item.phone || "").trim();
      const estado = String(item.estado || item.estado_aprendiz || "En Formación").trim();
      const registros = (item.registros && typeof item.registros === 'object') ? item.registros : {};

      if (doc !== "" || nombres !== "") {
        const claveUnica = doc !== "" ? doc : `${nombres}_${apellidos}`;
        
        if (!mapaUnico.has(claveUnica)) {
          mapaUnico.set(claveUnica, {
            ...item,
            tipo_documento: tipoDoc,
            numero_documento: doc,
            nombres: nombres,
            apellidos: apellidos,
            correo: correo,
            telefono: telefono,
            estado: estado === 'En formación' ? 'En Formación' : estado,
            registros
          });
        }
      }
    });

  return Array.from(mapaUnico.values());
};

export type TipoAccionAuditoria = 
  | 'REGISTRAR_ASISTENCIA' 
  | 'MODIFICAR_ASISTENCIA' 
  | 'REEMPLAZAR_INSTRUCTOR' 
  | 'MODIFICAR_FICHA'
  | 'INCORPORAR_APRENDIZ'
  | 'REGISTRAR_NOVEDAD_SALIDA'
  | 'ELIMINAR_REGISTRO';

export const registrarLogAuditoria = async (
  fichaId: string,
  correoUsuario: string,
  tipoAccion: TipoAccionAuditoria,
  detalles: string,
  valorAnterior?: any,
  valorNuevo?: any
): Promise<void> => {
  try {
    const fechaHoraColombia = new Date().toLocaleString("es-CO", {
      timeZone: "America/Bogota",
      dateStyle: "full",
      timeStyle: "medium"
    });

    const logData = {
      ficha_id: fichaId,
      correo_usuario: sanitizarEmail(correoUsuario),
      tipo_accion: tipoAccion,
      detalles: detalles,
      valor_anterior: valorAnterior ? JSON.stringify(valorAnterior) : null,
      valor_nuevo: valorNuevo ? JSON.stringify(valorNuevo) : null,
      fecha_hora_colombia: fechaHoraColombia,
      timestamp_server: serverTimestamp()
    };

    await addDoc(collection(db, "logs_auditoria"), logData);
  } catch (error) {
    console.error("Error crítico al registrar la auditoría de seguridad:", error);
  }
};

export const generarBackupGlobalFichas = (fichasMap: any, userEmail: string) => {
  try {
    const fechaActual = new Date().toISOString().split('T')[0];
    const horaColombia = new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" });

    const backupPayload = {
      version: "2.1",
      sistema: "SENA - Gestión Académica y Asistencia",
      autor_respaldo: sanitizarEmail(userEmail),
      fecha_hora_colombia: horaColombia,
      total_fichas: Object.keys(fichasMap).length,
      data_fichas: fichasMap
    };

    const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `SENA_Backup_General_${fechaActual}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error al generar el respaldo de seguridad:", error);
    alert("Hubo un error al generar la copia de seguridad.");
  }
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

const parseDateForSorting = (dateStr: string) => {
  if (!dateStr) return new Date(0);
  const formatted = displayAsDDMMYYYY(dateStr);
  const parts = formatted.split('/');
  if (parts.length === 3) {
    const day = Number(parts[0]);
    const month = Number(parts[1]) - 1;
    const year = Number(parts[2]);
    return new Date(year, month, day);
  }
  return new Date(dateStr);
};

const formatDateForData = (dateString: string) => {
  if (!dateString) return "";
  let cleanStr = String(dateString).trim();
  if (cleanStr.includes('-')) {
    const parts = cleanStr.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      const [year, month, day] = parts;
      return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
    }
  }
  return displayAsDDMMYYYY(cleanStr);
};

const sanitizeFicha = (ficha: any, fichaId: string) => {
  const base = JSON.parse(JSON.stringify(initialCourseData));
  
  if (!ficha || typeof ficha !== 'object') {
    return { 
      ...base, 
      ficha_de_caracterizacion: fichaId
    };
  }

  const instructoresSeguros = Array.isArray(ficha.equipo_instructores) && ficha.equipo_instructores.length > 0
    ? ficha.equipo_instructores.map((inst: any) => ({
        ...inst,
        nombre_del_instructor: sanitizarTextoNombre(inst.nombre_del_instructor || inst.nombre || ''),
        correo_gmail: sanitizarEmail(inst.correo_gmail || ''),
        correo_institucional: sanitizarEmail(inst.correo_institucional || inst.correo_institucional_sena || inst.correo || ''),
        correo_institucional_sena: sanitizarEmail(inst.correo_institucional || inst.correo_institucional_sena || inst.correo || ''),
        correo: sanitizarEmail(inst.correo || inst.correo_gmail || '')
      }))
    : (base.equipo_instructores || []);

  const aprendicesSeguros = normalizarListadoAprendices(ficha).map((a: any) => {
    const registrosNormalizados: Record<string, string> = {};
    const regs = a.registros || {};
    Object.keys(regs).forEach(fechaKey => {
      const nuevaFechaKey = displayAsDDMMYYYY(fechaKey);
      registrosNormalizados[nuevaFechaKey] = regs[fechaKey];
    });
    return { 
      ...a, 
      tipo_documento: a.tipo_documento || 'CC',
      telefono: a.telefono || '',
      estado: a.estado || 'En Formación',
      tipo_movimiento: a.tipo_movimiento || 'Ninguno',
      fecha_ingreso: a.fecha_ingreso || '',
      fecha_novedad: a.fecha_novedad || '',
      observacion_novedad: a.observacion_novedad || '',
      registros: registrosNormalizados 
    };
  });

  const finalAprendices = aprendicesSeguros.length > 0 ? aprendicesSeguros : (base.asistencias_aprendices || []);

  return {
    ...base,
    ...ficha,
    ficha_de_caracterizacion: fichaId,
    equipo_instructores: instructoresSeguros,
    asistencias_aprendices: finalAprendices,
    fechas_asistencia: Array.isArray(ficha.fechas_asistencia) ? ficha.fechas_asistencia.map((d: string) => displayAsDDMMYYYY(d)) : [],
    competencias: Array.isArray(ficha.competencias) ? ficha.competencias : [],
    aprendices: finalAprendices
  };
};

export default function App() {
  const [currentFichaId, setCurrentFichaId] = useState<string>("3235418");
  
  const [fichasDataMap, setFichasDataMap] = useState<Record<string, any>>(() => {
    const saved = localStorage.getItem('sena_all_fichas_database');
    if (saved) {
      try {
        const parsedMap = JSON.parse(saved);
        const sanitizedMap: Record<string, any> = {};
        Object.keys(parsedMap).forEach(key => {
          sanitizedMap[key] = sanitizeFicha(parsedMap[key], key);
        });
        return sanitizedMap;
      } catch (e) {}
    }
    return {
      "3235418": sanitizeFicha(initialCourseData, "3235418"),
      "3311566": sanitizeFicha(initialCourseData, "3311566")
    };
  });

  useEffect(() => {
    const fetchAllFichasFromCloud = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "fichas"));
        const cloudFichasMap: Record<string, any> = {};

        querySnapshot.forEach((docSnap) => {
          const fichaId = docSnap.id;
          const fichaData = docSnap.data();
          cloudFichasMap[fichaId] = sanitizeFicha(fichaData, fichaId);
        });

        if (Object.keys(cloudFichasMap).length > 0) {
          setFichasDataMap(prev => {
            const merged = { ...prev, ...cloudFichasMap };
            localStorage.setItem('sena_all_fichas_database', JSON.stringify(merged));
            return merged;
          });
        }
      } catch (error) {
        console.error("Error al descargar todas las fichas de Firestore:", error);
      }
    };

    fetchAllFichasFromCloud();
  }, []);

  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState('');

  const [mainView, setMainView] = useState<'listado' | 'tablero'>('listado');
  const [activeTab, setActiveTab] = useState<'ficha' | 'asistencia' | 'novedades' | 'reportes' | 'instructores'>('asistencia');
  const [limiteInasistencias, setLimiteInasistencias] = useState<number>(1);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);

  const [instructorFiltroReporte, setInstructorFiltroReporte] = useState<string>('todos');
  const [kpiFilter, setKpiFilter] = useState<'all' | 'present' | 'absent' | 'late' | 'risk'>('all');
  
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<any>(null);

  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [selectedStudentForNotification, setSelectedStudentForNotification] = useState<any>(null);
  const [notificationTemplateType, setNotificationTemplateType] = useState<'inasistencia' | 'llegadas_tarde' | 'citacion'>('inasistencia');
  const [copiedNotification, setCopiedNotification] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const currentUserRole = useMemo(() => {
    return getUserSystemRole(user, fichasDataMap);
  }, [user, fichasDataMap]);

  const fichasDisponiblesMap = useMemo(() => {
    if (currentUserRole === 'ADMIN' || currentUserRole === 'COORDINADOR') {
      return fichasDataMap;
    }

    if (!user || !user.email) {
      return {};
    }

    const userEmail = sanitizarEmail(user.email);
    const fichasFiltradas: Record<string, any> = {};

    Object.keys(fichasDataMap).forEach((fichaId) => {
      const fichaObj = fichasDataMap[fichaId];
      const equipo = fichaObj.equipo_instructores || [];

      const estaVinculado = equipo.some((inst: any) => {
        const instEmails = [
          sanitizarEmail(inst.correo_institucional_sena),
          sanitizarEmail(inst.correo_institucional),
          sanitizarEmail(inst.correo_gmail),
          sanitizarEmail(inst.correo_google),
          sanitizarEmail(inst.correo)
        ];
        return instEmails.some(e => e && e === userEmail);
      });

      if (estaVinculado) {
        fichasFiltradas[fichaId] = fichaObj;
      }
    });

    return fichasFiltradas;
  }, [fichasDataMap, user, currentUserRole]);

  const llavesFichasDisponibles = useMemo(() => {
    return Object.keys(fichasDisponiblesMap);
  }, [fichasDisponiblesMap]);

  useEffect(() => {
    if (llavesFichasDisponibles.length > 0 && !fichasDisponiblesMap[currentFichaId]) {
      setCurrentFichaId(llavesFichasDisponibles[0]);
    }
  }, [llavesFichasDisponibles, currentFichaId, fichasDisponiblesMap]);

  const courseData = useMemo(() => {
    const rawData = fichasDataMap[currentFichaId] || {
      ...JSON.parse(JSON.stringify(initialCourseData)),
      ficha_de_caracterizacion: currentFichaId,
      fechas_asistencia: [],
      asistencias_aprendices: initialCourseData.asistencias_aprendices.map(a => ({ ...a, registros: {} }))
    };
    return sanitizeFicha(rawData, currentFichaId);
  }, [fichasDataMap, currentFichaId]);

  const updateCurrentFichaData = (newData: any) => {
    const cleanData = sanitizeFicha(newData, currentFichaId);
    setFichasDataMap(prev => {
      const updated = {
        ...prev,
        [currentFichaId]: cleanData
      };
      localStorage.setItem('sena_all_fichas_database', JSON.stringify(updated));
      return updated;
    });
  };

  const activeInstructor = useMemo(() => {
    return getInstructorFromSession(user, courseData);
  }, [user, courseData]);

  useEffect(() => {
    if (user && fichasDataMap) {
      if (currentUserRole === 'ADMIN' || currentUserRole === 'COORDINADOR') {
        setAuthError('');
        return;
      }
      const userEmail = sanitizarEmail(user.email);
      let encontrado = false;

      for (const [_, fichaObj] of Object.entries(fichasDataMap)) {
        const equipo = fichaObj.equipo_instructores || [];
        const idx = equipo.findIndex(
          (inst: any) => {
            const instEmails = [
              sanitizarEmail(inst.correo_institucional_sena),
              sanitizarEmail(inst.correo_institucional),
              sanitizarEmail(inst.correo_gmail),
              sanitizarEmail(inst.correo_google),
              sanitizarEmail(inst.correo)
            ];
            return instEmails.some(e => e && e === userEmail);
          }
        );

        if (idx !== -1) {
          encontrado = true;
          setAuthError('');
          break;
        }
      }

      if (!encontrado) {
        setAuthError('Tu correo no está registrado como instructor o coordinador en ninguna ficha del sistema.');
      }
    }
  }, [user, fichasDataMap, currentUserRole]);
    
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentDoc, setSelectedStudentDoc] = useState<string | null>(null);
  const [showRiskOnly, setShowRiskOnly] = useState(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
    
  const currentInstructorDates = useMemo(() => {
    const dates = courseData.fechas_asistencia || [];
    return [...dates].sort((a, b) => {
      return parseDateForSorting(a).getTime() - parseDateForSorting(b).getTime();
    });
  }, [courseData]);
    
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [tempRecords, setTempRecords] = useState<Record<string, string>>({});

  useEffect(() => {
    setIsLoading(true);
    
    const localData = localStorage.getItem(`sena_ficha_data_${currentFichaId}`);
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        updateCurrentFichaData(parsed);
      } catch (e) {}
    }

    const unsubscribe = subscribeToFichaData((cloudData) => {
      if (cloudData) {
        const sanitized = sanitizeFicha(cloudData, currentFichaId);
        setFichasDataMap(prev => {
          const updated = {
            ...prev,
            [currentFichaId]: sanitized
          };
          localStorage.setItem('sena_all_fichas_database', JSON.stringify(updated));
          return updated;
        });
      }
      setIsLoading(false);
    }, currentFichaId);
     
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [currentFichaId]);

  const handleOpenAttendance = () => {
    if (!canUserEditFicha(user, courseData.equipo_instructores)) {
      alert("Acceso denegado: No tienes permisos para registrar asistencia en esta ficha.");
      return;
    }

    const formattedDate = formatDateForData(attendanceDate);
    const existingRecords: Record<string, string> = {};
     
    activeFilteredStudents.forEach((student: any) => {
      const status = student.registros[formattedDate];
      existingRecords[student.numero_documento] = status || 'Presente';
    });
     
    setTempRecords(existingRecords);
    setShowAttendanceModal(true);
  };

  const handleSaveAttendance = async () => {
    if (!user || !user.email) return;

    if (!canUserEditFicha(user, courseData.equipo_instructores)) {
      alert("Acceso denegado: No tienes permisos para modificar la asistencia.");
      return;
    }

    setIsSavingAttendance(true);
    const formattedDate = formatDateForData(attendanceDate);
     
    let newFechas = [...(courseData.fechas_asistencia || [])].map(d => displayAsDDMMYYYY(d));
    if (!newFechas.includes(formattedDate)) {
      newFechas.push(formattedDate);
    }
     
    const newAprendices = courseData.asistencias_aprendices.map((student: any) => {
      if (student.estado && student.estado !== 'En Formación') {
        return student; 
      }
      const status = tempRecords[student.numero_documento];
      if (status === undefined) return student;

      const newRegistros = { ...student.registros } as Record<string, string>;
      if (status === 'Presente') {
        delete newRegistros[formattedDate];
      } else {
        newRegistros[formattedDate] = status;
      }
      return { ...student, registros: newRegistros };
    });

    const updatedCourseData = {
      ...courseData,
      fechas_asistencia: newFechas,
      asistencias_aprendices: newAprendices,
    };
     
    try {
      await saveAttendanceData(newFechas, newAprendices, {}, currentFichaId);
      updateCurrentFichaData(updatedCourseData);
      localStorage.setItem(`sena_ficha_data_${currentFichaId}`, JSON.stringify(updatedCourseData));

      await registrarLogAuditoria(
        currentFichaId,
        user.email,
        'REGISTRAR_ASISTENCIA',
        `El usuario (${currentUserRole}) registró asistencia para la fecha ${formattedDate} en la ficha ${currentFichaId}.`,
        courseData.fechas_asistencia,
        newFechas
      );

      setShowAttendanceModal(false);
    } catch (error) {
      console.error("Failed to save attendance", error);
      updateCurrentFichaData(updatedCourseData);
      localStorage.setItem(`sena_ficha_data_${currentFichaId}`, JSON.stringify(updatedCourseData));
      setShowAttendanceModal(false);
      alert("Sin conexión cloud: Asistencia guardada en modo local (Offline).");
    } finally {
      setIsSavingAttendance(false);
    }
  };

  const { stats, studentsWithStats, activeFilteredStudents } = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;
    let totalRecords = 0;
    let enRiesgo = 0;
    let enRiesgoTarde = 0;

    const listadoBase = normalizarListadoAprendices(courseData);

    const augmented = listadoBase.map((student: Aprendiz) => {
      let fallasAcumuladas = 0;
      let tardanzasAcumuladas = 0;
      let fechasTarde: string[] = [];
      let fechasFalla: string[] = [];
      
      const fechaIngresoObj = student.fecha_ingreso ? parseDateForSorting(student.fecha_ingreso) : new Date(0);
      const fechaNovedadObj = student.fecha_novedad ? parseDateForSorting(student.fecha_novedad) : new Date(8640000000000000);

      currentInstructorDates.forEach(date => {
        const standardizedDate = displayAsDDMMYYYY(date);
        const sessionDateObj = parseDateForSorting(standardizedDate);

        if (sessionDateObj < fechaIngresoObj || sessionDateObj > fechaNovedadObj) {
          return; 
        }

        const status = student.registros[date] || student.registros[standardizedDate];
        
        if (status) {
          totalRecords++;
          if (status === 'X') {
            absent++;
            fallasAcumuladas++;
            fechasFalla.push(standardizedDate);
          } else if (status === 'Tarde') {
            late++;
            tardanzasAcumuladas++;
            fechasTarde.push(standardizedDate);
          } else if (status === 'Excusa' || status === 'Evento') {
            excused++;
          }
        } else {
          present++;
        }
      });

      const estadoActual = student.estado || 'En Formación';
      const isActivo = estadoActual === 'En Formación';
      const isRisk = isActivo && (fallasAcumuladas >= limiteInasistencias);
      const isLateRisk = isActivo && (tardanzasAcumuladas >= 3);

      if (isRisk) enRiesgo++;
      if (isLateRisk) enRiesgoTarde++;

      return {
        ...student,
        estado: estadoActual,
        fallasAcumuladas,
        tardanzasAcumuladas,
        fechasTarde,
        fechasFalla,
        enRiesgo: isRisk,
        enRiesgoTarde: isLateRisk,
        isActivo
      };
    });

    augmented.sort((a, b) => {
      const nameA = `${a.apellidos} ${a.nombres}`.toLowerCase();
      const nameB = `${b.apellidos} ${b.nombres}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });

    const activeFilteredStudents = augmented.filter(s => s.isActivo);
    const totalPossibleRecords = activeFilteredStudents.length * currentInstructorDates.length;

    return {
      studentsWithStats: augmented,
      activeFilteredStudents,
      stats: {
        present,
        absent,
        late,
        excused,
        enRiesgo,
        enRiesgoTarde,
        totalStudents: activeFilteredStudents.length,
        attendanceRate: totalPossibleRecords > 0 ? Math.round(((totalPossibleRecords - absent) / totalPossibleRecords) * 100) : 100
      }
    };
  }, [courseData, currentInstructorDates, limiteInasistencias]);

  const filteredStudents = useMemo(() => {
    let filtered = activeFilteredStudents; 
     
    if (selectedStudentDoc) {
      return filtered.filter(s => s.numero_documento === selectedStudentDoc);
    }

    if (kpiFilter === 'present') {
      filtered = filtered.filter(s => s.fallasAcumuladas === 0);
    } else if (kpiFilter === 'absent') {
      filtered = filtered.filter(s => s.fallasAcumuladas > 0);
    } else if (kpiFilter === 'late') {
      filtered = filtered.filter(s => s.tardanzasAcumuladas > 0);
    } else if (kpiFilter === 'risk') {
      filtered = filtered.filter(s => s.enRiesgo);
    }

    if (showRiskOnly) {
      filtered = filtered.filter(s => s.enRiesgo || s.enRiesgoTarde);
    }
     
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(student => 
        student.nombres.toLowerCase().includes(term) ||
        student.apellidos.toLowerCase().includes(term) ||
        student.numero_documento.includes(term)
      );
    }
     
    return filtered;
  }, [searchTerm, selectedStudentDoc, showRiskOnly, activeFilteredStudents, kpiFilter]);

  const correoInstructorActual = sanitizarEmail(activeInstructor.correo_institucional_sena || activeInstructor.correo_google || user?.email || '');

  const riskStudentsList = useMemo(() => {
    return activeFilteredStudents.filter(s => s.enRiesgo || s.enRiesgoTarde);
  }, [activeFilteredStudents]);

  const getNotificationTemplateText = (student: any) => {
    const instructorName = activeInstructor.nombre_del_instructor || "Instructor SENA";
    const fechasFallasInstructor = currentInstructorDates.filter(date => student.registros[date] === 'X' || student.registros[displayAsDDMMYYYY(date)] === 'X');
    const fechasTardanzasInstructor = currentInstructorDates.filter(date => student.registros[date] === 'Tarde' || student.registros[displayAsDDMMYYYY(date)] === 'Tarde');

    if (notificationTemplateType === 'inasistencia') {
      const listadoFechas = fechasFallasInstructor.length > 0 ? fechasFallasInstructor.map(f => `- ${displayAsDDMMYYYY(f)}`).join('\n') : 'Ninguna registrada';
      return `Asunto: Notificación por Inasistencia Injustificada (Acuerdo 009 de 2024) - Ficha ${courseData.ficha_de_caracterizacion}

Estimado(a) aprendiz ${student.nombres} ${student.apellidos} (${student.numero_documento}),

De conformidad con el Acuerdo 009 de 2024 (Reglamento del Aprendiz SENA), específicamente en su Artículo 27 ("Cumplimiento satisfactorio del proceso formativo") y el Artículo 29 ("Incumplimiento injustificado"), le informamos que registra un acumulado de ${fechasFallasInstructor.length} inasistencia(s) injustificada(s):

${listadoFechas}

Le recordamos que, conforme al Artículo 28, las inasistencias no programadas deben justificarse formalmente con los respectivos soportes a más tardar dentro de los cinco (5) días hábiles siguientes a su ocurrencia.

Atentamente,
${instructorName}
CC: ${correoInstructorActual}`;

    } else if (notificationTemplateType === 'llegadas_tarde') {
      const listadoTardanzas = fechasTardanzasInstructor.length > 0 ? fechasTardanzasInstructor.map(f => `- ${displayAsDDMMYYYY(f)}`).join('\n') : 'Ninguna registrada';
      return `Asunto: Llamado de Atención Formal por Llegadas Tarde - Ficha ${courseData.ficha_de_caracterizacion}

Estimado(a) aprendiz ${student.nombres} ${student.apellidos} (${student.numero_documento}),

El presente correo constituye un llamado de atención formal en relación con sus reiteradas llegadas tarde y ausencias parciales a las sesiones de formación programadas.

Conforme al Artículo 27 del Acuerdo 009 de 2024 del SENA, el cumplimiento satisfactorio exige puntualidad y participación activa:

${listadoTardanzas}

Atentamente,
${instructorName}
CC: ${correoInstructorActual}`;

    } else {
      return `Asunto: Citación a Comité de Evaluación y Seguimiento - Ficha ${courseData.ficha_de_caracterizacion}

Estimado(a) aprendiz ${student.nombres} ${student.apellidos} (${student.numero_documento}),

Dado el incumplimiento reiterado en las normas de asistencia y puntualidad bajo los lineamientos del Acuerdo 009 de 2024 (Artículos 22 al 26), se le cita formalmente a Comité de Evaluación y Seguimiento para la revisión de su caso y emisión de descargos correspondientes.

Atentamente,
${instructorName}
CC: ${correoInstructorActual}`;
    }
  };

  if (!authReady || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <img src={LOGO_SENA_SVG} alt="SENA" className="w-16 h-16 animate-pulse" />
          <Loader2 className="w-8 h-8 animate-spin text-[#39a900]" />
          <p className="text-slate-600 font-medium">Cargando plataforma académica SENA...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (currentUserRole === 'INVITADO' && llavesFichasDisponibles.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 p-8 text-center space-y-4">
          <div className="flex justify-center">
            <img src={LOGO_SENA_SVG} alt="SENA" className="w-14 h-14" />
          </div>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-2">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Acceso Restringido</h1>
          <p className="text-slate-600">{authError || 'Tu correo no está registrado como instructor o coordinador en ninguna ficha.'}</p>
           
          <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-500 text-left">
            <span className="font-semibold text-slate-700 block mb-1">Correo actual:</span>
            {user.email}
          </div>

          <button 
            onClick={() => signOut(auth)}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 mx-auto cursor-pointer"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12 flex flex-col justify-between">
      {/* 🛡️ Modal Bloqueante de Habeas Data */}
      <HabeasDataModalComponent userUid={user.uid} userEmail={user.email || ADMIN_EMAIL} />
      
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between py-3">
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md border-2 border-[#39a900]/30 p-1">
              <img src={LOGO_SENA_SVG} alt="Logo SENA" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-base tracking-tight hidden sm:block">
                SENA - Gestión Académica
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Layers className="w-3.5 h-3.5 text-[#39a900]" />
                <select 
                  value={currentFichaId}
                  onChange={(e) => setCurrentFichaId(e.target.value)}
                  className="bg-emerald-50 text-[#39a900] text-xs font-bold px-2 py-0.5 rounded border border-[#39a900]/30 focus:outline-none cursor-pointer"
                >
                 {llavesFichasDisponibles.length > 0 ? (
                   llavesFichasDisponibles.map((fichaKey) => (
                    <option key={fichaKey} value={fichaKey}>
                      Ficha: {fichaKey}
                    </option>
                  ))
                 ) : (
                  <option value="" disabled>Sin fichas asignadas</option>
                 )}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {currentUserRole === 'ADMIN' && (
              <button
                onClick={() => generarBackupGlobalFichas(fichasDataMap, user.email || ADMIN_EMAIL)}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
                title="Descargar copia de seguridad estructurada (.JSON)"
              >
                💾 Backup Global (.JSON)
              </button>
            )}

            <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${isOnline ? 'bg-emerald-50 text-[#39a900] border border-[#39a900]/30' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
              {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span>{isOnline ? 'En línea' : 'Modo Offline'}</span>
            </div>

            <div className="relative">
              <button 
                onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600 relative transition-colors cursor-pointer"
                title="Centro de Notificaciones"
              >
                <Bell className="w-5 h-5" />
                {riskStudentsList.length > 0 && (
                  <span className="absolute top-1 right-1 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                    {riskStudentsList.length}
                  </span>
                )}
              </button>

              {showNotificationsDropdown && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 py-3 z-50">
                  <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Centro de Notificaciones</span>
                    <span className="text-[11px] text-[#39a900] font-semibold">Acuerdo 009 de 2024</span>
                  </div>

                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-700">Umbral de Inasistencia:</span>
                      <div className="flex items-center gap-1">
                        <input 
                          type="number" 
                          min="1" 
                          max="20" 
                          value={limiteInasistencias}
                          onChange={(e) => setLimiteInasistencias(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-14 text-center border border-slate-300 rounded px-1.5 py-0.5 text-xs font-bold bg-white text-[#39a900]"
                        />
                        <span className="text-xs text-slate-500">faltas</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">CC Automática: <strong>{correoInstructorActual}</strong></p>
                  </div>

                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                    {riskStudentsList.length > 0 ? (
                      riskStudentsList.map((student: any) => (
                        <div key={student.numero_documento} className="px-4 py-2.5 hover:bg-slate-50 flex items-center justify-between gap-2">
                          <div>
                            <p className="text-xs font-bold text-slate-800">{student.apellidos} {student.nombres}</p>
                            <p className="text-[10px] text-red-600 font-semibold">{student.fallasAcumuladas} inasistencias registradas</p>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedStudentForNotification(student);
                              setShowNotificationModal(true);
                              setShowNotificationsDropdown(false);
                            }}
                            className="px-2.5 py-1 bg-emerald-50 text-[#39a900] hover:bg-emerald-100 rounded text-[11px] font-bold transition-colors whitespace-nowrap cursor-pointer"
                          >
                            Plantilla
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-6 text-center text-xs text-slate-400">
                        No hay aprendices que alcancen el límite de inasistencia actual.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
              <div className="w-10 h-10 rounded-full bg-[#39a900] text-white flex items-center justify-center font-bold text-sm shadow-sm border-2 border-emerald-100">
                {activeInstructor.nombre_del_instructor?.charAt(0) || 'U'}
              </div>
              <div className="hidden md:block text-left leading-tight">
                <p className="text-xs font-bold text-slate-800">
                  {activeInstructor.nombre_del_instructor}
                </p>
                <p className="text-[11px] text-slate-500">
                  {activeInstructor.correo_gmail || activeInstructor.correo_institucional_sena || user.email}
                </p>
              </div>
              
              <button
                onClick={() => signOut(auth)}
                className="ml-2 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-bold border border-red-200 transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="Cerrar Sesión de forma segura"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6 w-full flex-grow">
        
        {currentUserRole === 'COORDINADOR' && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
            <span className="font-semibold">📊 Modo de Coordinación Académica Activo: Tienes privilegios de supervisión global, reportes consolidados y auditoría en todas las fichas.</span>
          </div>
        )}

        <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setMainView('listado')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${mainView === 'listado' ? 'bg-[#39a900] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Users className="w-4 h-4" />
              Listado y Asistencia
            </button>
            <button
              onClick={() => setMainView('tablero')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${mainView === 'tablero' ? 'bg-[#39a900] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Vista de Tablero (KPI)
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <button 
              onClick={handleOpenAttendance}
              className="flex items-center gap-2 px-3.5 py-2 bg-[#39a900] text-white rounded-lg text-sm font-semibold hover:bg-[#329600] shadow-sm transition-colors cursor-pointer"
            >
              <ClipboardList className="w-4 h-4" />
              Tomar Asistencia
            </button>
            {canManageFichasAndSheets(user, courseData.equipo_instructores) && (
              <button 
                onClick={() => setIsSheetsModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-[#39a900] hover:border-[#39a900]/50 shadow-sm transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#39a900]" />
                <span className="hidden sm:inline">Google Sheets & Validación</span>
              </button>
            )}
          </div>
        </div>

        <div>
          <p className="text-xs text-slate-500 mb-1">
            Inicio &gt; {mainView === 'listado' ? 'Listado de Aprendices' : 'Vista de Tablero'} &gt; <span className="font-semibold text-slate-800">Ficha {courseData.ficha_de_caracterizacion}</span>
          </p>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <img src={LOGO_SENA_SVG} alt="" className="w-7 h7 inline-block" />
            {courseData.denominacion} - Ficha {courseData.ficha_de_caracterizacion}
          </h1>
        </div>

        {mainView === 'listado' && (
          <div className="space-y-6">
            <div className="flex border-b border-slate-200 gap-8 text-sm font-medium overflow-x-auto">
              <button 
                onClick={() => setActiveTab('asistencia')}
                className={`pb-3 transition-colors whitespace-nowrap cursor-pointer ${activeTab === 'asistencia' ? 'text-[#39a900] border-b-2 border-[#39a900] font-semibold' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Listado y Control de Asistencia
              </button>
              <button 
                onClick={() => setActiveTab('ficha')}
                className={`pb-3 transition-colors whitespace-nowrap cursor-pointer ${activeTab === 'ficha' ? 'text-[#39a900] border-b-2 border-[#39a900] font-semibold' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Datos de la Ficha
              </button>
              <button 
                onClick={() => setActiveTab('novedades')}
                className={`pb-3 transition-colors whitespace-nowrap cursor-pointer ${activeTab === 'novedades' ? 'text-[#39a900] border-b-2 border-[#39a900] font-semibold' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Gestión de Novedades
              </button>
              <button 
                onClick={() => setActiveTab('reportes')}
                className={`pb-3 transition-colors whitespace-nowrap cursor-pointer ${activeTab === 'reportes' ? 'text-[#39a900] border-b-2 border-[#39a900] font-semibold' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Reportes
              </button>
              <button 
                onClick={() => setActiveTab('instructores')}
                className={`pb-3 transition-colors whitespace-nowrap cursor-pointer ${activeTab === 'instructores' ? 'text-[#39a900] border-b-2 border-[#39a900] font-semibold' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Gestión de Instructores
              </button>
            </div>

            {activeTab === 'ficha' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
                <div className="border-b border-slate-200 pb-5">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider mb-1">
                    <BookOpen className="w-4 h-4 text-emerald-600" /> Servicio Nacional de Aprendizaje SENA
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">{courseData.denominacion || 'Programa de Formación'}</h2>
                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
                    <span className="bg-slate-100 px-3 py-1.5 rounded-lg font-semibold border border-slate-200">
                      Ficha N°: <strong className="text-slate-900">{courseData.ficha_de_caracterizacion}</strong>
                    </span>
                    <span className="bg-slate-100 px-3 py-1.5 rounded-lg font-semibold border border-slate-200">
                      Centro: <strong className="text-slate-900">{courseData.centro || 'Centro Agroindustrial'}</strong>
                    </span>
                    <span className="bg-slate-100 px-3 py-1.5 rounded-lg font-semibold border border-slate-200">
                      Total Nómina: <strong className="text-slate-900">{activeFilteredStudents.length} aprendices</strong>
                    </span>
                  </div>
                </div>

                {/* 🛡️ Inserción de la pasarela de validación previa en la pestaña de la ficha */}
                <FileUploaderPasarelaSection 
                  currentFichaId={currentFichaId}
                  onDataLoaded={(newData, targetFichaId) => {
                    const fichaToUse = targetFichaId || currentFichaId;
                    if (fichaToUse !== currentFichaId) {
                      setCurrentFichaId(fichaToUse);
                    }
                    updateCurrentFichaData(newData);
                    localStorage.setItem(`sena_ficha_data_${fichaToUse}`, JSON.stringify(newData));
                  }}
                />

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-700" />
                    <h3 className="text-base font-bold text-slate-800">Equipo Ejecutor de Instructores</h3>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Listado oficial de instructores y tutores asignados a los procesos formativos de esta ficha.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(courseData.equipo_instructores || []).map((inst: any, idx: number) => {
                      const rol = inst.rol || (inst.es_lider ? 'Instructor Lider' : 'Instructor / Tutor');
                      return (
                        <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-slate-800 text-sm">{inst.nombre_del_instructor || inst.nombre}</h4>
                              <p className="text-xs text-emerald-700 font-medium">{inst.competencia}</p>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${rol === 'Instructor Lider' ? 'bg-emerald-100 text-[#39a900]' : 'bg-slate-200 text-slate-700'}`}>
                              {rol}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 space-y-0.5 pt-1 border-t border-slate-200/60">
                            <p>Correo: <strong>{inst.correo_institucional || inst.correo_institucional_sena || inst.correo_gmail}</strong></p>
                            <p>Día asignado: <strong>{inst.dia || inst.dia_semana || 'N/A'}</strong></p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'asistencia' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div 
                    onClick={() => { setKpiFilter('all'); setSelectedStudentDoc(null); }}
                    className={`bg-white rounded-xl border p-4 shadow-sm flex flex-col justify-between cursor-pointer transition-all ${kpiFilter === 'all' && !selectedStudentDoc ? 'border-[#39a900] ring-2 ring-[#39a900]/20 bg-emerald-50/20' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-semibold text-slate-500">Total Aprendices Activos</span>
                      <div className="p-2 bg-emerald-50 rounded-lg text-[#39a900]"><Users className="w-4 h-4" /></div>
                    </div>
                    <span className="text-2xl font-bold text-slate-900 mt-3">{stats.totalStudents}</span>
                    <span className="text-[10px] text-slate-400 mt-1">En formación</span>
                  </div>
                  
                  <div 
                    onClick={() => { setKpiFilter('present'); setSelectedStudentDoc(null); }}
                    className={`bg-white rounded-xl border p-4 shadow-sm flex flex-col justify-between cursor-pointer transition-all ${kpiFilter === 'present' ? 'border-[#39a900] ring-2 ring-[#39a900]/20 bg-emerald-50/20' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-semibold text-slate-500">Asistencia Global</span>
                      <div className="p-2 bg-emerald-50 rounded-lg text-[#39a900]"><CheckCircle2 className="w-4 h-4" /></div>
                    </div>
                    <span className="text-2xl font-bold text-[#39a900] mt-3">{stats.attendanceRate}%</span>
                    <span className="text-[10px] text-slate-400 mt-1">Sin inasistencias</span>
                  </div>

                  <div 
                    onClick={() => { setKpiFilter('absent'); setSelectedStudentDoc(null); }}
                    className={`bg-white rounded-xl border p-4 shadow-sm flex flex-col justify-between cursor-pointer transition-all ${kpiFilter === 'absent' ? 'border-red-500 ring-2 ring-red-500/20 bg-red-50/20' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-semibold text-slate-500">Total Inasistencias</span>
                      <div className="p-2 bg-red-50 rounded-lg text-red-500"><XCircle className="w-4 h-4" /></div>
                    </div>
                    <span className="text-2xl font-bold text-slate-900 mt-3">{stats.absent}</span>
                    <span className="text-[10px] text-slate-400 mt-1">Aprendices con fallas</span>
                  </div>

                  <div 
                    onClick={() => { setKpiFilter('late'); setSelectedStudentDoc(null); }}
                    className={`bg-white rounded-xl border p-4 shadow-sm flex flex-col justify-between cursor-pointer transition-all ${kpiFilter === 'late' ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-semibold text-slate-500">Llegadas Tarde</span>
                      <div className="p-2 bg-amber-50 rounded-lg text-amber-600"><Clock className="w-4 h-4" /></div>
                    </div>
                    <span className="text-2xl font-bold text-slate-900 mt-3">{stats.late}</span>
                    <span className="text-[10px] text-slate-400 mt-1">Retardos registrados</span>
                  </div>

                  <div 
                    onClick={() => { setKpiFilter('risk'); setSelectedStudentDoc(null); }}
                    className={`bg-white rounded-xl border p-4 shadow-sm flex flex-col justify-between cursor-pointer transition-all col-span-2 md:col-span-1 ${kpiFilter === 'risk' ? 'border-purple-500 ring-2 ring-purple-500/20 bg-purple-50/20' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-semibold text-slate-500">En Riesgo</span>
                      <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><AlertTriangle className="w-4 h-4" /></div>
                    </div>
                    <span className="text-2xl font-bold text-slate-900 mt-3">{stats.enRiesgo}</span>
                    <span className="text-[10px] text-slate-400 mt-1">&gt;= {limiteInasistencias} inasistencias</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="Buscar por nombre, apellido o documento..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:bg-white focus:border-[#39a900] transition-colors"
                    />
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={showRiskOnly}
                        onChange={(e) => setShowRiskOnly(e.target.checked)}
                        className="rounded border-slate-300 text-[#39a900] focus:ring-[#39a900] w-4 h-4"
                      />
                      Mostrar solo aprendices en riesgo
                    </label>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                          <th className="p-3.5 sticky left-0 bg-slate-50 z-10">Aprendiz</th>
                          <th className="p-3.5 text-center">Documento</th>
                          <th className="p-3.5 text-center">Fallas</th>
                          <th className="p-3.5 text-center">Tardanzas</th>
                          {currentInstructorDates.map((date, idx) => (
                            <th key={idx} className="p-3.5 text-center whitespace-nowrap font-mono">
                              {displayAsDDMMYYYY(date)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredStudents.length === 0 ? (
                          <tr>
                            <td colSpan={4 + currentInstructorDates.length} className="p-8 text-center text-slate-400 italic">
                              {stats.totalStudents === 0 
                                ? `No se encontraron aprendices activos para la ficha N° ${currentFichaId}. Verifique el archivo cargado o seleccione otra ficha.` 
                                : 'No se encontraron aprendices con los filtros especificados.'}
                            </td>
                          </tr>
                        ) : (
                          filteredStudents.map((student: any) => (
                            <tr key={student.numero_documento} className="hover:bg-slate-50/80 cursor-pointer" onClick={() => setSelectedStudentForProfile(student)}>
                              <td className="p-3.5 font-bold text-slate-800 sticky left-0 bg-white z-10 whitespace-nowrap hover:text-[#39a900]">
                                {student.apellidos} {student.nombres} 🔍
                              </td>
                              <td className="p-3.5 text-center font-mono text-slate-500 whitespace-nowrap">{student.numero_documento}</td>
                              <td className="p-3.5 text-center font-bold">
                                <span className={`px-2 py-0.5 rounded text-[11px] ${student.fallasAcumuladas >= limiteInasistencias ? 'bg-red-100 text-red-700' : 'text-slate-700'}`}>
                                  {student.fallasAcumuladas}
                                </span>
                              </td>
                              <td className="p-3.5 text-center font-bold">
                                <span className={`px-2 py-0.5 rounded text-[11px] ${student.tardanzasAcumuladas > 0 ? 'bg-amber-100 text-amber-700' : 'text-slate-700'}`}>
                                  {student.tardanzasAcumuladas}
                                </span>
                              </td>
                              {currentInstructorDates.map((date, idx) => {
                                const standardizedDate = displayAsDDMMYYYY(date);
                                const status = student.registros[date] || student.registros[standardizedDate];
                                return (
                                  <td key={idx} className="p-3.5 text-center whitespace-nowrap">
                                    {!status ? (
                                      <span className="text-[#39a900] font-bold">·</span>
                                    ) : status === 'X' ? (
                                      <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">X</span>
                                    ) : status === 'Tarde' ? (
                                      <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">T</span>
                                    ) : (
                                      <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">E</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'novedades' && (
              <GestionNovedadesTab 
                courseData={courseData}
                currentFichaId={currentFichaId}
                updateCourseData={updateCurrentFichaData}
                userEmail={user.email || ADMIN_EMAIL}
              />
            )}

            {activeTab === 'reportes' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-3 border-b pb-4">
                  <img src={LOGO_SENA_SVG} alt="" className="w-10 h-10" />
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Generador de Reportes de Inasistencia</h2>
                    <p className="text-xs text-slate-500">Centralice y consulte la información académica de asistencia y novedades discriminando por instructor y competencias.</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
                  <div className="w-full sm:w-96">
                    <label className="text-xs font-bold text-slate-700 block mb-1">Filtrar Reportes por Instructor:</label>
                    <select 
                      value={instructorFiltroReporte}
                      onChange={(e) => setInstructorFiltroReporte(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:border-[#39a900]"
                    >
                      <option value="todos">Todos los Instructores</option>
                      {courseData.equipo_instructores?.map((inst: any, idx: number) => (
                        <option key={idx} value={inst.nombre_del_instructor}>{inst.nombre_del_instructor}</option>
                      ))}
                    </select>
                  </div>

                  <div className="w-full sm:w-auto flex justify-end">
                    <button 
                      type="button"
                      onClick={() => setShowExportModal(true)}
                      className="px-5 py-2.5 bg-[#39a900] text-white rounded-lg text-sm font-semibold hover:bg-[#329600] flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
                    >
                      <Printer className="w-4 h-4" /> Abrir Vista Previa y PDF
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'instructores' && (
              <GestionInstructores 
                courseData={courseData}
                currentFichaId={currentFichaId}
                updateCourseData={updateCurrentFichaData}
                user={user}
              />
            )}
          </div>
        )}

        {mainView === 'tablero' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <img src={LOGO_SENA_SVG} alt="" className="w-6 h-6" /> Vista de Tablero y Estadísticas Generales
            </h2>
            <p className="text-sm text-slate-600">Resumen analítico del comportamiento de asistencia de la ficha {courseData.ficha_de_caracterizacion}.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 border-l-4 border-l-[#39a900]">
                <span className="text-xs font-semibold text-slate-500">Total Aprendices Activos</span>
                <p className="text-3xl font-bold text-slate-800 mt-1">{stats.totalStudents}</p>
              </div>
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 border-l-4 border-l-blue-500">
                <span className="text-xs font-semibold text-slate-500">Porcentaje de Asistencia General</span>
                <p className="text-3xl font-bold text-[#39a900] mt-1">{stats.attendanceRate}%</p>
              </div>
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 border-l-4 border-l-red-500">
                <span className="text-xs font-semibold text-slate-500">Aprendices en Riesgo Académico</span>
                <p className="text-3xl font-bold text-red-600 mt-1">{stats.enRiesgo}</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {selectedStudentForProfile && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <img src={LOGO_SENA_SVG} alt="" className="w-8 h-8" />
                <div>
                  <h3 className="font-bold text-slate-800 text-base">{selectedStudentForProfile.apellidos} {selectedStudentForProfile.nombres}</h3>
                  <p className="text-xs text-slate-500 font-mono">Documento: {selectedStudentForProfile.numero_documento} | Ficha: {courseData.ficha_de_caracterizacion}</p>
                </div>
              </div>
              <button onClick={() => setSelectedStudentForProfile(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-grow">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-center">
                  <span className="text-xs font-semibold text-red-600">Fallas Acumuladas</span>
                  <p className="text-2xl font-bold text-red-700 mt-1">{selectedStudentForProfile.fallasAcumuladas}</p>
                </div>
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-center">
                  <span className="text-xs font-semibold text-amber-600">Llegadas Tarde</span>
                  <p className="text-2xl font-bold text-amber-700 mt-1">{selectedStudentForProfile.tardanzasAcumuladas}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-800 mb-2">Historial Detallado de Registros por Fecha:</h4>
                <div className="border rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 uppercase font-bold border-b">
                        <th className="p-3">Fecha de Sesión</th>
                        <th className="p-3 text-center">Estado Registrado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentInstructorDates.map((date, idx) => {
                        const standardizedDate = displayAsDDMMYYYY(date);
                        const status = selectedStudentForProfile.registros[date] || selectedStudentForProfile.registros[standardizedDate];
                        return (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-3 font-mono font-bold text-slate-700">{standardizedDate}</td>
                            <td className="p-3 text-center">
                              {!status ? (
                                <span className="bg-emerald-50 text-[#39a900] font-bold px-2 py-0.5 rounded">Presente</span>
                              ) : status === 'X' ? (
                                <span className="bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded">Falta (X)</span>
                              ) : status === 'Tarde' ? (
                                <span className="bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded">Tarde (T)</span>
                              ) : (
                                <span className="bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded">Excusa (E)</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedStudentForProfile(null)}
                className="px-5 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-900 cursor-pointer"
              >
                Cerrar Perfil
              </button>
            </div>
          </div>
        </div>
      )}

      {showAttendanceModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <img src={LOGO_SENA_SVG} alt="" className="w-5 h-5" /> Registro Diario de Asistencia
              </h3>
              <button onClick={() => setShowAttendanceModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-grow">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <label className="text-xs font-bold text-slate-700">Fecha de la Sesión:</label>
                <input 
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold bg-white text-slate-800"
                />
              </div>

              <div className="space-y-2">
                {activeFilteredStudents.map((student: any) => (
                  <div key={student.numero_documento} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{student.apellidos} {student.nombres}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{student.numero_documento}</p>
                    </div>
                    <select
                      value={tempRecords[student.numero_documento] || 'Presente'}
                      onChange={(e) => setTempRecords({ ...tempRecords, [student.numero_documento]: e.target.value })}
                      className="border border-slate-300 rounded-lg px-3 py-1 text-xs font-bold bg-slate-50 text-slate-800 cursor-pointer"
                    >
                      <option value="Presente">Presente</option>
                      <option value="X">Falta (X)</option>
                      <option value="Tarde">Tarde (T)</option>
                      <option value="Excusa">Excusa (E)</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button 
                onClick={() => setShowAttendanceModal(false)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveAttendance}
                disabled={isSavingAttendance}
                className="px-5 py-2 bg-[#39a900] text-white rounded-lg text-sm font-semibold hover:bg-[#329600] flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSavingAttendance && <Loader2 className="w-4 h-4 animate-spin" />}
                Guardar Asistencia
              </button>
            </div>
          </div>
        </div>
      )}

      {showNotificationModal && selectedStudentForNotification && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <img src={LOGO_SENA_SVG} alt="" className="w-5 h-5" /> Plantilla Acuerdo 009 de 2024 SENA
              </h3>
              <button onClick={() => setShowNotificationModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setNotificationTemplateType('inasistencia')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${notificationTemplateType === 'inasistencia' ? 'bg-[#39a900] text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  Inasistencia
                </button>
                <button
                  onClick={() => setNotificationTemplateType('llegadas_tarde')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${notificationTemplateType === 'llegadas_tarde' ? 'bg-[#39a900] text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  Llegadas Tarde
                </button>
                <button
                  onClick={() => setNotificationTemplateType('citacion')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${notificationTemplateType === 'citacion' ? 'bg-[#39a900] text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  Citación a Comité
                </button>
              </div>

              <textarea 
                readOnly
                value={getNotificationTemplateText(selectedStudentForNotification)}
                rows={11}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 focus:outline-none"
              />
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button 
                onClick={() => setShowNotificationModal(false)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100 cursor-pointer"
              >
                Cerrar
              </button>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(getNotificationTemplateText(selectedStudentForNotification));
                  setCopiedNotification(true);
                  setTimeout(() => setCopiedNotification(false), 2000);
                }}
                className="px-5 py-2 bg-[#39a900] text-white rounded-lg text-sm font-semibold hover:bg-[#329600] flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                {copiedNotification ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedNotification ? 'Copiado al Portapapeles' : 'Copiar Texto'}
              </button>
            </div>
          </div>
        </div>
      )}

      <SheetsTemplateModal 
        isOpen={isSheetsModalOpen} 
        onClose={() => setIsSheetsModalOpen(false)} 
        currentFicha={currentFichaId}
        courseData={courseData} 
        currentUser={user}
        onDataLoaded={(newData, targetFichaId) => {
          const fichaToUse = targetFichaId || currentFichaId;
          if (fichaToUse !== currentFichaId) {
            setCurrentFichaId(fichaToUse);
          }
          updateCurrentFichaData(newData);
          localStorage.setItem(`sena_ficha_data_${fichaToUse}`, JSON.stringify(newData));
        }}
      />

      <ExportReportModal 
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        courseData={courseData}
        students={studentsWithStats}
        currentUser={user}
      />
    </div>
  );
}

interface GestionNovedadesTabProps {
  courseData: any;
  currentFichaId: string;
  updateCourseData: (newData: any) => void;
  userEmail: string;
}

export const GestionNovedadesTab: React.FC<GestionNovedadesTabProps> = ({
  courseData,
  currentFichaId,
  updateCourseData,
  userEmail
}) => {
  const [selectedStudentForSalida, setSelectedStudentForSalida] = useState<any>(null);
  const [estadoSalida, setEstadoSalida] = useState<EstadoAprendiz>('Retiro Voluntario');
  const [fechaSalida, setFechaSalida] = useState(new Date().toISOString().split('T')[0]);
  const [observacionSalida, setObservacionSalida] = useState('');

  const [showIncorporarModal, setShowIncorporarModal] = useState(false);
  const [nuevoTipoDoc, setNuevoTipoDoc] = useState('CC');
  const [nuevoDoc, setNuevoDoc] = useState('');
  const [nuevoNombres, setNuevoNombres] = useState('');
  const [nuevoApellidos, setNuevoApellidos] = useState('');
  const [nuevoCorreo, setNuevoCorreo] = useState('');
  const [nuevoTelefono, setNuevoTelefono] = useState('');
  const [nuevoTipoMovimiento, setNuevoTipoMovimiento] = useState<'Ingreso_Nuevo' | 'Reingreso' | 'Traslado_Entrada'>('Ingreso_Nuevo');
  const [nuevoFechaIngreso, setNuevoFechaIngreso] = useState(new Date().toISOString().split('T')[0]);
  const [nuevoObservacion, setNuevoObservacion] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const listadoAprendicesSeguro = normalizarListadoAprendices(courseData);

  const handleSaveSalida = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForSalida) return;
    setIsSubmitting(true);

    try {
      const estadoAnterior = selectedStudentForSalida.estado || 'En Formación';

      const updatedAprendices = listadoAprendicesSeguro.map((a: any) => {
        if (a.numero_documento === selectedStudentForSalida.numero_documento) {
          return {
            ...a,
            estado: estadoSalida,
            tipo_movimiento: 'Traslado_Salida',
            fecha_novedad: fechaSalida,
            observacion_novedad: observacionSalida.trim()
          };
        }
        return a;
      });

      const updatedCourseData = {
        ...courseData,
        asistencias_aprendices: updatedAprendices
      };

      updateCourseData(updatedCourseData);
      await updateFichaCompleteData(updatedCourseData, currentFichaId);

      await registrarLogAuditoria(
        currentFichaId,
        userEmail,
        'REGISTRAR_NOVEDAD_SALIDA',
        `Novedad de salida (${estadoSalida}) aplicada al aprendiz ${selectedStudentForSalida.nombres} ${selectedStudentForSalida.apellidos} (${selectedStudentForSalida.numero_documento}).`,
        { estado: estadoAnterior },
        { estado: estadoSalida, fecha: fechaSalida, observacion: observacionSalida }
      );

      alert("Novedad de salida registrada y auditada exitosamente.");
      setSelectedStudentForSalida(null);
    } catch (error) {
      console.error("Error al registrar novedad de salida:", error);
      alert("Guardado localmente (Error de sincronización con Firestore).");
      setSelectedStudentForSalida(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveIncorporacion = async (e: React.FormEvent) => {
    e.preventDefault();
    const docLimpios = sanitizarDocumento(nuevoDoc);
    const nombresLimpios = sanitizarTextoNombre(nuevoNombres);
    const apellidosLimpios = sanitizarTextoNombre(nuevoApellidos);

    if (!docLimpios || !nombresLimpios || !apellidosLimpios) {
      alert("Por favor complete los campos obligatorios del nuevo aprendiz.");
      return;
    }
    setIsSubmitting(true);

    try {
      const existe = listadoAprendicesSeguro.some((a: any) => a.numero_documento === docLimpios);
      if (existe) {
        alert("Ya existe un aprendiz registrado con este número de documento en la ficha.");
        setIsSubmitting(false);
        return;
      }

      const nuevoAprendizObj = {
        tipo_documento: nuevoTipoDoc,
        numero_documento: docLimpios,
        nombres: nombresLimpios,
        apellidos: apellidosLimpios,
        correo: sanitizarEmail(nuevoCorreo),
        telefono: nuevoTelefono.trim(),
        estado: 'En Formación' as EstadoAprendiz,
        tipo_movimiento: nuevoTipoMovimiento,
        fecha_ingreso: nuevoFechaIngreso,
        fecha_novedad: '',
        observacion_novedad: nuevoObservacion.trim(),
        registros: {}
      };

      const updatedAprendices = [...listadoAprendicesSeguro, nuevoAprendizObj];

      const updatedCourseData = {
        ...courseData,
        asistencias_aprendices: updatedAprendices
      };

      updateCourseData(updatedCourseData);
      await updateFichaCompleteData(updatedCourseData, currentFichaId);

      await registrarLogAuditoria(
        currentFichaId,
        userEmail,
        'INCORPORAR_APRENDIZ',
        `Incorporación de nuevo aprendiz ${nombresLimpios} ${apellidosLimpios} (${docLimpios}) por ${nuevoTipoMovimiento}.`,
        null,
        nuevoAprendizObj
      );

      alert("Nuevo aprendiz incorporado e integrado exitosamente a la ficha.");
      setShowIncorporarModal(false);
      
      setNuevoDoc('');
      setNuevoNombres('');
      setNuevoApellidos('');
      setNuevoCorreo('');
      setNuevoTelefono('');
      setNuevoObservacion('');
    } catch (error) {
      console.error("Error al incorporar aprendiz:", error);
      alert("Error al guardar la incorporación en la base de datos.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">📋 Administración de Novedades e Incorporaciones</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Gestione las novedades de salida para aprendices existentes o incorpore nuevos aprendices a la ficha.
            </p>
          </div>
          <button
            onClick={() => setShowIncorporarModal(true)}
            className="px-4 py-2.5 bg-[#39a900] hover:bg-[#329600] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> ➕ Incorporar Nuevo Aprendiz
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 uppercase font-bold border-b">
                <th className="p-3.5">Aprendiz</th>
                <th className="p-3.5 text-center">Documento</th>
                <th className="p-3.5 text-center">Estado Actual</th>
                <th className="p-3.5 text-center">Movimiento / Novedad</th>
                <th className="p-3.5 text-center">Acción (Solo Salidas)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {listadoAprendicesSeguro.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 italic">
                    No hay aprendices registrados en esta ficha.
                  </td>
                </tr>
              ) : (
                listadoAprendicesSeguro.map((student: any) => {
                  const est = student.estado || 'En Formación';
                  const mov = student.tipo_movimiento || 'Ninguno';
                  return (
                    <tr key={student.numero_documento} className="hover:bg-slate-50">
                      <td className="p-3.5 font-bold text-slate-800">
                        {student.apellidos} {student.nombres}
                        {student.correo && <span className="block font-normal text-[10px] text-slate-400">{student.correo}</span>}
                      </td>
                      <td className="p-3.5 text-center font-mono text-slate-500">{student.tipo_documento || 'CC'} {student.numero_documento}</td>
                      <td className="p-3.5 text-center">
                        <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${est === 'En Formación' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'}`}>
                          {est}
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-semibold text-slate-600">
                        {mov}
                      </td>
                      <td className="p-3.5 text-center">
                        {est === 'En Formación' ? (
                          <button
                            onClick={() => {
                              setSelectedStudentForSalida(student);
                              setEstadoSalida('Retiro Voluntario');
                              setFechaSalida(new Date().toISOString().split('T')[0]);
                              setObservacionSalida('');
                            }}
                            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-lg border border-red-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <LogOut className="w-3.5 h-3.5" /> Registrar Salida
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Novedad aplicada</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedStudentForSalida && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <LogOut className="w-5 h-5 text-red-600" /> Registrar Novedad de Salida
              </h3>
              <button onClick={() => setSelectedStudentForSalida(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSalida} className="p-6 space-y-4 text-xs">
              <div className="bg-red-50 p-3 rounded-xl border border-red-100">
                <span className="font-bold text-red-900 block text-sm">
                  {selectedStudentForSalida.apellidos} {selectedStudentForSalida.nombres}
                </span>
                <span className="text-red-700 font-mono">Documento: {selectedStudentForSalida.numero_documento}</span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tipo de Novedad de Salida</label>
                <select 
                  value={estadoSalida} 
                  onChange={(e) => setEstadoSalida(e.target.value as EstadoAprendiz)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 font-semibold focus:outline-none focus:border-[#39a900]"
                >
                  <option value="Retiro Voluntario">Retiro Voluntario</option>
                  <option value="Cancelado">Cancelación de Matrícula</option>
                  <option value="Aplazado">Aplazamiento</option>
                  <option value="Trasladado">Traslado de Salida</option>
                  <option value="Desercion">Deserción</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Fecha de la Novedad</label>
                <input 
                  type="date" 
                  value={fechaSalida} 
                  onChange={(e) => setFechaSalida(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 font-mono"
                  required 
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observación / Soporte Legal (Memorando / Radicado)</label>
                <textarea 
                  rows={3}
                  value={observacionSalida}
                  onChange={(e) => setObservacionSalida(e.target.value)}
                  placeholder="Detalle el motivo o número de radicado..."
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-none focus:border-[#39a900]"
                  required
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setSelectedStudentForSalida(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors shadow-sm cursor-pointer"
                >
                  {isSubmitting ? 'Guardando...' : 'Confirmar Salida'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showIncorporarModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#39a900]" /> Incorporar Nuevo Aprendiz a la Ficha
              </h3>
              <button onClick={() => setShowIncorporarModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveIncorporacion} className="p-6 space-y-4 text-xs overflow-y-auto">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-[11px] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#39a900] flex-shrink-0" />
                <span>Los documentos se limpian automáticamente y los nombres se formatean en mayúsculas para evitar duplicados.</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo Documento</label>
                  <select 
                    value={nuevoTipoDoc} 
                    onChange={(e) => setNuevoTipoDoc(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 font-semibold"
                  >
                    <option value="CC">CC - Cédula</option>
                    <option value="TI">TI - Tarjeta Identidad</option>
                    <option value="CE">CE - Cédula Extranjería</option>
                    <option value="PP">PP - Pasaporte</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Número de Documento *</label>
                  <input 
                    type="text" 
                    value={nuevoDoc} 
                    onChange={(e) => setNuevoDoc(e.target.value)}
                    placeholder="Ej. 1020304050"
                    className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 font-mono font-semibold"
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nombres *</label>
                  <input 
                    type="text" 
                    value={nuevoNombres} 
                    onChange={(e) => setNuevoNombres(e.target.value)}
                    placeholder="Nombres completos"
                    className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 font-semibold uppercase"
                    required 
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Apellidos *</label>
                  <input 
                    type="text" 
                    value={nuevoApellidos} 
                    onChange={(e) => setNuevoApellidos(e.target.value)}
                    placeholder="Apellidos completos"
                    className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 font-semibold uppercase"
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Correo Electrónico</label>
                  <input 
                    type="email" 
                    value={nuevoCorreo} 
                    onChange={(e) => setNuevoCorreo(e.target.value)}
                    placeholder="correo@sena.edu.co"
                    className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 lowercase"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Teléfono / Celular</label>
                  <input 
                    type="text" 
                    value={nuevoTelefono} 
                    onChange={(e) => setNuevoTelefono(e.target.value)}
                    placeholder="3001234567"
                    className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tipo de Incorporación (Entrada)</label>
                <select 
                  value={nuevoTipoMovimiento} 
                  onChange={(e) => setNuevoTipoMovimiento(e.target.value as any)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 font-bold text-[#39a900]"
                >
                  <option value="Ingreso_Nuevo">🟢 Ingreso Nuevo</option>
                  <option value="Reingreso">🟢 Reingreso (Post-aplazamiento)</option>
                  <option value="Traslado_Entrada">🟢 Traslado de Entrada (Desde otra ficha/centro)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Fecha de Ingreso</label>
                <input 
                  type="date" 
                  value={nuevoFechaIngreso} 
                  onChange={(e) => setNuevoFechaIngreso(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 font-mono"
                  required 
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Motivo / Soporte Legal (Radicado o Memorando)</label>
                <textarea 
                  rows={2}
                  value={nuevoObservacion}
                  onChange={(e) => setNuevoObservacion(e.target.value)}
                  placeholder="Detalle el soporte de ingreso..."
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowIncorporarModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#39a900] text-white font-bold rounded-lg hover:bg-[#329600] transition-colors shadow-sm cursor-pointer"
                >
                  {isSubmitting ? 'Incorporando...' : 'Guardar e Integrar Aprendiz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

interface GestionInstructoresProps {
  courseData: any;
  currentFichaId: string;
  updateCourseData: (newData: any) => void;
  user: User | null;
}

export const GestionInstructores: React.FC<GestionInstructoresProps> = ({ 
  courseData, 
  currentFichaId, 
  updateCourseData, 
  user 
}) => {
  const [nombre, setNombre] = useState('');
  const [competencia, setCompetencia] = useState('');
  const [correoGmail, setCorreoGmail] = useState('');
  const [correoInst, setCorreoInst] = useState('');
  const [diaSemana, setDiaSemana] = useState('Lunes');
  const [fechaInicio, setFechaInicio] = useState('');
  const [rolNuevo, setRolNuevo] = useState('Instructor / Tutor');
  const [registradoPor, setRegistradoPor] = useState(user?.email || '');

  const [editingInstructorIndex, setEditingInstructorIndex] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editCompetencia, setEditCompetencia] = useState('');
  const [editCorreoGmail, setEditCorreoGmail] = useState('');
  const [editCorreoInst, setEditCorreoInst] = useState('');
  const [editDia, setEditDia] = useState('');
  const [editRol, setEditRol] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const equipoInstructores = courseData.equipo_instructores || [];
  const userRole = getUserSystemRole(user, equipoInstructores);
  const esLiderOSuperior = userRole === 'ADMIN' || userRole === 'COORDINADOR' || userRole === 'INSTRUCTOR_LIDER';

  const handleOpenEditModal = (instructor: any, index: number) => {
    if (!esLiderOSuperior) {
      alert("Acceso denegado: Solo el Instructor Líder, Coordinador o Administrador pueden editar los datos del equipo ejecutor.");
      return;
    }
    setEditingInstructorIndex(index);
    setEditNombre(instructor.nombre_del_instructor || instructor.nombre || '');
    setEditCompetencia(instructor.competencia || '');
    setEditCorreoGmail(instructor.correo_gmail || '');
    setEditCorreoInst(instructor.correo_institucional || instructor.correo_institucional_sena || '');
    setEditDia(instructor.dia || instructor.dia_semana || 'Lunes');
    setEditRol(instructor.rol || (instructor.es_lider ? 'Instructor Lider' : 'Instructor / Tutor'));
  };

  const handleSaveEditedInstructor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingInstructorIndex === null) return;
    if (!esLiderOSuperior) {
      alert("No tienes permisos suficientes para realizar esta modificación.");
      return;
    }

    setIsSubmittingEdit(true);
    const instructorOriginal = equipoInstructores[editingInstructorIndex];

    const instructorActualizado = {
      ...instructorOriginal,
      nombre_del_instructor: sanitizarTextoNombre(editNombre),
      competencia: editCompetencia.trim(),
      correo_gmail: sanitizarEmail(editCorreoGmail),
      correo_institucional: sanitizarEmail(editCorreoInst),
      correo_institucional_sena: sanitizarEmail(editCorreoInst),
      dia: editDia,
      rol: editRol,
      es_lider: editRol === 'Instructor Lider'
    };

    const nuevoEquipo = [...equipoInstructores];
    nuevoEquipo[editingInstructorIndex] = instructorActualizado;

    const updatedCourseData = {
      ...courseData,
      equipo_instructores: nuevoEquipo
    };

    try {
      await updateFichaCompleteData(updatedCourseData, currentFichaId);
      updateCourseData(updatedCourseData);
      localStorage.setItem(`sena_ficha_data_${currentFichaId}`, JSON.stringify(updatedCourseData));

      await registrarLogAuditoria(
        currentFichaId,
        user?.email || 'sistema@sena.edu.co',
        'MODIFICAR_FICHA',
        `El Instructor Líder (${user?.email}) editó los datos del instructor ${instructorOriginal.nombre_del_instructor} en la ficha ${currentFichaId}.`,
        instructorOriginal,
        instructorActualizado
      );

      alert("¡Datos del instructor actualizados y auditados exitosamente!");
      setEditingInstructorIndex(null);
    } catch (error) {
      console.error("Error al actualizar instructor en Firestore:", error);
      updateCourseData(updatedCourseData);
      alert("Guardado localmente (Error de sincronización con Firestore).");
      setEditingInstructorIndex(null);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleRegistrarInstructor = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!esLiderOSuperior) {
      alert("Acceso denegado: Solo el Instructor Líder o superior pueden registrar nuevos instructores.");
      return;
    }

    if (!nombre || !competencia || !correoInst || !fechaInicio || !registradoPor) {
      alert("Por favor complete los campos obligatorios.");
      return;
    }

    const nuevoInstructor = {
      nombre_del_instructor: sanitizarTextoNombre(nombre),
      competencia: competencia.trim(),
      correo_gmail: sanitizarEmail(correoGmail),
      correo_institucional: sanitizarEmail(correoInst),
      correo_institucional_sena: sanitizarEmail(correoInst),
      dia: diaSemana,
      rol: rolNuevo,
      es_lider: rolNuevo === 'Instructor Lider',
      fecha_inicio: fechaInicio,
      fecha_fin: null,
      registrado_por: sanitizarEmail(registradoPor)
    };

    const updatedEquipo = equipoInstructores.map((inst: any) => {
      if (inst.competencia === competencia && inst.dia === diaSemana && !inst.fecha_fin) {
        return { ...inst, fecha_fin: fechaInicio };
      }
      return inst;
    });

    updatedEquipo.push(nuevoInstructor);

    const updatedCourseData = {
      ...courseData,
      equipo_instructores: updatedEquipo
    };

    try {
      await updateFichaCompleteData(updatedCourseData, currentFichaId);
      updateCourseData(updatedCourseData);

      await registrarLogAuditoria(
        currentFichaId,
        user?.email || registradoPor,
        'REEMPLAZAR_INSTRUCTOR',
        `Se registró o reemplazó al instructor ${nombre} con rol "${rolNuevo}" para la competencia "${competencia}" en la ficha ${currentFichaId}.`,
        equipoInstructores,
        updatedEquipo
      );

      alert("¡Instructor registrado y auditado exitosamente en Firebase Firestore!");
      
      setNombre('');
      setCompetencia('');
      setCorreoGmail('');
      setCorreoInst('');
      setFechaInicio('');
      setRolNuevo('Instructor / Tutor');
    } catch (error) {
      console.error("Error al guardar en Firestore:", error);
      alert("Hubo un error al sincronizar con Firebase. Los cambios se guardaron localmente.");
    }
  };

  const getRoleBadgeClass = (rol: string) => {
    if (rol === 'Instructor Lider') {
      return 'bg-emerald-100 text-[#39a900] border border-emerald-300 font-bold px-2.5 py-1 rounded-full text-[11px]';
    }
    if (rol === 'Coordinador Academico') {
      return 'bg-blue-100 text-blue-800 border border-blue-300 font-bold px-2.5 py-1 rounded-full text-[11px]';
    }
    return 'bg-slate-100 text-slate-700 border border-slate-200 font-semibold px-2.5 py-1 rounded-full text-[11px]';
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
      <div className="border-b border-slate-200 pb-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">👥 Módulo de Gestión y Reemplazo de Instructores - Ficha {currentFichaId}</h2>
          <p className="text-xs text-slate-500 mt-1">
            Gestione los roles institucionales y edite la información del equipo ejecutor.
          </p>
        </div>
        <span className="px-3 py-1 bg-emerald-50 text-[#39a900] font-bold text-xs rounded-lg border border-emerald-200">
          Rol: {userRole}
        </span>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-800">Equipo Ejecutor e Instructores Asignados</h3>
        {equipoInstructores.length === 0 ? (
          <p className="text-xs text-slate-400 italic p-4 bg-slate-50 rounded-lg">No hay instructores registrados actualmente.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 uppercase font-bold border-b">
                  <th className="p-3">Instructor</th>
                  <th className="p-3">Rol Institucional</th>
                  <th className="p-3">Competencia</th>
                  <th className="p-3">Día</th>
                  <th className="p-3">Correo Institucional</th>
                  <th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {equipoInstructores.map((inst: any, idx: number) => {
                  const rolActual = inst.rol || (inst.es_lider ? 'Instructor Lider' : 'Instructor / Tutor');
                  return (
                    <tr key={idx} className={inst.fecha_fin ? "bg-slate-50 text-slate-400" : "hover:bg-slate-50"}>
                      <td className="p-3 font-bold text-slate-800 whitespace-nowrap">
                        {inst.nombre_del_instructor || inst.nombre}
                      </td>
                      
                      <td className="p-3 whitespace-nowrap">
                        <span className={getRoleBadgeClass(rolActual)}>
                          {rolActual}
                        </span>
                      </td>

                      <td className="p-3 max-w-xs truncate" title={inst.competencia}>{inst.competencia}</td>
                      <td className="p-3">{inst.dia || inst.dia_semana || 'N/A'}</td>
                      <td className="p-3">{inst.correo_institucional || inst.correo_institucional_sena || inst.correo_gmail}</td>
                      <td className="p-3 text-center whitespace-nowrap">
                        {esLiderOSuperior ? (
                          <button
                            onClick={() => handleOpenEditModal(inst, idx)}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#39a900] font-bold rounded-lg border border-emerald-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                            title="Editar instructor"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Editar
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Solo Líder</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingInstructorIndex !== null && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#39a900]" /> Editar Datos del Instructor
              </h3>
              <button onClick={() => setEditingInstructorIndex(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedInstructor} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-[11px] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#39a900] flex-shrink-0" />
                <span>Los correos se convertirán a minúsculas y los nombres a mayúsculas automáticamente.</span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre Completo</label>
                <input 
                  type="text" 
                  value={editNombre} 
                  onChange={e => setEditNombre(e.target.value)} 
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 font-semibold uppercase focus:outline-none focus:border-[#39a900]" 
                  required 
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Competencia Asociada</label>
                <input 
                  type="text" 
                  value={editCompetencia} 
                  onChange={e => setEditCompetencia(e.target.value)} 
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-none focus:border-[#39a900]" 
                  required 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Correo Gmail / Personal</label>
                  <input 
                    type="email" 
                    value={editCorreoGmail} 
                    onChange={e => setEditCorreoGmail(e.target.value)} 
                    className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 lowercase" 
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Correo Institucional SENA</label>
                  <input 
                    type="email" 
                    value={editCorreoInst} 
                    onChange={e => setEditCorreoInst(e.target.value)} 
                    className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 font-semibold lowercase" 
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Día Asignado</label>
                  <select 
                    value={editDia} 
                    onChange={e => setEditDia(e.target.value)} 
                    className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 font-semibold"
                  >
                    {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rol Institucional</label>
                  <select 
                    value={editRol} 
                    onChange={e => setEditRol(e.target.value)} 
                    className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 font-bold text-[#39a900]"
                  >
                    <option value="Instructor / Tutor">Instructor / Tutor</option>
                    <option value="Instructor Lider">Instructor Líder</option>
                    <option value="Coordinador Academico">Coordinador Académico</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setEditingInstructorIndex(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmittingEdit}
                  className="px-5 py-2 bg-[#39a900] text-white font-bold rounded-lg hover:bg-[#329600] transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" /> {isSubmittingEdit ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {esLiderOSuperior ? (
        <div className="border-t border-slate-200 pt-6">
          <h3 className="text-sm font-bold text-slate-800 mb-4">➕ Registrar o Reemplazar Instructor</h3>
          <form onSubmit={handleRegistrarInstructor} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nombre completo del instructor</label>
              <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#39a900] uppercase font-semibold" required />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Competencia asociada</label>
              <input type="text" value={competencia} onChange={e => setCompetencia(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#39a900]" required />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Correo Gmail / Personal</label>
              <input type="email" value={correoGmail} onChange={e => setCorreoGmail(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#39a900] lowercase" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Correo institucional</label>
              <input type="email" value={correoInst} onChange={e => setCorreoInst(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#39a900] lowercase" required />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Día de la semana asignado</label>
              <select value={diaSemana} onChange={e => setDiaSemana(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#39a900]">
                {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Rol Institucional</label>
              <select value={rolNuevo} onChange={e => setRolNuevo(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#39a900] font-bold text-[#39a900]">
                <option value="Instructor / Tutor">Instructor / Tutor</option>
                <option value="Instructor Lider">Instructor Líder</option>
                <option value="Coordinador Academico">Coordinador Académico</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Fecha de inicio / reemplazo</label>
              <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#39a900]" required />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tu Correo (Autorización)</label>
              <input type="email" value={registradoPor} onChange={e => setRegistradoPor(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#39a900] lowercase" required />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button type="submit" className="px-6 py-2.5 bg-[#39a900] text-white font-bold rounded-lg hover:bg-[#329600] transition-colors shadow-sm cursor-pointer flex items-center gap-2">
                <UserPlus className="w-4 h-4" /> Guardar e Integrar Instructor
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-semibold text-center flex items-center justify-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600" /> Los formularios de registro y adición de instructores están restringidos exclusivamente al Instructor Líder y Coordinación.
        </div>
      )}
    </div>
  );
};
