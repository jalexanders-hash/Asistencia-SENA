import React, { useMemo, useState, useEffect } from 'react';
import { courseData as initialCourseData } from './data';
import { subscribeToFichaData, saveAttendanceData } from './lib/firebase';
import { REPORT_TYPES, generatePDFReport } from './lib/pdfGenerator';
import { HelpModal } from './components/HelpModal';
import { SheetsTemplateModal } from './components/SheetsTemplateModal';
import ExportReportModal from './components/ExportReportModal';
import EmailTemplate from './components/EmailTemplate';
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
  FileText
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
  const [currentInstructorIdx, setCurrentInstructorIdx] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState('');

  // Estados de navegación y configuración
  const [activeTab, setActiveTab] = useState<'ficha' | 'aprendices' | 'alertas' | 'reportes'>('aprendices');
  const [limiteInasistencias, setLimiteInasistencias] = useState<number>(1);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);

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
  const [isHelpOpen, setIsHelpOpen] = useState(false);
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
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');

  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [tempRecords, setTempRecords] = useState<Record<string, string>>({});

  useEffect(() => {
    let unsubscribe: () => void;
     
    subscribeToFichaData((data) => {
      setCourseData(data);
      setIsLoading(false);
    }).then(unsub => {
      unsubscribe = unsub;
    }).catch(err => {
      console.error("Error loading data from Firestore:", err);
      setIsLoading(false);
    });
     
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

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
      await saveAttendanceData(newFechas, newAprendices, newFechasPorInstructor);
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
    if (currentInstructorDates.length > 0) {
      setExportStartDate(currentInstructorDates[0]);
      setExportEndDate(currentInstructorDates[currentInstructorDates.length - 1]);
    }
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

  const filteredStudents = useMemo(() => {
    let filtered = studentsWithStats;
     
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
  }, [searchTerm, showRiskOnly, studentsWithStats]);

  const correoInstructorActual = (currentInstructor as any)?.correo_institucional || currentInstructor?.correo || '';

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
            <span className="font-bold text-slate-800 text-base tracking-tight hidden sm:inline">
              SENA - Gestión Académica
            </span>
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
              onClick={() => setActiveTab('alertas')}
              className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
            >
              <Mail className="w-4 h-4 text-slate-500" />
              Notificar Faltas
            </button>
            <button 
              onClick={() => setIsSheetsModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 shadow-sm transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Formato Google Sheets</span>
            </button>
            <button 
              onClick={handleOpenExportModal}
              disabled={isPreparingPdf}
              className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-colors disabled:opacity-70"
            >
              {isPreparingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileOutput className="w-4 h-4 text-slate-500" />}
              <span>{isPreparingPdf ? 'Preparando...' : 'Exportar'}</span>
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
            Reportes
          </button>
        </div>

        {/* CONTENIDO SEGÚN PESTAÑA ACTIVA */}
        {activeTab === 'aprendices' && (
          <>
            {/* Tarjetas KPI */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold text-slate-500">Total Aprendices</span>
                  <div className="p-2 bg-emerald-50 rounded-lg text-sena"><Users className="w-4 h-4" /></div>
                </div>
                <span className="text-2xl font-bold text-slate-900 mt-3">{stats.totalStudents}</span>
              </div>
              
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold text-slate-500">Asistencia Global</span>
                  <div className="p-2 bg-emerald-50 rounded-lg text-sena"><CheckCircle2 className="w-4 h-4" /></div>
                </div>
                <span className="text-2xl font-bold text-sena mt-3">{stats.attendanceRate}%</span>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold text-slate-500">Total Inasistencias</span>
                  <div className="p-2 bg-red-50 rounded-lg text-red-500"><XCircle className="w-4 h-4" /></div>
                </div>
                <span className="text-2xl font-bold text-slate-900 mt-3">{stats.absent}</span>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold text-slate-500">Llegadas Tarde (&ge; 3)</span>
                  <div className="p-2 bg-amber-50 rounded-lg text-amber-500"><Clock className="w-4 h-4" /></div>
                </div>
                <span className="text-2xl font-bold text-amber-600 mt-3">{stats.enRiesgoTarde}</span>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between col-span-2 md:col-span-1">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold text-slate-500">En Riesgo (&ge; {limiteInasistencias})</span>
                  <div className="p-2 bg-red-50 rounded-lg text-red-600"><AlertTriangle className="w-4 h-4" /></div>
                </div>
                <span className="text-2xl font-bold text-red-600 mt-3">{stats.enRiesgo}</span>
              </div>
            </div>

            {/* Tabla de Aprendices */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
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
                      <th className="p-3.5 font-semibold text-center">Acciones / Notificación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((student) => {
                        const fechasFaltasStr = student.fechasFalla.length > 0
                          ? student.fechasFalla.map(formatDateForDisplay).join(', ')
                          : 'Sin inasistencias';

                        const estaEnRiesgo = student.fallasAcumuladas >= limiteInasistencias || student.tardanzasAcumuladas >= 3;

                        return (
                          <tr key={student.numero_documento} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3.5 text-center">
                              <input type="checkbox" className="accent-sena rounded" />
                            </td>
                            <td className="p-3.5 font-medium text-slate-800">
                              {student.apellidos} {student.nombres}
                            </td>
                            <td className="p-3.5 text-center text-slate-500 font-mono text-xs">
                              {student.numero_documento}
                            </td>
                            <td className="p-3.5 text-center font-bold text-slate-700">
                              {student.fallasAcumuladas}
                            </td>
                            <td className="p-3.5 text-center font-bold text-slate-700">
                              {student.tardanzasAcumuladas}
                            </td>
                            <td className="p-3.5 text-center">
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
                            <td className="p-3.5 text-center">
                              {estaEnRiesgo ? (
                                <EmailTemplate 
                                  nombreAprendiz={`${student.nombres} ${student.apellidos}`}
                                  documento={student.numero_documento}
                                  ficha={courseData.ficha_de_caracterizacion}
                                  fechasFaltas={fechasFaltasStr}
                                  correoInstructor={correoInstructorActual}
                                  correo_electronico={student.correo_electronico}
                                />
                              ) : (
                                <span className="text-slate-400 text-xs italic">Sin acciones</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">
                          No se encontraron aprendices con los filtros actuales.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'ficha' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 border-b pb-3">Información General de la Ficha</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <p className="text-xs text-slate-500 font-medium">Programa de Formación</p>
                <p className="font-semibold text-slate-800 text-base">{courseData.programa}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Denominación</p>
                <p className="font-semibold text-slate-800 text-base">{courseData.denominacion}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Centro de Formación</p>
                <p className="font-semibold text-slate-800 text-base">{courseData.centro}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Ficha de Caracterización</p>
                <p className="font-semibold text-sena text-base">{courseData.ficha_de_caracterizacion}</p>
              </div>
            </div>

            <h3 className="text-md font-bold text-slate-800 pt-4 border-b pb-2">Equipo de Instructores Asignados</h3>
            <div className="space-y-3">
              {courseData.equipo_instructores.map((inst, index) => (
                <div key={index} className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex flex-col md:flex-row justify-between gap-2">
                  <div>
                    <p className="font-bold text-slate-800">{inst.nombre_del_instructor}</p>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">{inst.competencia}</p>
                  </div>
                  <div className="text-xs text-right text-slate-500 flex flex-col justify-center">
                    <span>{inst.correo || inst.correo_institucional}</span>
                    <span className="font-semibold text-sena">{inst.dia} ({inst.fecha_de_inicio} - {inst.fecha_terminacion})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'alertas' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-sm max-w-2xl mx-auto">
            <h2 className="text-lg font-bold text-slate-800 border-b pb-3 flex items-center gap-2">
              <Settings className="w-5 h-5 text-sena" /> Configuración de Alertas y Reglamento SENA
            </h2>
            <div className="space-y-4 text-sm">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Límite de inasistencias para activar alerta de riesgo:</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="number" 
                    min="1" 
                    max="20" 
                    value={limiteInasistencias}
                    onChange={(e) => setLimiteInasistencias(Math.max(1, parseInt(e.target.value) || 1))}
                    className="border border-slate-300 rounded-lg px-3 py-2 w-24 text-center font-bold text-slate-800 focus:ring-2 focus:ring-sena"
                  />
                  <span className="text-slate-600 font-medium">falta(s) acumulada(s)</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">De acuerdo con el Reglamento del Aprendiz SENA, define el umbral a partir del cual se genera el requerimiento de soportes.</p>
              </div>

              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <p className="text-xs font-bold text-sena-dark uppercase">Copia de Evidencia (CC)</p>
                <p className="text-xs text-slate-700 mt-1">Los correos enviados a los aprendices incluirán copia automática institucional al instructor a cargo: <strong>{correoInstructorActual}</strong></p>
              </div>

              <div className="pt-4 flex justify-end">
                <button 
                  onClick={() => { setActiveTab('aprendices'); alert("Configuración guardada correctamente."); }}
                  className="px-5 py-2.5 bg-sena text-white font-semibold rounded-lg hover:bg-sena-dark transition-colors shadow-sm"
                >
                  Guardar Configuración
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reportes' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-sm max-w-2xl mx-auto text-center">
            <h2 className="text-lg font-bold text-slate-800 border-b pb-3">Centro de Exportación y Reportes PDF</h2>
            <p className="text-sm text-slate-600">Genera reportes oficiales de asistencia acumulados o por rangos de fecha para la Ficha {courseData.ficha_de_caracterizacion}.</p>
            <div className="pt-4">
              <button 
                onClick={handleOpenExportModal}
                className="px-6 py-3 bg-sena text-white font-semibold rounded-lg hover:bg-sena-dark shadow-md transition-colors inline-flex items-center gap-2"
              >
                <FileOutput className="w-5 h-5" /> Generar Reporte PDF Oficial
              </button>
            </div>
          </div>
        )}

      </main>

      {/* MODAL DE TOMA DE ASISTENCIA */}
      {showAttendanceModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full overflow-hidden border border-slate-200">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-sena" /> Tomar Asistencia - Ficha {courseData.ficha_de_caracterizacion}
              </h3>
              <button onClick={() => setShowAttendanceModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha de la Sesión:</label>
                <input 
                  type="date" 
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-sena"
                />
              </div>

              <div className="space-y-2 pt-2">
                <p className="text-xs font-bold text-slate-600 uppercase">Listado de Aprendices:</p>
                {courseData.asistencias_aprendices.map((student) => (
                  <div key={student.numero_documento} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border text-sm">
                    <span className="font-medium text-slate-800">{student.apellidos} {student.nombres}</span>
                    <select 
                      value={tempRecords[student.numero_documento] || 'Presente'}
                      onChange={(e) => setTempRecords({ ...tempRecords, [student.numero_documento]: e.target.value })}
                      className="border border-slate-300 rounded px-2 py-1 text-xs font-semibold bg-white"
                    >
                      <option value="Presente">Presente</option>
                      <option value="X">Falta (X)</option>
                      <option value="Tarde">Tarde</option>
                      <option value="Excusa">Excusa</option>
                      <option value="Evento">Evento</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button 
                onClick={() => setShowAttendanceModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveAttendance}
                disabled={isSavingAttendance}
                className="px-4 py-2 text-sm font-semibold bg-sena text-white rounded-lg hover:bg-sena-dark transition-colors shadow-sm flex items-center gap-2"
              >
                {isSavingAttendance ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar Asistencia
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EXPORTACIÓN PDF MODERNO INTEGRADO */}
      <ExportReportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        isPreparing={isPreparingPdf}
        fichaNumber={courseData.ficha_de_caracterizacion}
        startDate={exportStartDate}
        endDate={exportEndDate}
        onExport={handleExportConfirm}
      />

      {/* FOOTER INSTITUCIONAL */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 mt-12 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
        <div>SENA - Centro de Formación Agroindustrial, Pecuario y Turístico</div>
        <div>Versión 2.0.1 • Módulo de Gestión Académica</div>
      </footer>

      {/* Modales auxiliares */}
      {isHelpOpen && <HelpModal onClose={() => setIsHelpOpen(false)} />}
      {isSheetsModalOpen && <SheetsTemplateModal isOpen={isSheetsModalOpen} onClose={() => setIsSheetsModalOpen(false)} courseData={courseData} />}
    </div>
  );
}
