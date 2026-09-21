import React, { useMemo, useState, useEffect } from 'react';
import { courseData as initialCourseData } from './data';
import { subscribeToFichaData, saveAttendanceData } from './lib/firebase';
import { REPORT_TYPES, generatePDFReport } from './lib/pdfGenerator';
import { HelpModal } from './components/HelpModal';
import { SheetsTemplateModal } from './components/SheetsTemplateModal';
import { 
  Users, 
  CalendarDays, 
  BookOpen, 
  UserSquare2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Search,
  Download,
  Mail,
  AlertTriangle,
  Loader2,
  CheckCircle,
  FileText,
  Copy,
  Calendar,
  ClipboardList,
  Save,
  FileOutput,
  FileSpreadsheet
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

import { auth } from "./lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { Login } from "./components/Login";
import { LogOut } from "lucide-react";

export default function App() {
  const [courseData, setCourseData] = useState(initialCourseData);
  const [isLoading, setIsLoading] = useState(true);
  const [currentInstructorIdx, setCurrentInstructorIdx] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState('');

  const [limiteInasistencias, setLimiteInasistencias] = useState<number>(1);

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
   
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyTab, setNotifyTab] = useState<'inasistencias' | 'retardos'>('inasistencias');
  const [selectedTemplateStudent, setSelectedTemplateStudent] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [notifySuccess, setNotifySuccess] = useState(false);
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

  const studentsAtRiskFallas = useMemo(() => studentsWithStats.filter(s => s.enRiesgo), [studentsWithStats]);
  const studentsAtRiskTarde = useMemo(() => studentsWithStats.filter(s => s.enRiesgoTarde), [studentsWithStats]);

  const handleOpenExportModal = () => {
    if (currentInstructorDates.length > 0) {
      setExportStartDate(currentInstructorDates[0]);
      setExportEndDate(currentInstructorDates[currentInstructorDates.length - 1]);
    }
    setShowExportModal(true);
  };

  const handleExportConfirm = () => {
    setIsPreparingPdf(true);
    setTimeout(async () => {
      try {
        await generatePDFReport(selectedReportType, courseData, studentsWithStats, {
          startDate: exportStartDate,
          endDate: exportEndDate,
          mode: exportMode,
          instructor: exportInstructor
        });
      } catch (err) {
        console.error("Error generating PDF", err);
        alert("Hubo un error al generar el PDF. Por favor intente nuevamente.");
      }
      setIsPreparingPdf(false);
      setShowExportModal(false);
    }, 100);
  };

  const handleNotifyClick = () => {
    if (stats.enRiesgo === 0 && stats.enRiesgoTarde === 0) {
      alert("No hay aprendices que cumplan con los criterios para notificar.");
      return;
    }
    setNotifyTab(stats.enRiesgo > 0 ? 'inasistencias' : 'retardos');
    setShowNotifyModal(true);
    setNotifySuccess(false);
    setSelectedTemplateStudent(null);
  };

  const correoInstructorActual = (currentInstructor as any)?.correo_institucional || currentInstructor?.correo || '';

  const handleSendEmailDirect = (student: typeof studentsWithStats[0], tipo: 'inasistencia' | 'retardo') => {
    setIsSending(true);
    setSelectedTemplateStudent(student.numero_documento);

    const fechas = tipo === 'inasistencia' 
      ? student.fechasFalla.map(formatDateForDisplay).join(', ') 
      : student.fechasTarde.map(formatDateForDisplay).join(', ');

    const asunto = encodeURIComponent(`Notificación formal de ${tipo} - Reglamento del Aprendiz - Ficha ${courseData.ficha_de_caracterizacion}`);
    const cuerpo = encodeURIComponent(
      `Estimado(a) Aprendiz: ${student.nombres} ${student.apellidos}\n\n` +
      `Se le notifica registro de ${tipo}(s) en las fechas: ${fechas}.\n` +
      `Programa: ${courseData.programa} (Ficha: ${courseData.ficha_de_caracterizacion})\n` +
      `Instructor: ${currentInstructor?.nombre_del_instructor}\n\n` +
      `De acuerdo con el Reglamento del Aprendiz (Acuerdo 09 de 2024), cuenta con un plazo de hasta cinco (5) días hábiles para presentar sus soportes de justificación válidos (citas médicas, calamidad doméstica, etc.).\n\n` +
      `--- Copia de evidencia enviada automáticamente (CC) a: ${correoInstructorActual} ---`
    );

    setTimeout(() => {
      setIsSending(false);
      setNotifySuccess(true);
      
      const mailtoLink = `mailto:aprendiz@sena.edu.co?cc=${encodeURIComponent(correoInstructorActual)}&subject=${asunto}&body=${cuerpo}`;
      window.open(mailtoLink, '_blank');

      setTimeout(() => {
        setNotifySuccess(false);
        setSelectedTemplateStudent(null);
      }, 2500);
    }, 1200);
  };

  const generateAbsenceTemplate = (student: typeof studentsWithStats[0]) => {
    const fechas = student.fechasFalla.map(formatDateForDisplay).join(', ') || '[Fecha]';
    return `<div>
<p><strong>ASUNTO:</strong> Notificación de inasistencia y recordatorio del Reglamento del Aprendiz (Acuerdo 09 de 2024) - ${courseData.programa}</p>
<br>
<p><strong>Destinatario:</strong><br>
Aprendiz: ${student.nombres} ${student.apellidos}<br>
Documento: ${student.numero_documento}<br>
Ficha: ${courseData.ficha_de_caracterizacion}</p>
<br>
<p><strong>Detalle del Incumplimiento:</strong><br>
Competencia: ${currentInstructor?.competencia}<br>
Fechas de inasistencia: ${fechas}</p>
<br>
<p><strong>Normativa de Referencia (Reglamento del Aprendiz SENA - Acuerdo 09 de 2024):</strong><br>
Se le recuerda el deber de cumplir satisfactoriamente con el proceso formativo asistiendo puntualmente a las actividades programadas (Artículo 27). Los incumplimientos injustificados (Artículo 29) o la falta de reporte oportuno pueden derivar en llamado de atención o deserción (Artículo 30).</p>
<br>
<p><strong>Causales de Incumplimiento Justificado (Artículo 28):</strong><br>
Si su inasistencia obedece a causas programadas (citas médicas, calamidad doméstica, fuerza mayor, etc.), cuenta con un plazo máximo de <strong>cinco (5) días hábiles</strong> siguientes a su ocurrencia para presentar los soportes pertinentes ante el instructor.</p>
<br>
<p><em>Este reporte incluye copia automática de evidencia (CC) al correo del instructor:</em> <strong>${correoInstructorActual}</strong></p>
</div>`;
  };

  const generateLateTemplate = (student: typeof studentsWithStats[0]) => {
    const f1 = formatDateForDisplay(student.fechasTarde[0]) || '[Fecha]';
    const f2 = formatDateForDisplay(student.fechasTarde[1]) || '[Fecha]';
    const f3 = formatDateForDisplay(student.fechasTarde[2]) || '[Fecha]';
    
    return `<div>
<p><strong>ASUNTO:</strong> Notificación de tercer retardo y Primer Llamado de Atención Escrito - Ficha ${courseData.ficha_de_caracterizacion}</p>
<br>
<p><strong>Para:</strong> ${student.nombres} ${student.apellidos}<br>
<strong>De:</strong> ${currentInstructor?.nombre_del_instructor} (${currentInstructor?.competencia})</p>
<br>
<p>Estimado(a) aprendiz:<br>
Se le notifica formalmente que ha acumulado tres (3) llegadas tarde injustificadas a las sesiones formativas:</p>
<br>
<ul>
  <li>Retardo 1: ${f1}</li>
  <li>Retardo 2: ${f2}</li>
  <li>Retardo 3: ${f3}</li>
</ul>
<br>
<p>De acuerdo con el Reglamento del Aprendiz SENA (Acuerdo 09 de 2024), la puntualidad es un deber fundamental. Este registro constituye un Primer Llamado de Atención Escrito. Dispone de cinco (5) días hábiles para presentar soportes si existiera alguna causal justificada.</p>
<br>
<p><em>Copia de evidencia (CC) enviada al correo del instructor:</em> <strong>${correoInstructorActual}</strong></p>
</div>`;
  };

  const copyToClipboard = async (html: string) => {
    try {
      const plainText = html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n\n').replace(/<[^>]+>/g, '');
      if (navigator.clipboard && window.ClipboardItem) {
        const textBlob = new Blob([plainText], { type: 'text/plain' });
        const htmlBlob = new Blob([html], { type: 'text/html' });
        const clipboardItem = new ClipboardItem({
          'text/plain': textBlob,
          'text/html': htmlBlob,
        });
        await navigator.clipboard.write([clipboardItem]);
      } else {
        await navigator.clipboard.writeText(plainText);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleDateChange = (newDate: string) => {
    setAttendanceDate(newDate);
    const formattedDate = formatDateForData(newDate);
    const newRecords: Record<string, string> = {};
     
    courseData.asistencias_aprendices.forEach(student => {
      const status = student.registros[formattedDate as keyof typeof student.registros];
      newRecords[student.numero_documento] = status || 'Presente';
    });
     
    setTempRecords(newRecords);
  };

  const handleSaveAttendance = async () => {
    setIsSavingAttendance(true);
    const formattedDate = formatDateForData(attendanceDate);
     
    let newFechas = [...courseData.fechas_asistencia];
    if (!newFechas.includes(formattedDate)) {
      const newDateObj = new Date(attendanceDate);
      let insertIdx = newFechas.length;
       
      for (let i = 0; i < newFechas.length; i++) {
        const [m, d, y] = newFechas[i].split('/');
        const existingDateObj = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
        if (newDateObj < existingDateObj) {
          insertIdx = i;
          break;
        }
      }
      newFechas.splice(insertIdx, 0, formattedDate);
    }
     
    let newFechasPorInstructor = { ...(courseData.fechas_por_instructor || {}) };
    if (currentInstructor) {
      let currentDates = [...(newFechasPorInstructor[currentInstructor.nombre_del_instructor] || [])];
      if (!currentDates.includes(formattedDate)) {
        currentDates.push(formattedDate);
        currentDates.sort((a,b) => {
           const da = new Date(a.split('/')[2], parseInt(a.split('/')[0])-1, a.split('/')[1]);
           const db = new Date(b.split('/')[2], parseInt(b.split('/')[0])-1, b.split('/')[1]);
           return da.getTime() - db.getTime();
        });
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
    } catch (error) {
      console.error("Failed to save attendance", error);
      alert("Error al guardar la asistencia en la nube.");
    } finally {
      setIsSavingAttendance(false);
    }
  };

  if (!authReady || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-sena" />
          <p className="text-slate-500 font-medium">Cargando plataforma...</p>
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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-sena-light text-sena-dark text-xs font-semibold px-2 py-0.5 rounded-md tracking-wide">
                  FICHA: {courseData.ficha_de_caracterizacion}
                </span>
                <span className="bg-slate-100 text-slate-600 text-xs font-medium px-2 py-0.5 rounded-md">
                  {courseData.asistencias_aprendices.length} Aprendices
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight">
                {courseData.denominacion}
              </h1>
              <div className="mt-2 p-3 bg-slate-50 border border-slate-100 rounded-lg flex items-start gap-2 max-w-3xl">
                <BookOpen className="w-5 h-5 text-sena flex-shrink-0 mt-0.5" />
                <p className="text-sm text-slate-700 leading-relaxed font-medium">
                  {currentInstructor?.competencia}
                </p>
              </div>
              <div className="mt-1">
                 <p className="text-xs text-sena font-medium">{currentInstructor?.correo}</p>
              </div>
            </div>
            
            <div className="flex flex-col items-start md:items-end gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 p-2 shadow-sm w-full md:w-auto">
                <div className="w-8 h-8 rounded-full bg-sena-light flex items-center justify-center text-sena-dark">
                  <UserSquare2 className="w-4 h-4" />
                </div>
                <div className="pr-2">
                  <p className="text-sm font-semibold text-slate-800 line-clamp-1">{currentInstructor.nombre_del_instructor}</p>
                  <p className="text-xs text-slate-500">{currentInstructor.correo}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto mt-1 justify-end">
                <button 
                  onClick={handleOpenAttendance}
                  className="flex-1 md:flex-none justify-center flex items-center gap-2 px-3 py-2 bg-sena-light text-sena-dark border border-emerald-200 rounded-lg text-sm font-medium hover:bg-sena-light shadow-sm transition-colors"
                >
                  <ClipboardList className="w-4 h-4" />
                  Tomar Asistencia
                </button>
                <button 
                  onClick={handleNotifyClick}
                  className="flex-1 md:flex-none justify-center flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
                >
                  <Mail className="w-4 h-4 text-slate-500" />
                  Notificar
                </button>
                <button 
                  onClick={() => setIsSheetsModalOpen(true)}
                  className="flex-1 md:flex-none justify-center flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 shadow-sm transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span className="hidden sm:inline">Formato Google Sheets</span>
                </button>
                <button 
                  onClick={handleOpenExportModal}
                  disabled={isPreparingPdf}
                  className="flex-1 md:flex-none justify-center flex items-center gap-2 px-3 py-2 bg-sena rounded-lg text-sm font-medium text-white hover:bg-sena-dark shadow-sm transition-colors disabled:opacity-70"
                >
                  {isPreparingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileOutput className="w-4 h-4" />}
                  <span>{isPreparingPdf ? 'Preparando...' : 'Exportar'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        
        {/* PANEL DE CONFIGURACIÓN */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg text-sena">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Centro de Notificaciones y Reglamento</h3>
              <p className="text-xs text-slate-500">Copia automática (CC) al instructor: <strong>{correoInstructorActual}</strong></p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <label className="text-xs font-medium text-slate-700 whitespace-nowrap">
              Notificar inasistencias a partir de:
            </label>
            <input 
              type="number" 
              min="1" 
              max="20"
              value={limiteInasistencias} 
              onChange={(e) => setLimiteInasistencias(Math.max(1, parseInt(e.target.value) || 1))}
              className="border border-slate-300 rounded-md px-3 py-1.5 w-20 text-sm font-bold text-center text-slate-800 focus:outline-none focus:ring-2 focus:ring-sena"
            />
            <span className="text-xs font-semibold text-slate-600">falta(s)</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col">
            <span className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              Total Aprendices
            </span>
            <span className="text-3xl font-bold text-slate-900 mt-2">{stats.totalStudents}</span>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col">
            <span className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sena" />
              Asistencia Global
            </span>
            <span className="text-3xl font-bold text-slate-900 mt-2">{stats.attendanceRate}%</span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col">
            <span className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              Total Inasistencias
            </span>
            <span className="text-3xl font-bold text-slate-900 mt-2">{stats.absent}</span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col">
            <span className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Llegadas Tarde (&ge; 3)
            </span>
            <span className="text-3xl font-bold text-amber-600 mt-2">{stats.enRiesgoTarde}</span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col">
            <span className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              En Riesgo Faltas (&ge; {limiteInasistencias})
            </span>
            <span className="text-3xl font-bold text-red-600 mt-2">{stats.enRiesgo}</span>
          </div>
        </div>

        {/* Tabla de aprendices */}
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
            <div className="flex items-center gap-2 w-full sm:w-auto">
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
                <tr className="bg-slate-50 text-slate-700 uppercase text-xs tracking-wider border-b border-slate-200">
                  <th className="p-3 font-semibold">Aprendiz</th>
                  <th className="p-3 font-semibold text-center">Documento</th>
                  <th className="p-3 font-semibold text-center">Inasistencias</th>
                  <th className="p-3 font-semibold text-center">Retardos</th>
                  <th className="p-3 font-semibold text-center">Estado de Riesgo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <tr key={student.numero_documento} className="hover:bg-slate-50/80">
                      <td className="p-3 font-medium text-slate-800">
                        {student.apellidos} {student.nombres}
                      </td>
                      <td className="p-3 text-center text-slate-500 font-mono text-xs">
                        {student.numero_documento}
                      </td>
                      <td className="p-3 text-center font-bold text-slate-700">
                        {student.fallasAcumuladas}
                      </td>
                      <td className="p-3 text-center font-bold text-slate-700">
                        {student.tardanzasAcumuladas}
                      </td>
                      <td className="p-3 text-center">
                        {(student.fallasAcumuladas >= limiteInasistencias || student.tardanzasAcumuladas >= 3) ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                            Atención Requerida
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-sena-dark">
                            Normal
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      No se encontraron aprendices con los filtros actuales.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODAL DE TOMA DE ASISTENCIA */}
      {showAttendanceModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Llamado a Lista</h2>
                <p className="text-xs text-slate-500">Instructor: {currentInstructor?.nombre_del_instructor}</p>
              </div>
              <input 
                type="date" 
                value={attendanceDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-medium"
              />
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {courseData.asistencias_aprendices.map((student) => {
                const currentStatus = tempRecords[student.numero_documento] || 'Presente';
                return (
                  <div key={student.numero_documento} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{student.apellidos} {student.nombres}</p>
                      <p className="text-xs font-mono text-slate-500">{student.numero_documento}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {['Presente', 'X', 'Tarde', 'Excusa'].map((st) => {
                        const isSelected = currentStatus === st;
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setTempRecords({ ...tempRecords, [student.numero_documento]: st })}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              isSelected 
                                ? st === 'X' ? 'bg-red-600 text-white shadow-sm' : st === 'Tarde' ? 'bg-amber-500 text-white shadow-sm' : 'bg-sena text-white shadow-sm'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {st === 'X' ? 'Falla' : st}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
              <button 
                onClick={() => setShowAttendanceModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveAttendance}
                disabled={isSavingAttendance}
                className="px-5 py-2 bg-sena text-white rounded-lg text-sm font-medium hover:bg-sena-dark flex items-center gap-2 disabled:opacity-50"
              >
                {isSavingAttendance && <Loader2 className="w-4 h-4 animate-spin" />}
                Guardar Asistencia
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE NOTIFICACIONES CON PESTAÑAS (INASISTENCIAS Y RETARDOS) */}
      {showNotifyModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Centro de Notificaciones - Reglamento SENA</h2>
                <p className="text-xs text-slate-500">Con copia de respaldo automática (CC) a: <strong>{correoInstructorActual}</strong></p>
              </div>
              <button onClick={() => setShowNotifyModal(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">
                &times;
              </button>
            </div>

            {/* Pestañas de Navegación */}
            <div className="flex border-b border-slate-200 bg-white px-6 pt-3 gap-4">
              <button
                onClick={() => setNotifyTab('inasistencias')}
                className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
                  notifyTab === 'inasistencias'
                    ? 'border-sena text-sena'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Inasistencias ({studentsAtRiskFallas.length})
              </button>
              <button
                onClick={() => setNotifyTab('retardos')}
                className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
                  notifyTab === 'retardos'
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Llegadas Tarde &ge; 3 ({studentsAtRiskTarde.length})
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {notifyTab === 'inasistencias' ? (
                studentsAtRiskFallas.length > 0 ? (
                  studentsAtRiskFallas.map((student) => (
                    <div key={student.numero_documento} className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">{student.apellidos} {student.nombres}</h4>
                          <p className="text-xs text-slate-500">Inasistencias acumuladas: <span className="font-bold text-red-600">{student.fallasAcumuladas}</span> (Umbral &ge; {limiteInasistencias})</p>
                        </div>
                        <span className="text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-md font-semibold">Alerta Faltas</span>
                      </div>

                      <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs font-mono text-slate-600 max-h-36 overflow-y-auto">
                        <div dangerouslySetInnerHTML={{ __html: generateAbsenceTemplate(student) }} />
                      </div>

                      <div className="flex justify-end gap-2 flex-wrap">
                        <button
                          onClick={() => copyToClipboard(generateAbsenceTemplate(student))}
                          className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-300 flex items-center gap-1.5"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Copiar Plantilla
                        </button>
                        <button
                          onClick={() => handleSendEmailDirect(student, 'inasistencia')}
                          disabled={isSending && selectedTemplateStudent === student.numero_documento}
                          className="px-4 py-1.5 bg-sena text-white rounded-lg text-xs font-semibold hover:bg-sena-dark flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                        >
                          {isSending && selectedTemplateStudent === student.numero_documento ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Mail className="w-3.5 h-3.5" />
                          )}
                          Enviar Notificación (Con Copia CC)
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    No hay aprendices que alcancen el límite de {limiteInasistencias} inasistencia(s).
                  </div>
                )
              ) : (
                studentsAtRiskTarde.length > 0 ? (
                  studentsAtRiskTarde.map((student) => (
                    <div key={student.numero_documento} className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">{student.apellidos} {student.nombres}</h4>
                          <p className="text-xs text-slate-500">Retardos acumulados: <span className="font-bold text-amber-600">{student.tardanzasAcumuladas}</span></p>
                        </div>
                        <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-md font-semibold">Alerta Retardos</span>
                      </div>

                      <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs font-mono text-slate-600 max-h-36 overflow-y-auto">
                        <div dangerouslySetInnerHTML={{ __html: generateLateTemplate(student) }} />
                      </div>

                      <div className="flex justify-end gap-2 flex-wrap">
                        <button
                          onClick={() => copyToClipboard(generateLateTemplate(student))}
                          className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-300 flex items-center gap-1.5"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Copiar Plantilla
                        </button>
                        <button
                          onClick={() => handleSendEmailDirect(student, 'retardo')}
                          disabled={isSending && selectedTemplateStudent === student.numero_documento}
                          className="px-4 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                        >
                          {isSending && selectedTemplateStudent === student.numero_documento ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Mail className="w-3.5 h-3.5" />
                          )}
                          Enviar Llamado Retardos (Con Copia CC)
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    No hay aprendices con 3 o más llegadas tarde.
                  </div>
                )
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button 
                onClick={() => setShowNotifyModal(false)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <SheetsTemplateModal isOpen={isSheetsModalOpen} onClose={() => setIsSheetsModalOpen(false)} courseData={courseData} />
    </div>
  );
}
