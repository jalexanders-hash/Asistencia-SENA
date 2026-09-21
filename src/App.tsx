import React, { useMemo, useState, useEffect } from 'react';
import { courseData as initialCourseData } from './data';
import { subscribeToFichaData, saveAttendanceData } from './lib/firebase';
import { REPORT_TYPES, generatePDFReport } from './lib/pdfGenerator';
import { HelpModal } from './components/HelpModal';
import { SheetsTemplateModal } from './components/SheetsTemplateModal';
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
    
  const [isPreparingPdf, setIsPreparingPdf] = useState(false);
    
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState(REPORT_TYPES[0].id);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [exportMode, setExportMode] = useState<'acumulado' | 'diario'>('acumulado');
  const [exportInstructor, setExportInstructor] = useState('all');

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

  const handleOpenExportModal = () => {
    if (currentInstructorDates.length > 0) {
      setExportStartDate(currentInstructorDates[0]);
      setExportEndDate(currentInstructorDates[currentInstructorDates.length - 1]);
    }
    setShowExportModal(true);
  };

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
            {/* Campana de Notificaciones con Dropdown Interactivo */}
            <div className="relative">
              <button 
                onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600 relative transition-colors"
                title="Notificaciones"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                  3
                </span>
              </button>

              {showNotificationsDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center text-xs font-semibold text-slate-700">
                    <span>Notificaciones Recientes</span>
                    <span className="text-sena cursor-pointer hover:underline">Marcar leídas</span>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    <div className="px-4 py-3 hover:bg-slate-50 border-b border-slate-50 flex gap-3 text-xs border-l-4 border-red-500 bg-red-50/30">
                      <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-slate-800">Aprendices en riesgo de inasistencia</p>
                        <span className="text-[10px] text-slate-400">Hace 10 minutos • Ficha {courseData.ficha_de_caracterizacion}</span>
                      </div>
                    </div>
                    <div className="px-4 py-3 hover:bg-slate-50 border-b border-slate-50 flex gap-3 text-xs border-l-4 border-sena">
                      <Mail className="w-4 h-4 text-sena flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-slate-800">Reporte de Reglamento enviado</p>
                        <span className="text-[10px] text-slate-400">Hace 45 minutos • Sistema automático</span>
                      </div>
                    </div>
                    <div className="px-4 py-3 hover:bg-slate-50 flex gap-3 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-slate-800">Asistencia sincronizada con la nube</p>
                        <span className="text-[10px] text-slate-400">Ayer • Firebase DB</span>
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
              onClick={() => {}}
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

        {/* Pestañas de Navegación Estilo Material Design */}
        <div className="flex border-b border-slate-200 gap-8 text-sm font-medium">
          <button className="pb-3 text-slate-500 hover:text-slate-800 transition-colors">Datos de la Ficha</button>
          <button className="pb-3 text-sena border-b-2 border-sena font-semibold">Listado de Aprendices</button>
          <button className="pb-3 text-slate-500 hover:text-slate-800 transition-colors">Configuración de Alertas</button>
          <button className="pb-3 text-slate-500 hover:text-slate-800 transition-colors">Reportes</button>
        </div>

        {/* Tarjetas KPI (5 métricas clave) */}
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

        {/* Tabla de Aprendices y Herramientas */}
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
      </main>

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
