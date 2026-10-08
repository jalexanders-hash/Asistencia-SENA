import React, { useState, useMemo } from 'react';
import { X, Printer, Download, Calendar, Shield, Award, Users, FileText } from 'lucide-react';

const LOGO_SENA_SVG = `data:image/svg+xml,%3c?xml%20version=%271.0%27%20encoding=%27utf-8%27?%3e%3c!--%20Generator:%20Adobe%20Illustrator%2026.0.1,%20SVG%20Export%20Plug-In%20.%20SVG%20Version:%206.00%20Build%200)%20--%3e%3csvg%20version=%271.1%27%20id=%27Capa_1%27%20xmlns=%27http://www.w3.org/2000/svg%27%20xmlns:xlink=%27http://www.w3.org/1999/xlink%27%20x=%270px%27%20y=%270px%27%20viewBox=%270%200%201000%201000%27%20style=%27enable-background:new%200%200%201000%201000;%27%20xml:space=%27preserve%27%3e%3cstyle%20type=%27text/css%27%3e%20.st0{fill:%2339a900;}%20%3c/style%3e%3cpath%20id=%27path47-5%27%20class=%27st0%27%20d=%27M504.2,20.5c-58.3,0.1-105.6,47.4-105.5,105.8c0.1,58.3,47.4,105.6,105.7,105.6%20c58.3,0,105.6-47.3,105.6-105.7V126C609.9,67.6,562.6,20.4,504.2,20.5z%20M155.6,264.6c-18.6,0.1-37.5,1.1-55.2,5.6%20c-11.7,3-23,7.8-30.3,15.4c-9.2,9.5-10.4,22.3-5.9,33.3c4,9.7,14.8,16.9,26.8,21.1c25.9,8.9,54.6,10.7,81.8,16.3%20c5,1.2,10.6,2.6,13.7,6c3.2,4.1,1.3,9.7-4,12.2c-8.8,4.5-20.1,4.5-30.4,4.4c-9.4-0.4-19.7-1.2-27.2-5.9c-5.5-3.4-6.5-9.1-5.2-14.1%20l-60.6,0c-0.2,9.2,1.6,18.9,8.4,26.8c5.6,6.8,14.8,11.5,24.6,14.4c15.7,4.6,32.7,6,49.4,6.4c22.7,0.4,45.8-0.3,67.6-5.4%20c13-3.2,25.8-8.3,34.1-16.6c14.8-14.8,11.3-38.3-8.3-49.8c-9.8-5.7-21.5-9.2-33.4-11.5c-17.5-3.6-35.3-6.3-52.9-9.2%20c-6.2-1.2-12.8-2.3-18-5.2c-5.5-2.9-5.9-9.8-0.3-12.9c7.2-4.1,16.8-4,25.4-4c9.1,0.2,19,0.7,26.5,5c4.2,2.3,5.9,6.3,5.9,10.1%20l57.6-0.1c-0.2-7.3-1.6-14.9-6.9-21.2c-6.2-7.8-17.1-12.7-28.3-15.5C192.8,265.6,174.1,264.7,155.6,264.6L155.6,264.6z%20M280.6,268.9%20l0,137.7l168.1,0l0-30H342.3v-26.7h94.9v-29.3h-94.9l0-21.9l102.6,0l-0.1-29.7L280.6,268.9z%20M557.5,269c0,0-51.9,0-77.9,0l0,137.7%20l59,0l0-92.7l80.8,92.6l81,0.1l0-137.7l-59.1,0l0.1,92L557.5,269z%20M805.6,269.2c0,0-63.6,91.9-95.6,137.7l61.9,0l14.9-24.8h95.7%20l13.9,24.9l68.8,0L874,269.2L805.6,269.2z%20M836.6,302.1l29.4,49.9l-60.7,0.1L836.6,302.1z%20M10.6,445.6l0.5,75l280.1-1%20c14.3,3.1,22.6,12.4,19.7,33.5L138.6,854.7l56.1,52.5l266.9-461.6L10.6,445.6z%20M545.2,446.2l262.4,459.6l58-52.1L691.3,552.9%20c-2.9-21.2,5.4-30.6,19.7-33.7l280.2,1l-0.1-73.7L545.2,446.2z%20M500.9,522.3L254.8,944.7l65.4,31.9L484.4,699%20c5.7-4.6,11.4-7.1,17.1-7.3c6-0.2,12.2,2,18.3,6.8l163.8,278.4l67.4-35.2L500.9,522.3z%27/%3e%3cg%20id=%27_x23_000000ff-2%27%20transform=%27matrix(0.31570611,0,0,0.23560774,-391.49698,-10.601126)%27%3e%3c/g%3e%3c/svg%3e`;

const displayAsDDMMYYYY = (dateStr: string) => {
  if (!dateStr) return "";
  let parts: string[] = [];
  if (dateStr.includes('/')) {
    parts = dateStr.split('/');
  } else if (dateStr.includes('-')) {
    parts = dateStr.split('-');
  }
  if (parts.length === 3) {
    let p1 = parts[0].trim().replace(/['"]/g, '');
    let p2 = parts[1].trim().replace(/['"]/g, '');
    let p3 = parts[2].trim().replace(/['"]/g, '');

    if (p1.length === 4) {
      return `${String(p3).padStart(2, '0')}/${String(p2).padStart(2, '0')}/${p1}`;
    }
    if (p3.length === 4) {
      if (Number(p1) > 12) {
        return `${String(p1).padStart(2, '0')}/${String(p2).padStart(2, '0')}/${p3}`;
      }
      return `${String(p2).padStart(2, '0')}/${String(p1).padStart(2, '0')}/${p3}`;
    }
  }
  return dateStr;
};

const parseDateForSorting = (dateStr: string) => {
  if (!dateStr) return new Date(0);
  let parts: string[] = [];
  if (dateStr.includes('/')) {
    parts = dateStr.split('/');
  } else if (dateStr.includes('-')) {
    parts = dateStr.split('-');
  }
  if (parts.length === 3) {
    let p1 = parts[0].trim().replace(/['"]/g, '');
    let p2 = parts[1].trim().replace(/['"]/g, '');
    let p3 = parts[2].trim().replace(/['"]/g, '');

    if (p1.length === 4) {
      return new Date(Number(p1), Number(p2) - 1, Number(p3));
    }
    if (p3.length === 4) {
      if (Number(p1) > 12) {
        return new Date(Number(p3), Number(p2) - 1, Number(p1));
      }
      return new Date(Number(p3), Number(p1) - 1, Number(p2));
    }
  }
  return new Date(dateStr);
};

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseData: any;
  students: any[];
}

export default function ExportReportModal({ isOpen, onClose, courseData, students }: ExportReportModalProps) {
  const [reportType, setReportType] = useState<'sin_excusa' | 'con_excusa' | 'tardanzas'>('sin_excusa');
  const [selectedInstructorName, setSelectedInstructorName] = useState<string>('todos');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  if (!isOpen) return null;

  const safeCourseData = courseData || {};
  const instructorsList = Array.isArray(safeCourseData.equipo_instructores) ? safeCourseData.equipo_instructores : [];
  const currentInstructor = instructorsList.find((i: any) => i.nombre_del_instructor === selectedInstructorName) || instructorsList[0];

  const filteredDates = useMemo(() => {
    const allDates = Array.isArray(safeCourseData.fechas_asistencia) ? safeCourseData.fechas_asistencia : [];
    return allDates.filter((dateStr: string) => {
      const d = parseDateForSorting(dateStr);
      if (startDate && d < new Date(startDate)) return false;
      if (endDate && d > new Date(endDate)) return false;
      return true;
    }).sort((a: string, b: string) => parseDateForSorting(a).getTime() - parseDateForSorting(b).getTime());
  }, [safeCourseData, startDate, endDate]);

  const reportDataByStudent = useMemo(() => {
    const safeStudents = Array.isArray(students) ? students : [];
    return safeStudents.map((student) => {
      const matchedDates: string[] = [];
      const registros = student?.registros || {};

      filteredDates.forEach((date: string) => {
        const status = registros[date] || registros[displayAsDDMMYYYY(date)];
        if (reportType === 'sin_excusa' && status === 'X') {
          matchedDates.push(displayAsDDMMYYYY(date));
        } else if (reportType === 'con_excusa' && (status === 'Excusa' || status === 'Evento')) {
          matchedDates.push(displayAsDDMMYYYY(date));
        } else if (reportType === 'tardanzas' && status === 'Tarde') {
          matchedDates.push(displayAsDDMMYYYY(date));
        }
      });

      return {
        ...student,
        matchedDates,
        totalOcurrencias: matchedDates.length
      };
    }).filter(s => s.totalOcurrencias > 0);
  }, [students, filteredDates, reportType]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "APELLIDOS Y NOMBRES,DOCUMENTO DE IDENTIDAD,TOTAL,FECHAS REGISTRADAS\r\n";
    
    reportDataByStudent.forEach(s => {
      const row = `"${s.apellidos || ''} ${s.nombres || ''}","${s.numero_documento || ''}",${s.totalOcurrencias},"${s.matchedDates.join(', ')}"`;
      csvContent += row + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Reporte_${reportType}_Ficha_${safeCourseData.ficha_de_caracterizacion || 'SENA'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* ENCABEZADO DEL MODAL */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center print:hidden">
          <div className="flex items-center gap-2">
            <img src={LOGO_SENA_SVG} alt="SENA" className="w-8 h-8 object-contain" />
            <div>
              <h3 className="font-bold text-slate-800 text-base">Generador de Reportes Académicos SENA</h3>
              <p className="text-xs text-slate-500">Acuerdo 009 de 2024 y Soporte para Sofía Plus / Comité</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTROLES / FILTROS */}
        <div className="p-4 bg-emerald-50/50 border-b border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
          
          <div className="md:col-span-3 flex flex-wrap gap-2 border-b border-emerald-200 pb-3">
            <span className="text-xs font-bold text-slate-700 self-center mr-2">Tipo de Reporte:</span>
            <button
              type="button"
              onClick={() => setReportType('sin_excusa')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${reportType === 'sin_excusa' ? 'bg-[#39a900] text-white shadow-sm' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'}`}
            >
              1. Inasistencias Injustificadas (Sin Excusa)
            </button>
            <button
              type="button"
              onClick={() => setReportType('con_excusa')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${reportType === 'con_excusa' ? 'bg-[#39a900] text-white shadow-sm' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'}`}
            >
              2. Inasistencias Justificadas (Con Excusa)
            </button>
            <button
              type="button"
              onClick={() => setReportType('tardanzas')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${reportType === 'tardanzas' ? 'bg-[#39a900] text-white shadow-sm' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'}`}
            >
              3. Control de Llegadas Tarde
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Filtrar por Instructor:</label>
            <select
              value={selectedInstructorName}
              onChange={(e) => setSelectedInstructorName(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:border-[#39a900]"
            >
              <option value="todos">Todos los Instructores</option>
              {instructorsList.map((inst: any, idx: number) => (
                <option key={idx} value={inst.nombre_del_instructor}>{inst.nombre_del_instructor}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Desde la Fecha:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:border-[#39a900]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Hasta la Fecha:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:border-[#39a900]"
            />
          </div>
        </div>

        {/* VISTA PREVIA DEL REPORTE */}
        <div className="p-6 overflow-y-auto flex-grow space-y-6 bg-white print:p-0 print:overflow-visible">
          
          <div className="border-b-2 border-[#39a900] pb-4 text-center space-y-1">
            <div className="flex justify-center mb-2">
              <img src={LOGO_SENA_SVG} alt="SENA" className="w-12 h-12 object-contain" />
            </div>
            <h1 className="text-sm font-bold text-slate-900 uppercase tracking-wide">SERVICIO NACIONAL DE APRENDIZAJE SENA</h1>
            <h2 className="text-base font-extrabold text-[#39a900] uppercase">{safeCourseData.denominacion || 'PROGRAMA DE FORMACIÓN'}</h2>
            <p className="text-xs text-slate-600 font-medium">Centro: {safeCourseData.centro || 'Centro Agroindustrial'} | Ficha de Caracterización: <strong className="text-slate-900">{safeCourseData.ficha_de_caracterizacion || ''}</strong></p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block font-medium">Instructor a Cargo:</span>
              <strong className="text-slate-800 text-sm">{selectedInstructorName === 'todos' ? 'Consolidado General de Instructores' : currentInstructor?.nombre_del_instructor}</strong>
            </div>
            <div>
              <span className="text-slate-500 block font-medium">Competencia / Rol:</span>
              <span className="text-slate-700 font-semibold">{currentInstructor?.competencia || 'Competencia general de la ficha'}</span>
            </div>
            <div className="sm:col-span-2 pt-2 border-t border-slate-200 flex justify-between items-center">
              <span className="font-bold text-emerald-800 uppercase">
                {reportType === 'sin_excusa' && 'Reporte N° 1: Inasistencias Injustificadas (Sin Excusa)'}
                {reportType === 'con_excusa' && 'Reporte N° 2: Inasistencias Justificadas (Con Excusa / Evento)'}
                {reportType === 'tardanzas' && 'Reporte N° 3: Control de Llegadas Tarde (Retardos)'}
              </span>
              <span className="text-slate-500 font-mono text-[11px]">
                {startDate || endDate ? `Rango: ${startDate || 'Inicio'} al ${endDate || 'Actual'}` : 'Histórico Completo'}
              </span>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-200">
                  <th className="p-3 w-12 text-center">#</th>
                  <th className="p-3">Apellidos y Nombres del Aprendiz</th>
                  <th className="p-3 text-center w-32">Documento</th>
                  <th className="p-3 text-center w-24">Total</th>
                  <th className="p-3">Fechas Registradas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportDataByStudent.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 italic">
                      No se encontraron registros para este reporte con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  reportDataByStudent.map((student, idx) => (
                    <tr key={student.numero_documento || idx} className="hover:bg-slate-50/80">
                      <td className="p-3 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="p-3 font-bold text-slate-800">{student.apellidos || ''} {student.nombres || ''}</td>
                      <td className="p-3 text-center font-mono text-slate-600">{student.numero_documento || ''}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full font-bold text-xs ${reportType === 'sin_excusa' ? 'bg-red-100 text-red-700' : reportType === 'tardanzas' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                          {student.totalOcurrencias}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-700">
                        <div className="flex flex-wrap gap-1.5">
                          {student.matchedDates.map((d: string, i: number) => (
                            <span key={i} className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                              {d}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="pt-12 grid grid-cols-2 gap-8 text-center text-xs mt-8 page-break-inside-avoid">
            <div className="border-t border-slate-400 pt-2">
              <p className="font-bold text-slate-800">{selectedInstructorName === 'todos' ? 'Instructor / Tutor a Cargo' : currentInstructor?.nombre_del_instructor}</p>
              <p className="text-slate-500">Instructor Ejecutor SENA</p>
            </div>
            <div className="border-t border-slate-400 pt-2">
              <p className="font-bold text-slate-800">Coordinación Académica</p>
              <p className="text-slate-500">Control y Seguimiento / Comité</p>
            </div>
          </div>
        </div>

        {/* PIE DE PAGINA CON ACCIONES */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap justify-between items-center gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-emerald-50 hover:text-[#39a900] hover:border-[#39a900] flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#39a900]" /> Descargar CSV (Sofía Plus)
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2 bg-[#39a900] text-white rounded-lg text-sm font-semibold hover:bg-[#329600] flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Imprimir / Guardar PDF
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
