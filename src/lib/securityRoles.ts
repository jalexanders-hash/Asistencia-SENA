// src/lib/securityRoles.ts
import { User } from 'firebase/auth';

const ADMIN_EMAIL = "jalexanders@gmail.com";

export interface Instructor {
  nombre_del_instructor: string;
  competencia: string;
  correo_institucional_sena?: string;
  correo_institucional?: string;
  correo_gmail?: string;
  correo?: string;
  rol?: string; // Ejemplo: 'Instructor Lider', 'Instructor / Tutor', 'Coordinador Academico'
  es_lider?: boolean;
  dia?: string;
  fecha_fin?: string | null;
}

export type UserRole = 'ADMIN' | 'COORDINADOR' | 'INSTRUCTOR_LIDER' | 'INSTRUCTOR' | 'INVITADO';

/**
 * Determina el rol estructurado del usuario actual basándose en su correo y metadatos de la ficha
 */
export const getUserSystemRole = (user: User | null, equipoInstructores: Instructor[] = []): UserRole => {
  if (!user || !user.email) return 'INVITADO';
  const email = user.email.toLowerCase().trim();

  // 1. Validar Administrador Global
  if (email === ADMIN_EMAIL.toLowerCase()) return 'ADMIN';
  
  // 2. Validar Coordinador Académico (por patrón en el correo institucional o asignación explícita en rol)
  if (
    email.includes('coordinacion') || 
    email === 'coordinacion.academica@sena.edu.co' ||
    equipoInstructores.some(inst => {
      const instEmails = [inst.correo_institucional_sena, inst.correo_institucional, inst.correo_gmail, inst.correo];
      const matchesEmail = instEmails.some(e => e && e.toLowerCase().trim() === email);
      return matchesEmail && inst.rol === 'Coordinador Academico';
    })
  ) {
    return 'COORDINADOR';
  }

  // 3. Validar Instructor Líder en la ficha actual
  const esLider = equipoInstructores.some(inst => {
    const instEmails = [
      inst.correo_institucional_sena, 
      inst.correo_institucional, 
      inst.correo_gmail, 
      inst.correo
    ];
    const matchesEmail = instEmails.some(e => e && e.toLowerCase().trim() === email);
    return matchesEmail && (inst.rol === 'Instructor Lider' || inst.es_lider === true);
  });

  if (esLider) return 'INSTRUCTOR_LIDER';

  // 4. Validar Instructor Regular del equipo ejecutor
  const esRegular = equipoInstructores.some(inst => {
    const instEmails = [
      inst.correo_institucional_sena, 
      inst.correo_institucional, 
      inst.correo_gmail, 
      inst.correo
    ];
    return instEmails.some(e => e && e.toLowerCase().trim() === email);
  });

  return esRegular ? 'INSTRUCTOR' : 'INVITADO';
};

/**
 * Valida si el usuario actual tiene privilegios de gestión (crear fichas, cargar plantillas de Sheets, etc.)
 */
export const canManageFichasAndSheets = (user: User | null, equipoInstructores: Instructor[] = []): boolean => {
  const role = getUserSystemRole(user, equipoInstructores);
  return role === 'ADMIN' || role === 'COORDINADOR' || role === 'INSTRUCTOR_LIDER';
};
