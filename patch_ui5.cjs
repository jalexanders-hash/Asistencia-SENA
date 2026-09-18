const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<h3 className="font-semibold text-slate-800">\{instructor\.nombre_del_instructor\}<\/h3>\n\s*<p className="text-sm text-slate-500">\{instructor\.competencia\} \(\{instructor\.dia\}\)<\/p>/;

const replacement = `<h3 className="font-semibold text-slate-800">{instructor.nombre_del_instructor}</h3>
                    <p className="text-xs text-sena font-medium">{instructor.correo}</p>
                    <p className="text-sm text-slate-500 line-clamp-1">{instructor.competencia} ({instructor.dia})</p>`;

if (regex.test(code)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Successfully patched list.");
} else {
  console.log("Regex did not match");
}
