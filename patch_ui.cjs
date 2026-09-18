const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const uiInjection = `
              </div>
              
              {selectedReportType === 'asistencia_diaria_acumulada' && (
                <div className="mt-6 p-4 border border-slate-200 rounded-xl bg-white space-y-4">
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
`;
code = code.replace(/              <\/div>\n            <\/div>\n\n            <div className="p-4 border-t border-slate-200/g, uiInjection + '\n\n            <div className="p-4 border-t border-slate-200');

fs.writeFileSync('src/App.tsx', code);
