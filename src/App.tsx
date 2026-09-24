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
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6 w-full flex-grow">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800">Panel Principal de Asistencia - Ficha {courseData.ficha_de_caracterizacion}</h2>
          <p className="text-sm text-slate-600 mt-1">Programa: {courseData.programa} ({courseData.denominacion})</p>
        </div>
      </main>
    </div>
  );
}
