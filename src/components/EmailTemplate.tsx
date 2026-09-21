import React from 'react';

interface EmailTemplateProps {
  nombreAprendiz?: string;
  documento?: string;
  ficha?: string;
  fechasFaltas?: string;
  correoInstructor?: string;
}

export const EmailTemplate: React.FC<EmailTemplateProps> = ({
  nombreAprendiz = "Pérez Gómez, Juan Carlos",
  documento = "1098765432",
  ficha = "3387401",
  fechasFaltas = "15/09/2026, 18/09/2026",
  correoInstructor = "jasepulvedad@sena.edu.co"
}) => {
  
  // Codificación segura para el enlace mailto con asunto y cuerpo prellenados
  const subject = encodeURIComponent(`Notificación de Inasistencia - Ficha ${ficha} - ${nombreAprendiz}`);
  const body = encodeURIComponent(
    `Cordial saludo, instructor.\n\n` +
    `Adjunto el soporte correspondiente a mi inasistencia de las fechas registradas.\n\n` +
    `Detalles del aprendiz:\n` +
    `- Nombre: ${nombreAprendiz}\n` +
    `- Documento: ${documento}\n` +
    `- Ficha: ${ficha}`
  );

  const mailtoLink = `mailto:${correoInstructor}?subject=${subject}&body=${body}`;

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

      {/* BOTÓN FUNCIONAL PARA CARGAR SOPORTES */}
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
          📂 Enviar Soporte de Inasistencia por Correo
        </a>
      </div>

      <div style={{ fontSize: '12px', color: '#666', borderTop: '1px solid #f0f0f0', paddingTop: '15px', marginTop: '20px' }}>
        <em>Nota: Este mensaje incluye copia automática de evidencia (CC) al correo institucional del instructor a cargo:</em> <strong>{correoInstructor}</strong>
      </div>
    </div>
  );
};

export default EmailTemplate;
