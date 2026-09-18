const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<p className="text-sm text-slate-700 leading-relaxed font-medium">\n\s*\{currentInstructor\?\.competencia\}\n\s*<\/p>\n\s*<\/div>\n\s*<\/div>/;

const replacement = `<p className="text-sm text-slate-700 leading-relaxed font-medium">
                  {currentInstructor?.competencia}
                </p>
              </div>
              <div className="mt-1">
                 <p className="text-xs text-sena font-medium">{currentInstructor?.correo}</p>
              </div>
            </div>`;

if (regex.test(code)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Successfully patched header.");
} else {
  console.log("Regex did not match header");
}
