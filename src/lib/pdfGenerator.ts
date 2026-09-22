import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

    // Encabezado institucional SENA
    doc.setFillColor(39, 174, 96); // Color verde SENA
    doc.rect(0, 0, pageWidth, 25, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('SERVICIO NACIONAL DE APRENDIZAJE SENA', pageWidth / 2, 10, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`REPORTE DE ASISTENCIA - FICHA: ${courseData?.ficha_de_caracterizacion || 'N/A'}`, pageWidth / 2, 18, { align: 'center' });

    // Información del programa
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(9);
    doc.text(`Programa: ${courseData?.programa || 'N/A'}`, 14, 32);
    doc.text(`Centro: ${courseData?.centro || 'N/A'}`, 14, 38);
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, 14, 44);

    // Filtrar datos según el tipo de reporte
    let dataToPrint = studentsWithStats || [];
    if (reportType === REPORT_TYPES.RIESGO) {
      dataToPrint = dataToPrint.filter(s => s.enRiesgo || s.enRiesgoTarde);
    }

    const tableRows = dataToPrint.map((student, index) => [
      index + 1,
      student.numero_documento || '',
      `${student.apellidos || ''} ${student.nombres || ''}`.trim(),
      student.fallasAcumuladas || 0,
      student.tardanzasAcumuladas || 0,
      student.enRiesgo ? 'EN RIESGO' : 'NORMAL'
    ]);

    // Generar tabla utilizando la función autoTable importada explícitamente
    autoTable(doc, {
      startY: 50,
      head: [['No.', 'Documento', 'Apellidos y Nombres', 'Faltas', 'Retardos', 'Estado']],
      body: tableRows,
      headStyles: { fillColor: [39, 174, 96], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 },
      alternateRowStyles: { fillColor: [245, 247, 248] },
    });

    // Pie de página con número total de páginas
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Página ${i} de ${pageCount} - Sistema de Gestión Académica SENA`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    // Descargar archivo PDF
    doc.save(`Reporte_Asistencia_Ficha_${courseData?.ficha_de_caracterizacion || 'SENA'}.pdf`);
  } catch (error) {
    console.error("Error al generar el PDF:", error);
    alert("Ocurrió un error al generar el reporte PDF. Revisa la consola para más detalles.");
  }
}
