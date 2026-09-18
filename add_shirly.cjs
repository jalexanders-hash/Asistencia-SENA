const fs = require('fs');
let content = fs.readFileSync('src/data.ts', 'utf8');

const dataString = content.replace('export const courseData = ', '').trim().replace(/;$/, '');
const courseData = eval('(' + dataString + ')');

courseData.asistencias_aprendices.splice(2, 0, {
  numero_documento: "1011399073",
  nombres: "SHIRLY SAMANTA",
  apellidos: "MURILLO CORDOBA",
  correo_electronico: "SSMC@soy.sena.edu.co",
  registros: {
    "4/27/2026": "X",
    "8/3/2026": "X",
    "8/10/2026": "X",
    "8/24/2026": "X",
    "8/31/2026": "X",
    "9/7/2026": "X",
    "7/21/2026": "X",
    "7/28/2026": "X",
    "8/4/2026": "X",
    "8/11/2026": "X"
  }
});

const output = `export const courseData = ${JSON.stringify(courseData, null, 2)};\n`;
fs.writeFileSync('src/data.ts', output);
console.log("Added Shirly back");
