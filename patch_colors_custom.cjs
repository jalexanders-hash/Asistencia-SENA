const fs = require('fs');
let code = fs.readFileSync('src/index.css', 'utf8');

if (!code.includes('theme(')) {
  const customColors = `
@theme {
  --color-sena: #39A900;
  --color-sena-dark: #2a7e00;
  --color-sena-light: #eaf6e5;
}
`;
  code += customColors;
  fs.writeFileSync('src/index.css', code);
}
console.log("Custom colors added to index.css");
