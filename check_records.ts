import fs from 'fs';
import { courseData } from './src/data';

// check Jorge's dates
const jorgeDates = courseData.fechas_por_instructor["Jorge Alexander Sepúlveda Vélez"];

let datesWithRecords = new Set<string>();

courseData.asistencias_aprendices.forEach(student => {
  jorgeDates.forEach(date => {
    if (student.registros[date]) {
      datesWithRecords.add(date);
    }
  });
});

console.log("Jorge dates in timeline:", jorgeDates);
console.log("Jorge dates that actually have records:", Array.from(datesWithRecords));
