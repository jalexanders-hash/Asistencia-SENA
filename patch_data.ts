import fs from 'fs';
import { courseData } from './src/data';

const idsToRemove = ["1011399073", "1027943573"];
courseData.asistencias_aprendices = courseData.asistencias_aprendices.filter((s: any) => !idsToRemove.includes(s.numero_documento));

const newContent = `export const courseData = ${JSON.stringify(courseData, null, 2)};\n`;
fs.writeFileSync('src/data.ts', newContent);
console.log("Patched src/data.ts");
