import React, { useState } from 'react';

interface EmailTemplateProps {
  nombreAprendiz?: string;
  documento?: string;
  ficha?: string;
  fechasFaltas?: string;
  correoInstructor?: string;
  correoAprendiz?: string; // Recibe el correo real de la base de datos
}

export const EmailTemplate: React.FC<EmailTemplateProps> = ({
  nombreAprendiz = "Pérez Gómez, Juan Carlos",
  documento = "1098765432",
  ficha = "3387401",
  fechasFaltas = "15/09/2026, 18/09/2026",
  correoInstructor = "jasepulvedad@sena.edu.co",
  correoAprendiz = "" // Inicia vacío para obligar y validar la lectura desde la BD
}) => {
  const [copiado, setCopiado] = useState(false);

  // Validación robusta del correo que viene de la base de datos
  const destinatarioReal = correoAprendiz && correoAprendiz.trim() !== "" 
    ? correoAprendiz 
    : "correo.no.registrado@sena.edu.co";

  // Plantilla estructurada completa para el correo y el portapapeles
  const subject = `Notificación de Inasistencia y Requerimiento de Soportes - Ficha ${ficha}`;
  const body = 
    `Estimado(a) Aprendiz: ${nombreAprendiz}\n\n` +
    `Se le notifica formalmente el registro de inasistencia(s) a las actividades de formación correspondientes, en la(s) siguiente(s) fecha(s): ${fechasFaltas}.\n` +
    `Programa / Ficha: Análisis y Desarrollo de Software (${ficha})\n` +
    `Instructor a cargo: Jorge Alexander Sepúlveda Vélez\n\n` +
    `De conformidad con el Reglamento del Aprendiz SENA (Acuerdo 09 de 2024), se detallan las disposiciones normativas aplicables:\n` +
    `- Artículo 28 (Incumplimiento Justificado): Las inasistencias pueden ser justificadas por causas programadas (informadas con al menos 1 día de anterioridad) o no programadas (reportadas a más tardar dentro de los 5 días hábiles siguientes con soportes).\n` +
    `- Artículo 29 (Incumplimiento Injustificado): Se configura cuando el aprendiz no reporta ni justifica la novedad dentro del plazo reglamentario.\n` +
    `- Artículo 30 (Deserción): El abandono injustificado activa los procedimientos institucionales de deserción según las causales normativas.\n` +
    `- Artículo 31 (Procedimiento): Establece el debido proceso y las medidas aplicables.\n\n` +
    `Por favor, adjunte los soportes correspondientes en respuesta a este mensaje.\n\n` +
    `-- Copia de evidencia enviada automáticamente (CC) a: ${correoInstructor} --`;

  // Enlace mailto optimizado con codificación segura
  const mailtoLink = `mailto:${destinatarioReal}?cc=${correoInstructor}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  // Función combinada: abre el correo y copia la plantilla como respaldo ante restricciones del sistema
  const handleEnviarClick = () => {
    navigator.clipboard.writeText(body);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 5000);
  };

  return (
    <div style={{
      maxWidth: '650px',
      margin: '0 auto',
      background: '#ffffff',
      padding: '30px',
      borderRadius: '8px',
      boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
      borderTop: '5px solid #39A900',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h2 style={{ color: '#39A900', fontSize: '20px', borderBottom: '2px solid #f0f0f0', paddingBottom: '10px' }}>
        📩 Notificación de Inasistencia y Requerimiento de Soportes
      </h2>
      
      <p><strong>ASUNTO:</strong> {subject}</p>
      
      <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '6px', margin: '15px 0', fontSize: '14px', lineHeight: '1.6' }}>
        <strong>Correo Destinatario (BD):</strong> <span style={{ color: correoAprendiz ? '#000' : 'red', fontWeight: 'bold' }}>{destinatarioReal}</span><br />
        <strong>Nombre:</strong> {nombreAprendiz}<br />
        <strong>Documento:</strong> {documento}<br />
        <strong>Programa / Ficha:</strong> Análisis y Desarrollo de Software ({ficha})<br />
        <strong>Competencia:</strong> Producir documentos de acuerdo con normas técnicas<br />
        <strong>Fechas con inasistencia:</strong> {fechasFaltas}
      </div>

      {!correoAprendiz && (
        <div style={{ background: '#fdf2f2', color: '#c53030', padding: '10px', borderRadius: '4px', fontSize: '12px', margin: '10px 0' }}>
          ⚠️ <strong>Aviso:</strong> El campo de correo del aprendiz en la base de datos está vacío para este registro. Se recomienda verificar los datos en el sistema.
        </div>
      )}

      <p>De conformidad con el <strong>Reglamento del Aprendiz SENA (Acuerdo 09 de 2024)</strong>, se detallan las disposiciones normativas aplicables:</p>

      <div style={{ fontSize: '13px', color: '#333', lineHeight: '1.5' }}>
        <ol style={{ paddingLeft: '20px' }}>
          <li><strong>Artículo 28 (Incumplimiento Justificado):</strong> Las inasistencias pueden ser justificadas por causas programadas (informadas con al menos 1 día de anterioridad) o no programadas (reportadas a más tardar dentro de los 5 días hábiles siguientes con soportes).</li>
          <li><strong>Artículo 29 (Incumplimiento Injustificado):</strong> Se configura cuando el aprendiz no reporta ni justifica la novedad dentro del plazo reglamentario.</li>
          <li><strong>Artículo 30 (Deserción):</strong> El abandono injustificado activa los procedimientos institucionales de deserción según las causales normativas.</li>
          <li><strong>Artículo 31 (Procedimiento):</strong> Establece el debido proceso y las medidas aplicables ante los incumplimientos injustificados.</li>
        </ol>
      </div>

      {/* BOTÓN FUNCIONAL */}
      <div style={{ textAlign: 'center', margin: '30px 0' }}>
        <a 
          href={mailtoLink} 
          onClick={handleEnviarClick}
          style={{
            backgroundColor: '#39A900',
            color: '#ffffff',
            padding: '14px 28px',
            textDecoration: 'none',
            fontWeight: 'bold',
            borderRadius: '6px',
            display: 'inline-block',
            fontSize: '15px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.15)'
          }}
        >
          📂 Enviar Notificación (Con Copia CC)
        </a>
        {copiado && (
          <p style={{ color: '#385723', fontSize: '12px', marginTop: '10px', fontWeight: 'bold' }}>
            📋 ¡Plantilla copiada al portapapeles por seguridad! (Si tu cliente de correo recorta el texto, presiona Ctrl+V para pegarlo completo).
          </p>
        )}
      </div>

      <div style={{ fontSize: '12px', color: '#666', borderTop: '1px solid #f0f0f0', paddingTop: '15px', marginTop: '20px' }}>
        <em>Nota: Este mensaje incluye copia automática de evidencia (CC) al correo institucional del instructor a cargo:</em> <strong>{correoInstructor}</strong>
      </div>
    </div>
  );
};

export default EmailTemplate;
