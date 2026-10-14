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
  correo_google?: string;
  rol?: string; // Ejemplo: 'Instructor Lider', 'Instructor / Tutor', 'Coordinador Academico'
  es_lider?: boolean;
  dia?: string;
  fecha_fin?: string | null;
}

export type UserRole = 'ADMIN' | 'COORDINADOR' | 'INSTRUCTOR_LIDER' | 'INSTRUCTOR' | 'INVITADO';

/**
 * Determina el rol estructurado del usuario evaluando de forma global en todas las fichas del complejo
 */
export const getUserSystemRoleGlobal = (user: User | null, fichasDataMap: Record<string, any> = {}): UserRole => {
  if (!user || !user.email) return 'INVITADO';
  const email = user.email.toLowerCase().trim();

  // 1. Validar Administrador Global
  if (email === ADMIN_EMAIL.toLowerCase()) return 'ADMIN';
  
  // 2. Validar Coordinador Académico por correo institucional o patrón
  if (email.includes('coordinacion') || email === 'coordinacion.academica@sena.edu.co') {
    return 'COORDINADOR';
  }

  // 3. Buscar de forma global en todas las fichas del diccionario
  for (const fichaId of Object.keys(fichasDataMap)) {
    const ficha = fichasDataMap[fichaId];
    const equipo = ficha.equipo_instructores || [];

    for (const inst of equipo) {
      const instEmails = [
        inst.correo_institucional_sena, 
        inst.correo_institucional, 
        inst.correo_gmail, 
        inst.correo,
        inst.correo_google
      ];
      const matchesEmail = instEmails.some(e => e && e.toLowerCase().trim() === email);

      if (matchesEmail) {
        if (inst.rol === 'Coordinador Academico') return 'COORDINADOR';
        if (inst.rol === 'Instructor Lider' || inst.es_lider === true) return 'INSTRUCTOR_LIDER';
        return 'INSTRUCTOR';
      }
    }
  }

  return 'INVITADO';
};

/**
 * Función auxiliar compatible con llamadas individuales basadas en un solo equipo de instructores
 */
export const getUserSystemRole = (user: User | null, equipoInstructores: Instructor[] = []): UserRole => {
  if (!user || !user.email) return 'INVITADO';
  const email = user.email.toLowerCase().trim();

  if (email === ADMIN_EMAIL.toLowerCase()) return 'ADMIN';
  
  if (email.includes('coordinacion') || email === 'coordinacion.academica@sena.edu.co') {
    return 'COORDINADOR';
  }

  const instEncontrado = equipoInstructores.find(inst => {
    const instEmails = [
      inst.correo_institucional_sena, 
      inst.correo_institucional, 
      inst.correo_gmail, 
      inst.correo,
      inst.correo_google
    ];
    return instEmails.some(e => e && e.toLowerCase().trim() === email);
  });

  if (instEncontrado) {
    if (instEncontrado.rol === 'Coordinador Academico') return 'COORDINADOR';
    if (instEncontrado.rol === 'Instructor Lider' || instEncontrado.es_lider === true) return 'INSTRUCTOR_LIDER';
    return 'INSTRUCTOR';
  }

  return 'INVITADO';
};

/**
 * Valida si el usuario actual tiene privilegios de gestión global o en ficha
 */
export const canManageFichasAndSheets = (user: User | null, equipoInstructores: Instructor[] = []): boolean => {
  const role = getUserSystemRole(user, equipoInstructores);
  return role === 'ADMIN' || role === 'COORDINADOR' || role === 'INSTRUCTOR_LIDER';
};
