import { courseData } from './src/data';
const jorgeDates = courseData.fechas_por_instructor["Jorge Alexander Sepúlveda Vélez"];

for (const date of jorgeDates) {
  let count = 0;
  let values = new Set();
  courseData.asistencias_aprendices.forEach(student => {
    const val = student.registros[date];
    if (val !== undefined && val !== null && val.toString().trim() !== "") {
      count++;
      values.add(val);
    }
  });
  console.log(`Date: ${date} - Records: ${count} - Values: ${Array.from(values).join(", ")}`);
}
