import jsPDF from 'jspdf';

export const REPORT_TYPES = {
  CONSOLIDADO: 'consolidado',
  RIESGO: 'riesgo',
  DETALLADO: 'detallado'
};

export async function generatePDFReport(
  reportType: string,
  courseData: any,
  studentsWithStats: any[],
  options: { startDate: string; endDate: string; mode: string; instructor: string }
) {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // 1. Encabezado institucional SENA
    doc.setFillColor(39, 174, 96); // Verde SENA
    doc.rect(0, 0, pageWidth, 28, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('SERVICIO NACIONAL DE APRENDIZAJE SENA', pageWidth / 2, 10, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`REPORTE OFICIAL DE ASISTENCIA - FICHA: ${courseData?.ficha_de_caracterizacion || 'N/A'}`, pageWidth / 2, 18, { align: 'center' });
    doc.text(`Programa: ${courseData?.programa || 'N/A'}`, pageWidth / 2, 23, { align: 'center' });

    // 2. Información general
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(9);
    doc.text(`Centro de Formación: ${courseData?.centro || 'N/A'}`, 14, 36);
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, 14, 42);

    // 3. Filtrar datos según el tipo de reporte
    let dataToPrint = studentsWithStats || [];
    if (reportType === REPORT_TYPES.RIESGO) {
      dataToPrint = dataToPrint.filter(s => s.enRiesgo || s.enRiesgoTarde);
    }

    let startY = 50;

    // Dibujar cabecera de la tabla manualmente
    doc.setFillColor(240, 243, 244);
    doc.rect(14, startY, pageWidth - 28, 8, 'F');
    doc.setTextColor(40, 40, 40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);

    doc.text('No.', 18, startY + 5.5);
    doc.text('DOCUMENTO', 32, startY + 5.5);
    doc.text('APELLIDOS Y NOMBRES', 65, startY + 5.5);
    doc.text('FALTAS', 145, startY + 5.5);
    doc.text('TARDE', 165, startY + 5.5);
    doc.text('ESTADO', 183, startY + 5.5);

    startY += 8;
    doc.setFont('helvetica', 'normal');

    // 4. Pintar filas de aprendices
    dataToPrint.forEach((student, index) => {
      // Control de salto de página si excede el alto de la hoja
      if (startY > pageHeight - 20) {
        doc.addPage();
        startY = 20;
      }

      // Alternar color de fondo de las filas
      if (index % 2 === 0) {
        doc.setFillColor(249, 250, 251);
        doc.rect(14, startY, pageWidth - 28, 7, 'F');
      }

      doc.setTextColor(60, 60, 60);
      doc.text(`${index + 1}`, 18, startY + 4.5);
      doc.text(`${student.numero_documento || ''}`, 32, startY + 4.5);
      
      const nombreCompleto = `${student.apellidos || ''} ${student.nombres || ''}`.trim();
      // Recortar texto largo si excede el ancho de la columna
      const nombreCorto = nombreCompleto.length > 38 ? nombreCompleto.substring(0, 35) + '...' : nombreCompleto;
      doc.text(nombreCorto, 65, startY + 4.5);

      doc.text(`${student.fallasAcumuladas || 0}`, 148, startY + 4.5);
      doc.text(`${student.tardanzasAcumuladas || 0}`, 168, startY + 4.5);

      if (student.enRiesgo) {
        doc.setTextColor(192, 57, 43); // Rojo alerta
        doc.setFont('helvetica', 'bold');
        doc.text('RIESGO', 183, startY + 4.5);
        doc.setFont('helvetica', 'normal');
      } else {
        doc.setTextColor(39, 174, 96); // Verde normal
        doc.text('Normal', 183, startY + 4.5);
      }

      // Línea divisoria inferior de la celda
      doc.setDrawColor(230, 230, 230);
      doc.line(14, startY + 7, pageWidth - 14, startY + 7);

      startY += 7;
    });

    // 5. Pie de página en todas las hojas
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Página ${i} de ${pageCount} - Sistema de Gestión Académica SENA`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    // 6. Descargar el archivo PDF generado
    doc.save(`Reporte_Asistencia_Ficha_${courseData?.ficha_de_caracterizacion || 'SENA'}.pdf`);
  } catch (error) {
    console.error("Error al generar el PDF:", error);
    alert("Ocurrió un error al generar el reporte PDF. Por favor, intenta de nuevo.");
  }
}
