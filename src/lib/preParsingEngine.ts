// src/lib/preParsingEngine.ts
import * as XLSX from 'xlsx';
import { ParseResult, ValidationError, Instructor, AprendizImport, EstadoAprendiz, TipoDocumento } from '../types'; // O ajusta la ruta a tu archivo types si está en otra parte

const EMAIL_REGEX = /^[\w\.-]+@(sena\.edu\.co|misena\.edu\.co|gmail\.com)$/;
const ESTADOS_VALIDOS: EstadoAprendiz[] = ['En Formación', 'Retiro Voluntario', 'Cancelado', 'Aplazado', 'Trasladado', 'Deserción'];
const TIPOS_DOC_VALIDOS: TipoDocumento[] = ['CC', 'TI', 'CE', 'PP', 'PPT'];

const sanitizarTexto = (texto: string): string => {
  if (!texto) return '';
  const limpio = String(texto).trim().replace(/_/g, ' ');
  return limpio
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const procesarArchivoExcel = async (file: File, instructoresExistentes: Instructor[]): Promise<ParseResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const errores: ValidationError[] = [];
        const instructoresProcesados: Instructor[] = [];
        const aprendicesProcesados: AprendizImport[] = [];

        // 1. Procesar Hoja 'Aprendices'
        const hojaAprendicesName = workbook.SheetNames.find(s => s.toLowerCase().includes('aprendiz')) || workbook.SheetNames[2];
        const sheetAprendices = workbook.Sheets[hojaAprendicesName];
        const rowsAprendices: any[] = XLSX.utils.sheet_to_json(sheetAprendices);

        rowsAprendices.forEach((row, index) => {
          const filaNum = index + 2;
          const nombres = sanitizarTexto(row['nombres']);
          const apellidos = sanitizarTexto(row['apellidos']);
          const tipoDoc = String(row['tipo_documento'] || '').trim().toUpperCase() as TipoDocumento;
          const numDoc = String(row['numero_documento'] || '').trim();
          const correo = String(row['correo_electronico'] || '').trim();
          const estado = String(row['estado'] || '').trim() as EstadoAprendiz;

          if (!TIPOS_DOC_VALIDOS.includes(tipoDoc)) {
            errores.push({ fila: filaNum, seccion: 'Aprendiz', campo: 'tipo_documento', mensaje: `Tipo de documento inválido: "${tipoDoc}".` });
          }
          if (!numDoc) {
            errores.push({ fila: filaNum, seccion: 'Aprendiz', campo: 'numero_documento', mensaje: `El número de documento es obligatorio.` });
          }
          if (!ESTADOS_VALIDOS.includes(estado)) {
            errores.push({ fila: filaNum, seccion: 'Aprendiz', campo: 'estado', mensaje: `Estado inválido o mal escrito: "${estado}".` });
          }
          if (correo && !EMAIL_REGEX.test(correo)) {
            errores.push({ fila: filaNum, seccion: 'Aprendiz', campo: 'correo_electronico', mensaje: `Dominio de correo no permitido: "${correo}".` });
          }

          aprendicesProcesados.push({
            tipoDocumento: tipoDoc,
            numeroDocumento: numDoc,
            nombres,
            apellidos,
            correoElectronico: correo,
            telefono: String(row['telefono'] || ''),
            estado: ESTADOS_VALIDOS.includes(estado) ? estado : 'En Formación'
          });
        });

        // 2. Procesar Hoja 'Equipo_Ejecutor' (Instructores)
        const hojaEquipoName = workbook.SheetNames.find(s => s.toLowerCase().includes('equipo') || s.toLowerCase().includes('instructor')) || workbook.SheetNames[1];
        const sheetEquipo = workbook.Sheets[hojaEquipoName];
        const rowsEquipo: any[] = XLSX.utils.sheet_to_json(sheetEquipo);

        rowsEquipo.forEach((row, index) => {
          const filaNum = index + 2;
          const seleccionInstructor = String(row['nombre_del_instructor'] || '').trim();

          if (seleccionInstructor.includes('Instructor Nuevo')) {
            const docNuevo = String(row['nuevo_documento'] || '').trim();
            const nombreNuevo = sanitizarTexto(row['nuevo_nombre'] || '');
            const correoSenaNuevo = String(row['nuevo_correo_sena'] || '').trim();
            const correoGmailNuevo = String(row['nuevo_correo_gmail'] || '').trim();

            if (!docNuevo || !nombreNuevo) {
              errores.push({ fila: filaNum, seccion: 'Instructor', campo: 'Instructor Nuevo', mensaje: `Faltan Documento o Nombre para el nuevo instructor.` });
            }
            if (!EMAIL_REGEX.test(correoSenaNuevo)) {
              errores.push({ fila: filaNum, seccion: 'Instructor', campo: 'nuevo_correo_sena', mensaje: `Correo SENA inválido: "${correoSenaNuevo}".` });
            }

            instructoresProcesados.push({
              numeroDocumento: docNuevo,
              nombreCompleto: nombreNuevo,
              correoSena: correoSenaNuevo,
              correoGmail: correoGmailNuevo,
              activo: true
            });
          } else {
            const instructorEncontrado = instructoresExistentes.find(i => i.nombreCompleto.toLowerCase() === seleccionInstructor.toLowerCase());
            if (!instructorEncontrado) {
              errores.push({ fila: filaNum, seccion: 'Instructor', campo: 'nombre_del_instructor', mensaje: `El instructor "${seleccionInstructor}" no existe en el catálogo.` });
            } else {
              instructoresProcesados.push(instructorEncontrado);
            }
          }
        });

        resolve({
          valido: errores.length === 0,
          errores,
          instructores: instructoresProcesados,
          aprendices: aprendicesProcesados
        });

      } catch (error) {
        resolve({
          valido: false,
          errores: [{ fila: 0, seccion: 'Ficha', campo: 'Archivo', mensaje: 'Error al leer el archivo Excel. Verifique el formato.' }],
          instructores: [],
          aprendices: []
        });
      }
    };

    reader.readAsArrayBuffer(file);
  });
};
