import * as XLSX from 'xlsx';
import { DIAS_SEMANA } from '../types';

export function normalizarEstadoAprendiz(estadoRaw: string): string {
  if (!estadoRaw) return 'En Formación';
  const limpio = String(estadoRaw).trim().toLowerCase();
  
  if (limpio.includes('formacion') || limpio.includes('formación')) return 'En Formación';
  if (limpio.includes('retiro')) return 'Retiro Voluntario';
  if (limpio.includes('cancelado')) return 'Cancelado';
  if (limpio.includes('aplazado')) return 'Aplazado';
  if (limpio.includes('trasladado')) return 'Trasladado';
  if (limpio.includes('deserc') || limpio.includes('deserción')) return 'Deserción';

  return 'En Formación';
}

export function normalizarAsistencia(valor: any): string {
  if (!valor) return '';
  const val = String(valor).trim().toLowerCase();
  if (val === 'falta' || val === 'x') return 'X';
  if (val === 'evento' || val === 'excusa') return 'Excusa';
  if (val === 'tarde') return 'Tarde';
  if (val === 'presente') return '';
  return '';
}

export async function procesarPlantillaConfiguracionPreParsing(file: File, currentFicha: string): Promise<any> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const errores: string[] = [];

        // 1. Validar Ficha
        const sheetFicha = workbook.Sheets['Ficha'];
        if (!sheetFicha) {
          return resolve({ success: false, message: 'La hoja "Ficha" es obligatoria en la plantilla.' });
        }
        const rowsFicha: any[] = XLSX.utils.sheet_to_json(sheetFicha);
        const fichaArchivo = String(rowsFicha[0]?.ficha_de_caracterizacion || '').trim();

        if (fichaArchivo && fichaArchivo !== String(currentFicha).trim()) {
          return resolve({
            success: false,
            message: `El número de ficha del archivo (${fichaArchivo}) no coincide con la ficha activa (${currentFicha}). Proceso bloqueado.`
          });
        }

        // 2. Procesar Aprendices (Ignorando filas de ejemplo)
        const sheetAprendices = workbook.Sheets['Aprendices'];
        const aprendicesProcesados: any[] = [];
        if (sheetAprendices) {
          const rows: any[] = XLSX.utils.sheet_to_json(sheetAprendices);
          rows.forEach((row, idx) => {
            const tipoDoc = String(row['tipo_documento'] || '').trim().toUpperCase();
            if (tipoDoc === 'EJEMPLO' || String(row['nombres']).includes('EJEMPLO')) return;

            const numDoc = String(row['numero_documento'] || '').trim();
            const nombres = String(row['nombres'] || '').trim().toUpperCase();
            const apellidos = String(row['apellidos'] || '').trim().toUpperCase();
            const correo = String(row['correo_electronico'] || '').trim().toLowerCase();
            const estadoNormalizado = normalizarEstadoAprendiz(row['estado']);

            if (!numDoc) errores.push(`Fila ${idx + 2} [Aprendiz]: Número de documento obligatorio.`);
            if (!nombres) errores.push(`Fila ${idx + 2} [Aprendiz]: Nombres obligatorios.`);

            aprendicesProcesados.push({
              tipo_documento: tipoDoc || 'CC',
              numero_documento: numDoc,
              nombres,
              apellidos,
              correo, // Aprendices aceptan cualquier servidor
              telefono: String(row['telefono'] || ''),
              estado: estadoNormalizado,
              registros: {}
            });
          });
        }

        // 3. Procesar Equipo Ejecutor con validación estricta de dominios y control anti-traslapes
        const sheetEquipo = workbook.Sheets['Equipo_Ejecutor'];
        const instructoresProcesados: any[] = [];
        const diasAsignados = new Set<string>();

        if (sheetEquipo) {
          const rows: any[] = XLSX.utils.sheet_to_json(sheetEquipo);
          rows.forEach((row, idx) => {
            const instructorName = String(row['nombre_del_instructor'] || '').trim();
            if (instructorName.includes('EJEMPLO')) return;

            const correoGoogle = String(row['correo_google'] || '').trim().toLowerCase();
            const correoSena = String(row['correo_institucional_sena'] || '').trim().toLowerCase();
            const diaRaw = String(row['dia'] || '').trim();
            const diaFormateado = diaRaw.charAt(0).toUpperCase() + diaRaw.slice(1).toLowerCase();

            if (correoGoogle && !correoGoogle.endsWith('@gmail.com')) {
              errores.push(`Fila ${idx + 2} [Instructor]: El correo Google debe terminar en @gmail.com.`);
            }
            if (correoSena && !correoSena.endsWith('@sena.edu.co')) {
              errores.push(`Fila ${idx + 2} [Instructor]: El correo institucional debe terminar en @sena.edu.co.`);
            }

            if (diaFormateado && DIAS_SEMANA.includes(diaFormateado as any)) {
              if (diasAsignados.has(diaFormateado)) {
                errores.push(`[Conflicto de Programación - Fila ${idx + 2}]: Se detectó un traslape en el día "${diaFormateado}" asignado a múltiples instructores.`);
              } else {
                diasAsignados.add(diaFormateado);
              }
            }

            instructoresProcesados.push({
              competencia: String(row['competencia'] || ''),
              nombre_del_instructor: instructorName,
              correo_google: correoGoogle,
              correo_institucional_sena: correoSena,
              dia: diaFormateado,
              rol: String(row['rol'] || 'Instructor / Tutor'),
              fecha_de_inicio: String(row['fecha_de_inicio'] || '')
            });
          });
        }

        if (errores.length > 0) {
          return resolve({ success: false, message: 'Se encontraron errores de validación en el archivo.', errors: errores });
        }

        resolve({
          success: true,
          message: 'Archivo validado y normalizado correctamente.',
          counts: { aprendices: aprendicesProcesados.length, instructores: instructoresProcesados.length },
          data: {
            ficha_de_caracterizacion: currentFicha,
            asistencias_aprendices: aprendicesProcesados,
            equipo_instructores: instructoresProcesados
          }
        });
      } catch (err: any) {
        resolve({ success: false, message: `Error al procesar el archivo Excel: ${err.message}` });
      }
    };
    reader.readAsArrayBuffer(file);
  });
}
