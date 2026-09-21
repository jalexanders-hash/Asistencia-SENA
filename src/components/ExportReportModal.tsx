import React, { useState } from 'react';
import { 
  BarChart3, 
  Scale, 
  Clock, 
  MailCheck, 
  FileOutput, 
  Loader2, 
  Check, 
  ChevronDown, 
  X 
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (selectedType: string, dateRange: { start: string; end: string }) => void;
  isPreparing: boolean;
  fichaNumber?: string;
}

// IDs mapeados exactamente con los que utiliza pdfGenerator.ts en tu proyecto
export const REPORT_OPTIONS = [
  {
    id: 'consolidado_general',
    title: 'Consolidado de Asistencia y Alertas Tempranas',
    subtitle: 'Resumen global de asistencia y aprendices en riesgo por inasistencias.',
    icon: BarChart3,
  },
  {
    id: 'comite_evaluacion',
    title: 'Reporte para Comité de Evaluación y Seguimiento',
    subtitle: 'Listado crítico para toma de decisiones académicas y reglamentarias.',
    icon: Scale,
  },
  {
    id: 'inasistencias_por_fecha',
    title: 'Detalle de Faltas y Retardos por Aprendiz',
    subtitle: 'Historial cronológico individual para control y descargos.',
    icon: Clock,
  },
  {
    id: 'trazabilidad_notificaciones',
    title: 'Trazabilidad de Notificaciones y Debido Proceso',
    subtitle: 'Registro de correos y alertas enviadas a los aprendices.',
    icon: MailCheck,
  },
];

export default function ExportReportModal({
  isOpen,
  onClose,
  onExport,
  isPreparing,
  fichaNumber = '3387401',
}: ExportModalProps) {
  const [selectedReportId, setSelectedReportId] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  
  // Fechas funcionales en formato YYYY-MM-DD
  const [exportStartDate, setExportStartDate] = useState<string>('2026-02-01');
  const [exportEndDate, setExportEndDate] = useState<string>('2026-09-21');

  if (!isOpen) return null;

  const selectedOption = REPORT_OPTIONS.find((opt) => opt.id === selectedReportId);

  const handleSelect = (id: string) => {
    setSelectedReportId(id);
    setIsDropdownOpen(false);
  };

  const handleConfirmExport = () => {
    if (!selectedReportId) return;
    onExport(selectedReportId, { start: exportStartDate, end: exportEndDate });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 relative">
        
        {/* Cabecera Institucional */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center rounded-t-2xl">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#39A900] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Ficha: {fichaNumber}
            </span>
            <h3 className="text-lg font-bold text-slate-800 mt-1 flex items-center gap-2">
              <FileOutput className="w-5 h-5 text-[#39A900]" /> Generar Reporte Oficial PDF
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 flex items-center justify-center text-slate-600 font-bold transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cuerpo del Formulario */}
        <div className="p-6 space-y-5 text-sm">
          
          {/* Dropdown Personalizado con Navegación y Scroll Seguro */}
          <div className="relative">
            <label className="block font-semibold text-slate-700 mb-2">
              Seleccionar Tipo de Informe Académico:
            </label>
            
            {/* Botón Disparador */}
            <div 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`w-full border-2 rounded-xl p-3.5 bg-white flex items-center justify-between cursor-pointer transition-all shadow-sm ${
                isDropdownOpen ? 'border-[#39A900] ring-4 ring-[#39A900]/10' : 'border-slate-300 hover:border-slate-400'
              }`}
            >
              {selectedOption ? (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 text-[#39A900] rounded-lg">
                    <selectedOption.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-xs sm:text-sm">{selectedOption.title}</p>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{selectedOption.subtitle}</p>
                  </div>
                </div>
              ) : (
                <span className="text-slate-400 font-medium">-- Seleccione una opción oficial --</span>
              )}
              <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </div>

            {/* Lista Desplegable Flotante con Scroll (Soluciona el corte y permite navegar) */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-[200] max-h-60 overflow-y-auto divide-y divide-slate-100 animate-in fade-in slide-in-from-top-2 duration-150">
                {REPORT_OPTIONS.map((option) => {
                  const IconComponent = option.icon;
                  const isSelected = option.id === selectedReportId;
                  return (
                    <div
                      key={option.id}
                      onClick={() => handleSelect(option.id)}
                      className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                        isSelected ? 'bg-emerald-50/80' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className={`p-2 rounded-lg mt-0.5 flex-shrink-0 ${isSelected ? 'bg-[#39A900] text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-center justify-between">
                          <p className={`font-semibold text-xs sm:text-sm ${isSelected ? 'text-[#39A900]' : 'text-slate-800'}`}>
                            {option.title}
                          </p>
                          {isSelected && <Check className="w-4 h-4 text-[#39A900]" />}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                          {option.subtitle}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Rango de Fechas Funcional */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha de Inicio:</label>
              <input 
                type="date" 
                value={exportStartDate} 
                onChange={(e) => setExportStartDate(e.target.value)} 
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-medium bg-white focus:ring-2 focus:ring-[#39A900]/20 focus:border-[#39A900] outline-none cursor-pointer" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha de Cierre:</label>
              <input 
                type="date" 
                value={exportEndDate} 
                onChange={(e) => setExportEndDate(e.target.value)} 
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-medium bg-white focus:ring-2 focus:ring-[#39A900]/20 focus:border-[#39A900] outline-none cursor-pointer" 
              />
            </div>
          </div>
        </div>

        {/* Pie de Página del Modal */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 rounded-b-2xl">
          <button 
            onClick={onClose} 
            className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleConfirmExport} 
            disabled={!selectedReportId || isPreparing}
            className="px-5 py-2.5 bg-[#39A900] hover:bg-[#329200] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-md text-sm flex items-center gap-2 transition-all active:scale-95"
          >
            {isPreparing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Procesando PDF...
              </>
            ) : (
              <>
                <FileOutput className="w-4 h-4" /> Descargar PDF
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
