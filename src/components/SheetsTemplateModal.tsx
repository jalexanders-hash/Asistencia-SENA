import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  ExternalLink, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  FileText, 
  Users, 
  Briefcase, 
  BookOpen, 
  Loader2,
  Table,
  Settings,
  ClipboardList
} from 'lucide-react';
import { 
  downloadGoogleSheetsTemplate, 
  downloadAprendicesCSVTemplate, 
  parseUploadedTemplate,
  ParsedTemplateResult
} from '../lib/templateGenerator';
import { downloadBlankAttendanceTemplate } from '../lib/blankTemplateGenerator';
import { updateFichaCompleteData } from '../lib/firebase';
import { courseData as initialCourseData } from '../data';

interface SheetsTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFicha: string;
  courseData: typeof initialCourseData;
  onDataLoaded: (newData: typeof initialCourseData, targetFichaId?: string) => void;
}

/**
 * Fusiona de manera segura las inasistencias de un archivo de asistencia descargado 
 * con los datos existentes en la nube, preservando la estructura general de la ficha.
 */
function mergeInstructorAttendance(
  currentCloudData: typeof initialCourseData,
  uploadedData: typeof initialCourseData,
  currentInstructorName: string
): typeof initialCourseData {
  const fechasDelInstructor = uploadedData.fechas_por_instructor?.[currentInstructorName] 
    || uploadedData.fechas_asistencia 
    || [];

  const mergedData = JSON.parse(JSON.stringify(currentCloudData));

  if (!mergedData.fechas_asistencia) {
    mergedData.fechas_asistencia = [];
  }
  
  fechasDelInstructor.forEach((fecha: string) => {
    if (!mergedData.fechas_asistencia.includes(fecha)) {
      mergedData.fechas_asistencia.push(fecha);
    }
  });

  if (!mergedData.fechas_por_instructor) {
    mergedData.fechas_por_instructor = {};
  }
  if (currentInstructorName) {
    mergedData.fechas_por_instructor[currentInstructorName] = fechasDelInstructor;
  }

  if (!mergedData.asistencias_aprendices) {
    mergedData.asistencias_aprendices = [];
  }

  mergedData.asistencias_aprendices = mergedData.asistencias_aprendices.map((cloudStudent: any) => {
    const uploadedStudent = uploadedData.asistencias_aprendices?.find(
      (s: any) => String(s.numero_documento).trim() === String(cloudStudent.numero_documento).trim()
    );

    if (!uploadedStudent) return cloudStudent;

    const cloudRegistros = { ...(cloudStudent.registros || {}) };

    fechasDelInstructor.forEach((fecha: string) => {
      delete cloudRegistros[fecha];
    });

    fechasDelInstructor.forEach((fecha: string) => {
      if (uploadedStudent.registros?.[fecha]) {
        cloudRegistros[fecha] = uploadedStudent.registros[fecha];
      }
    });

    return {
      ...cloudStudent,
      registros: cloudRegistros
    };
  });

  return mergedData;
}

export function SheetsTemplateModal({
  isOpen,
  onClose,
  currentFicha,
  courseData,
  onDataLoaded
}: SheetsTemplateModalProps) {
  const [activeTab, setActiveTab] = useState<'descargar' | 'estructura' | 'cargar'>('descargar');
  const [uploadType, setUploadType] = useState<'configuracion' | 'inasistencias' | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadResult, setUploadResult] = useState<ParsedTemplateResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsParsing(true);
    setUploadResult(null);

    try {
      const result = await parseUploadedTemplate(file, courseData);
      console.log(`=== RESULTADO DE PARSEADO EXCEL (${uploadType}) ===`, result);
      setUploadResult(result);
    } catch (err: any) {
      console.error("Error al procesar plantilla Excel:", err);
      setUploadResult({
        success: false,
        message: `Error al procesar el archivo: ${err.message || err.toString()}`
      });
    } finally {
      setIsParsing(false);
    }
  };

  const handleApplyData = async () => {
    if (!uploadResult?.data) return;

    let excelFichaId = '';
    
    if (uploadResult.data.ficha_de_caracterizacion) {
      excelFichaId = String(uploadResult.data.ficha_de_caracterizacion).trim();
    }

    if ((!excelFichaId || excelFichaId === 'undefined' || excelFichaId === 'null') && selectedFile) {
      const match = selectedFile.name.match(/\b\d{7}\b/);
      if (match) {
        excelFichaId = match[0];
      }
    }

    if (!excelFichaId || excelFichaId === 'undefined' || excelFichaId === 'null') {
      excelFichaId = currentFicha;
    }

    console.log(`Ficha de destino (${uploadType}):`, excelFichaId);

    setIsSaving(true);
    try {
      let finalDataToSave;

      if (uploadType === 'inasistencias') {
        // Flujo 2: Fusionar inasistencias de forma segura
        const currentInstructorName = courseData?.equipo_instructores?.[0]?.nombre_del_instructor || "";
        finalDataToSave = mergeInstructorAttendance(
          courseData,
          uploadResult.data,
          currentInstructorName
        );
      } else {
        // Flujo 1: Configuración general completa (reemplazo íntegro)
        finalDataToSave = {
          ...uploadResult.data,
          ficha_de_caracterizacion: excelFichaId
        };
      }

      finalDataToSave.ficha_de_caracterizacion = excelFichaId;

      await updateFichaCompleteData(finalDataToSave, excelFichaId);
      onDataLoaded(finalDataToSave, excelFichaId);
      
      const mensajeExito = uploadType === 'inasistencias' 
        ? `¡Inasistencias de la Ficha N° ${excelFichaId} cargadas y fusionadas con éxito!`
        : `¡Configuración general de la Ficha N° ${excelFichaId} actualizada con éxito!`;

      alert(mensajeExito);
      onClose();
    } catch (err: any) {
      console.error("Error al guardar en Firebase desde el modal:", err);
      alert(`Error al guardar en la base de datos: ${err.message || err.toString()}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Institucional */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-800 via-emerald-700 to-sena text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20 shadow-inner">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                Formato de Datos Google Sheets & Excel
              </h2>
              <p className="text-emerald-100 text-xs mt-0.5">
                Plantilla estandarizada con todos los campos requeridos para la carga en el aplicativo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 transition-colors"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('descargar')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'descargar'
                ? 'border-sena text-sena bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-4 h-4" />
            Descargar y Abrir Formato
          </button>
          <button
            onClick={() => setActiveTab('estructura')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'estructura'
                ? 'border-sena text-sena bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Table className="w-4 h-4" />
            Estructura de Campos Requeridos
          </button>
          <button
            onClick={() => setActiveTab('cargar')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'cargar'
                ? 'border-sena text-sena bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            Cargar al Aplicativo
          </button>
        </div>

        {/* Tab Content Container */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          
          {/* TAB 1: DESCARGAR Y ABRIR */}
          {activeTab === 'descargar' && (
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-900 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-emerald-950">
                    Formato oficial compatible con Google Sheets y Microsoft Excel (.xlsx)
                  </p>
                  <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                    Este archivo contiene las hojas preconfiguradas con los datos de la ficha actual ({currentFicha}), instructores y el listado de aprendices.
                  </p>
                </div>
              </div>

              {/* Action Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-emerald-300 transition-all group">
                  <div>
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-base">
                      Plantilla para Inasistencias (.xlsx)
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      Descarga el archivo con el listado actual de aprendices para marcar fallas o tardanzas y volver a cargarlo.
                    </p>
                  </div>
                  <div className="mt-5">
                    <button
                      onClick={() => downloadBlankAttendanceTemplate(courseData)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-sena hover:bg-sena-dark text-white rounded-lg font-medium text-sm transition-colors shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      Descargar Plantilla en Blanco
                    </button>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-blue-300 transition-all group">
                  <div>
                    <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
                      <ExternalLink className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-base">
                      Formato Completo de Configuración
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      Descarga la estructura completa de múltiples hojas para la configuración inicial de fichas e instructores.
                    </p>
                  </div>
                  <div className="mt-5">
                    <button
                      onClick={() => downloadGoogleSheetsTemplate(currentFicha)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      Descargar Formato Completo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ESTRUCTURA DE CAMPOS */}
          {activeTab === 'estructura' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs p-5 space-y-3">
                <h4 className="font-bold text-sm text-slate-800">Guía para la carga independiente</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Utiliza <strong>Configuración General</strong> para actualizar la estructura de la ficha y aprendices. Utiliza <strong>Inasistencias</strong> para registrar o actualizar las novedades de asistencia manteniendo intacta la estructura general.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: CARGAR AL APLICATIVO (DOS OPCIONES SEPARADAS) */}
          {activeTab === 'cargar' && (
            <div className="space-y-5">
              
              {/* Selector de Tipo de Carga si no se ha elegido */}
              {!uploadType ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div 
                    onClick={() => setUploadType('configuracion')}
                    className="bg-white p-6 rounded-xl border-2 border-slate-200 hover:border-emerald-600 cursor-pointer transition-all shadow-sm flex flex-col items-center text-center group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Settings className="w-7 h-7" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-base">Cargar Configuración General</h3>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                      Ideal para inicializar o actualizar la estructura base de la ficha, aprendices e instructores.
                    </p>
                  </div>

                  <div 
                    onClick={() => setUploadType('inasistencias')}
                    className="bg-white p-6 rounded-xl border-2 border-slate-200 hover:border-emerald-600 cursor-pointer transition-all shadow-sm flex flex-col items-center text-center group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <ClipboardList className="w-7 h-7" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-base">Cargar Registro de Inasistencias</h3>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                      Ideal para actualizar únicamente las fallas y tardanzas marcadas en el formato de asistencia.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl">
                    <span className="text-xs font-bold text-emerald-900">
                      Modo seleccionado: {uploadType === 'configuracion' ? '⚙️ Configuración General de Ficha' : '📋 Registro de Inasistencias'}
                    </span>
                    <button 
                      onClick={() => { setUploadType(null); setSelectedFile(null); setUploadResult(null); }}
                      className="text-xs font-semibold text-emerald-700 hover:underline"
                    >
                      Cambiar modo
                    </button>
                  </div>

                  <div className="bg-white p-6 rounded-xl border border-slate-200 text-center space-y-4 shadow-xs">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                      <Upload className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-800">
                        Selecciona tu archivo Excel (.xlsx) diligenciado
                      </h3>
                      <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                        Ficha activa actual: <strong>{currentFicha}</strong>
                      </p>
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".xlsx, .xls"
                      className="hidden"
                    />

                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isParsing}
                        className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm"
                      >
                        {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {selectedFile ? 'Cambiar archivo' : 'Elegir archivo (.xlsx)'}
                      </button>
                      {selectedFile && (
                        <button
                          onClick={() => {
                            setSelectedFile(null);
                            setUploadResult(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="px-4 py-2.5 text-xs text-slate-500 hover:text-red-600 transition-colors"
                        >
                          Limpiar
                        </button>
                      )}
                    </div>

                    {selectedFile && (
                      <p className="text-xs text-slate-600 font-mono bg-slate-50 py-1.5 px-3 rounded-md inline-block border border-slate-200">
                        Archivo seleccionado: <strong>{selectedFile.name}</strong> ({Math.round(selectedFile.size / 1024)} KB)
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Resultado de la validación */}
              {uploadResult && (
                <div className={`p-5 rounded-xl border ${uploadResult.success ? 'bg-emerald-50/70 border-emerald-200' : 'bg-red-50/70 border-red-200'} space-y-4`}>
                  <div className="flex items-start gap-3">
                    {uploadResult.success ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h4 className={`text-sm font-bold ${uploadResult.success ? 'text-emerald-950' : 'text-red-950'}`}>
                        {uploadResult.success ? '¡Archivo validado correctamente!' : 'Error en la validación'}
                      </h4>
                      <p className={`text-xs mt-0.5 ${uploadResult.success ? 'text-emerald-800' : 'text-red-800'}`}>
                        {uploadResult.message}
                      </p>
                    </div>
                  </div>

                  {uploadResult.success && uploadResult.counts && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white p-3.5 rounded-lg border border-emerald-100 text-xs">
                      <div>
                        <span className="text-slate-400 block font-medium">Ficha detectada:</span>
                        <span className="font-bold text-slate-800 text-sm">
                          {uploadResult.data?.ficha_de_caracterizacion || currentFicha}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Total Aprendices:</span>
                        <span className="font-bold text-emerald-700 text-sm">
                          {uploadResult.counts.aprendices} alumnos
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Equipo Ejecutor:</span>
                        <span className="font-bold text-slate-800 text-sm">
                          {uploadResult.counts.instructores} instructores
                        </span>
                      </div>
                    </div>
                  )}

                  {uploadResult.success && (
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={handleApplyData}
                        disabled={isSaving}
                        className="px-5 py-2.5 bg-sena hover:bg-sena-dark text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm disabled:opacity-60"
                      >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        {isSaving ? 'Sincronizando con la nube...' : 'Confirmar y Actualizar Aplicativo'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-100/80 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Compatible con Google Sheets, Microsoft Excel y LibreOffice Calc
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-md font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
