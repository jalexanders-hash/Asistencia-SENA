import fs from 'fs';
import { courseData } from './src/data';

const jorgeDates = courseData.fechas_por_instructor["Jorge Alexander Sepúlveda Vélez"];

console.log("Jorge dates in data.ts:", jorgeDates);

const sampleStudent = courseData.asistencias_aprendices[0];
console.log("Sample student records:", Object.keys(sampleStudent.registros));

let allDatesWithAnyNonEmptyRecord = new Set<string>();

courseData.asistencias_aprendices.forEach(student => {
  Object.keys(student.registros).forEach(date => {
    const val = student.registros[date];
    if (val !== undefined && val !== null && val !== "" && val !== " ") {
      allDatesWithAnyNonEmptyRecord.add(date);
    }
  });
});

console.log("Dates with ANY actual text record in the entire DB:", Array.from(allDatesWithAnyNonEmptyRecord));

