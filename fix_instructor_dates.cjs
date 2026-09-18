const fs = require('fs');
let content = fs.readFileSync('src/data.ts', 'utf8');

const dataString = content.replace('export const courseData = ', '').trim().replace(/;$/, '');
const courseData = eval('(' + dataString + ')');

const carolinaDates = [
  "2/13/2026", "2/20/2026", "2/27/2026", "3/6/2026", "3/13/2026", "3/20/2026", "3/27/2026", 
  "4/10/2026", "4/24/2026", "5/19/2026", "5/29/2026", "6/5/2026", "6/12/2026", "6/19/2026", 
  "6/26/2026", "7/3/2026", "7/10/2026", "7/16/2026", "7/24/2026", "7/31/2026", "8/14/2026", 
  "8/21/2026", "9/4/2026", "9/11/2026"
];

const dayanaDates = [
  "6/17/2026", "6/24/2026", "7/1/2026", "7/15/2026", "7/22/2026", "7/29/2026", 
  "8/5/2026", "8/12/2026", "8/19/2026", "9/2/2026", "9/9/2026"
];

const xalimaDates = [
  "7/21/2026", "7/28/2026", "8/4/2026", "8/11/2026", "8/18/2026", "8/25/2026", 
  "9/1/2026", "9/8/2026"
];

// For Alfredo and Jorge, we can infer from the remaining dates based on Day of Week.
// Alfredo = Lunes
// Jorge = Jueves
// Note: May 19 is Tuesday (Carolina), July 16 is Thursday (Carolina)

const daysMap = { 0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado' };

const alfredoDates = [];
const jorgeDates = [];

courseData.fechas_asistencia.forEach(d => {
  if (carolinaDates.includes(d) || dayanaDates.includes(d) || xalimaDates.includes(d)) {
    // Already assigned, BUT wait! What if Jorge also taught on July 16?
    // Let's just assign based on Day of week for Jorge and Alfredo to be safe!
  }
  
  const dateObj = new Date(d);
  const dayName = daysMap[dateObj.getDay()];
  
  if (dayName === 'Lunes' && !alfredoDates.includes(d)) {
    alfredoDates.push(d);
  }
  if (dayName === 'Jueves' && !jorgeDates.includes(d)) {
    jorgeDates.push(d);
  }
});

courseData.fechas_por_instructor = {
  "Leidy Carolina Cano Muñoz": carolinaDates,
  "Dayana Marcela Diaz Dager": dayanaDates,
  "Xalima De Jesús Ruiz Doria": xalimaDates,
  "Alfredo De Jesús Pérez Mendez": alfredoDates,
  "Jorge Alexander Sepúlveda Vélez": jorgeDates
};

const output = `export const courseData = ${JSON.stringify(courseData, null, 2)};\n`;
fs.writeFileSync('src/data.ts', output);
console.log("Added fechas_por_instructor to data.ts");
