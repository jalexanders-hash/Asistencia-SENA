const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const profileRegex = /<h3 className="text-lg font-bold text-slate-800">\{instructor\.nombre_del_instructor\}<\/h3>\n\s*<p className="text-sm text-slate-500 font-medium">\{instructor\.competencia\}<\/p>\n\s*<div className="flex items-center gap-2 mt-2 text-xs font-semibold px-2\.5 py-1 bg-white border border-slate-200 text-slate-600 rounded-md w-fit">/;

const profileReplacement = `<h3 className="text-lg font-bold text-slate-800">{instructor.nombre_del_instructor}</h3>
                    <p className="text-xs text-sena font-medium mb-1">{instructor.correo}</p>
                    <p className="text-sm text-slate-500 font-medium">{instructor.competencia}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs font-semibold px-2.5 py-1 bg-white border border-slate-200 text-slate-600 rounded-md w-fit">`;

if (profileRegex.test(code)) {
  code = code.replace(profileRegex, profileReplacement);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Successfully patched profile selection with email.");
} else {
  console.log("Profile selection regex did not match");
}
