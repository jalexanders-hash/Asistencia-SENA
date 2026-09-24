import React, { useMemo, useState, useEffect } from 'react';
import { courseData as initialCourseData } from './data';[cite: 4]
import { subscribeToFichaData, saveAttendanceData } from './lib/firebase';[cite: 4]
import { REPORT_TYPES, generatePDFReport } from './lib/pdfGenerator';[cite: 4]
import { HelpModal } from './components/HelpModal';[cite: 4]
import { SheetsTemplateModal } from './components/SheetsTemplateModal';[cite: 4]
import ExportReportModal from './components/ExportReportModal';[cite: 4]
import { auth } from "./lib/firebase";[cite: 4]
import { onAuthStateChanged, signOut, User } from "firebase/auth";[cite: 4]
import { Login } from "./components/Login";[cite: 4]
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
  Check,
  ChevronDown,
  X
} from 'lucide-react';[cite: 4]

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
    return `${d}/${m}`;
  }
  return dateString;
};

export default function App() {
  const [courseData, setCourseData] = useState(initialCourseData);[cite: 4]
  const [isLoading, setIsLoading] = useState(true);[cite: 4]
  
  const [currentFichaId, setCurrentFichaId] = useState<string>("3387401");[cite: 4]
  const [currentInstructorIdx, setCurrentInstructorIdx] = useState<number | null>(null);[cite: 4]
  const [user, setUser] = useState<User | null>(null);[cite: 4]
  const [authReady, setAuthReady] = useState(false);[cite: 4]
  const [authError, setAuthError] = useState('');[cite: 4]

  const [activeTab, setActiveTab] = useState<'ficha' | 'asistencia' | 'alertas' | 'reportes'>('asistencia');[cite: 4]
  const [limiteInasistencias, setLimiteInasistencias] = useState<number>(1);[cite: 4]
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);[cite: 4]

  const [kpiFilter, setKpiFilter] = useState<'all' | 'present' | 'absent' | 'late' | 'risk'>('all');[cite: 4]
  const [showNotificationModal, setShowNotificationModal] = useState(false);[cite: 4]

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
    
  const [searchTerm, setSearchTerm] = useState('');[cite: 4]
  const [selectedStudentDoc, setSelectedStudentDoc] = useState<string | null>(null);[cite: 4]
  const [showDropdown, setShowDropdown] = useState(false);[cite: 4]
  const [showRiskOnly, setShowRiskOnly] = useState(false);[cite: 4]
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);[cite: 4]
    
  const currentInstructor = currentInstructorIdx !== null ? courseData.equipo_instructores[currentInstructorIdx] : null;[cite: 4]

  const currentInstructorDates = useMemo(() => {
    if (!currentInstructor) return [];
    if (courseData.fechas_por_instructor && courseData.fechas_por_instructor[currentInstructor.nombre_del_instructor]) {
      return courseData.fechas_por_instructor[currentInstructor.nombre_del_instructor];
    }
    return courseData.fechas_asistencia;
  }, [currentInstructor, courseData]);
    
  const [isPreparingPdf, setIsPreparingPdf] = useState(false);[cite: 4]
  const [showExportModal, setShowExportModal] = useState(false);[cite: 4]

  const [showAttendanceModal, setShowAttendanceModal] = useState(false);[cite: 4]
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);[cite: 4]
  const [attendanceDate, setAttendanceDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [tempRecords, setTempRecords] = useState<Record<string, string>>({});[cite: 4]

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
    return <Login />;[cite: 4]
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
            <div className="w-11 h-11 bg-sena rounded-full flex items-center justify-center text-white font-bold shadow-md border-2 border-emerald-100">
              <span className="text-xs tracking-tighter">SENA</span>
            </div>
            <div>
              <span className="font-bold text-slate-800 text-base tracking-tight hidden sm:block">
                SENA - Gestión Académica
              </span>
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
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-xs text-slate-500 mb-1">
              Inicio &gt; Gestión Administrativa &gt; <span className="font-semibold text-slate-800">Ficha {courseData.ficha_de_caracterizacion}</span>
            </p>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900">
              {courseData.denominacion} - Ficha {courseData.ficha_de_caracterizacion}
            </h1>
          </div>

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
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Formato Google Sheets</span>
            </button>
          </div>
        </div>

        <div className="flex border-b border-slate-200 gap-8 text-sm font-medium">
          <button 
            onClick={() => setActiveTab('asistencia')}
            className={`pb-3 transition-colors ${activeTab === 'asistencia' ? 'text-sena border-b-2 border-sena font-semibold' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Tablero y Matriz de Asistencia
          </button>
          <button 
            onClick={() => setActiveTab('ficha')}
            className={`pb-3 transition-colors ${activeTab === 'ficha' ? 'text-sena border-b-2 border-sena font-semibold' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Datos de la Ficha
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
          </div>
        )}

        {activeTab === 'asistencia' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div 
                onClick={() => { setKpiFilter('all'); setSelectedStudentDoc(null); }}
                className={`bg-white rounded-xl border p-4 shadow-sm flex flex-col justify-between cursor-pointer transition-all ${kpiFilter === 'all' && !selectedStudentDoc ? 'border-sena ring-2 ring-sena/20 bg-emerald-50/20' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold text-slate-500">Total Aprendices</span>
                  <div className="p-2 bg-emerald-50 rounded-lg text-sena"><Users className="w-4 h-4" /></div>
                </div>
                <span className="text-2xl font-bold text-slate-900 mt-3">{stats.totalStudents}</span>
                <span className="text-[10px] text-slate-400 mt-1">Clic para mostrar todos</span>
              </div>
              
              <div 
                onClick={() => { setKpiFilter('present'); setSelectedStudentDoc(null); }}
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
                  <div className="p-2 bg-amber-50 rounded-lg text-amber-500"><Clock className="w-4 h-4" /></div>
                </div>
                <span className="text-2xl font-bold text-amber-600 mt-3">{stats.enRiesgoTarde}</span>
                <span className="text-[10px] text-slate-400 mt-1">Retardos acumulados</span>
              </div>

              <div 
                onClick={() => { setKpiFilter('risk'); setSelectedStudentDoc(null); }}
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

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <h3 className="text-base font-bold text-slate-800">Matriz Consolidada de Asistencia por Fechas</h3>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="w-full sm:w-80 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 z-10" />
                    <input 
                      type="text" 
                      placeholder="Filtrar aprendiz en matriz..." 
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setSelectedStudentDoc(null);
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                      className="w-full pl-9 pr-10 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sena bg-white"
                    />
                    {(searchTerm || selectedStudentDoc) && (
                      <button 
                        onClick={() => { setSearchTerm(''); setSelectedStudentDoc(null); setShowDropdown(false); }}
                        className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <button 
                      onClick={() => setShowDropdown(!showDropdown)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>

                    {showDropdown && (
                      <div className="absolute left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl border border-slate-200 max-h-60 overflow-y-auto z-50 divide-y divide-slate-100">
                        <div 
                          className="px-4 py-2 text-xs text-slate-400 hover:bg-slate-50 cursor-pointer font-semibold"
                          onClick={() => { setSearchTerm(''); setSelectedStudentDoc(null); setShowDropdown(false); }}
                        >
                          -- Mostrar todos los aprendices --
                        </div>
                        {studentsWithStats
                          .filter(s => 
                            `${s.nombres} ${s.apellidos} ${s.numero_documento}`.toLowerCase().includes(searchTerm.toLowerCase())
                          )
                          .map(student => (
                            <div
                              key={student.numero_documento}
                              onClick={() => {
                                setSearchTerm(`${student.apellidos} ${student.nombres}`);
                                setSelectedStudentDoc(student.numero_documento);
                                setShowDropdown(false);
                              }}
                              className="px-4 py-2.5 text-xs hover:bg-emerald-50/60 cursor-pointer flex justify-between items-center transition-colors"
                            >
                              <span className="font-bold text-slate-800">{student.apellidos} {student.nombres}</span>
                              <span className="font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{student.numero_documento}</span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {(kpiFilter !== 'all' || searchTerm || selectedStudentDoc) && (
                    <button
                      onClick={() => { setKpiFilter('all'); setSearchTerm(''); setSelectedStudentDoc(null); }}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-colors"
                    >
                      Limpiar Filtros
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3 sticky left-0 bg-slate-50 z-20 min-w-[220px] shadow-sm">APRENDIZ</th>
                      <th className="p-3 text-center bg-slate-50 z-20 min-w-[70px] border-r border-slate-200">FALLAS</th>
                      {currentInstructorDates.map((date, idx) => (
                        <th key={idx} className="p-2 text-center font-mono text-[11px] min-w-[65px] border-r border-slate-100 whitespace-nowrap">
                          {formatDateForDisplay(date)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((student) => (
                        <tr key={student.numero_documento} className="hover:bg-slate-50/80">
                          <td className="p-3 sticky left-0 bg-white z-10 shadow-sm font-bold text-slate-800 whitespace-nowrap">
                            {student.apellidos} {student.nombres}
                            <span className="font-normal text-slate-500 block text-[11px]">{student.numero_documento}</span>
                          </td>
                          <td className="p-3 text-center font-bold border-r border-slate-200 bg-slate-50/50">
                            <span className={`px-2 py-0.5 rounded-full text-xs ${student.fallasAcumuladas >= limiteInasistencias ? 'bg-red-100 text-red-700' : 'bg-emerald-50 text-sena'}`}>
                              {student.fallasAcumuladas}
                            </span>
                          </td>
                          {currentInstructorDates.map((date, idx) => {
                            const status = student.registros[date as keyof typeof student.registros] || '•';
                            return (
                              <td key={idx} className="p-2 text-center font-mono border-r border-slate-100">
                                <span className={`inline-block w-6 h-6 leading-6 rounded text-[11px] font-bold ${
                                  status === 'X' ? 'bg-red-100 text-red-700' :
                                  status === 'Tarde' ? 'bg-amber-100 text-amber-700' :
                                  status === 'Excusa' ? 'bg-blue-100 text-blue-700' : 'text-slate-300'
                                }`}>
                                  {status === 'X' ? 'F' : status === 'Tarde' ? 'T' : status === 'Excusa' ? 'E' : '•'}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={currentInstructorDates.length + 2} className="p-8 text-center text-slate-400">
                          No se encontraron aprendices con los filtros seleccionados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'alertas' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-800 border-b pb-3">Configuración de Alertas Académicas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h3 className="font-bold text-slate-800 text-sm">Límite de Inasistencias por Instructor</h3>
                <p className="text-xs text-slate-500">Define a partir de cuántas faltas acumuladas un aprendiz es marcado en estado de riesgo.</p>
                <div className="flex items-center gap-3 pt-2">
                  <input 
                    type="number" 
                    min="1" 
                    max="20" 
                    value={limiteInasistencias} 
                    onChange={(e) => setLimiteInasistencias(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold bg-white"
                  />
                  <span className="text-sm font-medium text-slate-700">Faltas acumuladas</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h3 className="font-bold text-slate-800 text-sm">Notificaciones Automáticas (CC)</h3>
                <p className="text-xs text-slate-500">Las alertas y correos de notificación se enviarán con copia directa a tu correo institucional registrado:</p>
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-mono text-emerald-800 font-bold">
                  {correoInstructorActual}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reportes' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-800 border-b pb-3">Reportes y Exportación de Datos</h2>
            <p className="text-sm text-slate-600">Genera reportes formales en formato PDF listos para impresión o gestión administrativa con Coordinación Académica.</p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-sena text-white rounded-xl text-sm font-semibold hover:bg-sena-dark shadow-sm transition-colors"
              >
                <FileText className="w-4 h-4" /> Generar Reporte PDF / Excel
              </button>
            </div>
          </div>
        )}

      </main>

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 w-full text-center text-xs text-slate-400 border-t border-slate-200 pt-6">
        <p>SENA - Centro Agroindustrial, Pecuario y Turístico | Sistema de Gestión Académica e Inasistencias</p>
      </footer>

      {isSheetsModalOpen && (
        <SheetsTemplateModal isOpen={isSheetsModalOpen} onClose={() => setIsSheetsModalOpen(false)} />[cite: 4]
      )}

      {showExportModal && (
        <ExportReportModal 
          isOpen={showExportModal} 
          onClose={() => setShowExportModal(false)} 
          courseData={courseData}
          students={studentsWithStats}
        />
      )}

      {showAttendanceModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-base">Control de Asistencia Diaria</h3>
              <button onClick={() => setShowAttendanceModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-grow">
              <div className="flex items-center gap-4">
                <label className="text-xs font-bold text-slate-700">Fecha de la sesión:</label>
                <input 
                  type="date" 
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-medium bg-white"
                />
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Aprendiz</th>
                      <th className="p-3 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {courseData.asistencias_aprendices.map((student) => (
                      <tr key={student.numero_documento} className="hover:bg-slate-50">
                        <td className="p-3 font-medium text-slate-800">{student.apellidos} {student.nombres}</td>
                        <td className="p-3 text-center">
                          <select 
                            value={tempRecords[student.numero_documento] || 'Presente'}
                            onChange={(e) => setTempRecords({ ...tempRecords, [student.numero_documento]: e.target.value })}
                            className="border border-slate-300 rounded px-2 py-1 text-xs font-medium bg-white"
                          >
                            <option value="Presente">Presente</option>
                            <option value="X">Falla (Inasistencia)</option>
                            <option value="Tarde">Llegada Tarde</option>
                            <option value="Excusa">Excusa Justificada</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
