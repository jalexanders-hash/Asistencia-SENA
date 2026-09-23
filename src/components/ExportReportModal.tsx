import React, { useState } from 'react';
import { FileText, Calendar, X, Loader2, Download } from 'lucide-react';
import { REPORT_TYPES, generatePDFReport } from '../lib/pdfGenerator';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseData: any;
  studentsWithStats: any[];
  availableDates: string[];
}

// Función auxiliar para convertir formato 'DD/MM/YYYY' o 'M/D/YYYY' a 'YYYY-MM-DD' para el input date
const convertToInputDate = (dateStr: string) => {
  if (!dateStr) return '2026-02-01';
  if (dateStr.includes('-')) return dateStr; // Ya está en YYYY-MM-DD
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const month = parts[0].padStart(2, '0');
    const day = parts[1].padStart(2, '0');
    let year = parts[2];
    if (year.length === 2) year = '20' + year;
    return `${year}-${month}-${day}`;
  }
  return '2026-02-01';
};

// Función para volver a formatear de 'YYYY-MM-DD' a 'M/D/YYYY' al enviar al generador
const formatOutputDate = (dateStr: string) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  if (year && month && day) {
    return `${parseInt(month)}/${parseInt(day)}/${year}`;
  }
  return dateStr;
};

export default function ExportReportModal({
  isOpen,
  onClose,
  courseData,
  studentsWithStats,
  availableDates
}: ExportReportModalProps) {
  const [reportType, setReportType] = useState(REPORT_TYPES.CONSOLIDADO);
  
  // Convertir las fechas iniciales al formato YYYY-MM-DD compatible con el input date
  const [startDate, setStartDate] = useState(() => convertToInputDate(availableDates[0] || '01/02/2026'));
  const [endDate, setEndDate] = useState(() => convertToInputDate(availableDates[availableDates.length - 1] || '21/09/2026'));
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // Formatear las fechas al estándar esperado por el generador de PDF (M/D/YYYY)
      await generatePDFReport(reportType, courseData, studentsWithStats, {
        startDate: formatOutputDate(startDate),
        endDate: formatOutputDate(endDate),
        mode: 'acumulado',
        instructor: 'all'
      });
      onClose();
    } catch (error) {
      console.error("Error al exportar:", error);
      alert("Hubo un error al generar el reporte.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 space-y-6 overflow-hidden border border-slate-100">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-sena flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Generar Reporte Oficial PDF</h3>
              <p className="text-xs text-slate-500">Ficha: {courseData?.ficha_de_caracterizacion || '3387401'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido del Formulario */}
        <div className="space-y-4 text-sm">
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Seleccionar Tipo de Informe Académico:</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 font-medium focus:ring-2 focus:ring-sena focus:outline-none"
            >
              <option value={REPORT_TYPES.CONSOLIDADO}>Consolidado de Asistencia y Alertas Tempranas</option>
              <option value={REPORT_TYPES.RIESGO}>Listado Exclusivo de Aprendices en Riesgo (Deserción)</option>
              <option value={REPORT_TYPES.DETALLADO}>Reporte Detallado de Inasistencias por Fechas</option>
            </select>
            <p className="text-xs text-slate-500 mt-1">
              {reportType === REPORT_TYPES.CONSOLIDADO && 'Resumen global de asistencia, inasistencias y retardos de todos los aprendices.'}
              {reportType === REPORT_TYPES.RIESGO && 'Filtra únicamente a los aprendices que superan el umbral establecido.'}
              {reportType === REPORT_TYPES.DETALLADO && 'Informe analítico detallado con trazabilidad de fechas específicas.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha de Inicio:</label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white font-mono cursor-pointer"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha de Cierre:</label>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white font-mono cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-5 py-2.5 bg-sena hover:bg-sena-dark text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition-colors disabled:opacity-70"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>{isGenerating ? 'Generando PDF...' : 'Descargar PDF'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
