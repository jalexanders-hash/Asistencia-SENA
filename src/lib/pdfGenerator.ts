import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const REPORT_TYPES = [
  {
    id: "asistencia_diaria_acumulada",
    nombre: "Informe de asistencia diaria y acumulada",
    descripcion: "Consolidado de presentes, ausentes, excusas y llegadas tarde por sesión con porcentaje acumulado."
  },
  {
    id: "alertas_tempranas",
    nombre: "Reporte de alertas tempranas por inasistencia",
    descripcion: "Identificación de aprendices que superan los umbrales de inasistencia según la normativa institucional."
  },
  {
    id: "justificaciones_novedades",
    nombre: "Reporte de justificaciones y novedades",
    descripcion: "Registro y estado de aprobación de inasistencias soportadas con excusas médicas, laborales o institucionales."
  },
  {
    id: "historico_tendencias",
    nombre: "Informe histórico y de tendencias",
    descripcion: "Visualización del comportamiento de asistencia por periodos, días u horarios."
  },
  {
    id: "listado_control",
    nombre: "Listado de asistencia manual",
    descripcion: "Versión exportable (PDF/Excel) para registro manual o respaldo ante fallas de conectividad."
  }
];

const getLogoDataUrl = async (): Promise<string> => {
  return new Promise((resolve) => {
    const svgString = "data:image/svg+xml,%3c?xml%20version=%271.0%27%20encoding=%27utf-8%27?%3e%3c!--%20Generator:%20Adobe%20Illustrator%2026.0.1,%20SVG%20Export%20Plug-In%20.%20SVG%20Version:%206.00%20Build%200)%20--%3e%3csvg%20version=%271.1%27%20id=%27Capa_1%27%20xmlns=%27http://www.w3.org/2000/svg%27%20xmlns:xlink=%27http://www.w3.org/1999/xlink%27%20x=%270px%27%20y=%270px%27%20viewBox=%270%200%201000%201000%27%20style=%27enable-background:new%200%200%201000%201000;%27%20xml:space=%27preserve%27%3e%3cstyle%20type=%27text/css%27%3e%20.st0{fill:%2339a900;}%20%3c/style%3e%3cpath%20id=%27path47-5%27%20class=%27st0%27%20d=%27M504.2,20.5c-58.3,0.1-105.6,47.4-105.5,105.8c0.1,58.3,47.4,105.6,105.7,105.6%20c58.3,0,105.6-47.3,105.6-105.7V126C609.9,67.6,562.6,20.4,504.2,20.5z%20M155.6,264.6c-18.6,0.1-37.5,1.1-55.2,5.6%20c-11.7,3-23,7.8-30.3,15.4c-9.2,9.5-10.4,22.3-5.9,33.3c4,9.7,14.8,16.9,26.8,21.1c25.9,8.9,54.6,10.7,81.8,16.3%20c5,1.2,10.6,2.6,13.7,6c3.2,4.1,1.3,9.7-4,12.2c-8.8,4.5-20.1,4.5-30.4,4.4c-9.4-0.4-19.7-1.2-27.2-5.9c-5.5-3.4-6.5-9.1-5.2-14.1%20l-60.6,0c-0.2,9.2,1.6,18.9,8.4,26.8c5.6,6.8,14.8,11.5,24.6,14.4c15.7,4.6,32.7,6,49.4,6.4c22.7,0.4,45.8-0.3,67.6-5.4%20c13-3.2,25.8-8.3,34.1-16.6c14.8-14.8,11.3-38.3-8.3-49.8c-9.8-5.7-21.5-9.2-33.4-11.5c-17.5-3.6-35.3-6.3-52.9-9.2%20c-6.2-1.2-12.8-2.3-18-5.2c-5.5-2.9-5.9-9.8-0.3-12.9c7.2-4.1,16.8-4,25.4-4c9.1,0.2,19,0.7,26.5,5c4.2,2.3,5.9,6.3,5.9,10.1%20l57.6-0.1c-0.2-7.3-1.6-14.9-6.9-21.2c-6.2-7.8-17.1-12.7-28.3-15.5C192.8,265.6,174.1,264.7,155.6,264.6L155.6,264.6z%20M280.6,268.9%20l0,137.7l168.1,0l0-30H342.3v-26.7h94.9v-29.3h-94.9l0-21.9l102.6,0l-0.1-29.7L280.6,268.9z%20M557.5,269c0,0-51.9,0-77.9,0l0,137.7%20l59,0l0-92.7l80.8,92.6l81,0.1l0-137.7l-59.1,0l0.1,92L557.5,269z%20M805.6,269.2c0,0-63.6,91.9-95.6,137.7l61.9,0l14.9-24.8h95.7%20l13.9,24.9l68.8,0L874,269.2L805.6,269.2z%20M836.6,302.1l29.4,49.9l-60.7,0.1L836.6,302.1z%20M10.6,445.6l0.5,75l280.1-1%20c14.3,3.1,22.6,12.4,19.7,33.5L138.6,854.7l56.1,52.5l266.9-461.6L10.6,445.6z%20M545.2,446.2l262.4,459.6l58-52.1L691.3,552.9%20c-2.9-21.2,5.4-30.6,19.7-33.7l280.2,1l-0.1-73.7L545.2,446.2z%20M500.9,522.3L254.8,944.7l65.4,31.9L484.4,699%20c5.7-4.6,11.4-7.1,17.1-7.3c6-0.2,12.2,2,18.3,6.8l163.8,278.4l67.4-35.2L500.9,522.3z%27/%3e%3cg%20id=%27_x23_000000ff-2%27%20transform=%27matrix(0.31570611,0,0,0.23560774,-391.49698,-10.601126)%27%3e%3c/g%3e%3c/svg%3e";
    
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1000;
      canvas.height = 1000;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, 1000, 1000);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve('');
    img.src = svgString;
  });
};

export const generatePDFReport = async (reportType: string, courseData: any, studentsWithStats: any[], options?: any) => {
  let isLandscape = reportType === "listado_control";
  if (reportType === "asistencia_diaria_acumulada" && options?.mode === 'diario') {
    isLandscape = true;
  }
  const doc = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait'
  });
  
  if (reportType === "listado_control") {
    const logoDataUrl = await getLogoDataUrl();
    
    const today = new Date();
    const dia = String(today.getDate()).padStart(2, '0');
    const mesNames = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
    const mes = mesNames[today.getMonth()];
    const anio = String(today.getFullYear());

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    const drawHeader = (data: any) => {
      doc.setFont("helvetica");
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.2);
      
      doc.rect(14, 23, pageWidth - 28, 8);
      doc.rect(14, 31, pageWidth - 28, 9);

      if (logoDataUrl) {
        const logoSize = 14;
        doc.addImage(logoDataUrl, 'PNG', pageWidth / 2 - logoSize / 2, 8, logoSize, logoSize);
      } else {
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("SENA", pageWidth / 2, 20, { align: "center" });
      }

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const tituloFecha = `REGISTRO DE ASISTENCIA / DÍA ${dia} DEL MES DE ${mes} DEL AÑO ${anio}`;
      doc.text(tituloFecha, pageWidth / 2, 28, { align: "center" });

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      const objetivo = `OBJETIVO(S): ${courseData.programa} - Ficha: ${courseData.ficha_de_caracterizacion}`;
      doc.text(objetivo, 16, 37);
    };

    const drawFooter = (data: any) => {
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      
      const politica = "De acuerdo con La Ley 1581 de 2012, Protección de Datos Personales, el Servicio Nacional de Aprendizaje SENA, se compromete a garantizar la seguridad y protección de los datos personales que se encuentran almacenados en este documento, y les dará el tratamiento correspondiente en cumplimiento de lo establecido legalmente.";
      const splitPolicy = doc.splitTextToSize(politica, pageWidth - 28);
      
      doc.text(splitPolicy, 14, pageHeight - 15);
      
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("GOR-F-085 V02", pageWidth / 2, pageHeight - 6, { align: "center" });
    };

    const tableData = studentsWithStats.map((s, index) => [
      (index + 1).toString(),
      `${s.apellidos} ${s.nombres}`,
      s.numero_documento,
      "", 
      "", 
      "Aprendiz", 
      "SENA", 
      s.correo_electronico || "",
      s.celular || "",
      "", 
      ""  
    ]);

    autoTable(doc, {
      startY: 44,
      margin: { top: 44, bottom: 25 },
      head: [['No', 'NOMBRES Y APELLIDOS', 'No. DOCUMENTO', 'PLANTA', 'CONTRATISTA', 'OTRO ¿CUAL?', 'DEPENDENCIA/ EMPRESA', 'CORREO ELECTRÓNICO', 'TELÉFONO/EXT.', 'AUTORIZA GRABACIÓN', 'FIRMA O PARTICIPACIÓN VIRTUAL']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0], font: 'helvetica', fontSize: 7, halign: 'center', valign: 'middle', lineColor: [0, 0, 0], lineWidth: 0.2 },
      bodyStyles: { font: 'helvetica', fontSize: 7, valign: 'middle', lineColor: [0, 0, 0], lineWidth: 0.2 },
      styles: { cellPadding: 1, overflow: 'linebreak' },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 45 },
        2: { cellWidth: 22 },
        3: { cellWidth: 12 },
        4: { cellWidth: 18 },
        5: { cellWidth: 16 },
        6: { cellWidth: 28 },
        7: { cellWidth: 42 },
        8: { cellWidth: 20 },
        9: { cellWidth: 18 },
        10: { cellWidth: 38 },
      },
      didDrawPage: function (data) {
        drawHeader(data);
        drawFooter(data);
      }
    });
    
  } else {
    const logoDataUrl = await getLogoDataUrl();
    if (logoDataUrl) {
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.addImage(logoDataUrl, 'PNG', pageWidth - 40, 15, 25, 25);
    }
    
    doc.setFont("helvetica");
    doc.setFontSize(16);
    doc.text("SENA - Dashboard de Control de Asistencia", 14, 22);
    
    const report = REPORT_TYPES.find(r => r.id === reportType);
    doc.setFontSize(12);
    doc.text(`Informe: ${report?.nombre || reportType}`, 14, 30);
    
    doc.setFontSize(10);
    doc.text(`Ficha: ${courseData.ficha_de_caracterizacion}`, 14, 38);
    doc.text(`Programa: ${courseData.programa}`, 14, 44);
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, 14, 50);

    if (reportType === "asistencia_diaria_acumulada") {
      let datesToInclude = courseData.fechas_asistencia || [];
      if (options?.startDate && options?.endDate) {
        const startIdx = datesToInclude.indexOf(options.startDate);
        const endIdx = datesToInclude.indexOf(options.endDate);
        if (startIdx !== -1 && endIdx !== -1 && startIdx <= endIdx) {
          datesToInclude = datesToInclude.slice(startIdx, endIdx + 1);
        }
      }

      if (options?.instructor && options.instructor !== 'all') {
        const inst = courseData.equipo_instructores.find((i: any) => i.nombre_del_instructor === options.instructor);
        const dayMap: Record<string, number> = {
          "Domingo": 0, "Lunes": 1, "Martes": 2, "Miércoles": 3, "Jueves": 4, "Viernes": 5, "Sábado": 6
        };
        if (inst && inst.dia && dayMap[inst.dia] !== undefined) {
          const targetDay = dayMap[inst.dia];
          datesToInclude = datesToInclude.filter((d: string) => {
            const dateObj = new Date(d);
            return dateObj.getDay() === targetDay;
          });
        }
      }

      if (options?.mode === 'diario') {
        const head = [['Documento', 'Aprendiz', ...datesToInclude, 'Presentes', '% Asist.']];
        const tableData = studentsWithStats.map(s => {
          let presentCount = 0;
          const dateStatuses = datesToInclude.map((d: string) => {
            const status = s.registros?.[d];
            if (!status || status === 'Presente') {
              presentCount++;
              return 'P';
            }
            if (status === 'X') return 'F';
            if (status === 'Tarde') return 'T';
            if (status === 'Excusa') return 'E';
            if (status === 'Evento') return 'Ev';
            return '-';
          });
          const perc = datesToInclude.length > 0 ? Math.round((presentCount / datesToInclude.length) * 100) : 0;
          return [
            s.numero_documento,
            `${s.nombres} ${s.apellidos}`,
            ...dateStatuses,
            presentCount.toString(),
            `${perc}%`
          ];
        });
        
        doc.setFontSize(10);
        if (options?.instructor && options.instructor !== 'all') {
          doc.text(`Instructor: ${options.instructor}`, 14, 56);
        }
        
        autoTable(doc, {
          startY: 62,
          head: head,
          body: tableData,
          styles: { fontSize: 7, cellPadding: 1 },
          headStyles: { fillColor: [230, 230, 230], textColor: [0,0,0], halign: 'center' },
          columnStyles: {
            0: { cellWidth: 20 },
            1: { cellWidth: 35 },
          }
        });
      } else {
        const tableData = studentsWithStats.map(s => {
          let p = 0; let a = 0; let l = 0; let e = 0;
          datesToInclude.forEach((d: string) => {
            const status = s.registros?.[d];
            if (!status || status === 'Presente') p++;
            else if (status === 'X') a++;
            else if (status === 'Tarde') l++;
            else if (status === 'Excusa' || status === 'Evento') e++;
          });
          const perc = datesToInclude.length > 0 ? Math.round((p / datesToInclude.length) * 100) : 0;
          
          return [
            s.numero_documento,
            `${s.nombres} ${s.apellidos}`,
            p.toString(),
            a.toString(),
            l.toString(),
            e.toString(),
            `${perc}%`
          ];
        });
        
        doc.setFontSize(10);
        if (options?.instructor && options.instructor !== 'all') {
          doc.text(`Instructor: ${options.instructor}`, 14, 56);
        }
        
        autoTable(doc, {
          startY: 62,
          head: [['Documento', 'Aprendiz', 'Presentes', 'Ausentes', 'Tardes', 'Excusas', '% Asistencia']],
          body: tableData,
        });
      }
    } else if (reportType === "alertas_tempranas") {
      const tableData = studentsWithStats
        .filter(s => s.enRiesgo || s.enRiesgoTarde)
        .map(s => [
          s.numero_documento,
          `${s.nombres} ${s.apellidos}`,
          s.totalAbsent,
          s.totalLate,
          s.enRiesgo ? "Riesgo Inasistencia" : "Riesgo Retardos"
        ]);
      
      autoTable(doc, {
        startY: 60,
        head: [['Documento', 'Aprendiz', 'Ausencias', 'Tardes', 'Tipo Alerta']],
        body: tableData,
      });
    } else if (reportType === "justificaciones_novedades") {
      const tableData = studentsWithStats
        .filter(s => s.totalExcused > 0)
        .map(s => [
          s.numero_documento,
          `${s.nombres} ${s.apellidos}`,
          s.totalExcused,
          "Excusa presentada"
        ]);
      autoTable(doc, {
        startY: 60,
        head: [['Documento', 'Aprendiz', 'Total Excusas', 'Observación']],
        body: tableData,
      });
      if (tableData.length === 0) {
        doc.text("No se encontraron aprendices con excusas/novedades.", 14, 70);
      }
    } else if (reportType === "historico_tendencias") {
      const totalPresent = studentsWithStats.reduce((sum, s) => sum + s.totalPresent, 0);
      const totalAbsent = studentsWithStats.reduce((sum, s) => sum + s.totalAbsent, 0);
      const totalLate = studentsWithStats.reduce((sum, s) => sum + s.totalLate, 0);
      
      const tableData = [
        ["Total Presentes", totalPresent.toString()],
        ["Total Ausentes", totalAbsent.toString()],
        ["Total Tardes", totalLate.toString()],
      ];
      autoTable(doc, {
        startY: 60,
        head: [['Indicador Global', 'Valor (Acumulado)']],
        body: tableData,
      });
    }
  }

  doc.save(`Reporte_SENA_${reportType}.pdf`);
};
