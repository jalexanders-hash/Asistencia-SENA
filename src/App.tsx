import React, { useMemo, useState, useEffect } from 'react';
import { courseData as initialCourseData } from './data';
import { subscribeToFichaData, saveAttendanceData } from './lib/firebase';
import { SheetsTemplateModal } from './components/SheetsTemplateModal';
import ExportReportModal from './components/ExportReportModal';
import { auth } from "./lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { Login } from "./components/Login";
import { 
  Users, 
  XCircle,
  Clock,
  AlertCircle,
  Search,
  Mail,
  AlertTriangle,
  Loader2,
  ClipboardList,
  FileSpreadsheet,
  Bell,
  CheckCircle2,
  Layers,
  FileText,
  X,
  ChevronDown,
  LayoutDashboard,
  Printer,
  Copy,
  Check,
  Wifi,
  WifiOff
} from 'lucide-react';

const LOGO_SENA_SVG = `data:image/svg+xml,%3c?xml%20version=%271.0%27%20encoding=%27utf-8%27?%3e%3c!--%20Generator:%20Adobe%20Illustrator%2026.0.1,%20SVG%20Export%20Plug-In%20.%20SVG%20Version:%206.00%20Build%200)%20--%3e%3csvg%20version=%271.1%27%20id=%27Capa_1%27%20xmlns=%27http://www.w3.org/2000/svg%27%20xmlns:xlink=%27http://www.w3.org/1999/xlink%27%20x=%270px%27%20y=%270px%27%20viewBox=%270%200%201000%201000%27%20style=%27enable-background:new%200%200%201000%201000;%27%20xml:space=%27preserve%27%3e%3cstyle%20type=%27text/css%27%3e%20.st0{fill:%2339a900;}%20%3c/style%3e%3cpath%20id=%27path47-5%27%20class=%27st0%27%20d=%27M504.2,20.5c-58.3,0.1-105.6,47.4-105.5,105.8c0.1,58.3,47.4,105.6,105.7,105.6%20c58.3,0,105.6-47.3,105.6-105.7V126C609.9,67.6,562.6,20.4,504.2,20.5z%20M155.6,264.6c-18.6,0.1-37.5,1.1-55.2,5.6%20c-11.7,3-23,7.8-30.3,15.4c-9.2,9.5-10.4,22.3-5.9,33.3c4,9.7,14.8,16.9,26.8,21.1c25.9,8.9,54.6,10.7,81.8,16.3%20c5,1.2,10.6,2.6,13.7,6c3.2,4.1,1.3,9.7-4,12.2c-8.8,4.5-20.1,4.5-30.4,4.4c-9.4-0.4-19.7-1.2-27.2-5.9c-5.5-3.4-6.5-9.1-5.2-14.1%20l-60.6,0c-0.2,9.2,1.6,18.9,8.4,26.8c5.6,6.8,14.8,11.5,24.6,14.4c15.7,4.6,32.7,6,49.4,6.4c22.7,0.4,45.8-0.3,67.6-5.4%20c13-3.2,25.8-8.3,34.1-16.6c14.8-14.8,11.3-38.3-8.3-49.8c-9.8-5.7-21.5-9.2-33.4-11.5c-17.5-3.6-35.3-6.3-52.9-9.2%20c-6.2-1.2-12.8-2.3-18-5.2c-5.5-2.9-5.9-9.8-0.3-12.9c7.2-4.1,16.8-4,25.4-4c9.1,0.2,19,0.7,26.5,5c4.2,2.3,5.9,6.3,5.9,10.1%20l57.6-0.1c-0.2-7.3-1.6-14.9-6.9-21.2c-6.2-7.8-17.1-12.7-28.3-15.5C192.8,265.6,174.1,264.7,155.6,264.6L155.6,264.6z%20M280.6,268.9%20l0,137.7l168.1,0l0-30H342.3v-26.7h94.9v-29.3h-94.9l0-21.9l102.6,0l-0.1-29.7L280.6,268.9z%20M557.5,269c0,0-51.9,0-77.9,0l0,137.7%20l59,0l0-92.7l80.8,92.6l81,0.1l0-137.7l-59.1,0l0.1,92L557.5,269z%20M805.6,269.2c0,0-63.6,91.9-95.6,137.7l61.9,0l14.9-24.8h95.7%20l13.9,24.9l68.8,0L874,269.2L805.6,269.2z%20M836.6,302.1l29.4,49.9l-60.7,0.1L836.6,302.1z%20M10.6,445.6l0.5,75l280.1-1%20c14.3,3.1,22.6,12.4,19.7,33.5L138.6,854.7l56.1,52.5l266.9-461.6L10.6,445.6z%20M545.2,446.2l262.4,459.6l58-52.1L691.3,552.9%20c-2.9-21.2,5.4-30.6,19.7-33.7l280.2,1l-0.1-73.7L545.2,446.2z%20M500.9,522.3L254.8,944.7l65.4,31.9L484.4,699%20c5.7-4.6,11.4-7.1,17.1-7.3c6-0.2,12.2,2,18.3,6.8l163.8,278.4l67.4-35.2L500.9,522.3z%27/%3e%3cg%20id=%27_x23_000000ff-2%27%20transform=%27matrix(0.31570611,0,0,0.23560774,-391.49698,-10.601126)%27%3e%3c/g%3e%3c/svg%3e`;

const formatDateForData = (dateString: string) => {
  if (!dateString) return "";
  
  if (dateString.includes('-')) {
    const [year, month, day] = dateString.split('-');
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
  }
  
  const parts = dateString.split('/');
  if (parts.length === 3) {
    const [m, d, y] = parts;
    return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
  }

  return dateString;
};

// Función de formateo visual para que las fechas se muestren estrictamente como DD/MM/YYYY en la interfaz
const displayAsDDMMYYYY = (dateStr: string) => {
  if (!dateStr) return "";
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [m, d, y] = parts;
    return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
  }
  return dateStr;
};

export default function App() {
  const [courseData, setCourseData] = useState(initialCourseData);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const [currentFichaId, setCurrentFichaId] = useState<string>("3387401");
  const [currentInstructorIdx, setCurrentInstructorIdx] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState('');

  const [mainView, setMainView] = useState<'listado' | 'tablero'>('listado');
  const [activeTab, setActiveTab] = useState<'ficha' | 'asistencia' | 'alertas' | 'reportes'>('asistencia');
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

  useEffect(() => {
    if (user && courseData) {
      const userEmail = user.email?.toLowerCase().trim();
      const idx = courseData.equipo_instructores.findIndex(
        (inst: any) => 
          inst.correo?.toLowerCase().trim() === userEmail ||
          inst.correo_google?.toLowerCase().trim() === userEmail ||
          inst.correo_institucional?.toLowerCase().trim() === userEmail
      );
      if (idx !== -1) {
        setCurrentInstructorIdx(idx);
        setAuthError('');
      } else {
        setCurrentInstructorIdx(null);
        setAuthError('Tu correo no está registrado como instructor en esta ficha.');
      }
    } else {
      setCurrentInstructorIdx(null);
    }
  }, [user, courseData]);
    
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentDoc, setSelectedStudentDoc] = useState<string | null>(null);
  const [showRiskOnly, setShowRiskOnly] = useState(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
    
  const currentInstructor = currentInstructorIdx !== null ? courseData.equipo_instructores[currentInstructorIdx] : null;

const currentInstructorDates = useMemo(() => {
    const dates = courseData.fechas_asistencia || [];
    // Ordenar cronológicamente para que las columnas de la tabla no aparezcan salteadas
    return [...dates].sort((a, b) => {
      const parseDate = (dStr: string) => {
        const parts = dStr.split('/');
        if (parts.length === 3) {
          // Soporta formato M/D/YYYY o DD/MM/YYYY
          return new Date(Number(parts[2]), Number(parts[0]) - 1, Number(parts[1])).getTime();
        }
        return 0;
      };
      return parseDate(a) - parseDate(b);
    });
  }, [courseData]);
    
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [tempRecords, setTempRecords] = useState<Record<string, string>>({});

  useEffect(() => {
    setIsLoading(true);
    
    const unsubscribe = subscribeToFichaData((data) => {
      if (data) {
        setCourseData(data);
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
    const formattedDate = formatDateForData(attendanceDate);
    const existingRecords: Record<string, string> = {};
     
    courseData.asistencias_aprendices.forEach(student => {
      const status = student.registros[formattedDate as keyof typeof student.registros];
      existingRecords[student.numero_documento] = status || 'Presente';
    });
     
    setTempRecords(existingRecords);
    setShowAttendanceModal(true);
  };

  const handleSaveAttendance = async () => {
    setIsSavingAttendance(true);
    const formattedDate = formatDateForData(attendanceDate);
     
    let newFechas = [...courseData.fechas_asistencia];
    if (!newFechas.includes(formattedDate)) {
      newFechas.push(formattedDate);
    }
     
    let newFechasPorInstructor = { ...(courseData.fechas_por_instructor || {}) };
    if (currentInstructor) {
      let currentDates = [...(newFechasPorInstructor[currentInstructor.nombre_del_instructor] || [])];
      if (!currentDates.includes(formattedDate)) {
        currentDates.push(formattedDate);
        newFechasPorInstructor[currentInstructor.nombre_del_instructor] = currentDates;
      }
    }
     
    const newAprendices = courseData.asistencias_aprendices.map(student => {
      const status = tempRecords[student.numero_documento];
      const newRegistros = { ...student.registros } as Record<string, string>;
      if (status === 'Presente') {
        delete newRegistros[formattedDate];
      } else {
        newRegistros[formattedDate] = status;
      }
      return { ...student, registros: newRegistros };
    });
     
    try {
      await saveAttendanceData(newFechas, newAprendices, newFechasPorInstructor, currentFichaId);
      setShowAttendanceModal(false);
      alert("Asistencia guardada correctamente.");
    } catch (error) {
      console.error("Failed to save attendance", error);
      localStorage.setItem(`sena_offline_ficha_${currentFichaId}`, JSON.stringify({ newFechas, newAprendices }));
      setShowAttendanceModal(false);
      alert("Sin conexión cloud: Asistencia guardada en modo local (Offline).");
    } finally {
      setIsSavingAttendance(false);
    }
  };

  const { stats, studentsWithStats } = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;
    let totalRecords = 0;
    let enRiesgo = 0;
    let enRiesgoTarde = 0;
    let totalPossibleRecords = courseData.asistencias_aprendices.length * currentInstructorDates.length;

    const augmented = courseData.asistencias_aprendices.map(student => {
      let fallasAcumuladas = 0;
      let tardanzasAcumuladas = 0;
      let fechasTarde: string[] = [];
      let fechasFalla: string[] = [];
       
currentInstructorDates.forEach(date => {
        // Buscamos el registro probando tanto la fecha exacta como sus posibles variantes de formato
        const status = student.registros[date] || 
                       student.registros[formatDateForData(date)] || 
                       student.registros[date.replace(/^0+/, '')];
        
        if (status) {
          totalRecords++;
          if (status === 'X') {
            absent++;
            fallasAcumuladas++;
            fechasFalla.push(date);
          }
          else if (status === 'Tarde') {
            late++;
            tardanzasAcumuladas++;
            fechasTarde.push(date);
          }
          else if (status === 'Excusa' || status === 'Evento') excused++;
        } else {
          present++;
        }
      });

      const isRisk = fallasAcumuladas >= limiteInasistencias;
      const isLateRisk = tardanzasAcumuladas >= 3;

      if (isRisk) enRiesgo++;
      if (isLateRisk) enRiesgoTarde++;

      return {
        ...student,
        fallasAcumuladas,
        tardanzasAcumuladas,
        fechasTarde,
        fechasFalla,
        enRiesgo: isRisk,
        enRiesgoTarde: isLateRisk
      };
    });

    augmented.sort((a, b) => {
      const nameA = `${a.apellidos} ${a.nombres}`.toLowerCase();
      const nameB = `${b.apellidos} ${b.nombres}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });

    return {
      studentsWithStats: augmented,
      stats: {
        present,
        absent,
        late,
        excused,
        enRiesgo,
        enRiesgoTarde,
        totalStudents: courseData.asistencias_aprendices.length,
        attendanceRate: totalPossibleRecords > 0 ? Math.round(((totalPossibleRecords - absent) / totalPossibleRecords) * 100) : 100
      }
    };
  }, [courseData, currentInstructorDates, limiteInasistencias]);

  const filteredStudents = useMemo(() => {
    let filtered = studentsWithStats;
     
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
  }, [searchTerm, selectedStudentDoc, showRiskOnly, studentsWithStats, kpiFilter]);

  const correoInstructorActual = (currentInstructor as any)?.correo_institucional_sena || (currentInstructor as any)?.correo_institucional || currentInstructor?.correo || user?.email || '';

  const riskStudentsList = useMemo(() => {
    return studentsWithStats.filter(s => s.enRiesgo || s.enRiesgoTarde);
  }, [studentsWithStats]);

  const getNotificationTemplateText = (student: any) => {
    const instructorName = currentInstructor?.nombre_del_instructor || "Instructor SENA";
    const fechasFallasInstructor = currentInstructorDates.filter(date => student.registros[date] === 'X');
    const fechasTardanzasInstructor = currentInstructorDates.filter(date => student.registros[date] === 'Tarde');

    if (notificationTemplateType === 'inasistencia') {
      const listadoFechas = fechasFallasInstructor.length > 0 ? fechasFallasInstructor.map(f => `- ${displayAsDDMMYYYY(f)}`).join('\n') : 'Ninguna registrada por este instructor';
      return `Asunto: Notificación por Inasistencia Injustificada (Acuerdo 009 de 2024) - Ficha ${courseData.ficha_de_caracterizacion}

Estimado(a) aprendiz ${student.nombres} ${student.apellidos} (${student.numero_documento}),

De conformidad con el Acuerdo 009 de 2024 (Reglamento del Aprendiz SENA), específicamente en su Artículo 27 ("Cumplimiento satisfactorio del proceso formativo") y el Artículo 29 ("Incumplimiento injustificado"), le informamos que registra un acumulado de ${fechasFallasInstructor.length} inasistencia(s) injustificada(s) en las sesiones de formación con este instructor:

${listadoFechas}

Le recordamos que, conforme al Artículo 28, las inasistencias no programadas deben justificarse formalmente con los respectivos soportes a más tardar dentro de los cinco (5) días hábiles siguientes a su ocurrencia. De lo contrario, se configurará deserción según el Artículo 30.

Atentamente,
${instructorName}
CC: ${correoInstructorActual} / Coordinación Académica`;

    } else if (notificationTemplateType === 'llegadas_tarde') {
      const listadoTardanzas = fechasTardanzasInstructor.length > 0 ? fechasTardanzasInstructor.map(f => `- ${displayAsDDMMYYYY(f)}`).join('\n') : 'Ninguna registrada por este instructor';
      return `Asunto: Llamado de Atención Formal por Llegadas Tarde - Ficha ${courseData.ficha_de_caracterizacion}

Estimado(a) aprendiz ${student.nombres} ${student.apellidos} (${student.numero_documento}),

El presente correo constituye un llamado de atención formal en relación con sus reiteradas llegadas tarde y ausencias parciales a las sesiones de formación programadas.

Conforme al Artículo 27 del Acuerdo 009 de 2024 del SENA, el cumplimiento satisfactorio exige puntualidad y participación activa. Las tardanzas registradas en las sesiones de este instructor son:

${listadoTardanzas}

La puntualidad es un compromiso institucional fundamental para el desarrollo adecuado de la competencia.

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

  if (currentInstructorIdx === null || currentInstructor === null) {
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
          <p className="text-slate-600">{authError || 'Tu correo no está registrado como instructor en esta ficha.'}</p>
           
          <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-500 text-left">
            <span className="font-semibold text-slate-700 block mb-1">Correo actual:</span>
            {user.email}
          </div>

          <button 
            onClick={() => signOut(auth)}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12 flex flex-col justify-between">
      
      {/* HEADER INSTITUCIONAL */}
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
                  <option value="3387401">Ficha: 3387401</option>
                  <option value="3407860">Ficha: 3407860 (Nuevo Grupo)</option>
                  <option value={courseData.ficha_de_caracterizacion}>{courseData.ficha_de_caracterizacion} (Actual)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${isOnline ? 'bg-emerald-50 text-[#39a900] border border-[#39a900]/30' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
              {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span>{isOnline ? 'En línea' : 'Modo Offline'}</span>
            </div>

            <div className="relative">
              <button 
                onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600 relative transition-colors"
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
                    <span className="text-[11px] text-[#39a900] font-semibold cursor-pointer hover:underline" onClick={() => { setMainView('listado'); setActiveTab('alertas'); setShowNotificationsDropdown(false); }}>Configurar alertas</span>
                  </div>

                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-700">Notificar a partir de:</span>
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
                      riskStudentsList.map((student) => (
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
                            className="px-2.5 py-1 bg-emerald-50 text-[#39a900] hover:bg-emerald-100 rounded text-[11px] font-bold transition-colors whitespace-nowrap"
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
              <div className="w-9 h-9 rounded-full bg-[#39a900]/10 flex items-center justify-center font-bold text-[#39a900] text-xs border-2 border-[#39a900]/20">
                JS
              </div>
              <div className="hidden md:block text-left leading-tight">
                <p className="text-xs font-bold text-slate-800">Jorge Alexander Sepúlveda Vélez</p>
                <p className="text-[11px] text-slate-500">{user.email}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* CUERPO PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6 w-full flex-grow">
        
        <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setMainView('listado')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${mainView === 'listado' ? 'bg-[#39a900] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Users className="w-4 h-4" />
              Listado y Asistencia
            </button>
            <button
              onClick={() => setMainView('tablero')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${mainView === 'tablero' ? 'bg-[#39a900] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Vista de Tablero (KPI)
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <button 
              onClick={handleOpenAttendance}
              className="flex items-center gap-2 px-3.5 py-2 bg-[#39a900] text-white rounded-lg text-sm font-semibold hover:bg-[#329600] shadow-sm transition-colors"
            >
              <ClipboardList className="w-4 h-4" />
              Tomar Asistencia
            </button>
            <button 
              onClick={() => setIsSheetsModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-[#39a900] hover:border-[#39a900]/50 shadow-sm transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#39a900]" />
              <span className="hidden sm:inline">Google Sheets</span>
            </button>
          </div>
        </div>

        <div>
          <p className="text-xs text-slate-500 mb-1">
            Inicio &gt; {mainView === 'listado' ? 'Listado de Aprendices' : 'Vista de Tablero'} &gt; <span className="font-semibold text-slate-800">Ficha {courseData.ficha_de_caracterizacion}</span>
          </p>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <img src={LOGO_SENA_SVG} alt="" className="w-7 h-7 inline-block" />
            {courseData.denominacion} - Ficha {courseData.ficha_de_caracterizacion}
          </h1>
        </div>

        {mainView === 'listado' && (
          <div className="space-y-6">
            <div className="flex border-b border-slate-200 gap-8 text-sm font-medium overflow-x-auto">
              <button 
                onClick={() => setActiveTab('asistencia')}
                className={`pb-3 transition-colors whitespace-nowrap ${activeTab === 'asistencia' ? 'text-[#39a900] border-b-2 border-[#39a900] font-semibold' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Listado y Control de Asistencia
              </button>
              <button 
                onClick={() => setActiveTab('ficha')}
                className={`pb-3 transition-colors whitespace-nowrap ${activeTab === 'ficha' ? 'text-[#39a900] border-b-2 border-[#39a900] font-semibold' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Datos de la Ficha
              </button>
              <button 
                onClick={() => setActiveTab('alertas')}
                className={`pb-3 transition-colors whitespace-nowrap ${activeTab === 'alertas' ? 'text-[#39a900] border-b-2 border-[#39a900] font-semibold' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Configuración de Alertas
              </button>
              <button 
                onClick={() => setActiveTab('reportes')}
                className={`pb-3 transition-colors whitespace-nowrap ${activeTab === 'reportes' ? 'text-[#39a900] border-b-2 border-[#39a900] font-semibold' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Reportes y Google Sheets
              </button>
            </div>

            {activeTab === 'ficha' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
                <h2 className="text-lg font-bold text-slate-800 border-b pb-3 flex items-center gap-2">
                  <img src={LOGO_SENA_SVG} alt="" className="w-5 h-5" /> Información General de la Ficha
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div>
                    <span className="block font-semibold text-slate-500">Número de Ficha</span>
                    <p className="text-slate-800 text-base font-bold mt-0.5">{courseData.ficha_de_caracterizacion}</p>
                  </div>
                  <div>
                    <span className="block font-semibold text-slate-500">Programa de Formación</span>
                    <p className="text-slate-800 text-base font-bold mt-0.5">{courseData.programa}</p>
                  </div>
                  <div>
                    <span className="block font-semibold text-slate-500">Denominación</span>
                    <p className="text-slate-800 text-base font-bold mt-0.5">{courseData.denominacion}</p>
                  </div>
                  <div>
                    <span className="block font-semibold text-slate-500">Centro de Formación</span>
                    <p className="text-slate-800 text-base font-bold mt-0.5">{courseData.centro}</p>
                  </div>
                </div>

                <div className="border-t pt-6 space-y-4">
                  <h3 className="text-base font-bold text-slate-800">Equipo de Instructores y Días de Formación</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {courseData.equipo_instructores?.map((inst: any, idx: number) => {
                      const diasInst = courseData.fechas_por_instructor?.[inst.nombre_del_instructor] || courseData.fechas_asistencia;
                      return (
                        <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm">{inst.nombre_del_instructor}</h4>
                            <p className="text-xs text-slate-500 mt-0.5">Correo: {inst.correo || inst.correo_institucional || 'No registrado'}</p>
                          </div>
                          <div className="text-xs space-y-1 text-right md:text-left">
                            <span className="font-semibold text-[#39a900] block">Días de formación programados:</span>
                            <span className="text-slate-700 font-mono font-bold">{diasInst.length} sesiones</span>
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
                      <span className="text-xs font-semibold text-slate-500">Total Aprendices</span>
                      <div className="p-2 bg-emerald-50 rounded-lg text-[#39a900]"><Users className="w-4 h-4" /></div>
                    </div>
                    <span className="text-2xl font-bold text-slate-900 mt-3">{stats.totalStudents}</span>
                    <span className="text-[10px] text-slate-400 mt-1">Clic para mostrar todos</span>
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
                        {filteredStudents.map((student) => (
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
                              const status = student.registros[date];
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
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'alertas' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
                <h2 className="text-lg font-bold text-slate-800 border-b pb-3">Configuración de Alertas y Notificaciones</h2>
                <div className="max-w-md space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Límite de Inasistencias para Alertas</label>
                    <input 
                      type="number"
                      min="1"
                      max="20"
                      value={limiteInasistencias}
                      onChange={(e) => setLimiteInasistencias(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold bg-white text-[#39a900]"
                    />
                    <p className="text-xs text-slate-500 mt-1">Los aprendices que alcancen o superen este número de faltas aparecerán destacados en el centro de notificaciones según el Acuerdo 009 de 2024.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reportes' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-3 border-b pb-4">
                  <img src={LOGO_SENA_SVG} alt="" className="w-10 h-10" />
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Generador de Reportes y Sincronización Google Sheets</h2>
                    <p className="text-xs text-slate-500">Centralice la información académica discriminando por instructor y competencias.</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-4 rounded-xl border">
                  <div className="w-full sm:w-auto">
                    <label className="text-xs font-bold text-slate-700 block mb-1">Filtrar Reportes por Instructor:</label>
                    <select 
                      value={instructorFiltroReporte}
                      onChange={(e) => setInstructorFiltroReporte(e.target.value)}
                      className="border rounded-lg px-3 py-1.5 text-xs font-semibold bg-white text-slate-800"
                    >
                      <option value="todos">Todos los Instructores</option>
                      {courseData.equipo_instructores?.map((inst: any, idx: number) => (
                        <option key={idx} value={inst.nombre_del_instructor}>{inst.nombre_del_instructor}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 pt-2">
                  <button 
                    onClick={() => setShowExportModal(true)}
                    className="px-5 py-2.5 bg-[#39a900] text-white rounded-lg text-sm font-semibold hover:bg-[#329600] flex items-center gap-2 shadow-sm transition-colors"
                  >
                    <Printer className="w-4 h-4" /> Abrir Vista Previa y PDF
                  </button>
                  <button 
                    onClick={() => setIsSheetsModalOpen(true)}
                    className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-emerald-50 hover:text-[#39a900] flex items-center gap-2 shadow-sm transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-[#39a900]" /> Sincronizar Google Sheets
                  </button>
                </div>
              </div>
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
                <span className="text-xs font-semibold text-slate-500">Total Aprendices Matriculados</span>
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

      {/* MODAL: PERFIL HISTÓRICO DEL APRENDIZ */}
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
              <button onClick={() => setSelectedStudentForProfile(null)} className="text-slate-400 hover:text-slate-600">
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
                        const status = selectedStudentForProfile.registros[date];
                        return (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-3 font-mono font-bold text-slate-700">{displayAsDDMMYYYY(date)}</td>
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
                className="px-5 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-900"
              >
                Cerrar Perfil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TOMAR ASISTENCIA */}
      {showAttendanceModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <img src={LOGO_SENA_SVG} alt="" className="w-5 h-5" /> Registro Diario de Asistencia
              </h3>
              <button onClick={() => setShowAttendanceModal(false)} className="text-slate-400 hover:text-slate-600">
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
                {courseData.asistencias_aprendices.map((student) => (
                  <div key={student.numero_documento} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{student.apellidos} {student.nombres}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{student.numero_documento}</p>
                    </div>
                    <select
                      value={tempRecords[student.numero_documento] || 'Presente'}
                      onChange={(e) => setTempRecords({ ...tempRecords, [student.numero_documento]: e.target.value })}
                      className="border border-slate-300 rounded-lg px-3 py-1 text-xs font-bold bg-slate-50 text-slate-800"
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
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveAttendance}
                disabled={isSavingAttendance}
                className="px-5 py-2 bg-[#39a900] text-white rounded-lg text-sm font-semibold hover:bg-[#329600] flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
              >
                {isSavingAttendance && <Loader2 className="w-4 h-4 animate-spin" />}
                Guardar Asistencia
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PLANTILLA NOTIFICACIÓN ACUERDO 009 DE 2024 */}
      {showNotificationModal && selectedStudentForNotification && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <img src={LOGO_SENA_SVG} alt="" className="w-5 h-5" /> Plantilla Acuerdo 009 de 2024 SENA
              </h3>
              <button onClick={() => setShowNotificationModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setNotificationTemplateType('inasistencia')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${notificationTemplateType === 'inasistencia' ? 'bg-[#39a900] text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  Inasistencia
                </button>
                <button
                  onClick={() => setNotificationTemplateType('llegadas_tarde')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${notificationTemplateType === 'llegadas_tarde' ? 'bg-[#39a900] text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  Llegadas Tarde
                </button>
                <button
                  onClick={() => setNotificationTemplateType('citacion')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${notificationTemplateType === 'citacion' ? 'bg-[#39a900] text-white' : 'bg-slate-100 text-slate-600'}`}
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
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100"
              >
                Cerrar
              </button>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(getNotificationTemplateText(selectedStudentForNotification));
                  setCopiedNotification(true);
                  setTimeout(() => setCopiedNotification(false), 2000);
                }}
                className="px-5 py-2 bg-[#39a900] text-white rounded-lg text-sm font-semibold hover:bg-[#329600] flex items-center gap-2 shadow-sm transition-colors"
              >
                {copiedNotification ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedNotification ? 'Copiado al Portapapeles' : 'Copiar Texto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GOOGLE SHEETS */}
      <SheetsTemplateModal 
        isOpen={isSheetsModalOpen} 
        onClose={() => setIsSheetsModalOpen(false)} 
        currentFicha={currentFichaId}
        courseData={courseData} 
        onDataLoaded={(newData, targetFichaId) => {
          if (targetFichaId && targetFichaId !== currentFichaId) {
            setCurrentFichaId(targetFichaId);
          }
          setCourseData(JSON.parse(JSON.stringify(newData)));
        }}
      />

      {/* MODAL EXPORTAR / REPORTES */}
      <ExportReportModal 
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        courseData={courseData}
        students={studentsWithStats}
      />
    </div>
  );
}
