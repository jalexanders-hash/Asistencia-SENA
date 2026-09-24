<span className="font-normal text-slate-500 block text-[11px]">{student.nombres}</span>
                          {student.correo && <span className="text-[10px] text-slate-400 block">{student.correo}</span>}
                        </td>
                        <td className="p-3 text-center font-mono text-slate-500">
                          {student.numero_documento}
                        </td>
                        <td className="p-3 text-center font-bold">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${student.fallasAcumuladas > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-sena'}`}>
                            {student.fallasAcumuladas}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {student.enRiesgo ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-700">
                              <AlertTriangle className="w-3 h-3" /> En Riesgo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3" /> Al Día
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400">
                        No se encontraron aprendices con los filtros seleccionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'asistencia_global' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-800 border-b pb-3">Registro de Asistencia Global</h2>
          <p className="text-sm text-slate-600">
            Fechas registradas en la ficha: <span className="font-bold text-slate-800">{courseData.fechas_asistencia.length}</span> sesiones.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">APRENDIZ</th>
                  {currentInstructorDates.map((date: string) => (
                    <th key={date} className="p-2 text-center font-mono whitespace-nowrap">
                      {formatDateForDisplay(date)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {studentsWithStats.map((student) => (
                  <tr key={student.numero_documento} className="hover:bg-slate-50/80">
                    <td className="p-3 font-bold text-slate-800 whitespace-nowrap">
                      {student.apellidos} {student.nombres}
                    </td>
                    {currentInstructorDates.map((date: string) => {
                      const status = student.registros[date as keyof typeof student.registros] || '•';
                      return (
                        <td key={date} className="p-2 text-center font-mono">
                          <span className={`inline-block w-6 h-6 leading-6 rounded text-[11px] font-bold ${
                            status === 'X' ? 'bg-red-100 text-red-700' :
                            status === 'Tarde' ? 'bg-amber-100 text-amber-700' :
                            status === 'Excusa' ? 'bg-blue-100 text-blue-700' : 'text-slate-300'
                          }`}>
                            {status === 'X' ? 'F' : status === 'Tarde' ? 'T' : status === 'Excusa' ? 'E' : '•'}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'alertas' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-800 border-b pb-3">Configuración de Alertas Académicas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h3 className="font-bold text-slate-800 text-sm">Límite de Inasistencias por Instructor</h3>
              <p className="text-xs text-slate-500">Define a partir de cuántas faltas acumuladas un aprendiz es marcado en estado de riesgo.</p>
              <div className="flex items-center gap-3 pt-2">
                <input 
                  type="number" 
                  min="1" 
                  max="20" 
                  value={limiteInasistencias} 
                  onChange={(e) => setLimiteInasistencias(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold bg-white"
                />
                <span className="text-sm font-medium text-slate-700">Faltas acumuladas</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h3 className="font-bold text-slate-800 text-sm">Notificaciones Automáticas (CC)</h3>
              <p className="text-xs text-slate-500">Las alertas y correos de notificación se enviarán con copia directa a tu correo institucional registrado:</p>
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-mono text-emerald-800 font-bold">
                {correoInstructorActual}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reportes' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-800 border-b pb-3">Reportes y Exportación de Datos</h2>
          <p className="text-sm text-slate-600">Genera reportes formales en formato PDF listos para impresión o gestión administrativa con Coordinación Académica.</p>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-sena text-white rounded-xl text-sm font-semibold hover:bg-sena-dark shadow-sm transition-colors"
            >
              <FileText className="w-4 h-4" /> Generar Reporte PDF / Excel
            </button>
          </div>
        </div>
      )}

      </main>

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 w-full text-center text-xs text-slate-400 border-t border-slate-200 pt-6">
        <p>SENA - Centro Agroindustrial, Pecuario y Turístico | Sistema de Gestión Académica e Inasistencias</p>
      </footer>

      {/* Modales condicionales */}
      {isSheetsModalOpen && (
        <SheetsTemplateModal isOpen={isSheetsModalOpen} onClose={() => setIsSheetsModalOpen(false)} />
      )}

      {showExportModal && (
        <ExportReportModal 
          isOpen={showExportModal} 
          onClose={() => setShowExportModal(false)} 
          courseData={courseData}
          students={studentsWithStats}
        />
      )}

      {showAttendanceModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-base">Control de Asistencia Diaria</h3>
              <button onClick={() => setShowAttendanceModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-grow">
              <div className="flex items-center gap-4">
                <label className="text-xs font-bold text-slate-700">Fecha de la sesión:</label>
                <input 
                  type="date" 
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-medium bg-white"
                />
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Aprendiz</th>
                      <th className="p-3 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {courseData.asistencias_aprendices.map((student) => (
                      <tr key={student.numero_documento} className="hover:bg-slate-50">
                        <td className="p-3 font-medium text-slate-800">{student.apellidos} {student.nombres}</td>
                        <td className="p-3 text-center">
                          <select 
                            value={tempRecords[student.numero_documento] || 'Presente'}
                            onChange={(e) => setTempRecords({ ...tempRecords, [student.numero_documento]: e.target.value })}
                            className="border border-slate-300 rounded px-2 py-1 text-xs font-medium bg-white"
                          >
                            <option value="Presente">Presente</option>
                            <option value="X">Falla (Inasistencia)</option>
                            <option value="Tarde">Llegada Tarde</option>
                            <option value="Excusa">Excusa Justificada</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button 
                onClick={() => setShowAttendanceModal(false)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveAttendance}
                disabled={isSavingAttendance}
                className="px-4 py-2 bg-sena text-white rounded-lg text-sm font-semibold hover:bg-sena-dark flex items-center gap-2"
              >
                {isSavingAttendance && <Loader2 className="w-4 h-4 animate-spin" />}
                Guardar Asistencia
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
