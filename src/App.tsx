import React, { useMemo, useState, useEffect } from 'react';
import { courseData as initialCourseData } from './data';
import { subscribeToFichaData, saveAttendanceData } from './lib/firebase';
import { REPORT_TYPES, generatePDFReport } from './lib/pdfGenerator';
import { HelpModal } from './components/HelpModal';
import { SheetsTemplateModal } from './components/SheetsTemplateModal';
import ExportReportModal from './components/ExportReportModal';
import { auth } from "./lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { Login } from "./components/Login";
import { LogOut } from "lucide-react";
import { 
  Users, 
  BookOpen, 
  XCircle,
  Clock,
  AlertCircle,
  Search,
  Mail,
  AlertTriangle,
  Loader2,
  ClipboardList,
  FileOutput,
  FileSpreadsheet,
  Bell,
  CheckCircle2,
  Settings,
  Calendar,
  Save,
  FileText,
  Layers,
  Send,
  Copy,
  Check
} from 'lucide-react';

const formatDateForData = (dateString: string) => {
  const [year, month, day] = dateString.split('-');
  return `${parseInt(month)}/${parseInt(day)}/${year}`;
};

const formatDateForDisplay = (dateString: string) => {
  if (!dateString || dateString === '[Fecha]') return dateString;
  const parts = dateString.split('/');
  if (parts.length === 3) {
    const d = parts[1].padStart(2, '0');
    const m = parts[0].padStart(2, '0');
    const y = parts[2].slice(-2);
    return `${d}/${m}/${y}`;
  }
  return dateString;
};

export default function App() {
  const [courseData, setCourseData] = useState(initialCourseData);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estado para la Ficha Activa (Soporte Multi-Ficha / Grupos)
  const [currentFichaId, setCurrentFichaId] = useState<string>("3387401");

  const [currentInstructorIdx, setCurrentInstructorIdx] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState('');

  // Estados de navegación y configuración
  const [activeTab, setActiveTab] = useState<'ficha' | 'aprendices' | 'alertas' | 'reportes'>('aprendices');
  const [limiteInasistencias, setLimiteInasistencias] = useState<number>(1);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);

  // Estados de Filtro Interactivo del KPI Dashboard
  const [kpiFilter, setKpiFilter] = useState<'all' | 'present' | 'absent' | 'late' | 'risk'>('all');

  // Estado para el Modal de Notificaciones Masivas / Centralizadas
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [copiedDoc, setCopiedDoc] = useState<string | null>(null);

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
    
  // Modales de acciones
  const [isPreparingPdf, setIsPreparingPdf] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [tempRecords, setTempRecords] = useState<Record<string, string>>({});

  // Suscripción dinámica a Firebase según la Ficha Seleccionada
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

  const handleOpenExportModal = () => {
    setShowExportModal(true);
  };

  const handleExportConfirm = (selectedReportType: string, dateRange: { start: string; end: string }) => {
    setIsPreparingPdf(true);
    setTimeout(async () => {
      try {
        await generatePDFReport(selectedReportType, courseData, studentsWithStats, {
          startDate: dateRange.start,
          endDate: dateRange.end,
          mode: 'acumulado',
          instructor: 'all'
        });
      } catch (err) {
        console.error("Error generating PDF", err);
        alert("Hubo un error al generar el PDF.");
      }
      setIsPreparingPdf(false);
      setShowExportModal(false);
    }, 100);
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

      if (fallasAcumuladas >= limiteInasistencias) enRiesgo++;
      if (tardanzasAcumuladas >= 3) enRiesgoTarde++;

      return {
        ...student,
        fallasAcumuladas,
        tardanzasAcumuladas,
        fechasTarde,
        fechasFalla,
        enRiesgo: fallasAcumuladas >= limiteInasistencias,
        enRiesgoTarde: tardanzasAcumuladas >= 3
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

  // Filtrado avanzado combinando KPIs y barra de búsqueda
  const filteredStudents = useMemo(() => {
    let filtered = studentsWithStats;
     
    // Filtro por KPI interactivo
    if (kpiFilter === 'absent') {
      filtered = filtered.filter(s => s.fallasAcumuladas > 0);
    } else if (kpiFilter === 'late') {
      filtered = filtered.filter(s => s.tardanzasAcumuladas > 0);
    } else if (kpiFilter === 'risk') {
      filtered = filtered.filter(s => s.enRiesgo || s.enRiesgoTarde);
    } else if (kpiFilter === 'present') {
      filtered = filtered.filter(s => s.fallasAcumuladas === 0 && s.tardanzasAcumuladas === 0);
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
  }, [searchTerm, showRiskOnly, studentsWithStats, kpiFilter]);

  const correoInstructorActual = (currentInstructor as any)?.correo_institucional_sena || (currentInstructor as any)?.correo_institucional || currentInstructor?.correo || user?.email || '';

  if (!authReady || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-sena" />
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
            <LogOut className="w-4 h-4" />
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
            <div className="w-11 h-11 bg-sena rounded-full flex items-center justify-center text-white font-bold shadow-md border-2 border-emerald-100">
              <span className="text-xs tracking-tighter">SENA</span>
            </div>
            <div>
              <span className="font-bold text-slate-800 text-base tracking-tight hidden sm:block">
                SENA - Gestión Académica
              </span>
              {/* SELECTOR DE FICHA ACTIVA EN EL HEADER */}
              <div className="flex items-center gap-1.5 mt-0.5">
                <Layers className="w-3.5 h-3.5 text-sena" />
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
            {/* Campana de Notificaciones con Dropdown Interactiva */}
            <div className="relative">
              <button 
                onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600 relative transition-colors"
                title="Centro de Notificaciones"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                  3
                </span>
              </button>

              {showNotificationsDropdown && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 py-3 z-50">
                  <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Centro de Notificaciones</span>
                    <span className="text-[11px] text-sena font-semibold cursor-pointer hover:underline" onClick={() => { setActiveTab('alertas'); setShowNotificationsDropdown(false); }}>Configurar alertas</span>
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

                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                    <div className="px-4 py-2.5 hover:bg-slate-50 flex gap-3 text-xs border-l-4 border-red-500 bg-red-50/20">
                      <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-slate-800">{stats.enRiesgo} aprendices superan el límite de inasistencia.</p>
                        <span className="text-[10px] text-slate-400">Hace 10 minutos • Ficha {courseData.ficha_de_caracterizacion}</span>
                      </div>
                    </div>
                    <div className="px-4 py-2.5 hover:bg-slate-50 flex gap-3 text-xs border-l-4 border-sena">
                      <Mail className="w-4 h-4 text-sena flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-slate-800">Plantilla Acuerdo 09 de 2024 activa.</p>
                        <span className="text-[10px] text-slate-400">Hace 45 minutos • Sistema automático</span>
                      </div>
                    </div>
                    <div className="px-4 py-2.5 hover:bg-slate-50 flex gap-3 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-slate-800">Sincronización con Firebase exitosa.</p>
                        <span className="text-[10px] text-slate-400">Base de datos en tiempo real</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Perfil de Usuario */}
            <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
              <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs border-2 border-emerald-100">
                JS
              </div>
              <div className="hidden md:block text-left leading-tight">
                <p className="text-xs font-bold text-slate-800">Jorge Alexander Sepúlveda Vélez</p>
                <p className="text-[11px] text-slate-500">{user.email || 'j.sepulveda@email.com'}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6 w-full flex-grow">
        
        {/* Breadcrumb & Título Principal */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-xs text-slate-500 mb-1">
              Inicio &gt; Gestión Administrativa &gt; <span className="font-semibold text-slate-800">Ficha {courseData.ficha_de_caracterizacion}</span>
            </p>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900">
              {courseData.denominacion} - Ficha {courseData.ficha_de_caracterizacion}
            </h1>
          </div>

          {/* Botones de Acción Superior */}
          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={handleOpenAttendance}
              className="flex items-center gap-2 px-3.5 py-2 bg-sena text-white rounded-lg text-sm font-semibold hover:bg-sena-dark shadow-sm transition-colors"
            >
              <ClipboardList className="w-4 h-4" />
              Tomar Asistencia
            </button>
            <button 
              onClick={() => setShowNotificationModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
            >
              <Mail className="w-4 h-4 text-slate-500" />
              Notificar Faltas
            </button>
            <button 
              onClick={() => setIsSheetsModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 shadow-sm transition-colors"
              title="Cargar o actualizar formato con inasistencias en Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Formato Google Sheets</span>
            </button>
          </div>
        </div>

        {/* Pestañas de Navegación */}
        <div className="flex border-b border-slate-200 gap-8 text-sm font-medium">
          <button 
            onClick={() => setActiveTab('ficha')}
            className={`pb-3 transition-colors ${activeTab === 'ficha' ? 'text-sena border-b-2 border-sena font-semibold' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Datos de la Ficha
          </button>
          <button 
            onClick={() => setActiveTab('aprendices')}
            className={`pb-3 transition-colors ${activeTab === 'aprendices' ? 'text-sena border-b-2 border-sena font-semibold' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Listado de Aprendices
          </button>
          <button 
            onClick={() => setActiveTab('alertas')}
            className={`pb-3 transition-colors ${activeTab === 'alertas' ? 'text-sena border-b-2 border-sena font-semibold' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Configuración de Alertas
          </button>
          <button 
            onClick={() => setActiveTab('reportes')}
            className={`pb-3 transition-colors ${activeTab === 'reportes' ? 'text-sena border-b-2 border-sena font-semibold' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Reportes y Exportación
          </button>
        </div>

        {/* CONTENIDO SEGÚN PESTAÑA ACTIVA */}
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

            <h3 className="text-md font-bold text-slate-800 border-t pt-4 mt-6">Equipo Ejecutor de Instructores</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 uppercase">
                    <th className="p-3">Competencia</th>
                    <th className="p-3">Instructor</th>
                    <th className="p-3">Correo</th>
                    <th className="p-3">Día</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {courseData.equipo_instructores?.map((inst: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3 font-medium text-slate-800">{inst.competencia}</td>
                      <td className="p-3">{inst.nombre_del_instructor}</td>
                      <td className="p-3 text-slate-500">{inst.correo_institucional_sena || inst.correo_google}</td>
                      <td className="p-3">{inst.dia}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'aprendices' && (
          <>
            {/* Tarjetas KPI Interactivas / Dinámicas */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div 
                onClick={() => setKpiFilter('all')}
                className={`bg-white rounded-xl border p-4 shadow-sm flex flex-col justify-between cursor-pointer transition-all ${kpiFilter === 'all' ? 'border-sena ring-2 ring-sena/20 bg-emerald-50/20' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold text-slate-500">Total Aprendices</span>
                  <div className="p-2 bg-emerald-50 rounded-lg text-sena"><Users className="w-4 h-4" /></div>
                </div>
                <span className="text-2xl font-bold text-slate-900 mt-3">{stats.totalStudents}</span>
                <span className="text-[10px] text-slate-400 mt-1">Clic para mostrar todos</span>
              </div>
              
              <div 
                onClick={() => setKpiFilter('present')}
                className={`bg-white rounded-xl border p-4 shadow-sm flex flex-col justify-between cursor-pointer transition-all ${kpiFilter === 'present' ? 'border-sena ring-2 ring-sena/20 bg-emerald-50/20' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold text-slate-500">Asistencia Global</span>
                  <div className="p-2 bg-emerald-50 rounded-lg text-sena"><CheckCircle2 className="w-4 h-4" /></div>
                </div>
                <span className="text-2xl font-bold text-sena mt-3">{stats.attendanceRate}%</span>
                <span className="text-[10px] text-slate-400 mt-1">Sin inasistencias</span>
              </div>

              <div 
                onClick={() => setKpiFilter('absent')}
                className={`bg-white rounded-xl border p-4 shadow-sm flex flex-col justify-between cursor-pointer transition-all ${kpiFilter === 'absent' ? 'border-red-500 ring-2 ring-red-500/20 bg-red-50/20' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold text-slate-500">Total Inasistencias</span>
                  <div className="p-2 bg-red-50 rounded-lg text-red-500"><XCircle className="w-4 h-4" /></div>
                </div>
                <span className="text-2xl font-bold text-slate-900 mt-3">{stats.absent}</span>
                <span className="text-[10px] text-slate-400 mt-1">Clic para filtrar faltas</span>
              </div>

              <div 
                onClick={() => setKpiFilter('late')}
                className={`bg-white rounded-xl border p-4 shadow-sm flex flex-col justify-between cursor-pointer transition-all ${kpiFilter === 'late' ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold text-slate-500">Llegadas Tarde</span>
                  <div className="p-2 bg-amber-50 rounded-lg text-amber-500"><Clock className="w-4 h-4" /></div>
                </div>
                <span className="text-2xl font-bold text-amber-600 mt-3">{stats.enRiesgoTarde}</span>
                <span className="text-[10px] text-slate-400 mt-1">Clic para filtrar retardos</span>
              </div>

              <div 
                onClick={() => setKpiFilter('risk')}
                className={`bg-white rounded-xl border p-4 shadow-sm flex flex-col justify-between cursor-pointer transition-all col-span-2 md:col-span-1 ${kpiFilter === 'risk' ? 'border-red-600 ring-2 ring-red-600/20 bg-red-50/30' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold text-slate-500">En Riesgo (&ge; {limiteInasistencias})</span>
                  <div className="p-2 bg-red-50 rounded-lg text-red-600"><AlertTriangle className="w-4 h-4" /></div>
                </div>
                <span className="text-2xl font-bold text-red-600 mt-3">{stats.enRiesgo}</span>
                <span className="text-[10px] text-red-500 mt-1 font-medium">Acuerdo 09 de 2024</span>
              </div>
            </div>

            {/* Dashboard / Listado de Aprendices */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      placeholder="Buscar por nombre o documento..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena"
                    />
                  </div>
                  {kpiFilter !== 'all' && (
                    <button
                      onClick={() => setKpiFilter('all')}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-colors"
                    >
                      Limpiar Filtro (KPI)
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => setShowRiskOnly(!showRiskOnly)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                      showRiskOnly 
                        ? 'bg-red-50 text-red-700 border-red-200' 
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {showRiskOnly ? 'Mostrando solo en riesgo' : 'Filtrar en riesgo'}
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-700 text-white uppercase text-xs tracking-wider border-b border-slate-800">
                      <th className="p-3.5 font-semibold w-12 text-center"><input type="checkbox" className="accent-sena rounded" /></th>
                      <th className="p-3.5 font-semibold">Aprendiz</th>
                      <th className="p-3.5 font-semibold text-center">Documento</th>
                      <th className="p-3.5 font-semibold text-center">Inasistencias</th>
                      <th className="p-3.5 font-semibold text-center">Retardos</th>
                      <th className="p-3.5 font-semibold text-center">Estado de Riesgo</th>
                      <th className="p-3.5 font-semibold">Dashboard de Fechas (Faltas / Tardes)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((student) => {
                        const fechasFaltasStr = student.fechasFalla.length > 0
                          ? student.fechasFalla.map(formatDateForDisplay).join(', ')
                          : '';

                        const fechasTardeStr = student.fechasTarde.length > 0
                          ? student.fechasTarde.map(formatDateForDisplay).join(', ')
                          : '';

                        const estaEnRiesgo = student.fallasAcumuladas >= limiteInasistencias || student.tardanzasAcumuladas >= 3;

                        return (
                          <tr key={student.numero_documento} className="hover:bg-slate-50/80 transition-colors align-top">
                            <td className="p-3.5 text-center pt-4">
                              <input type="checkbox" className="accent-sena rounded" />
                            </td>
                            <td className="p-3.5 font-medium text-slate-800 pt-4">
                              {student.apellidos} {student.nombres}
                              <span className="block text-[11px] text-slate-400 font-normal">{student.correo_electronico || 'Sin correo registrado'}</span>
                            </td>
                            <td className="p-3.5 text-center text-slate-500 font-mono text-xs pt-4">
                              {student.numero_documento}
                            </td>
                            <td className="p-3.5 text-center font-bold text-slate-700 pt-4">
                              <span className={`px-2 py-0.5 rounded ${student.fallasAcumuladas > 0 ? 'bg-red-50 text-red-600' : 'text-slate-600'}`}>
                                {student.fallasAcumuladas}
                              </span>
                            </td>
                            <td className="p-3.5 text-center font-bold text-slate-700 pt-4">
                              <span className={`px-2 py-0.5 rounded ${student.tardanzasAcumuladas > 0 ? 'bg-amber-50 text-amber-600' : 'text-slate-600'}`}>
                                {student.tardanzasAcumuladas}
                              </span>
                            </td>
                            <td className="p-3.5 text-center pt-4">
                              {estaEnRiesgo ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-red-100 text-red-700">
                                  ATENCIÓN REQUERIDA
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-sena-dark">
                                  Normal
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 text-xs text-slate-600 py-3">
                              <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                {fechasFaltasStr ? (
                                  <div>
                                    <span className="font-semibold text-red-600 flex items-center gap-1">
                                      <XCircle className="w-3.5 h-3.5" /> Faltas (X):
                                    </span>
                                    <span className="text-slate-700 font-mono ml-4 block">{fechasFaltasStr}</span>
                                  </div>
                                ) : (
                                  <span className="text-emerald-700 flex items-center gap-1 font-medium">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Sin inasistencias registradas
                                  </span>
                                )}

                                {fechasTardeStr && (
                                  <div className="pt-1 border-t border-slate-200/60">
                                    <span className="font-semibold text-amber-600 flex items-center gap-1">
                                      <Clock className="w-3.5 h-3.5" /> Retardos (Tarde):
                                    </span>
                                    <span className="text-slate-700 font-mono ml-4 block">{fechasTardeStr}</span>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">
                          No se encontraron aprendices con los filtros seleccionados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'alertas' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6 max-w-2xl">
            <h2 className="text-lg font-bold text-slate-800 border-b pb-3">Configuración de Umbrales de Alertas</h2>
            <div className="space-y-4 text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Límite de Inasistencias para Alerta de Deserción:</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="number" 
                    min="1" 
                    max="15" 
                    value={limiteInasistencias}
                    onChange={(e) => setLimiteInasistencias(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-24 border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold bg-white"
                  />
                  <span className="text-slate-500">faltas acumuladas (Aplica para Acuerdo 09 de 2024).</span>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900 text-xs space-y-1">
                <p className="font-bold">Información de Notificación Automática:</p>
                <p>Las alertas enviadas por correo electrónico incluirán en copia al instructor responsable actual: <strong>{correoInstructorActual}</strong>.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reportes' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-800 border-b pb-3">Generación de Reportes Académicos y Exportación</h2>
            <p className="text-sm text-slate-600">Desde este panel central puedes generar, previsualizar y exportar los informes oficiales consolidados de inasistencia en formato PDF.</p>
            <div className="flex gap-4">
              <button 
                onClick={handleOpenExportModal}
                disabled={isPreparingPdf}
                className="px-5 py-3 bg-sena text-white rounded-lg text-sm font-semibold hover:bg-sena-dark shadow-sm transition-colors flex items-center gap-2 disabled:opacity-70"
              >
                {isPreparingPdf ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileOutput className="w-5 h-5" />}
                <span>{isPreparingPdf ? 'Generando Reporte PDF...' : 'Exportar Reporte Consolidado PDF'}</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* MODAL DE NOTIFICACIONES / CENTRO DE ALERTAS (ACUERDO 09) */}
      {showNotificationModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Centro de Notificaciones - Reglamento SENA</h3>
                  <p className="text-xs text-slate-500">Aprendices que superan el límite de inasistencias ({limiteInasistencias} faltas)</p>
                </div>
              </div>
              <button onClick={() => setShowNotificationModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
            </div>

            <div className="space-y-4">
              {studentsWithStats.filter(s => s.enRiesgo).length > 0 ? (
                studentsWithStats.filter(s => s.enRiesgo).map(student => {
                  const fechasFaltasStr = student.fechasFalla.length > 0
                    ? student.fechasFalla.map(formatDateForDisplay).join(', ')
                    : 'Fechas no especificadas';

                  const emailSubject = `Notificación de Inasistencia y Requerimiento de Soportes - Ficha ${courseData.ficha_de_caracterizacion}`;
                  const emailBody = `Estimado(a) ${student.nombres} ${student.apellidos},\n\nLe informamos que registra ${student.fallasAcumuladas} inasistencia(s) en la ficha ${courseData.ficha_de_caracterizacion} en las siguientes fechas: ${fechasFaltasStr}.\n\nDe acuerdo con el Reglamento del Aprendiz SENA (Acuerdo 09 de 2024), por favor presentar los soportes o justificaciones correspondientes.\n\nAtentamente,\n${currentInstructor?.nombre_del_instructor || 'Instructor SENA'}\nCC: ${correoInstructorActual}`;

                  return (
                    <div key={student.numero_documento} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{student.apellidos} {student.nombres}</p>
                          <p className="text-xs text-slate-500">Doc: {student.numero_documento} • <strong className="text-red-600">{student.fallasAcumuladas} Faltas</strong></p>
                        </div>
                        <span className="text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-md font-semibold self-start sm:self-auto">
                          Requiere Notificación
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-100 space-y-1">
                        <p><strong>Destinatario:</strong> {student.correo_electronico || 'Sin correo electrónico registrado'}</p>
                        <p><strong>Copia (CC):</strong> {correoInstructorActual}</p>
                        <p><strong>Asunto:</strong> {emailSubject}</p>
                        <hr className="my-1 border-slate-100" />
                        <p className="whitespace-pre-line text-slate-700">{emailBody}</p>
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(emailBody);
                            setCopiedDoc(student.numero_documento);
                            setTimeout(() => setCopiedDoc(null), 2500);
                          }}
                          className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                        >
                          {copiedDoc === student.numero_documento ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                          {copiedDoc === student.numero_documento ? '¡Copiado al portapapeles!' : 'Copiar Plantilla de Correo'}
                        </button>
                        <a
                          href={`mailto:${student.correo_electronico || ''}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`}
                          className="px-3.5 py-2 bg-sena hover:bg-sena-dark text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                        >
                          <Send className="w-4 h-4" />
                          Abrir Cliente de Correo
                        </a>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">No hay aprendices en riesgo de inasistencia</p>
                  <p className="text-xs text-slate-500 mt-0.5">Ningún aprendiz supera el límite configurado de {limiteInasistencias} falta(s).</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t">
              <button 
                onClick={() => setShowNotificationModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modales y Componentes de Apoyo */}
      {isSheetsModalOpen && (
        <SheetsTemplateModal 
          isOpen={isSheetsModalOpen} 
          onClose={() => setIsSheetsModalOpen(false)} 
          currentFicha={currentFichaId}
          courseData={courseData}
          onDataLoaded={(newData) => {
            setCourseData(newData);
            setIsSheetsModalOpen(false);
          }}
        />
      )}

      {showExportModal && (
        <ExportReportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          onConfirm={handleExportConfirm}
          availableDates={currentInstructorDates}
        />
      )}

      {showAttendanceModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-slate-800">Registro de Asistencia</h3>
              <button onClick={() => setShowAttendanceModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha de la Sesión:</label>
                <input 
                  type="date" 
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-full"
                />
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-3">
                {courseData.asistencias_aprendices.map((student) => (
                  <div key={student.numero_documento} className="flex items-center justify-between py-1.5 border-b last:border-0 text-sm">
                    <span className="font-medium text-slate-700">{student.apellidos} {student.nombres}</span>
                    <select
                      value={tempRecords[student.numero_documento] || 'Presente'}
                      onChange={(e) => setTempRecords({ ...tempRecords, [student.numero_documento]: e.target.value })}
                      className="border rounded px-2 py-1 text-xs font-semibold bg-slate-50"
                    >
                      <option value="Presente">Presente (•)</option>
                      <option value="X">Inasistencia (X)</option>
                      <option value="Tarde">Retardo (Tarde)</option>
                      <option value="Excusa">Excusa / Incapacidad</option>
                      <option value="Evento">Evento Institucional</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t">
              <button 
                onClick={() => setShowAttendanceModal(false)}
                className="px-4 py-2 border rounded-lg text-sm text-slate-600 hover:bg-slate-50 font-medium"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveAttendance}
                disabled={isSavingAttendance}
                className="px-4 py-2 bg-sena text-white rounded-lg text-sm font-semibold hover:bg-sena-dark flex items-center gap-2"
              >
                {isSavingAttendance && <Loader2 className="w-4 h-4 animate-spin" />}
                Guardar Asistencia
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
