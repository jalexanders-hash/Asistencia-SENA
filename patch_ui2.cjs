const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /(<p className="text-sm text-slate-500 mt-1">\s*\{report\.descripcion\}\s*<\/p>\s*<\/div>\s*<\/div>\s*)(<\/div>\s*\}\)\}\s*<\/div>\s*)([\s\S]*?)(\s*<\/div>\s*<div className="p-4 border-t border-slate-200 bg-white flex justify-end gap-3)/;

const filterCode = `
                      {selectedReportType === report.id && report.id === 'asistencia_diaria_acumulada' && (
                        <div className="mt-4 p-4 border border-slate-200 rounded-lg bg-white space-y-4 shadow-sm" onClick={e => e.stopPropagation()}>
                          <h4 className="font-semibold text-slate-800 text-sm">Opciones de Filtrado</h4>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">Fecha Inicial</label>
                              <select 
                                value={exportStartDate}
                                onChange={(e) => setExportStartDate(e.target.value)}
                                className="w-full rounded-lg border-slate-200 text-sm"
                              >
                                {courseData.fechas_asistencia.map(date => (
                                  <option key={date} value={date}>{date}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">Fecha Final</label>
                              <select 
                                value={exportEndDate}
                                onChange={(e) => setExportEndDate(e.target.value)}
                                className="w-full rounded-lg border-slate-200 text-sm"
                              >
                                {courseData.fechas_asistencia.map(date => (
                                  <option key={date} value={date}>{date}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">Modo de Reporte</label>
                              <select 
                                value={exportMode}
                                onChange={(e) => setExportMode(e.target.value as 'acumulado' | 'diario')}
                                className="w-full rounded-lg border-slate-200 text-sm"
                              >
                                <option value="acumulado">Acumulado (Totales)</option>
                                <option value="diario">Detallado Diario</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">Instructor</label>
                              <select 
                                value={exportInstructor}
                                onChange={(e) => setExportInstructor(e.target.value)}
                                className="w-full rounded-lg border-slate-200 text-sm"
                              >
                                <option value="all">Todos los instructores</option>
                                {courseData.equipo_instructores.map((inst, idx) => (
                                  <option key={idx} value={inst.nombre_del_instructor}>{inst.nombre_del_instructor} ({inst.dia})</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      )}
`;

const match = code.match(regex);
if (match) {
  // match[1] = </p> </div> </div>
  // match[2] = </div> })) </div>
  // match[3] = The old filter code (starts with {selectedReportType === 'asistencia_diaria_acumulada' && ...)
  // match[4] = </div> <div className="p-4 border-t border-slate-200 ...
  
  const newCode = code.substring(0, match.index) 
    + match[1] 
    + filterCode 
    + match[2] 
    + match[4] 
    + code.substring(match.index + match[0].length);
    
  fs.writeFileSync('src/App.tsx', newCode);
  console.log("Successfully patched App.tsx");
} else {
  console.log("Regex did not match");
}
