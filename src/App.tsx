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
  const [year, month, day] = dateString.split('-');
  return `${parseInt(month)}/${parseInt(day)}/${year}`;
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

  // Estados para plantillas de notificación Acuerdo 009 de 2024
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
    if (!currentInstructor) return [];
    if (courseData.fechas_por_instructor && courseData.fechas_por_instructor[currentInstructor.nombre_del_instructor]) {
      return courseData.fechas_por_instructor[currentInstructor.nombre_del_instructor];
    }
    return courseData.fechas_asistencia;
  }, [currentInstructor, courseData]);
  
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
    let unsubscribe: () => void;
    
    subscribeToFichaData((data) => {
      setCourseData(data);
      setIsLoading(false);
    }, currentFichaId).then(unsub => {
      unsubscribe = unsub;
    }).catch(err => {
      console.error("Error loading data from Firestore:", err);
      setIsLoading(false);
    });
    
    return () => {
      if (unsubscribe) unsubscribe();
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
      setIsLoading(false);
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
        const status = student.registros[date as keyof typeof student.registros];
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
      const listadoFechas = fechasFallasInstructor.length > 0 ? fechasFallasInstructor.map(f => `- ${f}`).join('\n') : 'Ninguna registrada por este instructor';
      return `Asunto: Notificación por Inasistencia Injustificada (Acuerdo 009 de 2024) - Ficha ${courseData.ficha_de_caracterizacion}

Estimado(a) aprendiz ${student.nombres} ${student.apellidos} (${student.numero_documento}),

De conformidad con el Acuerdo 009 de 2024 (Reglamento del Aprendiz SENA), específicamente en su Artículo 27 ("Cumplimiento satisfactorio del proceso formativo") y el Artículo 29 ("Incumplimiento injustificado"), le informamos que registra un acumulado de ${fechasFallasInstructor.length} inasistencia(s) injustificada(s) en las sesiones de formación con este instructor:

${listadoFechas}

Le recordamos que, conforme al Artículo 28, las inasistencias no programadas deben justificarse formalmente con los respectivos soportes a más tardar dentro de los cinco (5) días hábiles siguientes a su ocurrencia. De lo contrario, se configurará deserción según el Artículo 30.

Atentamente,
${instructorName}
CC: ${correoInstructorActual} / Coordinación Académica`;

    } else if (notificationTemplateType === 'llegadas_tarde') {
      const listadoTardanzas = fechasTardanzasInstructor.length > 0 ? fechasTardanzasInstructor.map(f => `- ${f}`).join('\n') : 'Ninguna registrada por este instructor';
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
              </div>
            )}

            {activeTab === 'asistencia' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
                  <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Buscar por nombre o número de documento..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#39a900]/30 focus:border-[#39a900]"
                    />
                  </div>
                  <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                      <input 
                        type="checkbox" 
                        checked={showRiskOnly} 
                        onChange={(e) => setShowRiskOnly(e.target.checked)}
                        className="rounded text-[#39a900] focus:ring-[#39a900]"
                      />
                      <span>Ver solo aprendices en riesgo</span>
                    </label>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="p-3">N°</th>
                        <th className="p-3">Apellidos y Nombres</th>
                        <th className="p-3">Documento</th>
                        <th className="p-3 text-center">Fallas (X)</th>
                        <th className="p-3 text-center">Tardanzas</th>
                        <th className="p-3 text-center">Estado</th>
                        <th className="p-3 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStudents.length > 0 ? (
                        filteredStudents.map((student, idx) => (
                          <tr key={student.numero_documento} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 text-slate-500">{idx + 1}</td>
                            <td className="p-3 font-semibold text-slate-800">{student.apellidos} {student.nombres}</td>
                            <td className="p-3 text-slate-600">{student.numero_documento}</td>
                            <td className="p-3 text-center font-bold text-red-600">{student.fallasAcumuladas}</td>
                            <td className="p-3 text-center font-bold text-amber-600">{student.tardanzasAcumuladas}</td>
                            <td className="p-3 text-center">
                              {student.enRiesgo ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">
                                  En Riesgo (Acuerdo 009)
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-[#39a900]">
                                  Regular
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => {
                                  setSelectedStudentForNotification(student);
                                  setShowNotificationModal(true);
                                }}
                                className="px-2.5 py-1 bg-emerald-50 text-[#39a900] hover:bg-emerald-100 rounded text-[11px] font-bold transition-colors inline-flex items-center gap-1"
                              >
                                <Mail className="w-3 h-3" /> Notificar
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-slate-400">
                            No se encontraron aprendices con los filtros seleccionados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'alertas' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
                <h2 className="text-lg font-bold text-slate-800 border-b pb-3 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-[#39a900]" /> Configuración de Alertas y Acuerdos
                </h2>
                <p className="text-sm text-slate-600">
                  Configure el umbral de inasistencias para el monitoreo de los aprendices acorde a los Artículos 27, 28, 29 y 30 del Reglamento del Aprendiz SENA (Acuerdo 009 de 2024).
                </p>
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 max-w-md">
                  <span className="text-sm font-semibold text-slate-700">Límite de Faltas para Alerta:</span>
                  <input 
                    type="number" 
                    min="1" 
                    max="20" 
                    value={limiteInasistencias}
                    onChange={(e) => setLimiteInasistencias(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 text-center border border-slate-300 rounded px-2 py-1 text-sm font-bold bg-white text-[#39a900]"
                  />
                </div>
              </div>
            )}

            {activeTab === 'reportes' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
                <h2 className="text-lg font-bold text-slate-800 border-b pb-3 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-[#39a900]" /> Reportes y Integración con Google Sheets
                </h2>
                <p className="text-sm text-slate-600">
                  Genere reportes detallados de asistencia o conecte la aplicación directamente con su plantilla de Google Sheets institucional.
                </p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setIsSheetsModalOpen(true)}
                    className="px-4 py-2 bg-[#39a900] text-white rounded-lg text-sm font-semibold hover:bg-[#329600] transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <FileSpreadsheet className="w-4 h-4" /> Abrir Plantilla Google Sheets
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {mainView === 'tablero' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div 
                onClick={() => setKpiFilter('all')}
                className={`bg-white p-5 rounded-xl border shadow-sm cursor-pointer transition-all ${kpiFilter === 'all' ? 'border-[#39a900] ring-2 ring-[#39a900]/20' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Aprendices</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalStudents}</p>
              </div>
              <div 
                onClick={() => setKpiFilter('risk')}
                className={`bg-white p-5 rounded-xl border shadow-sm cursor-pointer transition-all ${kpiFilter === 'risk' ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">Aprendices en Riesgo</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{stats.enRiesgo}</p>
              </div>
              <div 
                onClick={() => setKpiFilter('late')}
                className={`bg-white p-5 rounded-xl border shadow-sm cursor-pointer transition-all ${kpiFilter === 'late' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Tardanzas Registradas</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{stats.late}</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs font-semibold text-[#39a900] uppercase tracking-wider">Tasa de Asistencia</p>
                <p className="text-2xl font-bold text-[#39a900] mt-1">{stats.attendanceRate}%</p>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE TOMAR ASISTENCIA */}
        {showAttendanceModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-[#39a900]" /> Registro de Asistencia - Ficha {currentFichaId}
                </h3>
                <button onClick={() => setShowAttendanceModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto flex-grow">
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <label className="text-xs font-bold text-slate-700">Fecha de Asistencia:</label>
                  <input 
                    type="date" 
                    value={attendanceDate} 
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="border border-slate-300 rounded px-3 py-1.5 text-xs font-bold bg-white text-slate-800"
                  />
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="p-3">Aprendiz</th>
                        <th className="p-3 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {courseData.asistencias_aprendices.map((student) => {
                        const currentStatus = tempRecords[student.numero_documento] || 'Presente';
                        return (
                          <tr key={student.numero_documento} className="hover:bg-slate-50">
                            <td className="p-3 font-semibold text-slate-800">{student.apellidos} {student.nombres}</td>
                            <td className="p-3 text-center">
                              <select
                                value={currentStatus}
                                onChange={(e) => setTempRecords({ ...tempRecords, [student.numero_documento]: e.target.value })}
                                className="border border-slate-300 rounded px-2 py-1 text-xs font-bold bg-white"
                              >
                                <option value="Presente">Presente</option>
                                <option value="X">Falta (X)</option>
                                <option value="Tarde">Tarde</option>
                                <option value="Excusa">Excusa</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                <button 
                  onClick={() => setShowAttendanceModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveAttendance}
                  disabled={isSavingAttendance}
                  className="px-4 py-2 bg-[#39a900] text-white rounded-lg text-xs font-bold hover:bg-[#329600] flex items-center gap-2"
                >
                  {isSavingAttendance && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Guardar Asistencia
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE PLANTILLA DE NOTIFICACIÓN ACUERDO 009 */}
        {showNotificationModal && selectedStudentForNotification && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col">
              <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Mail className="w-5 h-5 text-[#39a900]" /> Notificación Institucional - Acuerdo 009 de 2024
                </h3>
                <button onClick={() => setShowNotificationModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setNotificationTemplateType('inasistencia')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${notificationTemplateType === 'inasistencia' ? 'bg-[#39a900] text-white' : 'bg-slate-100 text-slate-700'}`}
                  >
                    Inasistencia
                  </button>
                  <button
                    onClick={() => setNotificationTemplateType('llegadas_tarde')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${notificationTemplateType === 'llegadas_tarde' ? 'bg-[#39a900] text-white' : 'bg-slate-100 text-slate-700'}`}
                  >
                    Llegadas Tarde
                  </button>
                  <button
                    onClick={() => setNotificationTemplateType('citacion')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${notificationTemplateType === 'citacion' ? 'bg-[#39a900] text-white' : 'bg-slate-100 text-slate-700'}`}
                  >
                    Citación Comité
                  </button>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <textarea
                    readOnly
                    value={getNotificationTemplateText(selectedStudentForNotification)}
                    className="w-full h-64 bg-transparent text-xs text-slate-800 font-mono focus:outline-none resize-none"
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(getNotificationTemplateText(selectedStudentForNotification));
                    alert("Plantilla copiada al portapapeles.");
                  }}
                  className="px-4 py-2 bg-[#39a900] text-white rounded-lg text-xs font-bold hover:bg-[#329600] flex items-center gap-2"
                >
                  <Copy className="w-3.5 h-3.5" /> Copiar Plantilla
                </button>
              </div>
            </div>
          </div>
        )}

        {isSheetsModalOpen && (
          <SheetsTemplateModal isOpen={isSheetsModalOpen} onClose={() => setIsSheetsModalOpen(false)} courseData={courseData} />
        )}

        {showExportModal && (
          <ExportReportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} courseData={courseData} />
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 mt-12 text-center text-xs text-slate-500">
        <p>SENA - Servicio Nacional de Aprendizaje | Sistema de Gestión Académica y Asistencia</p>
      </footer>
    </div>
  );
}
