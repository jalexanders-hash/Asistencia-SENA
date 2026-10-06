import React, { useState } from 'react';
import { X, Printer, FileText, Filter, Download } from 'lucide-react';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseData: any;
  students: any[];
}

// Normaliza textos (elimina tildes, espacios y convierte a minúsculas)
function normalizeStr(str: string): string {
  if (!str) return '';
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// Mapeo preciso para convertir cualquier fecha en formato DD/MM/YYYY o YYYY-MM-DD a su día de la semana real
function getDayOfWeekFromDate(dateStr: string): string {
  if (!dateStr) return '';
  let parts: string[] = [];
  
  if (dateStr.includes('/')) {
    parts = dateStr.split('/');
  } else if (dateStr.includes('-')) {
    parts = dateStr.split('-');
    if (parts[0].length === 4) {
      parts = [parts[2], parts[1], parts[0]]; // YYYY-MM-DD a DD-MM-YYYY
    }
  }

  if (parts.length === 3) {
    const day = Number(parts[0]);
    const month = Number(parts[1]) - 1;
    const year = Number(parts[2]);
    const d = new Date(year, month, day);
    
    if (!isNaN(d.getTime())) {
      const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
      return days[d.getDay()] || '';
    }
  }
  return '';
}

export default function ExportReportModal({ isOpen, onClose, courseData, students }: ExportReportModalProps) {
  const [reportType, setReportType] = useState<'inasistencias' | 'tardanzas'>('inasistencias');
  const [selectedInstructorFilter, setSelectedInstructorFilter] = useState<string>('todos');

  if (!isOpen) return null;

  const instructores = courseData?.equipo_instructores || [];

  // Buscar los datos detallados del instructor seleccionado
  const currentInstructorObj = instructores.find(
    (i: any) => normalizeStr(i.nombre_del_instructor) === normalizeStr(selectedInstructorFilter)
  );

  // Cruce por calendario real entre las fechas de la ficha y el día programado del instructor
  const getDatesForFilter = () => {
    const allDates = courseData?.fechas_asistencia || [];

    if (selectedInstructorFilter === 'todos') {
      return allDates;
    }

    if (!currentInstructorObj) {
      return allDates; 
    }

    const diaProgramado = normalizeStr(currentInstructorObj.dia || '');

    if (!diaProgramado) {
      const fechasMap = courseData?.fechas_por_instructor?.[selectedInstructorFilter];
      if (Array.isArray(fechasMap) && fechasMap.length > 0) return fechasMap;
      return allDates;
    }

    return allDates.filter((dateStr: string) => {
      const diaRealDeLaFecha = getDayOfWeekFromDate(dateStr);
      return diaProgramado.includes(diaRealDeLaFecha);
    });
  };

  const activeDates = getDatesForFilter();

  const handlePrint = () => {
    window.print();
  };

  // ==========================================
  // EXPORTACIÓN A CSV / EXCEL LIMPIO
  // ==========================================
  const exportToCSV = (data: any[], fileName: string) => {
    if (!data || data.length === 0) {
      alert("No hay datos disponibles para exportar con este filtro.");
      return;
    }

    const headers = Object.keys(data[0]);
    const csvRows = [];

    csvRows.push(headers.join(';'));

    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header] !== undefined && row[header] !== null ? row[header] : '';
        const escaped = String(val).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(';'));
    }

    const blob = new Blob(["\ufeff" + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadCleanSummaryReport = () => {
    try {
      const listaEstudiantes = students || [];
      const dates = activeDates || [];

      if (listaEstudiantes.length === 0) {
        alert("No hay registros suficientes para generar el reporte.");
        return;
      }

      const reportData = listaEstudiantes.map((student: any) => {
        let totalAsistencias = 0;
        let totalInasistencias = 0;
        let totalExcusas = 0;
        let totalTardanzas = 0;

        dates.forEach((date: string) => {
          const estado = normalizeStr(student.registros?.[date]);
          if (estado === 'asistio' || estado === 'asistió') totalAsistencias++;
          if (estado === 'x' || estado === 'falto' || estado === 'faltó') totalInasistencias++;
          if (estado === 'excusa' || estado === 'evento') totalExcusas++;
          if (estado === 'tarde' || estado === 'tardanza') totalTardanzas++;
        });

        const totalSesionesEvaluadas = dates.length;
        const porcentajeAsistencia = totalSesionesEvaluadas > 0 
          ? ((totalAsistencias / totalSesionesEvaluadas) * 100).toFixed(1) + '%' 
          : '0.0%';

        return {
          "Documento": student.numero_documento,
          "Nombres": student.nombres,
          "Apellidos": student.apellidos,
          "Instructor_Filtro": selectedInstructorFilter === 'todos' ? 'Consolidado General' : selectedInstructorFilter,
          "Competencia": currentInstructorObj?.competencia || 'N/A',
          "Sesiones_Evaluadas": totalSesionesEvaluadas,
          "Total_Asistencias": totalAsistencias,
          "Total_Inasistencias": totalInasistencias,
          "Total_Excusas": totalExcusas,
          "Total_Tardanzas": totalTardanzas,
          "Porcentaje_Asistencia": porcentajeAsistencia
        };
      });

      const instructorSuffix = selectedInstructorFilter === 'todos' ? 'General' : selectedInstructorFilter.replace(/\s+/g, '_');
      exportToCSV(reportData, `Reporte_Ejecutivo_Ficha_${courseData?.ficha_de_caracterizacion || ''}_${instructorSuffix}`);
    } catch (error) {
      console.error("Error al generar reporte limpio:", error);
      alert("Ocurrió un error al generar el reporte.");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center print:hidden">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" /> Generador de Reportes Académicos (SENA)
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-grow">
          {/* Controles de Filtrado */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label className="text-xs font-bold text-slate-700">Tipo de Reporte:</label>
              <select 
                value={reportType}
                onChange={(e: any) => setReportType(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold bg-white text-slate-800"
              >
                <option value="inasistencias">Inasistencias y Excusas por Fecha</option>
                <option value="tardanzas">Control de Llegadas Tarde por Fecha</option>
              </select>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-emerald-600" /> Filtrar por Instructor:
              </span>
              <select 
                value={selectedInstructorFilter}
                onChange={(e) => setSelectedInstructorFilter(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold bg-white text-slate-800"
              >
                <option value="todos">Todos los Instructores (General)</option>
                {instructores.map((inst: any, idx: number) => (
                  <option key={idx} value={inst.nombre_del_instructor}>
                    {inst.nombre_del_instructor} {inst.dia ? `(${inst.dia})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* VISTA PREVIA CON INFORMACIÓN DETALLADA DEL INSTRUCTOR */}
          <div className="p-8 bg-white border border-slate-300 rounded-xl space-y-6 shadow-sm print:border-none print:shadow-none print:p-0">
            <div className="text-center border-b pb-4 space-y-1.5">
              <div className="font-bold text-sm text-emerald-800">SERVICIO NACIONAL DE APRENDIZAJE SENA</div>
              <h2 className="text-lg font-bold text-slate-900">{courseData?.denominacion}</h2>
              <p className="text-xs text-slate-600">
                Ficha de Caracterización: <strong>{courseData?.ficha_de_caracterizacion}</strong> | Centro: {courseData?.centro}
              </p>
              
              {/* Tarjeta de Información del Instructor Seleccionado */}
              {selectedInstructorFilter !== 'todos' && currentInstructorObj ? (
                <div className="mt-3 p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg text-left grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 font-medium">Instructor:</span>{' '}
                    <strong className="text-slate-800">{currentInstructorObj.nombre_del_instructor}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Rol:</span>{' '}
                    <strong className="text-slate-800">{currentInstructorObj.rol || 'Instructor / Tutor'}</strong>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-500 font-medium">Competencia:</span>{' '}
                    <strong className="text-slate-800">{currentInstructorObj.competencia || 'No especificada'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Día Asignado:</span>{' '}
                    <strong className="text-emerald-700 uppercase">{currentInstructorObj.dia || 'No definido'}</strong>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-emerald-700 font-semibold pt-1">
                  Reporte General Consolidado de la Ficha
                </p>
              )}
            </div>

            {reportType === 'inasistencias' ? (
              <div className="space-y-6">
                {activeDates.length === 0 ? (
                  <p className="text-center text-slate-400 italic text-xs py-4">No hay sesiones asociadas a los días programados para este instructor.</p>
                ) : (
                  activeDates.map((date: string) => {
                    const ausentesFecha = students.filter(s => {
                      const est = normalizeStr(s.registros?.[date]);
                      return est === 'x' || est === 'falto' || est === 'faltó';
                    });
                    const excusadosFecha = students.filter(s => {
                      const est = normalizeStr(s.registros?.[date]);
                      return est === 'excusa' || est === 'evento';
                    });
                    
                    if (ausentesFecha.length === 0 && excusadosFecha.length === 0) return null;

                    return (
                      <div key={date} className="border border-slate-200 rounded-lg overflow-hidden">
                        <div className="bg-slate-100 px-4 py-2 text-xs font-bold text-slate-800 border-b border-slate-200 flex justify-between">
                          <span>Fecha de Sesión: {date}</span>
                          <span className="text-red-600">Faltas: {ausentesFecha.length} | Excusas: {excusadosFecha.length}</span>
                        </div>
                        <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="font-bold text-red-700 block mb-1">Sin Excusa (Inasistencias):</span>
                            {ausentesFecha.length > 0 ? (
                              <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                                {ausentesFecha.map(s => (
                                  <li key={s.numero_documento}>{s.apellidos} {s.nombres} ({s.numero_documento})</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-slate-400 italic">Ninguna inasistencia sin excusa.</p>
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-blue-700 block mb-1">Con Excusa / Justificadas:</span>
                            {excusadosFecha.length > 0 ? (
                              <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                                {excusadosFecha.map(s => (
                                  <li key={s.numero_documento}>{s.apellidos} {s.nombres} ({s.numero_documento})</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-slate-400 italic">Ninguna excusa registrada.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-200">
                      <th className="p-2.5">Fecha</th>
                      <th className="p-2.5">Aprendiz</th>
                      <th className="p-2.5 text-center">Documento</th>
                      <th className="p-2.5 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeDates.flatMap((date: string) => 
                      students
                        .filter(s => {
                          const est = normalizeStr(s.registros?.[date]);
                          return est === 'tarde' || est === 'tardanza';
                        })
                        .map(s => ({ date, student: s }))
                    ).map(({ date, student }, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono font-bold text-slate-700">{date}</td>
                        <td className="p-2.5 font-bold text-slate-800">{student.apellidos} {student.nombres}</td>
                        <td className="p-2.5 text-center font-mono text-slate-500">{student.numero_documento}</td>
                        <td className="p-2.5 text-center">
                          <span className="bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded">Llegada Tarde</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* PIE DEL MODAL */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap justify-between items-center gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <button 
              onClick={handleDownloadCleanSummaryReport}
              className="px-4 py-2 bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Download className="w-4 h-4 text-emerald-700" /> Descargar Reporte Ejecutivo Limpio (.CSV)
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100"
            >
              Cerrar
            </button>
            <button 
              onClick={handlePrint}
              className="px-5 py-2 bg-emerald-700 text-white rounded-lg text-sm font-semibold hover:bg-emerald-800 flex items-center gap-2 shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" /> Imprimir / Guardar PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
