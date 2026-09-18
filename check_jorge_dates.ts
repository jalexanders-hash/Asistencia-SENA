import fs from 'fs';
import { courseData } from './src/data';

const jorgeDates = courseData.fechas_por_instructor["Jorge Alexander Sepúlveda Vélez"];
console.log("Original Jorge dates:", jorgeDates);

const cleanDates = jorgeDates.filter(date => {
  return courseData.asistencias_aprendices.some(student => {
    const val = student.registros[date];
    return val !== undefined && val !== null && val.toString().trim() !== "";
  });
});

console.log("Jorge dates with ANY valid text record:", cleanDates);
