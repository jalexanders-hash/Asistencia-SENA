const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Insert generateAbsenceTemplate right before generateLateTemplate
const absenceTemplate = `
  const generateAbsenceTemplate = (student: typeof studentsWithStats[0]) => {
    const fechas = student.fechasFalla.join(', ') || '[Fecha]';
    return \`ASUNTO: Notificación de inasistencia y recordatorio del Reglamento del Aprendiz - \${courseData.programa}

Destinatario:
Nombre Completo: \${student.nombres} \${student.apellidos}
Identificación: \${student.numero_documento}
Programa de Formación: \${courseData.programa} - Ficha: \${courseData.ficha_de_caracterizacion}

Detalle de la Inasistencia:
Módulo/Competencia: \${currentInstructor?.competencia}
Fecha(s) de inasistencia: \${fechas}

Normativa de Referencia (SENA):
Reglamento: Reglamento del Aprendiz SENA (Acuerdo 007 de 2012)
Extracto: "Cumplir con las actividades de formación acordadas en la ruta de aprendizaje y asistir puntualmente a los ambientes de formación presenciales o virtuales..."

Instrucciones para justificación:
Cuenta con un plazo máximo de 2 días hábiles para presentar su justificación. Los motivos válidos incluyen:
- Incapacidad médica
- Calamidad doméstica debidamente soportada

Enlace para subir justificación (clic para enviar correo al instructor):
mailto:\${currentInstructor?.correo}?subject=Justificacion%20Inasistencia%20-%20\${encodeURIComponent(student.nombres + ' ' + student.apellidos)}&body=Adjunto%20documento%20de%20justificacion%20para%20la%20inasistencia%20del%20dia%20\${encodeURIComponent(fechas)}.

Remitente:
Nombre Completo: \${currentInstructor?.nombre_del_instructor}
Cargo: Instructor(a) - \${currentInstructor?.competencia}
Centro de Formación: \${courseData.centro}
Correo Electrónico: \${currentInstructor?.correo}\`;
  };

`;

code = code.replace(
  'const generateLateTemplate = (student: typeof studentsWithStats[0]) => {',
  absenceTemplate + '  const generateLateTemplate = (student: typeof studentsWithStats[0]) => {'
);

fs.writeFileSync('src/App.tsx', code);
console.log("Template generated");
