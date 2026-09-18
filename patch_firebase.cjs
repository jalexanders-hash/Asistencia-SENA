const fs = require('fs');

// Patch lib/firebase.ts
let firebaseTs = fs.readFileSync('src/lib/firebase.ts', 'utf8');
firebaseTs = firebaseTs.replace(
  "export const saveAttendanceData = async (fechas_asistencia: string[], asistencias_aprendices: typeof defaultData['asistencias_aprendices']) => {",
  "export const saveAttendanceData = async (fechas_asistencia: string[], asistencias_aprendices: typeof defaultData['asistencias_aprendices'], fechas_por_instructor?: Record<string, string[]>) => {"
);
firebaseTs = firebaseTs.replace(
  "    asistencias_aprendices\n  });",
  "    asistencias_aprendices,\n    ...(fechas_por_instructor && { fechas_por_instructor })\n  });"
);
fs.writeFileSync('src/lib/firebase.ts', firebaseTs);
console.log("firebase.ts patched!");

// Patch App.tsx
let appTs = fs.readFileSync('src/App.tsx', 'utf8');
appTs = appTs.replace(
  "    const newAprendices = courseData.asistencias_aprendices.map(student => {",
  `    let newFechasPorInstructor = { ...(courseData.fechas_por_instructor || {}) };
    if (currentInstructor) {
      let currentDates = [...(newFechasPorInstructor[currentInstructor.nombre_del_instructor] || [])];
      if (!currentDates.includes(formattedDate)) {
        currentDates.push(formattedDate);
        currentDates.sort((a,b) => {
           const da = new Date(a.split('/')[2], parseInt(a.split('/')[0])-1, a.split('/')[1]);
           const db = new Date(b.split('/')[2], parseInt(b.split('/')[0])-1, b.split('/')[1]);
           return da.getTime() - db.getTime();
        });
        newFechasPorInstructor[currentInstructor.nombre_del_instructor] = currentDates;
      }
    }
    
    const newAprendices = courseData.asistencias_aprendices.map(student => {`
);
appTs = appTs.replace(
  "await saveAttendanceData(newFechas, newAprendices);",
  "await saveAttendanceData(newFechas, newAprendices, newFechasPorInstructor);"
);
fs.writeFileSync('src/App.tsx', appTs);
console.log("App.tsx patched!");
