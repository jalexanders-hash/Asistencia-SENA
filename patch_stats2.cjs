const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /fechasTarde,\s*enRiesgo: fallasAcumuladas >= 3/,
  `fechasTarde,
        fechasFalla,
        enRiesgo: fallasAcumuladas >= 3`
);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched stats 2");
