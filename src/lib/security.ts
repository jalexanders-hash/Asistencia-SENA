// src/utils/security.ts
import { User } from 'firebase/auth';

const ADMIN_EMAIL = "jalexanders@gmail.com";

export interface Instructor {
  nombre_del_instructor: string;
  competencia: string;
  correo_institucional_sena?: string;
  correo_institucional?: string;
  correo_gmail?: string;
  correo?: string;
  dia?: string;
  fecha_fin?: string | null;
}

/**
 * Valida si el usuario actual es el Administrador Global
 */
export const isGlobalAdmin = (user: User | null): boolean => {
  if (!user || !user.email) return false;
  return user.email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase();
};

/**
 * Busca y retorna el índice del instructor dentro del arreglo de la ficha actual.
 */
export const getInstructorIndex = (user: User | null, equipoInstructores: Instructor[] = []): number => {
  if (!user || !user.email) return -1;
  const userEmail = user.email.toLowerCase().trim();

  return equipoInstructores.findIndex((inst) => {
    const emails = [
      inst.correo_institucional_sena,
      inst.correo_institucional,
      inst.correo_gmail,
      inst.correo
    ];
    return emails.some(e => e && e.toLowerCase().trim() === userEmail);
  });
};

/**
 * Valida si el usuario tiene permisos para modificar o registrar en la ficha actual.
 */
export const canUserEditFicha = (user: User | null, equipoInstructores: Instructor[] = []): boolean => {
  if (isGlobalAdmin(user)) return true;
  return getInstructorIndex(user, equipoInstructores) !== -1;
};
