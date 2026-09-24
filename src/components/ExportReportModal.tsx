import React, { useState } from 'react';
import { X, Printer, FileText, Filter } from 'lucide-react';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseData: any;
  students: any[];
}

export default function ExportReportModal({ isOpen, onClose, courseData, students }: ExportReportModalProps) {
  const [reportType, setReportType] = useState<'inasistencias' | 'tardanzas'>('inasistencias');
  const [selectedInstructorFilter, setSelectedInstructorFilter] = useState<string>('todos');

  if (!isOpen) return null;

  const instructores = courseData.equipo_instructores || [];

  // Obtener fechas según el instructor seleccionado
  const getDatesForFilter = () => {
    if (selectedInstructorFilter === 'todos') {
      let allDates: string[] = [];
      if (courseData.fechas_por_instructor) {
        Object.values(courseData.fechas_por_instructor).forEach((dates: any) => {
          allDates = [...allDates, ...dates];
        });
      }
      return Array.from(new Set([...courseData.fechas_asistencia, ...allDates]));
    } else {
      const inst = instructores.find((i: any) => i.nombre_del_instructor === selectedInstructorFilter);
      if (inst && courseData.fechas_por_instructor?.[selectedInstructorFilter]) {
        return courseData.fechas_por_instructor[selectedInstructorFilter];
      }
      return courseData.fechas_asistencia;
    }
  };

  const activeDates = getDatesForFilter();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center print:hidden">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" /> Generador de Reportes Académicos (PDF / Impresión)
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-grow">
          {/* Controles de Filtrado (Ocultos al imprimir) */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label className="text-xs font-bold text-slate-700">Tipo de Reporte:</label>
              <select 
                value={reportType}
                onChange={(e: any) => setReportType(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold bg-white text-slate-800"
              >
                <option value="inasistencias">Inasistencias (Con / Sin Excusa) por Fecha</option>
                <option value="tardanzas">Reporte de Llegadas Tarde por Fecha</option>
              </select>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-emerald-600" /> Instructor:
              </span>
              <select 
                value={selectedInstructorFilter}
                onChange={(e) => setSelectedInstructorFilter(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold bg-white text-slate-800"
              >
                <option value="todos">Todos los Instructores</option>
                {instructores.map((inst: any, idx: number) => (
                  <option key={idx} value={inst.nombre_del_instructor}>
                    {inst.nombre_del_instructor}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* DOCUMENTO VISTA PREVIA LISTO PARA IMPRIMIR O GUARDAR COMO PDF */}
          <div className="p-8 bg-white border border-slate-300 rounded-xl space-y-6 shadow-sm print:border-none print:shadow-none print:p-0">
            <div className="text-center border-b pb-4 space-y-1">
              <div className="font-bold text-sm text-emerald-800">SERVICIO NACIONAL DE APRENDIZAJE SENA</div>
              <h2 className="text-lg font-bold text-slate-900">{courseData.denominacion}</h2>
              <p className="text-xs text-slate-600">Ficha de Caracterización: <strong>{courseData.ficha_de_caracterizacion}</strong> | Centro: {courseData.centro}</p>
              <p className="text-xs text-emerald-700 font-semibold pt-1">
                Reporte: {reportType === 'inasistencias' ? 'Inasistencias y Excusas por Fecha' : 'Control de Llegadas Tarde'} 
                {selectedInstructorFilter !== 'todos' ? ` | Instructor: ${selectedInstructorFilter}` : ''}
              </p>
            </div>

            {reportType === 'inasistencias' ? (
              <div className="space-y-6">
                {activeDates.map((date: string) => {
                  const ausentesFecha = students.filter(s => s.registros[date] === 'X');
                  const excusadosFecha = students.filter(s => s.registros[date] === 'Excusa' || s.registros[date] === 'Evento');
                  
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
                })}
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
                        .filter(s => s.registros[date] === 'Tarde')
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

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 print:hidden">
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
  );
}
