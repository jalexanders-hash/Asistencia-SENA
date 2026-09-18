const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// Replace courseData.fechas_asistencia with instructorDates in specific places.

// 1. Add useMemo for instructorDates
app = app.replace(
  "const currentInstructor = currentInstructorIdx !== null ? courseData.equipo_instructores[currentInstructorIdx] : null;",
  `const currentInstructor = currentInstructorIdx !== null ? courseData.equipo_instructores[currentInstructorIdx] : null;

  const currentInstructorDates = useMemo(() => {
    if (!currentInstructor) return [];
    // If we have mapped dates for this instructor, use them
    if (courseData.fechas_por_instructor && courseData.fechas_por_instructor[currentInstructor.nombre_del_instructor]) {
      return courseData.fechas_por_instructor[currentInstructor.nombre_del_instructor];
    }
    return courseData.fechas_asistencia;
  }, [currentInstructor, courseData]);`
);

// 2. In stats calculation
app = app.replace(
  "let totalPossibleRecords = courseData.asistencias_aprendices.length * courseData.fechas_asistencia.length;",
  "let totalPossibleRecords = courseData.asistencias_aprendices.length * currentInstructorDates.length;"
);

app = app.replace(
  "courseData.fechas_asistencia.forEach(date => {",
  "currentInstructorDates.forEach(date => {"
);

// 3. In table headers
app = app.replace(
  "{courseData.fechas_asistencia.map((date, idx) => (",
  "{currentInstructorDates.map((date, idx) => ("
);

// 4. In table empty colspan
app = app.replace(
  '<td colSpan={courseData.fechas_asistencia.length + 2}',
  '<td colSpan={currentInstructorDates.length + 2}'
);

// 5. In table body rows
app = app.replace(
  "{courseData.fechas_asistencia.map((date, idx) => {",
  "{currentInstructorDates.map((date, idx) => {"
);

// 6. Fix PDF modal to use courseData.fechas_asistencia (leave as is, since export should maybe allow all?)
// Actually, let's leave export as courseData.fechas_asistencia so they can export globally or by instructor,
// wait, the exportStartDate / endDate is already courseData.fechas_asistencia, which is fine.

fs.writeFileSync('src/App.tsx', app);
console.log("App.tsx patched successfully!");
