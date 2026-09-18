const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<li key=\{student\.numero_documento\} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200 shadow-sm">\n\s*<div className="flex flex-col">\n\s*<span className="text-sm font-semibold text-slate-900">\{student\.nombres\} \{student\.apellidos\}<\/span>\n\s*<span className="text-xs text-slate-500">\{student\.correo_electronico\}<\/span>\n\s*<\/div>\n\s*<span className="text-xs font-bold bg-red-100 text-red-700 px-2\.5 py-1 rounded-md">\n\s*\{student\.fallasAcumuladas\} Fallas\n\s*<\/span>\n\s*<\/li>/;

const replacement = `<div key={student.numero_documento} className="bg-white rounded-lg border border-red-200 shadow-sm overflow-hidden">
                              <div className="flex items-center justify-between p-3">
                                <div className="flex flex-col">
                                  <span className="text-sm font-semibold text-slate-900">{student.nombres} {student.apellidos}</span>
                                  <span className="text-xs text-slate-500">{student.correo_electronico}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs font-bold bg-red-100 text-red-700 px-2.5 py-1 rounded-md">
                                    {student.fallasAcumuladas} Fallas
                                  </span>
                                  <button 
                                    onClick={() => setSelectedTemplateStudent(selectedTemplateStudent === student.numero_documento ? null : student.numero_documento)}
                                    className="text-sena hover:text-sena-dark text-sm font-medium flex items-center gap-1 bg-sena-light px-2 py-1 rounded transition-colors"
                                  >
                                    <FileText className="w-4 h-4" />
                                    Plantilla
                                  </button>
                                </div>
                              </div>
                              
                              {selectedTemplateStudent === student.numero_documento && (
                                <div className="border-t border-slate-100 bg-slate-50 p-4">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vista previa del correo</span>
                                    <button 
                                      onClick={() => copyToClipboard(generateAbsenceTemplate(student))}
                                      className="text-slate-500 hover:text-slate-800 text-xs flex items-center gap-1 transition-colors"
                                    >
                                      {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-sena" /> : <Copy className="w-3.5 h-3.5" />}
                                      {copied ? 'Copiado' : 'Copiar'}
                                    </button>
                                  </div>
                                  <pre className="text-xs text-slate-600 whitespace-pre-wrap font-sans bg-white p-3 rounded border border-slate-200">
                                    {generateAbsenceTemplate(student)}
                                  </pre>
                                </div>
                              )}
                            </div>`;

if (regex.test(code)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Successfully patched inasistencias UI.");
} else {
  console.log("Regex did not match inasistencias UI");
}
