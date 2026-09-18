const fs = require('fs');
let content = fs.readFileSync('src/data.ts', 'utf8');

const dataString = content.replace('export const courseData = ', '').trim().replace(/;$/, '');
const courseData = eval('(' + dataString + ')');

const newData = [
  {
    "tipo_documento": "TI",
    "documento": "1032182189",
    "nombre": "ANGELLY",
    "apellido": "BERTEL PASTRANA",
    "asistencia": {
      "17/06/26": "asistio", "24/06/26": "asistio", "1/07/26": "asistio", "15/07/26": "asistio", "22-jul": "asistio", "29-jul": "asistio", "5/08/26": "asistio", "12-ago": "asistio", "19-ago": "asistio", "2-sept": "asistio", "9-sept": "asistio"
    }
  },
  {
    "tipo_documento": "CC",
    "documento": "1027953282",
    "nombre": "ASLIC YICED",
    "apellido": "VIDAL CHAVERRA",
    "asistencia": {
      "17/06/26": "asistio", "24/06/26": "asistio", "1/07/26": "asistio", "15/07/26": "asistio", "22-jul": "asistio", "29-jul": "asistio", "5/08/26": "asistio", "12-ago": "asistio", "19-ago": "asistio", "2-sept": "asistio", "9-sept": "asistio"
    }
  },
  {
    "tipo_documento": "CC",
    "documento": "1032177775",
    "nombre": "CAMILA ESTRELLA",
    "apellido": "ACEVEDO CAICEDO",
    "asistencia": {
      "17/06/26": "asistio", "24/06/26": "asistio", "1/07/26": "asistio", "15/07/26": "asistio", "22-jul": "asistio", "29-jul": "asistio", "5/08/26": "asistio", "12-ago": "asistio", "19-ago": "asistio", "2-sept": "asistio", "9-sept": "asistio"
    }
  },
  {
    "tipo_documento": "TI",
    "documento": "1028003208",
    "nombre": "CAROLL SOFIA",
    "apellido": "ARBELAEZ BARRAGAN",
    "asistencia": {
      "17/06/26": "asistio", "24/06/26": "asistio", "1/07/26": "asistio", "15/07/26": "asistio", "22-jul": "asistio", "29-jul": "asistio", "5/08/26": "sin_registro", "12-ago": "asistio", "19-ago": "asistio", "2-sept": "asistio", "9-sept": "asistio"
    }
  },
  {
    "tipo_documento": "TI",
    "documento": "1046530432",
    "nombre": "CLEIDIS YANIRIS",
    "apellido": "BORJA MOSQUERA",
    "asistencia": {
      "17/06/26": "asistio", "24/06/26": "asistio", "1/07/26": "asistio", "15/07/26": "asistio", "22-jul": "asistio", "29-jul": "asistio", "5/08/26": "asistio", "12-ago": "asistio", "19-ago": "asistio", "2-sept": "asistio", "9-sept": "falto"
    }
  },
  {
    "tipo_documento": "CC",
    "documento": "1032176717",
    "nombre": "CRISTIAN CAMILO",
    "apellido": "MARTINEZ MORENO",
    "asistencia": {
      "17/06/26": "asistio", "24/06/26": "asistio", "1/07/26": "asistio", "15/07/26": "asistio", "22-jul": "asistio", "29-jul": "asistio", "5/08/26": "asistio", "12-ago": "asistio", "19-ago": "asistio", "2-sept": "asistio", "9-sept": "asistio"
    }
  },
  {
    "tipo_documento": "CC",
    "documento": "1023632789",
    "nombre": "DARWIN ESTIVEN",
    "apellido": "ROMAÑA MUÑOZ",
    "asistencia": {
      "17/06/26": "asistio", "24/06/26": "asistio", "1/07/26": "asistio", "15/07/26": "asistio", "22-jul": "asistio", "29-jul": "asistio", "5/08/26": "asistio", "12-ago": "asistio", "19-ago": "asistio", "2-sept": "asistio", "9-sept": "falto"
    }
  },
  {
    "tipo_documento": "CC",
    "documento": "1039081463",
    "nombre": "DAYENIS",
    "apellido": "JARAMILLO ARIZA",
    "asistencia": {
      "17/06/26": "asistio", "24/06/26": "asistio", "1/07/26": "asistio", "15/07/26": "asistio", "22-jul": "asistio", "29-jul": "asistio", "5/08/26": "asistio", "12-ago": "asistio", "19-ago": "asistio", "2-sept": "asistio", "9-sept": "asistio"
    }
  },
  {
    "tipo_documento": "TI",
    "documento": "1027966782",
    "nombre": "EDWIN DAVID",
    "apellido": "CASTRO MURCIA",
    "asistencia": {
      "17/06/26": "asistio", "24/06/26": "asistio", "1/07/26": "asistio", "15/07/26": "asistio", "22-jul": "asistio", "29-jul": "asistio", "5/08/26": "asistio", "12-ago": "asistio", "19-ago": "asistio", "2-sept": "asistio", "9-sept": "asistio"
    }
  },
  {
    "tipo_documento": "CC",
    "documento": "1032178573",
    "nombre": "JESUS MATEO",
    "apellido": "MARIN DIAZ",
    "asistencia": {
      "17/06/26": "asistio", "24/06/26": "asistio", "1/07/26": "asistio", "15/07/26": "asistio", "22-jul": "asistio", "29-jul": "asistio", "5/08/26": "asistio", "12-ago": "asistio", "19-ago": "asistio", "2-sept": "asistio", "9-sept": "asistio"
    }
  },
  {
    "tipo_documento": "CC",
    "documento": "1193580844",
    "nombre": "KEVIN GAMALIEL",
    "apellido": "PAYARES GOMEZ",
    "asistencia": {
      "17/06/26": "asistio", "24/06/26": "asistio", "1/07/26": "falto", "15/07/26": "asistio", "22-jul": "asistio", "29-jul": "asistio", "5/08/26": "asistio", "12-ago": "asistio", "19-ago": "asistio", "2-sept": "asistio", "9-sept": "asistio"
    }
  },
  {
    "tipo_documento": "CC",
    "documento": "1032179329",
    "nombre": "KEVIN MATEO",
    "apellido": "RENDON GARCIA",
    "asistencia": {
      "17/06/26": "asistio", "24/06/26": "asistio", "1/07/26": "asistio", "15/07/26": "asistio", "22-jul": "asistio", "29-jul": "asistio", "5/08/26": "asistio", "12-ago": "asistio", "19-ago": "asistio", "2-sept": "asistio", "9-sept": "asistio"
    }
  },
  {
    "tipo_documento": "CC",
    "documento": "1028014128",
    "nombre": "LIBARDO ANTONIO",
    "apellido": "JIMENEZ HOYOS",
    "asistencia": {
      "17/06/26": "asistio", "24/06/26": "asistio", "1/07/26": "asistio", "15/07/26": "asistio", "22-jul": "asistio", "29-jul": "asistio", "5/08/26": "asistio", "12-ago": "asistio", "19-ago": "asistio", "2-sept": "asistio", "9-sept": "asistio"
    }
  },
  {
    "tipo_documento": "TI",
    "documento": "1046529870",
    "nombre": "LUZ MILEIDI",
    "apellido": "MOYA OROBIO",
    "asistencia": {
      "17/06/26": "asistio", "24/06/26": "asistio", "1/07/26": "asistio", "15/07/26": "asistio", "22-jul": "asistio", "29-jul": "asistio", "5/08/26": "asistio", "12-ago": "asistio", "19-ago": "asistio", "2-sept": "asistio", "9-sept": "falto"
    }
  },
  {
    "tipo_documento": "CC",
    "documento": "1001035388",
    "nombre": "MARYIS LEIDYS",
    "apellido": "ALMAIRO TAPIAS",
    "asistencia": {
      "17/06/26": "asistio", "24/06/26": "asistio", "1/07/26": "asistio", "15/07/26": "asistio", "22-jul": "asistio", "29-jul": "asistio", "5/08/26": "asistio", "12-ago": "asistio", "19-ago": "asistio", "2-sept": "asistio", "9-sept": "asistio"
    }
  },
  {
    "tipo_documento": "CC",
    "documento": "1038808586",
    "nombre": "NATALY",
    "apellido": "PEREZ MUENTES",
    "asistencia": {
      "17/06/26": "asistio", "24/06/26": "asistio", "1/07/26": "falto", "15/07/26": "asistio", "22-jul": "asistio", "29-jul": "asistio", "5/08/26": "asistio", "12-ago": "asistio", "19-ago": "asistio", "2-sept": "asistio", "9-sept": "asistio"
    }
  },
  {
    "tipo_documento": "CC",
    "documento": "1027951536",
    "nombre": "NIKOL",
    "apellido": "AGAMEZ PEÑATE",
    "asistencia": {
      "17/06/26": "asistio", "24/06/26": "asistio", "1/07/26": "falto", "15/07/26": "asistio", "22-jul": "falto", "29-jul": "asistio", "5/08/26": "asistio", "12-ago": "asistio", "19-ago": "asistio", "2-sept": "asistio", "9-sept": "asistio"
    }
  },
  {
    "tipo_documento": "TI",
    "documento": "1027999416",
    "nombre": "OSCAR URIEL",
    "apellido": "ABREU PIEDRAHITA",
    "asistencia": {
      "17/06/26": "asistio", "24/06/26": "asistio", "1/07/26": "asistio", "15/07/26": "asistio", "22-jul": "asistio", "29-jul": "asistio", "5/08/26": "asistio", "12-ago": "asistio", "19-ago": "asistio", "2-sept": "asistio", "9-sept": "asistio"
    }
  },
  {
    "tipo_documento": "TI",
    "documento": "1037123665",
    "nombre": "SANTIAGO",
    "apellido": "CANTERO DORIA",
    "asistencia": {
      "17/06/26": "asistio", "24/06/26": "asistio", "1/07/26": "asistio", "15/07/26": "asistio", "22-jul": "asistio", "29-jul": "asistio", "5/08/26": "asistio", "12-ago": "asistio", "19-ago": "asistio", "2-sept": "asistio", "9-sept": "falto"
    }
  },
  {
    "tipo_documento": "CC",
    "documento": "1037123011",
    "nombre": "SARA MILENA",
    "apellido": "GARCIA DIAZ",
    "asistencia": {
      "17/06/26": "asistio", "24/06/26": "asistio", "1/07/26": "asistio", "15/07/26": "asistio", "22-jul": "asistio", "29-jul": "asistio", "5/08/26": "asistio", "12-ago": "asistio", "19-ago": "asistio", "2-sept": "asistio", "9-sept": "asistio"
    }
  },
  {
    "tipo_documento": "TI",
    "documento": "1040364156",
    "nombre": "SARA SOFIA",
    "apellido": "POSSO AGUINAGA",
    "asistencia": {
      "17/06/26": "asistio", "24/06/26": "asistio", "1/07/26": "asistio", "15/07/26": "asistio", "22-jul": "falto", "29-jul": "asistio", "5/08/26": "asistio", "12-ago": "asistio", "19-ago": "asistio", "2-sept": "asistio", "9-sept": "asistio"
    }
  },
  {
    "tipo_documento": "CC",
    "documento": "1040352689",
    "nombre": "SAYDA VANESSA",
    "apellido": "BEJARANO ASPRILLA",
    "asistencia": {
      "17/06/26": "asistio", "24/06/26": "asistio", "1/07/26": "asistio", "15/07/26": "asistio", "22-jul": "asistio", "29-jul": "asistio", "5/08/26": "asistio", "12-ago": "asistio", "19-ago": "asistio", "2-sept": "asistio", "9-sept": "asistio"
    }
  },
  {
    "tipo_documento": "CC",
    "documento": "1035975387",
    "nombre": "SEBASTIAN",
    "apellido": "PABON BEDOYA",
    "asistencia": {
      "17/06/26": "asistio", "24/06/26": "asistio", "1/07/26": "asistio", "15/07/26": "asistio", "22-jul": "asistio", "29-jul": "asistio", "5/08/26": "asistio", "12-ago": "asistio", "19-ago": "asistio", "2-sept": "asistio", "9-sept": "asistio"
    }
  },
  {
    "tipo_documento": "TI",
    "documento": "1011399073",
    "nombre": "SHIRLY SAMANTA",
    "apellido": "MURILLO CORDOBA",
    "asistencia": {
      "17/06/26": "asistio", "24/06/26": "asistio", "1/07/26": "asistio", "15/07/26": "falto", "22-jul": "falto", "29-jul": "falto", "5/08/26": "falto", "12-ago": "falto", "19-ago": "sin_registro", "2-sept": "sin_registro", "9-sept": "sin_registro"
    }
  },
  {
    "tipo_documento": "CC",
    "documento": "1007607693",
    "nombre": "SONIA YOHANA",
    "apellido": "JARAMILLO SALAS",
    "asistencia": {
      "17/06/26": "asistio", "24/06/26": "asistio", "1/07/26": "asistio", "15/07/26": "asistio", "22-jul": "asistio", "29-jul": "asistio", "5/08/26": "asistio", "12-ago": "asistio", "19-ago": "asistio", "2-sept": "asistio", "9-sept": "asistio"
    }
  },
  {
    "tipo_documento": "CC",
    "documento": "1011591722",
    "nombre": "THANIA ALEJANDRA",
    "apellido": "AGUDELO VILLA",
    "asistencia": {
      "17/06/26": "asistio", "24/06/26": "asistio", "1/07/26": "asistio", "15/07/26": "asistio", "22-jul": "asistio", "29-jul": "asistio", "5/08/26": "asistio", "12-ago": "asistio", "19-ago": "asistio", "2-sept": "asistio", "9-sept": "asistio"
    }
  },
  {
    "tipo_documento": "TI",
    "documento": "1067606300",
    "nombre": "VALERIN NICOLL",
    "apellido": "LOPEZ BARRIOS",
    "asistencia": {
      "17/06/26": "asistio", "24/06/26": "asistio", "1/07/26": "asistio", "15/07/26": "asistio", "22-jul": "asistio", "29-jul": "asistio", "5/08/26": "asistio", "12-ago": "asistio", "19-ago": "asistio", "2-sept": "asistio", "9-sept": "asistio"
    }
  },
  {
    "tipo_documento": "CC",
    "documento": "1027961987",
    "nombre": "VANESA",
    "apellido": "MEJIA AGAMEZ",
    "asistencia": {
      "17/06/26": "asistio", "24/06/26": "asistio", "1/07/26": "asistio", "15/07/26": "asistio", "22-jul": "asistio", "29-jul": "asistio", "5/08/26": "asistio", "12-ago": "asistio", "19-ago": "asistio", "2-sept": "asistio", "9-sept": "asistio"
    }
  },
  {
    "tipo_documento": "CC",
    "documento": "1027943573",
    "nombre": "YILARYS",
    "apellido": "MOSQUERA MORENO",
    "asistencia": {
      "17/06/26": "falto", "24/06/26": "falto", "1/07/26": "falto", "15/07/26": "sin_registro", "22-jul": "sin_registro", "29-jul": "sin_registro", "5/08/26": "sin_registro", "12-ago": "sin_registro", "19-ago": "sin_registro", "2-sept": "sin_registro", "9-sept": "sin_registro"
    }
  },
  {
    "tipo_documento": "CC",
    "documento": "1032177401",
    "nombre": "YUBER STIVEN",
    "apellido": "BLANDON PALOMEQUE",
    "asistencia": {
      "17/06/26": "sin_registro", "24/06/26": "asistio", "1/07/26": "asistio", "15/07/26": "asistio", "22-jul": "falto", "29-jul": "asistio", "5/08/26": "falto", "12-ago": "asistio", "19-ago": "asistio", "2-sept": "asistio", "9-sept": "asistio"
    }
  }
];

const dateMap = {
  "17/06/26": "6/17/2026",
  "24/06/26": "6/24/2026",
  "1/07/26": "7/1/2026",
  "15/07/26": "7/15/2026",
  "22-jul": "7/22/2026",
  "29-jul": "7/29/2026",
  "5/08/26": "8/5/2026",
  "12-ago": "8/12/2026",
  "19-ago": "8/19/2026",
  "2-sept": "9/2/2026",
  "9-sept": "9/9/2026"
};

Object.values(dateMap).forEach(d => {
  if (!courseData.fechas_asistencia.includes(d)) {
    courseData.fechas_asistencia.push(d);
  }
});

newData.forEach(studentData => {
  let student = courseData.asistencias_aprendices.find(a => a.numero_documento === studentData.documento);
  if (!student) {
    student = {
      numero_documento: studentData.documento,
      nombres: studentData.nombre,
      apellidos: studentData.apellido,
      correo_electronico: `${studentData.nombre.split(' ')[0][0]}${studentData.apellido.split(' ')[0][0]}${studentData.documento.slice(-4)}@soy.sena.edu.co`,
      registros: {}
    };
    courseData.asistencias_aprendices.push(student);
  }

  for (const [rawDate, status] of Object.entries(studentData.asistencia)) {
    const realDate = dateMap[rawDate];
    if (!realDate) continue;

    let finalStatus = '';
    if (status === 'falto') finalStatus = 'X';
    else if (status === 'asistio') finalStatus = '';
    else if (status === 'sin_registro') finalStatus = '';

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
console.log("Updated data.ts with Dayana's data");
