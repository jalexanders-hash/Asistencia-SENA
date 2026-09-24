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
  Check
} from 'lucide-react';

const formatDateForData = (dateString: string) => {
  const [year, month, day] = dateString.split('-');
  return `${parseInt(month)}/${parseInt(day)}/${year}`;
};

export default function App() {
  const [courseData, setCourseData] = useState(initialCourseData);
  const [isLoading, setIsLoading] = useState(true);
  
  const [currentFichaId, setCurrentFichaId] = useState<string>("3387401");
  const [currentInstructorIdx, setCurrentInstructorIdx] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState('');

  const [mainView, setMainView] = useState<'listado' | 'tablero'>('listado');
  const [activeTab, setActiveTab] = useState<'ficha' | 'asistencia' | 'alertas' | 'reportes'>('asistencia');
  const [limiteInasistencias, setLimiteInasistencias] = useState<number>(1);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);

  const [kpiFilter, setKpiFilter] = useState<'all' | 'present' | 'absent' | 'late' | 'risk'>('all');
  
  // Estados para plantillas de notificaciones con reglamento SENA
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [selectedStudentForNotification, setSelectedStudentForNotification] = useState<any>(null);
  const [notificationTemplateType, setNotificationTemplateType] = useState<'inasistencia' | 'llamado_atencion' | 'citacion'>('inasistencia');
  const [copiedNotification, setCopiedNotification] = useState(false);

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
  const [showDropdown, setShowDropdown] = useState(false);
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
      alert("Error al guardar la asistencia en la nube.");
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
    if (notificationTemplateType === 'inasistencia') {
      return `Asunto: Notificación por Inasistencia y Presunto Incumplimiento - Ficha ${courseData.ficha_de_caracterizacion}\n\nEstimado(a) aprendiz ${student.nombres} ${student.apellidos} (${student.numero_documento}),\n\nDe conformidad con el Reglamento del Aprendiz SENA (Acuerdo 07 de 2012 / Acuerdo Actualizado), le informamos que presenta un acumulado de ${student.fallasAcumuladas} inasistencias injustificadas en la competencia del programa ${courseData.denominacion}.\n\nLe recordamos el deber de asistencia puntual a las actividades de formación. Por favor acérquese con su instructor para presentar las justificaciones pertinentes.\n\nAtentamente,\n${instructorName}\nCC: ${correoInstructorActual}`;
    } else if (notificationTemplateType === 'llamado_atencion') {
      return `Asunto: Llamado de Atención Formal por Inasistencias Reiteradas - Ficha ${courseData.ficha_de_caracterizacion}\n\nEstimado(a) aprendiz ${student.nombres} ${student.apellidos},\n\nEl presente correo constituye un LLAMADO DE ATENCIÓN FORMAL debido a sus fallas continuas (${student.fallasAcumuladas} faltas), vulnerando los deberes y compromisos establecidos en la normativa institucional sobre la asistencia obligatoria a los procesos de formación.\n\nAtentamente,\n${instructorName}\nCC: ${correoInstructorActual}`;
    } else {
      return `Asunto: Citación a Comité / Descargos por Inasistencia - Ficha ${courseData.ficha_de_caracterizacion}\n\nEstimado(a) aprendiz ${student.nombres} ${student.apellidos},\n\nDado el incumplimiento reiterado en las normas de asistencia (${student.fallasAcumuladas} inasistencias), se le cita formalmente a reunión de seguimiento académico para revisión de su caso y emisión de descargos.\n\nAtentamente,\n${instructorName}\nCC: ${correoInstructorActual}`;
    }
  };

  if (!authReady || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-slate-500 font-medium">Cargando plataforma académica...</p>
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
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-slate-800">Acceso Restringido</h1>
          <p className="text-slate-600 mb-6">{authError || 'Tu usuario no tiene asignación en esta ficha.'}</p>
           
          <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-500 mb-6 text-left">
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
            <div className="w-11 h-11 bg-emerald-700 rounded-full flex items-center justify-center text-white font-bold shadow-md border-2 border-emerald-100">
              <span className="text-xs tracking-tighter">SENA</span>
            </div>
            <div>
              <span className="font-bold text-slate-800 text-base tracking-tight hidden sm:block">
                SENA - Gestión Académica
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                <select 
                  value={currentFichaId}
                  onChange={(e) => setCurrentFichaId(e.target.value)}
                  className="bg-emerald-50 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded border border-emerald-200 focus:outline-none cursor-pointer"
                >
                  <option value="3387401">Ficha: 3387401</option>
                  <option value="3407860">Ficha: 3407860 (Nuevo Grupo)</option>
                  <option value={courseData.ficha_de_caracterizacion}>{courseData.ficha_de_caracterizacion} (Actual)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
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
                    <span className="text-[11px] text-emerald-600 font-semibold cursor-pointer hover:underline" onClick={() => { setMainView('listado'); setActiveTab('alertas'); setShowNotificationsDropdown(false); }}>Configurar alertas</span>
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
                          className="w-14 text-center border border-slate-300 rounded px-1.5 py-0.5 text-xs font-bold bg-white"
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
                            className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-[11px] font-bold transition-colors whitespace-nowrap"
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
              <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs border-2 border-emerald-100">
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
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setMainView('listado')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${mainView === 'listado' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Users className="w-4 h-4" />
              Listado de Aprendices
            </button>
            <button
              onClick={() => setMainView('tablero')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${mainView === 'tablero' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Vista de Tablero
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <button 
              onClick={handleOpenAttendance}
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-700 text-white rounded-lg text-sm font-semibold hover:bg-emerald-800 shadow-sm transition-colors"
            >
              <ClipboardList className="w-4 h-4" />
              Tomar Asistencia
            </button>
            <button 
              onClick={() => setIsSheetsModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 shadow-sm transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Google Sheets</span>
            </button>
          </div>
        </div>

        <div>
          <p className="text-xs text-slate-500 mb-1">
            Inicio &gt; {mainView === 'listado' ? 'Listado de Aprendices' : 'Vista de Tablero'} &gt; <span className="font-semibold text-slate-800">Ficha {courseData.ficha_de_caracterizacion}</span>
          </p>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">
            {courseData.denominacion} - Ficha {courseData.ficha_de_caracterizacion}
          </h1>
        </div>

        {mainView === 'listado' && (
          <div className="space-y-6">
            <div className="flex border-b border-slate-200 gap-8 text-sm font-medium">
              <button 
                onClick={() => setActiveTab('asistencia')}
                className={`pb-3 transition-colors ${activeTab === 'asistencia' ? 'text-emerald-700 border-b-2 border-emerald-700 font-semibold' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Listado y Control de Asistencia
              </button>
              <button 
                onClick={() => setActiveTab('ficha')}
                className={`pb-3 transition-colors ${activeTab === 'ficha' ? 'text-emerald-700 border-b-2 border-emerald-700 font-semibold' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Datos de la Ficha
              </button>
              <button 
                onClick={() => setActiveTab('alertas')}
                className={`pb-3 transition-colors ${activeTab === 'alertas' ? 'text-emerald-700 border-b-2 border-emerald-700 font-semibold' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Configuración de Alertas
              </button>
              <button 
                onClick={() => setActiveTab('reportes')}
                className={`pb-3 transition-colors ${activeTab === 'reportes' ? 'text-emerald-700 border-b-2 border-emerald-700 font-semibold' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Reportes y Exportación
              </button>
            </div>

            {activeTab === 'ficha' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
                <h2 className="text-lg font-bold text-slate-800 border-b pb-3">Información General de la Ficha</h2>
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
                            <span className="font-semibold text-emerald-700 block">Días de formación programados:</span>
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
                    className={`bg-white rounded-xl border p-4 shadow-sm flex flex-col justify-between cursor-pointer transition-all ${kpiFilter === 'all' && !selectedStudentDoc ? 'border-emerald-700 ring-2 ring-emerald-700/20 bg-emerald-50/20' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-semibold text-slate-500">Total Aprendices</span>
                      <div className="p-2 bg-emerald-50 rounded-lg text-emerald-700"><Users className="w-4 h-4" /></div>
                    </div>
                    <span className="text-2xl font-bold text-slate-900 mt-3">{stats.totalStudents}</span>
                    <span className="text-[10px] text-slate-400 mt-1">Clic para mostrar todos</span>
                  </div>
                  
                  <div 
                    onClick={() => { setKpiFilter('present'); setSelectedStudentDoc(null); }}
                    className={`bg-white rounded-xl border p-4 shadow-sm flex flex-col justify-between cursor-pointer transition-all ${kpiFilter === 'present' ? 'border-emerald-700 ring-2 ring-emerald-700/20 bg-emerald-50/20' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-semibold text-slate-500">Asistencia Global</span>
                      <div className="p-2 bg-emerald-50 rounded-lg text-emerald-700"><CheckCircle2 className="w-4 h-4" /></div>
                    </div>
                    <span className="text-2xl font-bold text-emerald-700 mt-3">{stats.attendanceRate}%</span>
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

                {/* Filtros y Buscador */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="Buscar por nombre, apellido o documento..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:bg-white focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={showRiskOnly}
                        onChange={(e) => setShowRiskOnly(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                      />
                      Mostrar solo aprendices en riesgo
                    </label>
                  </div>
                </div>

                {/* Tabla de Asistencia */}
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
                            <th key={idx} className="p-3.5 text-center whitespace-nowrap font-mono">{date}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredStudents.map((student) => (
                          <tr key={student.numero_documento} className="hover:bg-slate-50/80">
                            <td className="p-3.5 font-bold text-slate-800 sticky left-0 bg-white z-10 whitespace-nowrap">
                              {student.apellidos} {student.nombres}
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
                                    <span className="text-emerald-600 font-bold">·</span>
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
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold bg-white"
                    />
                    <p className="text-xs text-slate-500 mt-1">Los aprendices que alcancen o superen este número de faltas aparecerán destacados en el centro de notificaciones.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reportes' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
                <h2 className="text-lg font-bold text-slate-800 border-b pb-3">Generador de Reportes Académicos</h2>
                <p className="text-sm text-slate-600">Haz clic en el siguiente botón para abrir la vista previa e imprimir los reportes detallados de inasistencias y tardanzas.</p>
                <button 
                  onClick={() => setShowExportModal(true)}
                  className="px-5 py-2.5 bg-emerald-700 text-white rounded-lg text-sm font-semibold hover:bg-emerald-800 flex items-center gap-2 shadow-sm transition-colors"
                >
                  <Printer className="w-4 h-4" /> Abrir Generador de Reportes PDF
                </button>
              </div>
            )}
          </div>
        )}

        {mainView === 'tablero' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-800">Vista de Tablero y Estadísticas Generales</h2>
            <p className="text-sm text-slate-600">Resumen analítico del comportamiento de asistencia de la ficha {courseData.ficha_de_caracterizacion}.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-semibold text-slate-500">Total Aprendices Matriculados</span>
                <p className="text-2xl font-bold text-slate-800 mt-1">{stats.totalStudents}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-semibold text-slate-500">Porcentaje de Asistencia General</span>
                <p className="text-2xl font-bold text-emerald-700 mt-1">{stats.attendanceRate}%</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-semibold text-slate-500">Aprendices en Riesgo Académico</span>
                <p className="text-2xl font-bold text-red-600 mt-1">{stats.enRiesgo}</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL TOMAR ASISTENCIA */}
      {showAttendanceModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-emerald-600" /> Registro Diario de Asistencia
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
                className="px-5 py-2 bg-emerald-700 text-white rounded-lg text-sm font-semibold hover:bg-emerald-800 flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
              >
                {isSavingAttendance && <Loader2 className="w-4 h-4 animate-spin" />}
                Guardar Asistencia
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PLANTILLA NOTIFICACIÓN */}
      {showNotificationModal && selectedStudentForNotification && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Mail className="w-5 h-5 text-emerald-600" /> Plantilla de Comunicación SENA
              </h3>
              <button onClick={() => setShowNotificationModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setNotificationTemplateType('inasistencia')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${notificationTemplateType === 'inasistencia' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  Inasistencia
                </button>
                <button
                  onClick={() => setNotificationTemplateType('llamado_atencion')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${notificationTemplateType === 'llamado_atencion' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  Llamado de Atención
                </button>
                <button
                  onClick={() => setNotificationTemplateType('citacion')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${notificationTemplateType === 'citacion' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  Citación
                </button>
              </div>

              <textarea 
                readOnly
                value={getNotificationTemplateText(selectedStudentForNotification)}
                rows={10}
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
                className="px-5 py-2 bg-emerald-700 text-white rounded-lg text-sm font-semibold hover:bg-emerald-800 flex items-center gap-2 shadow-sm transition-colors"
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
        courseData={courseData} 
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
