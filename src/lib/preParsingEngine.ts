// src/lib/preParsingEngine.ts (Actualizado)
import * as XLSX from 'xlsx';
import { ParseResult, ValidationError, InstructorMaestro } from '../types';

const EMAIL_INSTRUCTOR_REGEX = /^[\w\.-]+@(sena\.edu\.co|misena\.edu\.co|gmail\.com)$/;
// Validación genérica para correos de aprendices (permite cualquier proveedor: gmail, hotmail, outlook, yahoo, etc.)
const EMAIL_APRENDIZ_REGEX = /^[\w\.-]+@[\w\.-]+\.\w+$/;

const ESTADOS_VALIDOS_MODAL = ['En Formación', 'Retiro Voluntario', 'Cancelado', 'Aplazado', 'Trasladado', 'Desercion', 'En formacion'];
const TIPOS_DOC_VALIDOS = ['CC', 'TI', 'CE', 'PP', 'PPT'];

const sanitizarTextoPreParser = (texto: string): string => {
  if (!texto) return '';
  const limpio = String(texto).trim().replace(/_/g, ' ');
  return limpio
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const procesarArchivoExcelPreParsing = async (file: File, instructoresExistentes: InstructorMaestro[]): Promise<ParseResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const errores: ValidationError[] = [];
        const instructoresProcesados: InstructorMaestro[] = [];
        const aprendicesProcesados: any[] = [];

        // 1. Procesar Hoja 'Aprendices'
        const hojaAprendicesName = workbook.SheetNames.find(s => s.toLowerCase().includes('aprendiz')) || workbook.SheetNames[2] || workbook.SheetNames[0];
        const sheetAprendices = workbook.Sheets[hojaAprendicesName];
        if (sheetAprendices) {
          const rowsAprendices: any[] = XLSX.utils.sheet_to_json(sheetAprendices);
          rowsAprendices.forEach((row, index) => {
            const filaNum = index + 2;
            const nombres = sanitizarTextoPreParser(row['nombres'] || row['nombre'] || '');
            const apellidos = sanitizarTextoPreParser(row['apellidos'] || row['apellido'] || '');
            const tipoDoc = String(row['tipo_documento'] || row['tipo_doc'] || 'CC').trim().toUpperCase();
            const numDoc = String(row['numero_documento'] || row['documento'] || '').trim();
            const correo = String(row['correo_electronico'] || row['correo'] || row['email'] || '').trim().toLowerCase();
            const estadoRaw = String(row['estado'] || row['estado_aprendiz'] || 'En Formación').trim();
            const estado = estadoRaw === 'En formacion' ? 'En Formación' : estadoRaw;

            if (!TIPOS_DOC_VALIDOS.includes(tipoDoc)) {
              errores.push({ fila: filaNum, seccion: 'Aprendiz', campo: 'tipo_documento', mensaje: `Tipo de documento inválido: "${tipoDoc}".` });
            }
            if (!numDoc) {
              errores.push({ fila: filaNum, seccion: 'Aprendiz', campo: 'numero_documento', mensaje: `El número de documento es obligatorio.` });
            }
            if (!ESTADOS_VALIDOS_MODAL.includes(estado)) {
              errores.push({ fila: filaNum, seccion: 'Aprendiz', campo: 'estado', mensaje: `Estado inválido o mal escrito: "${estado}".` });
            }
            // FLEXIBILIZACIÓN: Se permite cualquier formato de correo válido para aprendices
            if (correo && !EMAIL_APRENDIZ_REGEX.test(correo)) {
              errores.push({ fila: filaNum, seccion: 'Aprendiz', campo: 'correo_electronico', mensaje: `Estructura de correo electrónico inválida: "${correo}".` });
            }

            aprendicesProcesados.push({
              tipo_documento: tipoDoc,
              numero_documento: numDoc,
              nombres,
              apellidos,
              correo: correo,
              telefono: String(row['telefono'] || ''),
              estado: ESTADOS_VALIDOS_MODAL.includes(estado) ? (estado === 'En formacion' ? 'En Formación' : estado) : 'En Formación',
              registros: {}
            });
          });
        }

        // 2. Procesar Hoja 'Equipo_Ejecutor' (Instructores con restricción estricta de correo)
        const hojaEquipoName = workbook.SheetNames.find(s => s.toLowerCase().includes('equipo') || s.toLowerCase().includes('instructor')) || workbook.SheetNames[1];
        const sheetEquipo = workbook.Sheets[hojaEquipoName];
        if (sheetEquipo) {
          const rowsEquipo: any[] = XLSX.utils.sheet_to_json(sheetEquipo);
          rowsEquipo.forEach((row, index) => {
            const filaNum = index + 2;
            const seleccionInstructor = String(row['nombre_del_instructor'] || row['nombre'] || '').trim();
            const correoGoogle = String(row['correo_google'] || '').trim().toLowerCase();
            const correoSena = String(row['correo_institucional_sena'] || row['correo_institucional'] || '').trim().toLowerCase();

            // RESTRICCIÓN ESTRICTA EXCLUSIVA PARA INSTRUCTORES
            if (correoGoogle && !EMAIL_INSTRUCTOR_REGEX.test(correoGoogle)) {
              errores.push({ fila: filaNum, seccion: 'Instructor', campo: 'correo_google', mensaje: `El correo Google del instructor debe ser @gmail.com autorizado: "${correoGoogle}".` });
            }
            if (correoSena && !EMAIL_INSTRUCTOR_REGEX.test(correoSena)) {
              errores.push({ fila: filaNum, seccion: 'Instructor', campo: 'correo_institucional_sena', mensaje: `El correo institucional del instructor debe ser @sena.edu.co o @misena.edu.co: "${correoSena}".` });
            }

            if (seleccionInstructor.toLowerCase().includes('instructor nuevo') || seleccionInstructor.includes('+ Instructor Nuevo')) {
              const docNuevo = String(row['nuevo_documento'] || row['numero_documento'] || '').trim();
              const nombreNuevo = sanitizarTextoPreParser(row['nuevo_nombre'] || row['nombre_del_instructor'] || '');

              if (!docNuevo || !nombreNuevo) {
                errores.push({ fila: filaNum, seccion: 'Instructor', campo: 'Instructor Nuevo', mensaje: `Se seleccionó Instructor Nuevo pero faltan Documento o Nombre.` });
              }

              instructoresProcesados.push({
                numeroDocumento: docNuevo,
                nombreCompleto: nombreNuevo,
                correoSena: correoSena,
                correoGmail: correoGoogle,
                activo: true
              });
            } else if (seleccionInstructor) {
              const instructorEncontrado = instructoresExistentes.find(i => i.nombreCompleto.toLowerCase() === seleccionInstructor.toLowerCase());
              if (!instructorEncontrado) {
                instructoresProcesados.push({
                  numeroDocumento: String(row['numero_documento'] || '000000'),
                  nombreCompleto: sanitizarTextoPreParser(seleccionInstructor),
                  correoSena: correoSena,
                  correoGmail: correoGoogle,
                  activo: true
                });
              } else {
                instructoresProcesados.push(instructorEncontrado);
              }
            }
          });
        }

        resolve({
          valido: errores.length === 0,
          errores,
          instructores: instructoresProcesados,
          aprendices: aprendicesProcesados
        });

      } catch (error) {
        resolve({
          valido: false,
          errores: [{ fila: 0, seccion: 'Ficha', campo: 'Archivo', mensaje: 'Error al leer el archivo Excel. Verifique que el formato sea correcto.' }],
          instructores: [],
          aprendices: []
        });
      }
    };

    reader.readAsArrayBuffer(file);
  });
};
