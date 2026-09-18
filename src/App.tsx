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

// Helper to format date YYYY-MM-DD to M/D/YYYY
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

  // Handle Authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Sync instructor index when user changes or courseData changes
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
    // If we have mapped dates for this instructor, use them
    if (courseData.fechas_por_instructor && courseData.fechas_por_instructor[currentInstructor.nombre_del_instructor]) {
      return courseData.fechas_por_instructor[currentInstructor.nombre_del_instructor];
    }
    return courseData.fechas_asistencia;
  }, [currentInstructor, courseData]);
  
  // Modal & Action states
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyTab, setNotifyTab] = useState<'inasistencias' | 'retardos'>('inasistencias');
  const [selectedTemplateStudent, setSelectedTemplateStudent] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [notifySuccess, setNotifySuccess] = useState(false);
  const [isPreparingPdf, setIsPreparingPdf] = useState(false);
  
  // Export Modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState(REPORT_TYPES[0].id);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [exportMode, setExportMode] = useState<'acumulado' | 'diario'>('acumulado');
  const [exportInstructor, setExportInstructor] = useState('all');

  // Attendance Taking State
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // YYYY-MM-DD
  });
  const [tempRecords, setTempRecords] = useState<Record<string, string>>({});

  // Fetch Firestore Data
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

  // Helper to open attendance modal
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

  // Calculate stats and augmented student data
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

      if (fallasAcumuladas >= 3) enRiesgo++;
      if (tardanzasAcumuladas >= 3) enRiesgoTarde++;

      return {
        ...student,
        fallasAcumuladas,
        tardanzasAcumuladas,
        fechasTarde,
        fechasFalla,
        enRiesgo: fallasAcumuladas >= 3,
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
  }, [courseData, currentInstructorDates]);

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

  const getStatusIcon = (status: string | undefined) => {
    switch (status) {
      case 'X':
        return <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-600 font-bold text-xs" title="Inasistencia">X</span>;
      case 'Tarde':
        return <Clock className="w-5 h-5 text-amber-500 mx-auto" title="Tarde" />;
      case 'Excusa':
      case 'Evento':
        return <AlertCircle className="w-5 h-5 text-blue-500 mx-auto" title={status} />;
      default:
        return <CheckCircle2 className="w-5 h-5 text-sena mx-auto opacity-20" title="Presente" />;
    }
  };

  const getStatusClass = (status: string | undefined) => {
    switch (status) {
      case 'X': return 'bg-red-50/50';
      case 'Tarde': return 'bg-amber-50/50';
      case 'Excusa':
      case 'Evento': return 'bg-blue-50/50';
      default: return 'bg-white';
    }
  };

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
      alert("No hay aprendices en riesgo para notificar.");
      return;
    }
    setNotifyTab(stats.enRiesgo > 0 ? 'inasistencias' : 'retardos');
    setShowNotifyModal(true);
    setNotifySuccess(false);
    setSelectedTemplateStudent(null);
  };

  const confirmNotification = () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setNotifySuccess(true);
      setTimeout(() => {
        setShowNotifyModal(false);
      }, 2000);
    }, 1500);
  };

  
    const generateAbsenceTemplate = (student: typeof studentsWithStats[0]) => {
    const fechas = student.fechasFalla.map(formatDateForDisplay).join(', ') || '[Fecha]';
    return `<div>
<p><strong>ASUNTO:</strong> Notificación de inasistencia y recordatorio del Reglamento del Aprendiz - ${courseData.programa}</p>
<br>
<p><strong>Destinatario:</strong><br>
Nombre Completo: ${student.nombres} ${student.apellidos}<br>
Identificación: ${student.numero_documento}<br>
Programa de Formación: ${courseData.programa} - Ficha: ${courseData.ficha_de_caracterizacion}</p>
<br>
<p><strong>Detalle de la Inasistencia:</strong><br>
Módulo/Competencia: ${currentInstructor?.competencia}<br>
Fecha(s) de inasistencia: ${fechas}</p>
<br>
<p><strong>Normativa de Referencia (SENA):</strong><br>
Reglamento: Reglamento del Aprendiz SENA (Acuerdo 007 de 2012)<br>
Extracto: "Cumplir con las actividades de formación acordadas en la ruta de aprendizaje y asistir puntualmente a los ambientes de formación presenciales o virtuales..."</p>
<br>
<p><strong>Instrucciones para justificación:</strong><br>
Cuenta con un plazo máximo de 2 días hábiles para presentar su justificación. Los motivos válidos incluyen:<br>
- Incapacidad médica<br>
- Calamidad doméstica debidamente soportada</p>
<br>
<a href="mailto:${(currentInstructor as any)?.correo_institucional || currentInstructor?.correo}?subject=Justificacion%20Inasistencia%20-%20${encodeURIComponent(student.nombres + ' ' + student.apellidos)}&body=Adjunto%20documento%20de%20justificacion%20para%20la%20inasistencia%20del%20dia%20${encodeURIComponent(fechas)}." style="display:inline-block; padding:8px 16px; background-color:#39A900; color:white; text-decoration:none; border-radius:4px; font-weight:bold; font-family:sans-serif;">Subir justificación</a>
<br><br>
<p><strong>Remitente:</strong><br>
Nombre Completo: ${currentInstructor?.nombre_del_instructor}<br>
Cargo: Instructor(a) - ${currentInstructor?.competencia}<br>
Centro de Formación: ${courseData.centro}<br>
Correo Electrónico: ${(currentInstructor as any)?.correo_institucional || currentInstructor?.correo}</p>
</div>`;
  };

    const generateLateTemplate = (student: typeof studentsWithStats[0]) => {
    const f1 = formatDateForDisplay(student.fechasTarde[0]) || '[Fecha]';
    const f2 = formatDateForDisplay(student.fechasTarde[1]) || '[Fecha]';
    const f3 = formatDateForDisplay(student.fechasTarde[2]) || '[Fecha]';
    
    return `<div>
<p><strong>ASUNTO:</strong> Notificación de tercer retardo y Primer Llamado de Atención Escrito<br>
<strong>De:</strong> ${currentInstructor?.nombre_del_instructor}<br>
<strong>Para:</strong> ${student.nombres} ${student.apellidos}<br>
<strong>Ficha de Caracterización:</strong> ${courseData.ficha_de_caracterizacion}<br>
<strong>Programa de Formación:</strong> ${courseData.programa}</p>
<br>
<p>Estimado(a) aprendiz:<br>
Por medio de la presente, me dirijo a usted con el fin de notificarle formalmente que, de acuerdo con los registros de asistencia de la ficha de formación, ha acumulado un total de tres (3) llegadas tarde injustificadas a las sesiones presenciales/virtuales.</p>
<br>
<p><strong>Las novedades se registraron en las siguientes fechas y horarios:</strong><br>
Retardo 1: ${f1} - Hora de ingreso: N/A (Previo llamado de atención verbal)<br>
Retardo 2: ${f2} - Hora de ingreso: N/A (Previo llamado de atención verbal)<br>
Retardo 3: ${f3} - Hora de ingreso: N/A</p>
<br>
<p>De acuerdo con lo estipulado en el Reglamento del Aprendiz SENA, la puntualidad es un deber fundamental para el correcto desarrollo de su proceso de formación profesional integral y el respeto a la comunidad académica. Al haber superado los dos retardos iniciales, esta comunicación constituye su Primer Llamado de Atención Escrito.</p>
<br>
<p>Le solicito de manera cordial presentarme por este mismo medio el respectivo soporte o justificación válida (médica, laboral o de fuerza mayor) en un plazo no mayor a dos (2) días hábiles, si cuenta con ella. De lo contrario, este registro se mantendrá en su historial de seguimiento.</p>
<br>
<a href="mailto:${(currentInstructor as any)?.correo_institucional || currentInstructor?.correo}?subject=Justificacion%20Retardos%20-%20${encodeURIComponent(student.nombres + ' ' + student.apellidos)}&body=Adjunto%20documento%20de%20justificacion." style="display:inline-block; padding:8px 16px; background-color:#39A900; color:white; text-decoration:none; border-radius:4px; font-weight:bold; font-family:sans-serif;">Subir justificación</a>
<br><br>
<p>Lo(a) invito a corregir esta situación para evitar que la acumulación de más retardos afecte su proceso formativo o requiera el traslado de su caso al Comité de Evaluación y Seguimiento de la institución.</p>
<br>
<p>Atentamente,<br>
<strong>${currentInstructor?.nombre_del_instructor}</strong><br>
Instructor(a) SENA<br>
Centro de Formación: ${courseData.centro}<br>
Correo electrónico: ${(currentInstructor as any)?.correo_institucional || currentInstructor?.correo}</p>
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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-sena-light selection:text-sena-dark pb-12 print:bg-white print:pb-0">
      {/* Header section */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm print:static print:shadow-none print:border-b-2 print:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-sena-light text-sena-dark text-xs font-semibold px-2 py-0.5 rounded-md tracking-wide print:border print:border-emerald-700 print:bg-white">
                  FICHA: {courseData.ficha_de_caracterizacion}
                </span>
                <span className="bg-slate-100 text-slate-600 text-xs font-medium px-2 py-0.5 rounded-md print:border print:border-slate-400 print:bg-white">
                  {courseData.asistencias_aprendices.length} Aprendices
                </span>
                
    </div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight">
                {courseData.denominacion}
              </h1>
              <div className="mt-2 p-3 bg-slate-50 border border-slate-100 rounded-lg flex items-start gap-2 max-w-3xl print:border-none print:p-0 print:bg-white">
                <BookOpen className="w-5 h-5 text-sena flex-shrink-0 mt-0.5 print:hidden" />
                <p className="text-sm text-slate-700 leading-relaxed font-medium">
                  {currentInstructor?.competencia}
                </p>
                
    </div>
              <div className="mt-1">
                 <p className="text-xs text-sena font-medium">{currentInstructor?.correo}</p>
                
    </div>
              
    </div>
            
            <div className="print:hidden flex-shrink-0 self-center md:self-start mx-auto">
              <img src="data:image/svg+xml,%3c?xml%20version=%271.0%27%20encoding=%27utf-8%27?%3e%3c!--%20Generator:%20Adobe%20Illustrator%2026.0.1,%20SVG%20Export%20Plug-In%20.%20SVG%20Version:%206.00%20Build%200)%20--%3e%3csvg%20version=%271.1%27%20id=%27Capa_1%27%20xmlns=%27http://www.w3.org/2000/svg%27%20xmlns:xlink=%27http://www.w3.org/1999/xlink%27%20x=%270px%27%20y=%270px%27%20viewBox=%270%200%201000%201000%27%20style=%27enable-background:new%200%200%201000%201000;%27%20xml:space=%27preserve%27%3e%3cstyle%20type=%27text/css%27%3e%20.st0{fill:%2339a900;}%20%3c/style%3e%3cpath%20id=%27path47-5%27%20class=%27st0%27%20d=%27M504.2,20.5c-58.3,0.1-105.6,47.4-105.5,105.8c0.1,58.3,47.4,105.6,105.7,105.6%20c58.3,0,105.6-47.3,105.6-105.7V126C609.9,67.6,562.6,20.4,504.2,20.5z%20M155.6,264.6c-18.6,0.1-37.5,1.1-55.2,5.6%20c-11.7,3-23,7.8-30.3,15.4c-9.2,9.5-10.4,22.3-5.9,33.3c4,9.7,14.8,16.9,26.8,21.1c25.9,8.9,54.6,10.7,81.8,16.3%20c5,1.2,10.6,2.6,13.7,6c3.2,4.1,1.3,9.7-4,12.2c-8.8,4.5-20.1,4.5-30.4,4.4c-9.4-0.4-19.7-1.2-27.2-5.9c-5.5-3.4-6.5-9.1-5.2-14.1%20l-60.6,0c-0.2,9.2,1.6,18.9,8.4,26.8c5.6,6.8,14.8,11.5,24.6,14.4c15.7,4.6,32.7,6,49.4,6.4c22.7,0.4,45.8-0.3,67.6-5.4%20c13-3.2,25.8-8.3,34.1-16.6c14.8-14.8,11.3-38.3-8.3-49.8c-9.8-5.7-21.5-9.2-33.4-11.5c-17.5-3.6-35.3-6.3-52.9-9.2%20c-6.2-1.2-12.8-2.3-18-5.2c-5.5-2.9-5.9-9.8-0.3-12.9c7.2-4.1,16.8-4,25.4-4c9.1,0.2,19,0.7,26.5,5c4.2,2.3,5.9,6.3,5.9,10.1%20l57.6-0.1c-0.2-7.3-1.6-14.9-6.9-21.2c-6.2-7.8-17.1-12.7-28.3-15.5C192.8,265.6,174.1,264.7,155.6,264.6L155.6,264.6z%20M280.6,268.9%20l0,137.7l168.1,0l0-30H342.3v-26.7h94.9v-29.3h-94.9l0-21.9l102.6,0l-0.1-29.7L280.6,268.9z%20M557.5,269c0,0-51.9,0-77.9,0l0,137.7%20l59,0l0-92.7l80.8,92.6l81,0.1l0-137.7l-59.1,0l0.1,92L557.5,269z%20M805.6,269.2c0,0-63.6,91.9-95.6,137.7l61.9,0l14.9-24.8h95.7%20l13.9,24.9l68.8,0L874,269.2L805.6,269.2z%20M836.6,302.1l29.4,49.9l-60.7,0.1L836.6,302.1z%20M10.6,445.6l0.5,75l280.1-1%20c14.3,3.1,22.6,12.4,19.7,33.5L138.6,854.7l56.1,52.5l266.9-461.6L10.6,445.6z%20M545.2,446.2l262.4,459.6l58-52.1L691.3,552.9%20c-2.9-21.2,5.4-30.6,19.7-33.7l280.2,1l-0.1-73.7L545.2,446.2z%20M500.9,522.3L254.8,944.7l65.4,31.9L484.4,699%20c5.7-4.6,11.4-7.1,17.1-7.3c6-0.2,12.2,2,18.3,6.8l163.8,278.4l67.4-35.2L500.9,522.3z%27/%3e%3cg%20id=%27_x23_000000ff-2%27%20transform=%27matrix(0.31570611,0,0,0.23560774,-391.49698,-10.601126)%27%3e%3c/g%3e%3c/svg%3e" alt="SENA Logo" className="w-14 h-14 md:w-16 md:h-16 opacity-90 hidden sm:block" />
              
    </div>
            
            <div className="flex flex-col items-start md:items-end gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 p-2 shadow-sm w-full md:w-auto print:hidden">
                <div className="w-8 h-8 rounded-full bg-sena-light flex items-center justify-center text-sena-dark">
                  <UserSquare2 className="w-4 h-4" />
                </div>
                <div className="pr-2">
                  <p className="text-sm font-semibold text-slate-800 line-clamp-1">{currentInstructor.nombre_del_instructor}</p>
                  <p className="text-xs text-slate-500">{currentInstructor.correo}</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-1 w-full print:hidden">
                <button 
                  onClick={() => setIsHelpOpen(true)}
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-sena transition-colors bg-slate-100 hover:bg-emerald-50 px-2 py-1 rounded"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Ayuda
                </button>
                <button 
                  onClick={() => signOut(auth)}
                  className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-red-600 transition-colors bg-slate-50 hover:bg-red-50 px-2 py-1 rounded"
                >
                  <LogOut className="w-3 h-3" />
                  Salir
                </button>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 print:hidden w-full md:w-auto mt-1 justify-end">
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
                  title="Descargar o cargar formato oficial de Google Sheets / Excel"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span className="hidden sm:inline">Formato Google Sheets</span>
                  <span className="sm:hidden">Plantilla</span>
                </button>
                <button 
                  onClick={handleOpenExportModal}
                  disabled={isPreparingPdf}
                  className="flex-1 md:flex-none justify-center flex items-center gap-2 px-3 py-2 bg-sena rounded-lg text-sm font-medium text-white hover:bg-sena-dark shadow-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isPreparingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileOutput className="w-4 h-4" />}
                  <span className="hidden sm:inline">{isPreparingPdf ? 'Preparando...' : 'Exportar Informe'}</span>
                  <span className="sm:hidden">Exportar</span>
                </button>
                
    </div>
              
    </div>
            
    </div>
          
    </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6 print:mt-4">
        
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col print:border-slate-300">
            <span className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              Total Aprendices
            </span>
            <span className="text-3xl font-bold text-slate-900 mt-2">{stats.totalStudents}</span>
            
    </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col print:border-slate-300">
            <span className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sena" />
              Asistencia Global
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-bold text-slate-900">{stats.attendanceRate}%</span>
              
    </div>
            
    </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col print:border-slate-300">
            <span className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              Total Inasistencias
            </span>
            <span className="text-3xl font-bold text-slate-900 mt-2">{stats.absent}</span>
            
    </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col print:border-slate-300">
            <span className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Clock className={`w-4 h-4 ${stats.enRiesgoTarde > 0 ? 'text-amber-500' : 'text-amber-500'}`} />
              Llegadas Tarde
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-bold text-slate-900">{stats.late}</span>
              {stats.enRiesgoTarde > 0 && <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full">{stats.enRiesgoTarde} en riesgo</span>}
              
    </div>
            
    </div>

          <div className={`rounded-xl border p-4 shadow-sm flex flex-col print:border-slate-300 ${(stats.enRiesgo > 0 || stats.enRiesgoTarde > 0) ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
            <span className={`text-sm font-medium flex items-center gap-2 ${(stats.enRiesgo > 0 || stats.enRiesgoTarde > 0) ? 'text-red-700' : 'text-slate-500'}`}>
              <AlertTriangle className={`w-4 h-4 ${(stats.enRiesgo > 0 || stats.enRiesgoTarde > 0) ? 'text-red-500' : 'text-slate-400'}`} />
              Total en Riesgo
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className={`text-3xl font-bold ${(stats.enRiesgo > 0 || stats.enRiesgoTarde > 0) ? 'text-red-700' : 'text-slate-900'}`}>{stats.enRiesgo + stats.enRiesgoTarde}</span>
              {(stats.enRiesgo > 0 || stats.enRiesgoTarde > 0) && <span className="text-xs text-red-600 font-medium">(Fallas/Retardos)</span>}
              
    </div>
            
    </div>
          
    </div>

        {/* Table section */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden print:border-slate-300">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 print:bg-white">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-sena print:hidden" />
              Consolidado de Asistencia y Novedades
            </h2>
            
            <div className="flex items-center gap-3 print:hidden">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer bg-white px-3 py-2 border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50">
                <input 
                  type="checkbox" 
                  checked={showRiskOnly}
                  onChange={(e) => setShowRiskOnly(e.target.checked)}
                  className="rounded border-slate-300 text-sena focus:ring-sena"
                />
                Solo en riesgo (≥3)
              </label>
              
              <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400" />
                  
    </div>
                <input
                  type="text"
                  placeholder="Buscar aprendiz..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sena focus:border-sena sm:text-sm transition-shadow"
                />
                
    </div>
              
    </div>
            
    </div>
          
          <div className="overflow-x-auto print:overflow-visible">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-slate-200 print:divide-slate-400">
                <thead>
                  <tr className="bg-slate-50 print:bg-slate-100">
                    <th scope="col" className="sticky left-0 z-10 bg-slate-50/95 backdrop-blur-sm px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] w-72 print:static print:bg-transparent print:shadow-none print:border-slate-400">
                      Aprendiz
                    </th>
                    <th scope="col" className="px-3 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-r border-slate-200 bg-slate-50 print:border-slate-400">
                      Fallas
                    </th>
                    {currentInstructorDates.map((date, idx) => {
                      const displayDate = formatDateForDisplay(date);
                      const [d, m, y] = displayDate.split('/');
                      return (
                      <th key={idx} scope="col" className="px-3 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 whitespace-nowrap min-w-[80px] print:border-slate-400">
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] text-slate-400 font-medium mb-0.5">{d}/{m}</span>
                          <span>{y}</span>
                          
    </div>
                      </th>
                    )})}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200 print:divide-slate-300">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={currentInstructorDates.length + 2} className="px-6 py-12 text-center text-slate-500">
                        No se encontraron aprendices con ese criterio de búsqueda.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => (
                      <tr key={student.numero_documento} className="hover:bg-slate-50/50 transition-colors group print:break-inside-avoid">
                        <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50 px-4 py-3 whitespace-nowrap border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] print:static print:bg-transparent print:shadow-none print:border-slate-300">
                          <div className="flex items-center gap-2">
                            {student.enRiesgo && <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                            <div className="flex flex-col">
                              <span className={`text-sm font-medium truncate max-w-[200px] ${student.enRiesgo ? 'text-red-700' : 'text-slate-900'}`} title={`${student.apellidos} ${student.nombres}`}>
                                {student.apellidos} {student.nombres}
                              </span>
                              <span className="text-xs text-slate-500">{student.numero_documento}</span>
                              
    </div>
                            
    </div>
                        </td>
                        <td className={`px-3 py-3 whitespace-nowrap text-center border-r border-slate-200 font-bold ${student.enRiesgo ? 'bg-red-50 text-red-700' : 'text-slate-700'} print:border-slate-300`}>
                          {student.fallasAcumuladas}
                        </td>
                        {currentInstructorDates.map((date) => {
                          const status = student.registros[date as keyof typeof student.registros];
                          return (
                            <td key={`${student.numero_documento}-${date}`} className={`px-3 py-3 whitespace-nowrap text-center ${getStatusClass(status)} print:border-l print:border-slate-200`}>
                              {getStatusIcon(status)}
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
          
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-wrap gap-4 text-xs text-slate-600 justify-center sm:justify-start print:bg-white print:border-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-sena opacity-50" />
              <span>Presente (Vacío)</span>
              
    </div>
            <div className="flex items-center gap-1.5">
              <span className="flex items-center justify-center w-4 h-4 rounded-full bg-red-100 text-red-600 font-bold text-[10px] print:border print:border-red-600 print:bg-white">X</span>
              <span>Inasistencia</span>
              
    </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Llegada Tarde</span>
              
    </div>
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-blue-500" />
              <span>Excusa / Evento</span>
              
    </div>
            <div className="flex items-center gap-1.5 ml-auto border-l border-slate-300 pl-4">
              <span className="font-bold text-red-600">Alerta Normativa:</span>
              <span>≥ 3 Fallas</span>
              
    </div>
            
    </div>
          
    </div>
      </main>

      {/* Modal de Notificación */}
      {showNotifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 print:hidden">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Mail className="w-5 h-5 text-sena" />
                Notificación Normativa
              </h3>
              <button onClick={() => !isSending && setShowNotifyModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <XCircle className="w-6 h-6" />
              </button>
              
    </div>
            
            <div className="flex border-b border-slate-200 bg-white px-5 pt-3 gap-6">
              <button
                className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${notifyTab === 'inasistencias' ? 'border-sena text-sena' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                onClick={() => { setNotifyTab('inasistencias'); setSelectedTemplateStudent(null); }}
              >
                Inasistencias ({stats.enRiesgo})
              </button>
              <button
                className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${notifyTab === 'retardos' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                onClick={() => { setNotifyTab('retardos'); setSelectedTemplateStudent(null); }}
              >
                Llegadas Tarde ({stats.enRiesgoTarde})
              </button>
              
    </div>
            
            <div className="p-5 flex-1 overflow-y-auto bg-slate-50/50">
              {notifySuccess ? (
                <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                  <CheckCircle className="w-16 h-16 text-sena mb-4" />
                  <h4 className="text-xl font-bold text-slate-900 mb-2">¡Notificaciones Enviadas!</h4>
                  <p className="text-slate-500">Se han enviado correos normativos y notificado a Bienestar y Coordinación.</p>
                  
    </div>
              ) : (
                <>
                  {notifyTab === 'inasistencias' && (
                    <div className="space-y-4">
                      <p className="text-sm text-slate-600">
                        Aprendices que acumularon <strong>3 o más inasistencias injustificadas</strong>.
                      </p>
                      {studentsAtRiskFallas.length === 0 ? (
                        <div className="p-6 text-center text-slate-500 bg-white rounded-lg border border-slate-200">
                          No hay aprendices en riesgo por inasistencia.
                          
    </div>
                      ) : (
                        <ul className="space-y-3">
                          {studentsAtRiskFallas.map(student => (
                            <div key={student.numero_documento} className="bg-white rounded-lg border border-red-200 shadow-sm overflow-hidden">
                              <div className="flex items-center justify-between p-3">
                                <div className="flex flex-col">
                                  <span className="text-sm font-semibold text-slate-900">{student.nombres} {student.apellidos}</span>
                                  <span className="text-xs text-slate-500">{student.correo_electronico}</span>
                                  
    </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs font-bold bg-red-100 text-red-700 px-2.5 py-1 rounded-md">
                                    {student.fallasAcumuladas} Fallas
                                  </span>
                                  <button 
                                    onClick={() => setSelectedTemplateStudent(selectedTemplateStudent === student.numero_documento ? null : student.numero_documento)}
                                    className="text-sena hover:text-sena-dark text-sm font-medium flex items-center gap-1 bg-sena-light px-2 py-1 rounded transition-colors"
                                  >
                                    <FileText className="w-4 h-4" />
                                    Plantilla
                                  </button>
                                  
    </div>
                                
    </div>
                              
                              {selectedTemplateStudent === student.numero_documento && (
                                <div className="border-t border-slate-100 bg-slate-50 p-4">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vista previa del correo</span>
                                    <button 
                                      onClick={() => copyToClipboard(generateAbsenceTemplate(student))}
                                      className="text-slate-500 hover:text-slate-800 text-xs flex items-center gap-1 transition-colors"
                                    >
                                      {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-sena" /> : <Copy className="w-3.5 h-3.5" />}
                                      {copied ? 'Copiado' : 'Copiar'}
                                    </button>
                                    
    </div>
                                  <div className="text-xs text-slate-700 bg-white p-4 rounded border border-slate-200 overflow-y-auto max-h-[400px]" dangerouslySetInnerHTML={{ __html: generateAbsenceTemplate(student) }} />
                                  
    </div>
                              )}
                              
    </div>
                          ))}
                        </ul>
                      )}
                      
    </div>
                  )}

                  {notifyTab === 'retardos' && (
                    <div className="space-y-4">
                      <p className="text-sm text-slate-600">
                        Aprendices que acumularon <strong>3 o más llegadas tarde</strong>.
                      </p>
                      {studentsAtRiskTarde.length === 0 ? (
                        <div className="p-6 text-center text-slate-500 bg-white rounded-lg border border-slate-200">
                          No hay aprendices en riesgo por llegadas tarde.
                          
    </div>
                      ) : (
                        <ul className="space-y-3">
                          {studentsAtRiskTarde.map(student => (
                            <div key={student.numero_documento} className="bg-white rounded-lg border border-amber-200 shadow-sm overflow-hidden">
                              <div className="flex items-center justify-between p-3">
                                <div className="flex flex-col">
                                  <span className="text-sm font-semibold text-slate-900">{student.nombres} {student.apellidos}</span>
                                  <span className="text-xs text-slate-500">{student.correo_electronico}</span>
                                  
    </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-md">
                                    {student.tardanzasAcumuladas} Retardos
                                  </span>
                                  <button 
                                    onClick={() => setSelectedTemplateStudent(selectedTemplateStudent === student.numero_documento ? null : student.numero_documento)}
                                    className="text-sena hover:text-sena-dark text-sm font-medium flex items-center gap-1 bg-sena-light px-2 py-1 rounded transition-colors"
                                  >
                                    <FileText className="w-4 h-4" />
                                    Plantilla
                                  </button>
                                  
    </div>
                                
    </div>
                              
                              {selectedTemplateStudent === student.numero_documento && (
                                <div className="border-t border-slate-100 bg-slate-50 p-4">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vista previa del correo</span>
                                    <button 
                                      onClick={() => copyToClipboard(generateLateTemplate(student))}
                                      className="text-slate-500 hover:text-slate-800 text-xs flex items-center gap-1 transition-colors"
                                    >
                                      {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-sena" /> : <Copy className="w-3.5 h-3.5" />}
                                      {copied ? 'Copiado' : 'Copiar texto'}
                                    </button>
                                    
    </div>
                                  <div className="bg-white border border-slate-200 rounded-md p-4 text-xs text-slate-700 overflow-y-auto max-h-[400px]" dangerouslySetInnerHTML={{ __html: generateLateTemplate(student) }} />
                                  
    </div>
                              )}
                              
    </div>
                          ))}
                        </ul>
                      )}
                      
    </div>
                  )}
                </>
              )}
              
    </div>
            
            {!notifySuccess && (
              <div className="p-4 border-t border-slate-200 bg-white flex justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
                <button 
                  onClick={() => setShowNotifyModal(false)}
                  disabled={isSending}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmNotification}
                  disabled={isSending || (notifyTab === 'inasistencias' ? studentsAtRiskFallas.length === 0 : studentsAtRiskTarde.length === 0)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sena hover:bg-sena-dark rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enviando correos...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      Enviar Notificaciones a Todos
                    </>
                  )}
                </button>
                
    </div>
            )}
            
    </div>
          
    </div>
      )}

      {/* Modal para Tomar Asistencia */}
      {showAttendanceModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 print:hidden">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col h-[85vh]">
            <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <ClipboardList className="w-6 h-6 text-sena" />
                  Llamado a Lista
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Instructor: {currentInstructor.nombre_del_instructor}
                </p>
                
    </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <input 
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="border-none text-sm font-semibold text-slate-700 focus:ring-0 p-0"
                  />
                  
    </div>
                <button onClick={() => setShowAttendanceModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors bg-white rounded-full p-1">
                  <XCircle className="w-6 h-6" />
                </button>
                
    </div>
              
    </div>
            
            <div className="flex-1 overflow-auto bg-slate-50/30 p-0">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-white sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/3">
                      Aprendiz
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Estado de Asistencia
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {studentsWithStats.map(student => (
                    <tr key={student.numero_documento} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-900">{student.apellidos} {student.nombres}</span>
                          <span className="text-xs text-slate-500 font-mono">{student.numero_documento}</span>
                          
    </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setTempRecords(prev => ({ ...prev, [student.numero_documento]: 'Presente' }))}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium border flex-1 max-w-[100px] transition-all ${
                              tempRecords[student.numero_documento] === 'Presente' 
                                ? 'bg-sena-light border-emerald-500 text-sena-dark shadow-[inset_0_0_0_1px_rgba(16,185,129,0.5)]' 
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            Presente
                          </button>
                          <button
                            onClick={() => setTempRecords(prev => ({ ...prev, [student.numero_documento]: 'X' }))}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium border flex-1 max-w-[100px] transition-all ${
                              tempRecords[student.numero_documento] === 'X' 
                                ? 'bg-red-100 border-red-500 text-red-700 shadow-[inset_0_0_0_1px_rgba(239,68,68,0.5)]' 
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            Falla
                          </button>
                          <button
                            onClick={() => setTempRecords(prev => ({ ...prev, [student.numero_documento]: 'Tarde' }))}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium border flex-1 max-w-[100px] transition-all ${
                              tempRecords[student.numero_documento] === 'Tarde' 
                                ? 'bg-amber-100 border-amber-500 text-amber-700 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.5)]' 
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            Tarde
                          </button>
                          <button
                            onClick={() => setTempRecords(prev => ({ ...prev, [student.numero_documento]: 'Excusa' }))}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium border flex-1 max-w-[100px] transition-all ${
                              tempRecords[student.numero_documento] === 'Excusa' 
                                ? 'bg-blue-100 border-blue-500 text-blue-700 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.5)]' 
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            Excusa
                          </button>
                          
    </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
    </div>
            
            <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
              <span className="text-sm text-slate-500 font-medium">
                Se actualizará la tabla principal automáticamente
              </span>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowAttendanceModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Descartar
                </button>
                <button 
                  onClick={handleSaveAttendance}
                  disabled={isSavingAttendance}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-sena hover:bg-sena-dark rounded-lg transition-colors shadow-sm disabled:opacity-70"
                >
                  {isSavingAttendance ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSavingAttendance ? 'Guardando...' : 'Guardar Asistencia'}
                </button>
                
    </div>
              
    </div>
            
    </div>
          
    </div>
      )}
      {/* Modal para Exportar Informes */}
      {showExportModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 print:hidden">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <FileOutput className="w-6 h-6 text-sena" />
                  Exportar Informe PDF
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Seleccione el tipo de informe que desea generar
                </p>
                
    </div>
              <button onClick={() => setShowExportModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors bg-white rounded-full p-1">
                <XCircle className="w-6 h-6" />
              </button>
              
    </div>
            
            <div className="p-5 max-h-[60vh] overflow-y-auto bg-slate-50/50">
              <div className="space-y-3">
                {REPORT_TYPES.map(report => (
                  <div 
                    key={report.id}
                    onClick={() => setSelectedReportType(report.id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedReportType === report.id 
                        ? 'border-sena bg-sena-light/50' 
                        : 'border-slate-200 bg-white hover:border-sena'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedReportType === report.id ? 'border-sena' : 'border-slate-300'
                      }`}>
                        {selectedReportType === report.id && <div className="w-2.5 h-2.5 bg-sena rounded-full" />}
                        
    </div>
                      <div>
                        <h4 className={`font-semibold ${selectedReportType === report.id ? 'text-emerald-900' : 'text-slate-800'}`}>
                          {report.nombre}
                        </h4>
                        <p className="text-sm text-slate-500 mt-1">
                          {report.descripcion}
                        </p>
                        
    </div>
                      
    </div>

                    {/* Inject options here directly under the description when selected */}
                    {selectedReportType === report.id && report.id === 'asistencia_diaria_acumulada' && (
                      <div className="mt-4 p-4 border border-slate-200 rounded-lg bg-white space-y-4 shadow-sm" onClick={e => e.stopPropagation()}>
                        <h4 className="font-semibold text-slate-800 text-sm">Opciones de Filtrado</h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Fecha Inicial</label>
                            <select 
                              value={exportStartDate}
                              onChange={(e) => setExportStartDate(e.target.value)}
                              className="w-full rounded-lg border-slate-200 text-sm"
                            >
                              {currentInstructorDates.map(date => (
                                <option key={date} value={date}>{date}</option>
                              ))}
                            </select>
                            
    </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Fecha Final</label>
                            <select 
                              value={exportEndDate}
                              onChange={(e) => setExportEndDate(e.target.value)}
                              className="w-full rounded-lg border-slate-200 text-sm"
                            >
                              {currentInstructorDates.map(date => (
                                <option key={date} value={date}>{date}</option>
                              ))}
                            </select>
                            
    </div>
                          
    </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Modo de Reporte</label>
                            <select 
                              value={exportMode}
                              onChange={(e) => setExportMode(e.target.value as 'acumulado' | 'diario')}
                              className="w-full rounded-lg border-slate-200 text-sm"
                            >
                              <option value="acumulado">Acumulado (Totales)</option>
                              <option value="diario">Detallado Diario</option>
                            </select>
                            
    </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Instructor</label>
                            <select 
                              value={exportInstructor}
                              onChange={(e) => setExportInstructor(e.target.value)}
                              className="w-full rounded-lg border-slate-200 text-sm"
                            >
                              <option value="all">Todos los instructores</option>
                              {courseData.equipo_instructores.map((inst, idx) => (
                                <option key={idx} value={inst.nombre_del_instructor}>{inst.nombre_del_instructor} ({inst.dia})</option>
                              ))}
                            </select>
                            
    </div>
                          
    </div>
                        
    </div>
                    )}
                    
    </div>
                ))}
                
    </div>
              
    </div>

            <div className="p-4 border-t border-slate-200 bg-white flex justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
              <button 
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleExportConfirm}
                disabled={isPreparingPdf}
                className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-sena hover:bg-sena-dark rounded-lg transition-colors shadow-sm disabled:opacity-70"
              >
                {isPreparingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileOutput className="w-4 h-4" />}
                {isPreparingPdf ? 'Generando...' : 'Generar PDF'}
              </button>
              
    </div>
            
    </div>
          
    </div>
      )}

      {/* Global Modals */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <SheetsTemplateModal 
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        currentFicha={courseData.ficha_de_caracterizacion}
        courseData={courseData}
        onDataLoaded={(newData) => setCourseData(newData)}
      />
    </div>
  );
}
