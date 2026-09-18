import { courseData } from './src/data';
let values = new Set();
courseData.asistencias_aprendices.forEach(student => {
  Object.values(student.registros).forEach(val => {
    if (val !== undefined && val !== null && val.toString().trim() !== "") {
      values.add(val);
    }
  });
});
console.log("All unique values in records:", Array.from(values));
