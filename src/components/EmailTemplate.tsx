import React, { useState } from 'react';

interface EmailTemplateProps {
  nombreAprendiz?: string;
  documento?: string;
  ficha?: string;
  fechasFaltas?: string;
  correoInstructor?: string;
  correoElectronico?: string;
}

export const EmailTemplate: React.FC<EmailTemplateProps> = ({
  nombreAprendiz = "Sin nombre",
  documento = "Sin documento",
  ficha = "3387401",
  fechasFaltas = "No especificadas",
  correoInstructor = "jasepulveda@sena.edu.co",
  correoElectronico = ""
}) => {
  const [copiado, setCopiado] = useState(false);

  const destinatarioFinal = correoElectronico && correoElectronico.trim() !== "" 
    ? correoElectronico.trim() 
    : "correo.no.registrado@sena.edu.co";

  const asunto = `Notificación de Inasistencia y Requerimiento de Soportes - Ficha ${ficha}`;
  const cuerpoCompleto = 
    `Estimado(a) Aprendiz: ${nombreAprendiz}\n\n` +
    `Se le notifica formalmente el registro de inasistencia(s) a las actividades de formación correspondientes, en la(s) siguiente(s) fecha(s): ${fechasFaltas}.\n` +
    `Programa / Ficha: Tecnología en Gestión Administrativa (${ficha})\n` +
    `Instructor a cargo: Jorge Alexander Sepúlveda Vélez\n\n` +
    `De conformidad con el Reglamento del Aprendiz SENA (Acuerdo 09 de 2024), se detallan las disposiciones normativas aplicables:\n` +
    `- Artículo 28 (Incumplimiento Justificado): Presentación de soportes en máximo 5 días hábiles.\n` +
    `- Artículo 29 (Incumplimiento Injustificado): Falta de reporte o soportes en el plazo.\n` +
    `- Artículo 30 y 31 (Deserción y Procedimiento): Activación de debido proceso.\n\n` +
    `Por favor, adjunte los soportes correspondientes en respuesta a este mensaje.\n\n` +
    `-- Copia de evidencia enviada automáticamente (CC) a: ${correoInstructor} --`;

  const mailtoLink = `mailto:${destinatarioFinal}?cc=${correoInstructor}&subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpoCompleto)}`;

  const handleCopiarYEnviar = () => {
    navigator.clipboard.writeText(cuerpoCompleto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 6000);
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
        📩 Centro de Notificaciones - Reglamento SENA
      </h2>
      
      <p><strong>ASUNTO:</strong> {asunto}</p>
      
      <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '6px', margin: '15px 0', fontSize: '14px', lineHeight: '1.6' }}>
        <strong>Correo Destinatario (data.ts):</strong> <span style={{ color: destinatarioFinal ? '#008000' : 'red', fontWeight: 'bold' }}>{destinatarioFinal}</span><br />
        <strong>Nombre:</strong> {nombreAprendiz}<br />
        <strong>Documento:</strong> {documento}<br />
        <strong>Ficha:</strong> {ficha}<br />
        <strong>Fechas:</strong> {fechasFaltas}
      </div>

      <div style={{ textAlign: 'center', margin: '30px 0' }}>
        <a 
          href={mailtoLink} 
          onClick={handleCopiarYEnviar}
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
          📂 Abrir Correo y Copiar Plantilla Completa
        </a>
        
        {copiado && (
          <div style={{ background: '#e2f0d9', color: '#385723', padding: '10px', borderRadius: '6px', fontSize: '12px', marginTop: '12px', fontWeight: 'bold' }}>
            📋 ¡Plantilla copiada al portapapeles! Presiona <span style={{ background: '#fff', padding: '2px 6px', border: '1px solid #ccc' }}>Ctrl + V</span> si el cliente de correo recorta el texto.
          </div>
        )}
      </div>

      <div style={{ fontSize: '12px', color: '#666', borderTop: '1px solid #f0f0f0', paddingTop: '15px', marginTop: '20px' }}>
        <em>Copia automática de evidencia (CC) configurada para:</em> <strong>{correoInstructor}</strong>
      </div>
    </div>
  );
};

export default EmailTemplate;
