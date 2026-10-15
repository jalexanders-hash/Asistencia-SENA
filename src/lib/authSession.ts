import { courseData as initialCourseData } from '../data';

/**
 * Caracteriza y obtiene el objeto del instructor activo basado en el correo de Google Auth.
 * Realiza una búsqueda flexible y normalizada en el equipo ejecutor.
 */
export function getInstructorFromSession(user: any, courseData: typeof initialCourseData) {
  const userEmail = String(user?.email || '').toLowerCase().trim();
  
  const instructors = courseData?.equipo_instructores || [];

  // Buscar coincidencia exacta o parcial normalizada en los correos del instructor
  const matchedInstructor = instructors.find((inst: any) => {
    const googleMail = String(inst.correo_google || '').toLowerCase().trim();
    const senaMail = String(inst.correo_institucional_sena || '').toLowerCase().trim();
    const altMail = String(inst.correo || inst.email || '').toLowerCase().trim();

    return (
      (googleMail && googleMail === userEmail) ||
      (senaMail && senaMail === userEmail) ||
      (altMail && altMail === userEmail)
    );
  });

  if (matchedInstructor) {
    return {
      ...matchedInstructor,
      esAdmin: false,
      isLoggedIn: true
    };
  }

  // Si no se encuentra en el equipo de la ficha pero hay un usuario autenticado,
  // evitamos hacer un fallback destructivo al administrador si el correo no corresponde.
  return {
    nombre_del_instructor: user?.displayName || 'Usuario Autorizado',
    correo_institucional_sena: user?.email || '',
    correo_google: user?.email || '',
    competencia: 'Sin competencia asignada',
    rol: 'Invitado / Instructor',
    esAdmin: false,
    isLoggedIn: true
  };
}
