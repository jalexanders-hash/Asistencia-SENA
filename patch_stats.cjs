const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /let fechasTarde: string\[\] = \[\];/,
  `let fechasTarde: string[] = [];
      let fechasFalla: string[] = [];`
);

code = code.replace(
  /if \(status === 'X'\) \{\s*absent\+\+;\s*fallasAcumuladas\+\+;\s*\}/,
  `if (status === 'X') {
            absent++;
            fallasAcumuladas++;
            fechasFalla.push(date);
          }`
);

code = code.replace(
  /fechasTarde,\s*enRiesgoTarde: tardanzasAcumuladas >= 3/,
  `fechasTarde,
        fechasFalla,
        enRiesgoTarde: tardanzasAcumuladas >= 3`
);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched stats");
