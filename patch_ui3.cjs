const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /                      <\/div>\n                    <\/div>\n                  <\/div>\n                \}\)\}\n              <\/div>\n\n              \{selectedReportType === 'asistencia_diaria_acumulada' && \([\s\S]*?            <\/div>\n\n            <div className="p-4 border-t border-slate-200 bg-white flex justify-end gap-3 shadow-\[0_-4px_6px_-1px_rgba\(0,0,0,0\.02\)\]">/;

const filterCode = `                      </div>
                    </div>

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
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-white flex justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">`;

if (regex.test(code)) {
  const newCode = code.replace(regex, filterCode);
  fs.writeFileSync('src/App.tsx', newCode);
  console.log("Successfully patched App.tsx");
} else {
  console.log("Regex did not match");
}
