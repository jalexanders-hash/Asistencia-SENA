import { courseData as initialCourseData } from '../data';

/**
 * Caracteriza y obtiene el objeto del instructor activo basado en el correo de Google Auth.
 * Realiza una búsqueda flexible, ampliada y normalizada en el equipo ejecutor (Dual-Email / Multi-Key Check).
 */
export function getInstructorFromSession(user: any, courseData: typeof initialCourseData) {
  const userEmail = String(user?.email || '').toLowerCase().trim();
  
  if (!userEmail) {
    return {
      nombre_del_instructor: 'Invitado',
      correo_institucional_sena: '',
      correo_google: '',
      competencia: '',
      rol: 'INVITADO',
      esAdmin: false,
      isLoggedIn: false
    };
  }

  const instructors = courseData?.equipo_instructores || [];

  // Búsqueda flexible y normalizada evaluando todas las posibles propiedades de correo
  const matchedInstructor = instructors.find((inst: any) => {
    if (!inst) return false;

    const emailsToCompare = [
      inst.correo_google,
      inst.correo_institucional_sena,
      inst.correo_institucional,
      inst.correo,
      inst.email
    ]
      .filter(Boolean)
      .map((e: string) => String(e).toLowerCase().trim());

    return emailsToCompare.includes(userEmail);
  });

  if (matchedInstructor) {
    return {
      ...matchedInstructor,
      esAdmin: false,
      isLoggedIn: true
    };
  }

  // Si no se encuentra explícitamente en el equipo de la ficha actual,
  // devolvemos la sesión real del usuario autenticado sin forzar datos del Administrador.
  return {
    nombre_del_instructor: user?.displayName || 'Usuario Autorizado',
    correo_institucional_sena: userEmail,
    correo_google: userEmail,
    competencia: 'Sin competencia asignada',
    rol: 'Instructor / Invitado',
    esAdmin: false,
    isLoggedIn: true
  };
}
