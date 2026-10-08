import React, { useState } from 'react';

// Interfaces de datos
interface Instructor {
  id: number;
  nombre: string;
  competencia: string;
  correoGmail: string;
  correoInst: string;
}

interface Asignacion {
  id: number;
  fichaId: string;
  instructorId: number;
  competencia: string;
  diaSemana: string;
  fechaInicio: string;
  fechaFin: string | null;
  registradoPor: string;
}

export const GestionInstructores: React.FC<{ fichaActual: string }> = ({ fichaActual }) => {
  // Estados simulados (puedes conectarlos a tu base de datos Firebase/Firestore o backend actual)
  const [instructores, setInstructores] = useState<Instructor[]>([
    { id: 1, nombre: "Carlos Pérez", competencia: "Producir Documentos", correoGmail: "carlos@gmail.com", correoInst: "cperez@sena.edu.co" }
  ]);

  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([
    { id: 1, fichaId: fichaActual, instructorId: 1, competencia: "Producir Documentos", diaSemana: "Lunes", fechaInicio: "2026-01-10", fechaFin: null, registradoBy: "admin@sena.edu.co" } as any
  ]);

  const [nombre, setNombre] = useState('');
  const [competencia, setCompetencia] = useState('');
  const [correoGmail, setCorreoGmail] = useState('');
  const [correoInst, setCorreoInst] = useState('');
  const [diaSemana, setDiaSemana] = useState('Lunes');
  const [fechaInicio, setFechaInicio] = useState('');
  const [registradoPor, setRegistradoPor] = useState('');

  const handleRegistrarInstructor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !competencia || !correoInst || !fechaInicio || !registradoPor) {
      alert("Por favor completa los campos obligatorios.");
      return;
    }

    // 1. Crear o buscar instructor
    let inst = instructores.find(i => i.correoInst === correoInst);
    let instId = inst ? inst.id : instructores.length + 1;

    if (!inst) {
      setInstructores([...instructores, { id: instId, nombre, competencia, correoGmail, correoInst }]);
    }

    // 2. Cerrar ciclo del instructor anterior (Inmutabilidad histórica)
    // Se actualiza la asignación anterior agregando fecha_fin = fechaInicio - 1 día
    const fechaAnteriorObj = new Date(fechaInicio);
    fechaAnteriorObj.setDate(fechaAnteriorObj.getDate() - 1);
    const fechaFinStr = fechaAnteriorObj.toISOString().split('T')[0];

    const nuevasAsignaciones = asignaciones.map(asig => {
      if (asig.fichaId === fichaActual && asig.competencia === competencia && asig.diaSemana === diaSemana && asig.fechaFin === null) {
        return { ...asig, fechaFin: fechaFinStr };
      }
      return asig;
    });

    // 3. Agregar nueva asignación activa
    const nuevaAsig: Asignacion = {
      id: asignaciones.length + 1,
      fichaId: fichaActual,
      instructorId: instId,
      competencia,
      diaSemana,
      fechaInicio,
      fechaFin: null,
      registradoPor
    };

    setAsignaciones([...nuevasAsignaciones, nuevaAsig]);
    alert("¡Instructor registrado con éxito y historial preservado!");
    
    // Limpiar formulario
    setNombre('');
    setCompetencia('');
    setCorreoGmail('');
    setCorreoInst('');
    setFechaInicio('');
    setRegistradoPor('');
  };

  const asignacionesFicha = asignaciones.filter(a => a.fichaId === fichaActual);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-4 text-gray-800">👥 Equipo Ejecutor - Ficha {fichaActual}</h2>
      
      {/* Tabla de Instructores Actuales e Históricos */}
      <div className="overflow-x-auto mb-8">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Instructor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Competencia</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Día</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inicio</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fin (Histórico)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Correo Inst.</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {asignacionesFicha.map(asig => {
              const inst = instructores.find(i => i.id === asig.instructorId);
              return (
                <tr key={asig.id} className={asig.fechaFin ? "bg-gray-50 text-gray-400" : ""}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{inst?.nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{asig.competencia}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{asig.diaSemana}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{asig.fechaInicio}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{asig.fechaFin || "Activo (Actual)"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{inst?.correoInst}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Formulario de Alta o Reemplazo */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">➕ Registrar o Reemplazar Instructor</h3>
        <form onSubmit={handleRegistrarInstructor} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre completo</label>
            <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Competencia asociada</label>
            <input type="text" value={competencia} onChange={e => setCompetencia(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Correo Gmail / Personal</label>
            <input type="email" value={correoGmail} onChange={e => setCorreoGmail(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Correo institucional</label>
            <input type="email" value={correoInst} onChange={e => setCorreoInst(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Día de la semana</label>
            <select value={diaSemana} onChange={e => setDiaSemana(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2">
              {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha de inicio / reemplazo</label>
            <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" required />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Tu Correo Institucional (Autorización como instructor actual)</label>
            <input type="email" value={registradoPor} onChange={e => setRegistradoPor(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" required />
          </div>
          <div className="md:col-span-2">
            <button type="submit" className="w-full bg-green-600 text-white font-bold py-2 px-4 rounded-md hover:bg-green-700 transition">
              Guardar e Integrar Instructor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
