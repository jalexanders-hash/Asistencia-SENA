// src/services/auditService.ts
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Tipos de acciones permitidas para estandarizar la auditoría
export type TipoAccionAuditoria = 
  | 'REGISTRAR_ASISTENCIA' 
  | 'MODIFICAR_ASISTENCIA' 
  | 'REEMPLAZAR_INSTRUCTOR' 
  | 'MODIFICAR_FICHA'
  | 'ELIMINAR_REGISTRO';

export interface AuditLogPayload {
  fichaId: string;
  correoUsuario: string;
  tipoAccion: TipoAccionAuditoria;
  detalles: string;
  valorAnterior?: any;
  valorNuevo?: any;
}

/**
 * Registra una traza de auditoría inalterable en la colección 'logs_auditoria' de Firestore.
 * Protegida por las reglas de seguridad para que ningún usuario pueda modificarla o borrarla.
 */
export const registrarLogAuditoria = async (payload: AuditLogPayload): Promise<void> => {
  try {
    // Generar la marca de tiempo exacta con el formato y zona horaria de Colombia (America/Bogota)
    const fechaHoraColombia = new Date().toLocaleString("es-CO", {
      timeZone: "America/Bogota",
      dateStyle: "full",
      timeStyle: "medium"
    });

    const logData = {
      ficha_id: payload.fichaId,
      correo_usuario: payload.correoUsuario.toLowerCase().trim(),
      tipo_accion: payload.tipoAccion,
      detalles: payload.detalles,
      // Serializamos a JSON los objetos para mantener un historial estructurado de cambios
      valor_anterior: payload.valorAnterior ? JSON.stringify(payload.valorAnterior) : null,
      valor_nuevo: payload.valorNuevo ? JSON.stringify(payload.valorNuevo) : null,
      fecha_hora_colombia: fechaHoraColombia,
      timestamp_server: serverTimestamp() // Sello de tiempo oficial e inalterable del servidor de Google
    };

    await addDoc(collection(db, "logs_auditoria"), logData);
  } catch (error) {
    console.error("Error crítico al registrar la auditoría de seguridad:", error);
    // Nota: Dependiendo de tu lógica, puedes decidir si detienes la operación 
    // principal o permites que continúe registrando el error en consola.
  }
};
