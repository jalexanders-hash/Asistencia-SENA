import React, { useRef, useState } from 'react';
import { X, Download, FileText, CheckCircle2, AlertTriangle, Mail, Users, BookOpen } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import dashboardImg from '../assets/images/dashboard_attendance_1789653041480.jpg';
import alertsImg from '../assets/images/risk_alerts_1789653059886.jpg';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handlePrint = useReactToPrint({
    contentRef: contentRef,
    documentTitle: 'Manual_Usuario_SENA_Asistencia',
    onBeforePrint: () => {
      setIsDownloading(true);
      return Promise.resolve();
    },
    onAfterPrint: () => setIsDownloading(false),
    print: async (printIframe) => {
      const document = printIframe.contentDocument;
      if (document) {
        const html = document.documentElement.outerHTML;
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(html);
          win.document.close();
          win.focus();
          setTimeout(() => {
            win.print();
            win.close();
            setIsDownloading(false);
          }, 500);
        } else {
           alert("Por favor habilita las ventanas emergentes (pop-ups) para descargar el PDF.");
           setIsDownloading(false);
        }
      }
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 print:hidden">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sena-light rounded-lg">
              <BookOpen className="w-6 h-6 text-sena-dark" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Manual de Usuario</h2>
              <p className="text-sm text-slate-500">Gestión de Asistencia - Instructores SENA</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handlePrint()}
              disabled={isDownloading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sena hover:bg-sena-dark rounded-md transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isDownloading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isDownloading ? 'Generando...' : 'Descargar PDF'}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/50">
          <div 
            ref={contentRef} 
            className="max-w-3xl mx-auto space-y-8 bg-white p-8 rounded-xl border border-slate-100 shadow-sm"
          >
            <div className="text-center mb-10 pb-6 border-b border-slate-100">
              <h1 className="text-3xl font-bold text-slate-900 mb-4">Bienvenido al Sistema de Asistencia</h1>
              <p className="text-slate-600 leading-relaxed max-w-2xl mx-auto">
                Esta guía le explicará paso a paso cómo utilizar la plataforma para registrar la asistencia de los aprendices, identificar casos de riesgo y enviar notificaciones normativas.
              </p>
            </div>

            <section className="space-y-4">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-sena-light text-sena-dark text-sm">1</span>
                Panel Principal y Registro de Asistencia
              </h3>
              <div className="pl-10 space-y-4 text-slate-600 leading-relaxed">
                <p>El tablero principal muestra la lista de aprendices y un calendario interactivo del mes en curso. También puede seleccionar su perfil de instructor en la esquina superior derecha.</p>
                
                <div className="my-6 rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                  <img src={dashboardImg} alt="Panel de registro de asistencia" className="w-full h-auto object-cover" />
                  <div className="bg-slate-50 p-3 text-sm text-center text-slate-500 border-t border-slate-200">
                    Vista principal con el listado de aprendices y calendario de estados.
                  </div>
                </div>

                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Pasar lista:</strong> Haga clic en las celdas correspondientes a cada día y aprendiz.</li>
                  <li><strong>Estados:</strong> Cada clic cambia el estado entre <span className="font-semibold text-emerald-600">Presente (Asistió)</span>, <span className="font-semibold text-red-600">Falla (Inasistencia)</span>, <span className="font-semibold text-amber-600">Retardo</span>, o vuelve a "Sin Registro".</li>
                  <li>Los cambios se guardan automáticamente en la nube (Firestore), asegurando que la información no se pierda.</li>
                </ul>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-sena-light text-sena-dark text-sm">2</span>
                Notificaciones y Alertas (Aprendices en Riesgo)
              </h3>
              <div className="pl-10 space-y-4 text-slate-600 leading-relaxed">
                <p>El sistema identifica automáticamente a los aprendices que están en riesgo de deserción o llamados de atención.</p>
                
                <div className="my-6 rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                  <img src={alertsImg} alt="Panel de alertas y notificaciones" className="w-full h-auto object-cover" />
                  <div className="bg-slate-50 p-3 text-sm text-center text-slate-500 border-t border-slate-200">
                    Tarjetas de alerta identificando aprendices con fallas repetitivas.
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 grid gap-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-slate-800 text-sm">Alerta de Inasistencias</h4>
                      <p className="text-sm text-slate-600">Aprendices con 3 o más faltas injustificadas. Puede generar y enviar el "Llamado de Atención" por correo.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-slate-800 text-sm">Alerta de Retardos</h4>
                      <p className="text-sm text-slate-600">Aprendices con 3 o más retardos. Permite enviar notificaciones para corrección de comportamiento.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-sena-light text-sena-dark text-sm">3</span>
                Envío de Correos
              </h3>
              <div className="pl-10 space-y-3 text-slate-600 leading-relaxed">
                <p>Para notificar a un aprendiz específico:</p>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Vaya al panel derecho "Acciones Requeridas".</li>
                  <li>Haga clic en el botón <strong>Vista Previa Correo</strong> junto al nombre del aprendiz.</li>
                  <li>Revise el texto autogenerado (que incluye las fechas exactas de las fallas o retardos).</li>
                  <li>Utilice el botón <strong>Copiar</strong> para pegarlo en su cliente de correo institucional, o envíe la notificación masiva si la opción está habilitada.</li>
                </ol>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-sena-light text-sena-dark text-sm">4</span>
                Reportes PDF y Excel
              </h3>
              <div className="pl-10 space-y-3 text-slate-600 leading-relaxed">
                <p>Desde la barra de herramientas superior puede generar reportes oficiales:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Reporte de Novedades (PDF):</strong> Exporta un documento con la lista de aprendices en riesgo, detallando sus inasistencias y retardos consolidados.</li>
                  <li><strong>Vista de Impresión:</strong> El sistema está optimizado para ocultar controles interactivos al usar la función "Imprimir" (Ctrl+P) del navegador, ideal para guardar sábanas de asistencia en PDF.</li>
                </ul>
              </div>
            </section>
            
            <div className="mt-8 p-4 bg-sena-light/50 border border-emerald-100 rounded-lg flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-sena flex-shrink-0 mt-0.5" />
              <p className="text-sm text-slate-700">
                <strong>Consejo:</strong> Asegúrese de registrar la asistencia al finalizar cada sesión de formación para mantener los reportes de riesgo actualizados en tiempo real y permitir acciones oportunas por parte de Bienestar.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
