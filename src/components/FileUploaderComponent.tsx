// src/components/FileUploaderComponent.tsx
import React, { useState } from 'react';
import { procesarArchivoExcel } from '../utils/preParsingEngine';
import { ParseResult, Instructor } from '../types';
import { db } from '../firebaseConfig';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';

interface Props {
  instructoresCatalogo: Instructor[];
  onUploadSuccess: () => void;
}

export const FileUploaderComponent: React.FC<Props> = ({ instructoresCatalogo, onUploadSuccess }) => {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [resultadoParse, setResultadoParse] = useState<ParseResult | null>(null);
  const [analizando, setAnalizando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setArchivo(file);
      setAnalizando(true);

      const resultado = await procesarArchivoExcel(file, instructoresCatalogo);
      setResultadoParse(resultado);
      setAnalizando(false);
    }
  };

  const handleCommitToFirebase = async () => {
    if (!resultadoParse || !resultadoParse.valido) return;
    setGuardando(true);

    try {
      // Guardar instructores nuevos en el catálogo general
      for (const inst of resultadoParse.instructores) {
        if (!inst.id) {
          const instRef = doc(collection(db, 'instructores_maestros'));
          await setDoc(instRef, inst);
        }
      }

      // Guardar Ficha y Aprendices
      await addDoc(collection(db, 'fichas'), {
        fechaCreacion: new Date().toISOString(),
        aprendices: resultadoParse.aprendices,
        instructores: resultadoParse.instructores
      });

      alert('¡Cargue exitoso! Datos validados y guardados correctamente.');
      onUploadSuccess();
    } catch (error) {
      console.error('Error al guardar en Firebase:', error);
      alert('Ocurrió un error al guardar en la base de datos.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md space-y-4">
      <h2 className="text-xl font-bold text-gray-800">Pasarela de Carga Inteligente de Fichas</h2>
      
      <input 
        type="file" 
        accept=".xlsx, .xls" 
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
      />

      {analizando && <p className="text-blue-600 animate-pulse">Analizando y sanitizando archivo en memoria...</p>}

      {resultadoParse && (
        <div className="mt-4">
          {resultadoParse.valido ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-green-800 font-bold text-lg">🟢 Archivo Aprobado y Limpio</span>
                <p className="text-sm text-green-600">Se han validado los aprendices e instructores correctamente.</p>
              </div>
              <button 
                onClick={handleCommitToFirebase}
                disabled={guardando}
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition"
              >
                {guardando ? 'Guardando...' : 'Confirmar y Guardar en Base de Datos'}
              </button>
            </div>
          ) : (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <span className="text-red-800 font-bold text-lg">🔴 Archivo Rechazado (Errores Encontrados)</span>
              <p className="text-sm text-red-600 mb-3">Corrija las siguientes celdas en su archivo Excel y vuelva a cargarlo:</p>
              <ul className="max-h-48 overflow-y-auto space-y-2 text-xs">
                {resultadoParse.errores.map((err, idx) => (
                  <li key={idx} className="bg-white p-2 rounded border border-red-100 text-red-700">
                    <strong>Fila {err.fila}</strong> [{err.seccion} - {err.campo}]: {err.mensaje}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
