const fs = require('fs');
let content = fs.readFileSync('src/data.ts', 'utf8');

const dataString = content.replace('export const courseData = ', '').trim().replace(/;$/, '');
const courseData = eval('(' + dataString + ')');

const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const instructorDays = courseData.equipo_instructores.map(i => ({name: i.nombre_del_instructor, day: i.dia}));
console.log(instructorDays);

courseData.fechas_asistencia.forEach(d => {
  const dateObj = new Date(d);
  const dayName = days[dateObj.getDay()];
  console.log(`${d} -> ${dayName}`);
});
