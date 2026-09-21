import React from 'react';

interface EmailTemplateProps {
  nombreAprendiz?: string;
  documento?: string;
  ficha?: string;
  fechasFaltas?: string;
  correoInstructor?: string;
  correoAprendiz?: string;
}

export const EmailTemplate: React.FC<EmailTemplateProps> = ({
  nombreAprendiz = "Pérez Gómez, Juan Carlos",
  documento = "1098765432",
  ficha = "3387401",
  fechasFaltas = "15/09/2026, 18/09/2026",
  correoInstructor = "jasepulvedad@sena.edu.co",
  correoAprendiz = "aprendiz@sena.edu.co"
}) => {
  
  // Estructura completa de la plantilla institucional para el cliente de correo
  const subject = encodeURIComponent(`Notificación de Inasistencia y Requerimiento de Soportes - Ficha ${ficha}`);
  const body = encodeURIComponent(
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
    `-- Copia de evidencia enviada automáticamente (CC) a: ${correoInstructor} --`
  );

  // Enlace mailto que incluye al destinatario principal, copia CC, asunto y cuerpo completo
  const mailtoLink = `mailto:${correoAprendiz}?cc=${correoInstructor}&subject=${subject}&body=${body}`;

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
      
      <p><strong>ASUNTO:</strong> Registro de Inasistencia(s) - Reglamento del Aprendiz (Ficha {ficha})</p>
      
      <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '6px', margin: '15px 0', fontSize: '14px', lineHeight: '1.6' }}>
        <strong>Destinatario:</strong> {nombreAprendiz}<br />
        <strong>Documento:</strong> {documento}<br />
        <strong>Programa / Ficha:</strong> Análisis y Desarrollo de Software ({ficha})<br />
        <strong>Competencia:</strong> Producir documentos de acuerdo con normas técnicas<br />
        <strong>Fechas con inasistencia:</strong> {fechasFaltas} <em>(Total: 2 faltas)</em>
      </div>

      <p>De conformidad con el <strong>Reglamento del Aprendiz SENA (Acuerdo 09 de 2024)</strong>, se detallan las disposiciones normativas aplicables:</p>

      <div style={{ fontSize: '13px', color: '#333', lineHeight: '1.5' }}>
        <ol style={{ paddingLeft: '20px' }}>
          <li><strong>Artículo 28 (Incumplimiento Justificado):</strong> Las inasistencias pueden ser justificadas por causas programadas (informadas con al menos 1 día de anterioridad) o no programadas (reportadas a más tardar dentro de los 5 días hábiles siguientes con soportes).</li>
          <li><strong>Artículo 29 (Incumplimiento Injustificado):</strong> Se configura cuando el aprendiz no reporta ni justifica la novedad dentro del plazo reglamentario.</li>
          <li><strong>Artículo 30 (Deserción):</strong> El abandono injustificado activa los procedimientos institucionales de deserción según las causales normativas.</li>
          <li><strong>Artículo 31 (Procedimiento):</strong> Establece el debido proceso y las medidas aplicables ante los incumplimientos injustificados.</li>
        </ol>
      </div>

      {/* BOTÓN FUNCIONAL PARA ABRIR EL CORREO CON LA PLANTILLA COMPLETA */}
      <div style={{ textAlign: 'center', margin: '30px 0' }}>
        <a 
          href={mailtoLink} 
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
      </div>

      <div style={{ fontSize: '12px', color: '#666', borderTop: '1px solid #f0f0f0', paddingTop: '15px', marginTop: '20px' }}>
        <em>Nota: Este mensaje incluye copia automática de evidencia (CC) al correo institucional del instructor a cargo:</em> <strong>{correoInstructor}</strong>
      </div>
    </div>
  );
};

export default EmailTemplate;
