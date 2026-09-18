const fs = require('fs');
let content = fs.readFileSync('src/data.ts', 'utf8');

const dataString = content.replace('export const courseData = ', '').trim().replace(/;$/, '');
const courseData = eval('(' + dataString + ')');

const newData = [
  {
    "id": "TI 1035975387",
    "nombre": "SEBASTIAN PABON BEDOYA",
    "asistencia": {
      "Feb.13": "F", "feb.20": "A", "feb.27": "A", "mar.6": "A", "mar.13": "A", "mar.20": "L", "mar.27": "A", "abr.10": "L", "abr.24": "A", "may.19": "L", "may.29": "A", "jun.5": "L", "jun.12": "L", "jun.19": "A", "jun.26": "L", "jul.3": "L", "jul.10": "A", "jul.16": "A", "jul.24": "A", "jul.31": "X", "ago.14": "A", "ago.21": "A", "sep.4": "A", "sep.11": "A"
    }
  },
  {
    "id": "TI 1027999416",
    "nombre": "OSCAR URIEL ABREU PIEDRAHITA",
    "asistencia": {
      "Feb.13": "A", "feb.20": "A", "feb.27": "A", "mar.6": "A", "mar.13": "A", "mar.20": "A", "mar.27": "A", "abr.10": "A", "abr.24": "A", "may.19": "A", "may.29": "A", "jun.5": "A", "jun.12": "L", "jun.19": "A", "jun.26": "A", "jul.3": "A", "jul.10": "A", "jul.16": "A", "jul.24": "E", "jul.31": "L", "ago.14": "A", "ago.21": "A", "sep.4": "A", "sep.11": "A"
    }
  },
  {
    "id": "TI 1046530432",
    "nombre": "CLEIDIS YANIRIS BORJA MOSQUERA",
    "asistencia": {
      "Feb.13": "F", "feb.20": "A", "feb.27": "A", "mar.6": "A", "mar.13": "A", "mar.20": "A", "mar.27": "A", "abr.10": "A", "abr.24": "X", "may.19": "E", "may.29": "A", "jun.5": "A", "jun.12": "A", "jun.19": "A", "jun.26": "A", "jul.3": "A", "jul.10": "A", "jul.16": "A", "jul.24": "E", "jul.31": "A", "ago.14": "A", "ago.21": "A", "sep.4": "E", "sep.11": "A"
    }
  },
  {
    "id": "TI 1037123665",
    "nombre": "SANTIAGO CANTERO DORIA",
    "asistencia": {
      "Feb.13": "A", "feb.20": "A", "feb.27": "A", "mar.6": "A", "mar.13": "A", "mar.20": "A", "mar.27": "A", "abr.10": "A", "abr.24": "A", "may.19": "A", "may.29": "A", "jun.5": "A", "jun.12": "A", "jun.19": "E", "jun.26": "A", "jul.3": "A", "jul.10": "A", "jul.16": "A", "jul.24": "A", "jul.31": "L", "ago.14": "A", "ago.21": "A", "sep.4": "A", "sep.11": "A"
    }
  },
  {
    "id": "CC 1027951536",
    "nombre": "NIKOL AGAMEZ PEÑATE",
    "asistencia": {
      "Feb.13": "F", "feb.20": "A", "feb.27": "A", "mar.6": "E", "mar.13": "A", "mar.20": "E", "mar.27": "A", "abr.10": "A", "abr.24": "A", "may.19": "X", "may.29": "X", "jun.5": "A", "jun.12": "X", "jun.19": "E", "jun.26": "L", "jul.3": "A", "jul.10": "A", "jul.16": "A", "jul.24": "A", "jul.31": "A", "ago.14": "A", "ago.21": "A", "sep.4": "A", "sep.11": "A"
    }
  },
  {
    "id": "CC 1001035388",
    "nombre": "MARYIS LEIDYS ALMAIRO TAPIAS",
    "asistencia": {
      "Feb.13": "F", "feb.20": "A", "feb.27": "A", "mar.6": "A", "mar.13": "A", "mar.20": "A", "mar.27": "A", "abr.10": "A", "abr.24": "A", "may.19": "A", "may.29": "A", "jun.5": "A", "jun.12": "A", "jun.19": "A", "jun.26": "A", "jul.3": "A", "jul.10": "A", "jul.16": "A", "jul.24": "E", "jul.31": "A", "ago.14": "A", "ago.21": "A", "sep.4": "A", "sep.11": "A"
    }
  },
  {
    "id": "TI 1046529870",
    "nombre": "LUZ MILEIDI MOYA OROBIO",
    "asistencia": {
      "Feb.13": "F", "feb.20": "A", "feb.27": "A", "mar.6": "A", "mar.13": "A", "mar.20": "A", "mar.27": "A", "abr.10": "A", "abr.24": "X", "may.19": "A", "may.29": "A", "jun.5": "A", "jun.12": "A", "jun.19": "A", "jun.26": "A", "jul.3": "A", "jul.10": "A", "jul.16": "A", "jul.24": "A", "jul.31": "A", "ago.14": "E", "ago.21": "A", "sep.4": "E", "sep.11": "A"
    }
  },
  {
    "id": "CC 1023632789",
    "nombre": "DARWIN ESTIVEN ROMAÑA MUÑOZ",
    "asistencia": {
      "Feb.13": "A", "feb.20": "A", "feb.27": "A", "mar.6": "A", "mar.13": "A", "mar.20": "A", "mar.27": "A", "abr.10": "A", "abr.24": "A", "may.19": "L", "may.29": "A", "jun.5": "A", "jun.12": "A", "jun.19": "A", "jun.26": "A", "jul.3": "A", "jul.10": "A", "jul.16": "A", "jul.24": "A", "jul.31": "A", "ago.14": "A", "ago.21": "A", "sep.4": "A", "sep.11": "E"
    }
  },
  {
    "id": "CC 1037123011",
    "nombre": "SARA MILENA GARCIA DIAZ",
    "asistencia": {
      "Feb.13": "F", "feb.20": "X", "feb.27": "A", "mar.6": "A", "mar.13": "A", "mar.20": "A", "mar.27": "A", "abr.10": "A", "abr.24": "A", "may.19": "A", "may.29": "A", "jun.5": "A", "jun.12": "A", "jun.19": "A", "jun.26": "A", "jul.3": "A", "jul.10": "A", "jul.16": "A", "jul.24": "E", "jul.31": "A", "ago.14": "A", "ago.21": "A", "sep.4": "A", "sep.11": "A"
    }
  },
  {
    "id": "CC 1038808586",
    "nombre": "NATALY PEREZ MUENTES",
    "asistencia": {
      "Feb.13": "F", "feb.20": "X", "feb.27": "A", "mar.6": "A", "mar.13": "X", "mar.20": "A", "mar.27": "A", "abr.10": "A", "abr.24": "X", "may.19": "L", "may.29": "L", "jun.5": "X", "jun.12": "A", "jun.19": "A", "jun.26": "A", "jul.3": "A", "jul.10": "A", "jul.16": "A", "jul.24": "A", "jul.31": "A", "ago.14": "A", "ago.21": "X", "sep.4": "A", "sep.11": "A"
    }
  },
  {
    "id": "CC 1032177401",
    "nombre": "YUBER STIVEN BLANDON PALOMEQUE",
    "asistencia": {
      "Feb.13": "F", "feb.20": "A", "feb.27": "A", "mar.6": "L", "mar.13": "A", "mar.20": "A", "mar.27": "A", "abr.10": "P", "abr.24": "A", "may.19": "L", "may.29": "X", "jun.5": "X", "jun.12": "A", "jun.19": "L", "jun.26": "X", "jul.3": "A", "jul.10": "A", "jul.16": "A", "jul.24": "A", "jul.31": "A", "ago.14": "A", "ago.21": "L", "sep.4": "A", "sep.11": "A"
    }
  },
  {
    "id": "CC 1027953282",
    "nombre": "ASLIC YICED VIDAL CHAVERRA",
    "asistencia": {
      "Feb.13": "F", "feb.20": "A", "feb.27": "A", "mar.6": "A", "mar.13": "A", "mar.20": "A", "mar.27": "A", "abr.10": "A", "abr.24": "A", "may.19": "A", "may.29": "A", "jun.5": "A", "jun.12": "L", "jun.19": "L", "jun.26": "A", "jul.3": "A", "jul.10": "A", "jul.16": "A", "jul.24": "A", "jul.31": "A", "ago.14": "A", "ago.21": "A", "sep.4": "A", "sep.11": "A"
    }
  },
  {
    "id": "CC 1032177775",
    "nombre": "CAMILA ESTRELLA ACEVEDO CAICEDO",
    "asistencia": {
      "Feb.13": "F", "feb.20": "A", "feb.27": "A", "mar.6": "A", "mar.13": "A", "mar.20": "A", "mar.27": "A", "abr.10": "A", "abr.24": "A", "may.19": "A", "may.29": "A", "jun.5": "A", "jun.12": "A", "jun.19": "A", "jun.26": "L", "jul.3": "A", "jul.10": "A", "jul.16": "A", "jul.24": "A", "jul.31": "A", "ago.14": "A", "ago.21": "A", "sep.4": "A", "sep.11": "A"
    }
  },
  {
    "id": "CC 1007607693",
    "nombre": "SONIA YOHANA JARAMILLO SALAS",
    "asistencia": {
      "Feb.13": "F", "feb.20": "A", "feb.27": "A", "mar.6": "A", "mar.13": "A", "mar.20": "A", "mar.27": "A", "abr.10": "L", "abr.24": "A", "may.19": "A", "may.29": "A", "jun.5": "A", "jun.12": "A", "jun.19": "A", "jun.26": "A", "jul.3": "L", "jul.10": "A", "jul.16": "A", "jul.24": "A", "jul.31": "A", "ago.14": "A", "ago.21": "A", "sep.4": "A", "sep.11": "A"
    }
  },
  {
    "id": "CC 1032176717",
    "nombre": "CRISTIAN CAMILO MARTINEZ MORENO",
    "asistencia": {
      "Feb.13": "A", "feb.20": "A", "feb.27": "A", "mar.6": "A", "mar.13": "A", "mar.20": "A", "mar.27": "A", "abr.10": "A", "abr.24": "A", "may.19": "A", "may.29": "A", "jun.5": "A", "jun.12": "A", "jun.19": "A", "jun.26": "A", "jul.3": "A", "jul.10": "A", "jul.16": "A", "jul.24": "A", "jul.31": "A", "ago.14": "A", "ago.21": "A", "sep.4": "A", "sep.11": "A"
    }
  },
  {
    "id": "CC 1011591722",
    "nombre": "THANIA ALEJANDRA AGUDELO VILLA",
    "asistencia": {
      "Feb.13": "F", "feb.20": "A", "feb.27": "A", "mar.6": "A", "mar.13": "A", "mar.20": "A", "mar.27": "A", "abr.10": "E", "abr.24": "A", "may.19": "A", "may.29": "A", "jun.5": "A", "jun.12": "A", "jun.19": "A", "jun.26": "A", "jul.3": "A", "jul.10": "A", "jul.16": "A", "jul.24": "X", "jul.31": "A", "ago.14": "A", "ago.21": "A", "sep.4": "A", "sep.11": "L"
    }
  },
  {
    "id": "TI 1028003208",
    "nombre": "CAROLL SOFIA ARBELAEZ BARRAGAN",
    "asistencia": {
      "Feb.13": "A", "feb.20": "A", "feb.27": "A", "mar.6": "A", "mar.13": "A", "mar.20": "A", "mar.27": "A", "abr.10": "A", "abr.24": "A", "may.19": "A", "may.29": "A", "jun.5": "A", "jun.12": "A", "jun.19": "A", "jun.26": "A", "jul.3": "A", "jul.10": "A", "jul.16": "A", "jul.24": "A", "jul.31": "A", "ago.14": "A", "ago.21": "A", "sep.4": "A", "sep.11": "A"
    }
  },
  {
    "id": "TI 1032182189",
    "nombre": "ANGELLY BERTEL PASTRANA",
    "asistencia": {
      "Feb.13": "F", "feb.20": "A", "feb.27": "A", "mar.6": "A", "mar.13": "A", "mar.20": "A", "mar.27": "A", "abr.10": "L", "abr.24": "A", "may.19": "A", "may.29": "A", "jun.5": "A", "jun.12": "L", "jun.19": "A", "jun.26": "A", "jul.3": "A", "jul.10": "A", "jul.16": "A", "jul.24": "A", "jul.31": "E", "ago.14": "A", "ago.21": "A", "sep.4": "A", "sep.11": "A"
    }
  },
  {
    "id": "TI 1067606300",
    "nombre": "VALERIN NICOLL LOPEZ BARRIOS",
    "asistencia": {
      "Feb.13": "F", "feb.20": "A", "feb.27": "A", "mar.6": "A", "mar.13": "A", "mar.20": "A", "mar.27": "A", "abr.10": "A", "abr.24": "A", "may.19": "A", "may.29": "A", "jun.5": "A", "jun.12": "A", "jun.19": "A", "jun.26": "A", "jul.3": "A", "jul.10": "A", "jul.16": "A", "jul.24": "A", "jul.31": "A", "ago.14": "A", "ago.21": "A", "sep.4": "A", "sep.11": "A"
    }
  },
  {
    "id": "CC 1027961987",
    "nombre": "VANESA MEJIA AGAMEZ",
    "asistencia": {
      "Feb.13": "F", "feb.20": "X", "feb.27": "A", "mar.6": "A", "mar.13": "A", "mar.20": "A", "mar.27": "A", "abr.10": "A", "abr.24": "A", "may.19": "A", "may.29": "E", "jun.5": "A", "jun.12": "A", "jun.19": "A", "jun.26": "A", "jul.3": "A", "jul.10": "A", "jul.16": "A", "jul.24": "A", "jul.31": "A", "ago.14": "A", "ago.21": "A", "sep.4": "A", "sep.11": "A"
    }
  },
  {
    "id": "CC 1040352689",
    "nombre": "SAYDA VANESSA BEJARANO ASPRILLA",
    "asistencia": {
      "Feb.13": "F", "feb.20": "A", "feb.27": "A", "mar.6": "A", "mar.13": "A", "mar.20": "A", "mar.27": "A", "abr.10": "A", "abr.24": "A", "may.19": "A", "may.29": "A", "jun.5": "A", "jun.12": "A", "jun.19": "A", "jun.26": "A", "jul.3": "L", "jul.10": "A", "jul.16": "A", "jul.24": "A", "jul.31": "A", "ago.14": "A", "ago.21": "A", "sep.4": "A", "sep.11": "A"
    }
  },
  {
    "id": "TI 1027966782",
    "nombre": "EDWIN DAVID CASTRO MURCIA",
    "asistencia": {
      "Feb.13": "A", "feb.20": "A", "feb.27": "A", "mar.6": "L", "mar.13": "A", "mar.20": "L", "mar.27": "L", "abr.10": "L", "abr.24": "L", "may.19": "L", "may.29": "A", "jun.5": "A", "jun.12": "A", "jun.19": "L", "jun.26": "A", "jul.3": "L", "jul.10": "A", "jul.16": "A", "jul.24": "A", "jul.31": "A", "ago.14": "A", "ago.21": "A", "sep.4": "A", "sep.11": "A"
    }
  },
  {
    "id": "TI 1040364156",
    "nombre": "SARA SOFIA POSSO AGUINAGA",
    "asistencia": {
      "Feb.13": "F", "feb.20": "A", "feb.27": "A", "mar.6": "A", "mar.13": "A", "mar.20": "L", "mar.27": "A", "abr.10": "L", "abr.24": "A", "may.19": "X", "may.29": "A", "jun.5": "A", "jun.12": "A", "jun.19": "A", "jun.26": "A", "jul.3": "A", "jul.10": "A", "jul.16": "A", "jul.24": "A", "jul.31": "A", "ago.14": "A", "ago.21": "A", "sep.4": "X", "sep.11": "A"
    }
  },
  {
    "id": "CC 1032179329",
    "nombre": "KEVIN MATEO RENDON GARCIA",
    "asistencia": {
      "Feb.13": "A", "feb.20": "E", "feb.27": "A", "mar.6": "A", "mar.13": "A", "mar.20": "A", "mar.27": "A", "abr.10": "A", "abr.24": "E", "may.19": "A", "may.29": "A", "jun.5": "A", "jun.12": "A", "jun.19": "A", "jun.26": "A", "jul.3": "L", "jul.10": "A", "jul.16": "L", "jul.24": "A", "jul.31": "A", "ago.14": "A", "ago.21": "A", "sep.4": "A", "sep.11": "A"
    }
  },
  {
    "id": "CC 1039081463",
    "nombre": "DAYENIS JARAMILLO ARIZA",
    "asistencia": {
      "Feb.13": "F", "feb.20": "A", "feb.27": "A", "mar.6": "A", "mar.13": "A", "mar.20": "A", "mar.27": "L", "abr.10": "A", "abr.24": "A", "may.19": "A", "may.29": "A", "jun.5": "X", "jun.12": "L", "jun.19": "A", "jun.26": "A", "jul.3": "L", "jul.10": "A", "jul.16": "L", "jul.24": "A", "jul.31": "A", "ago.14": "A", "ago.21": "A", "sep.4": "A", "sep.11": "A"
    }
  },
  {
    "id": "CC 1193580844",
    "nombre": "KEVIN GAMALIEL PAYARES GOMEZ",
    "asistencia": {
      "Feb.13": "F", "feb.20": "A", "feb.27": "A", "mar.6": "L", "mar.13": "A", "mar.20": "A", "mar.27": "A", "abr.10": "P", "abr.24": "X", "may.19": "A", "may.29": "L", "jun.5": "A", "jun.12": "L", "jun.19": "A", "jun.26": "L", "jul.3": "L", "jul.10": "A", "jul.16": "A", "jul.24": "A", "jul.31": "A", "ago.14": "X", "ago.21": "A", "sep.4": "A", "sep.11": "L"
    }
  },
  {
    "id": "CC 1028014128",
    "nombre": "LIBARDO ANTONIO JIMENEZ HOYOS",
    "asistencia": {
      "Feb.13": "F", "feb.20": "A", "feb.27": "A", "mar.6": "A", "mar.13": "L", "mar.20": "A", "mar.27": "A", "abr.10": "L", "abr.24": "A", "may.19": "A", "may.29": "A", "jun.5": "L", "jun.12": "A", "jun.19": "A", "jun.26": "A", "jul.3": "A", "jul.10": "A", "jul.16": "A", "jul.24": "A", "jul.31": "A", "ago.14": "A", "ago.21": "A", "sep.4": "A", "sep.11": "A"
    }
  },
  {
    "id": "CC 1032178573",
    "nombre": "JESUS MATEO MARIN DIAZ",
    "asistencia": {
      "Feb.13": "A", "feb.20": "A", "feb.27": "A", "mar.6": "A", "mar.13": "A", "mar.20": "A", "mar.27": "A", "abr.10": "L", "abr.24": "L", "may.19": "A", "may.29": "L", "jun.5": "L", "jun.12": "A", "jun.19": "L", "jun.26": "L", "jul.3": "A", "jul.10": "A", "jul.16": "L", "jul.24": "A", "jul.31": "A", "ago.14": "L", "ago.21": "A", "sep.4": "L", "sep.11": "L"
    }
  }
];

const dateMap = {
  "Feb.13": "2/13/2026",
  "feb.20": "2/20/2026",
  "feb.27": "2/27/2026",
  "mar.6": "3/6/2026",
  "mar.13": "3/13/2026",
  "mar.20": "3/20/2026",
  "mar.27": "3/27/2026",
  "abr.10": "4/10/2026",
  "abr.24": "4/24/2026",
  "may.19": "5/19/2026",
  "may.29": "5/29/2026",
  "jun.5": "6/5/2026",
  "jun.12": "6/12/2026",
  "jun.19": "6/19/2026",
  "jun.26": "6/26/2026",
  "jul.3": "7/3/2026",
  "jul.10": "7/10/2026",
  "jul.16": "7/16/2026",
  "jul.24": "7/24/2026",
  "jul.31": "7/31/2026",
  "ago.14": "8/14/2026",
  "ago.21": "8/21/2026",
  "sep.4": "9/4/2026",
  "sep.11": "9/11/2026"
};

Object.values(dateMap).forEach(d => {
  if (!courseData.fechas_asistencia.includes(d)) {
    courseData.fechas_asistencia.push(d);
  }
});

newData.forEach(studentData => {
  // id is like "TI 1035975387", extract doc number
  const docNumberMatch = studentData.id.match(/\d+/);
  if (!docNumberMatch) return;
  const docNumber = docNumberMatch[0];
  
  let student = courseData.asistencias_aprendices.find(a => a.numero_documento === docNumber);
  if (!student) {
    const parts = studentData.nombre.split(' ');
    const apellido = parts.length > 2 ? parts.slice(2).join(' ') : (parts[1] || '');
    const nombres = parts.length > 2 ? parts.slice(0, 2).join(' ') : parts[0];
    student = {
      numero_documento: docNumber,
      nombres: nombres,
      apellidos: apellido,
      correo_electronico: `${nombres[0] || ''}${apellido[0] || ''}${docNumber.slice(-4)}@soy.sena.edu.co`,
      registros: {}
    };
    courseData.asistencias_aprendices.push(student);
  }

  for (const [rawDate, status] of Object.entries(studentData.asistencia)) {
    const realDate = dateMap[rawDate];
    if (!realDate) continue;

    let finalStatus = '';
    // A = Asistió, F = Falta, X = Falta, L = Tarde, E = Excusa, P = Permiso/Excusa
    if (status === 'F' || status === 'X') finalStatus = 'X';
    else if (status === 'A') finalStatus = '';
    else if (status === 'L') finalStatus = 'Tarde';
    else if (status === 'E' || status === 'P') finalStatus = 'Excusa';

    if (finalStatus) {
      student.registros[realDate] = finalStatus;
    } else {
      delete student.registros[realDate];
    }
  }
});

courseData.fechas_asistencia.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

const output = `export const courseData = ${JSON.stringify(courseData, null, 2)};\n`;
fs.writeFileSync('src/data.ts', output);
console.log("Updated data.ts with Carolina's data");
