const fs = require('fs');
let code = fs.readFileSync('src/lib/pdfGenerator.ts', 'utf8');

// 1. Add options parameter
code = code.replace(
  /export const generatePDFReport = async \(reportType: string, courseData: any, studentsWithStats: any\[\]\) => \{/,
  `export const generatePDFReport = async (reportType: string, courseData: any, studentsWithStats: any[], options?: any) => {`
);

// 2. Adjust isLandscape logic
const landscapeLogic = `  let isLandscape = reportType === "listado_control";
  if (reportType === "asistencia_diaria_acumulada" && options?.mode === 'diario') {
    isLandscape = true; // Always use landscape for diario to fit dates
  }`;
code = code.replace(
  /  const isLandscape = reportType === "listado_control";/,
  landscapeLogic
);

// 3. Update asistencia_diaria_acumulada block
const replacementLogic = `    if (reportType === "asistencia_diaria_acumulada") {
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
        // DIARIO MODE
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
            \`\${s.nombres} \${s.apellidos}\`,
            ...dateStatuses,
            presentCount.toString(),
            \`\${perc}%\`
          ];
        });
        
        doc.setFontSize(10);
        if (options?.instructor && options.instructor !== 'all') {
          doc.text(\`Instructor: \${options.instructor}\`, 14, 56);
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
        // ACUMULADO MODE (Recalculate based on datesToInclude)
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
            \`\${s.nombres} \${s.apellidos}\`,
            p.toString(),
            a.toString(),
            l.toString(),
            e.toString(),
            \`\${perc}%\`
          ];
        });
        
        doc.setFontSize(10);
        if (options?.instructor && options.instructor !== 'all') {
          doc.text(\`Instructor: \${options.instructor}\`, 14, 56);
        }
        
        autoTable(doc, {
          startY: 62,
          head: [['Documento', 'Aprendiz', 'Presentes', 'Ausentes', 'Tardes', 'Excusas', '% Asistencia']],
          body: tableData,
        });
      }
    }`;

code = code.replace(
  /    if \(reportType === "asistencia_diaria_acumulada"\) \{[\s\S]*?body: tableData,\n      \}\);\n    \}/,
  replacementLogic
);

fs.writeFileSync('src/lib/pdfGenerator.ts', code);
