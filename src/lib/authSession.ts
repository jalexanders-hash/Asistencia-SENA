import { User } from 'firebase/auth';

export interface Instructor {
  nombre_del_instructor: string;
  competencia: string;
  correo_gmail?: string;
  correo_google?: string;
  correo_institucional?: string;
  correo_institucional_sena?: string;
  correo?: string;
  rol?: string;
  es_lider?: boolean;
  dia?: string;
}

/**
 * Mapea de forma robusta y dinámica el usuario autenticado de Firebase Auth 
 * contra el equipo ejecutor de la ficha utilizando un chequeo de múltiples variantes (Dual-Email Check).
 */
export function getInstructorFromSession(user: User | null, courseData: any): Instructor {
  const defaultFallbackInstructor: Instructor = {
    nombre_del_instructor: "Usuario Invitado / Sin Asignar",
    competencia: "General",
    correo_gmail: user?.email || "",
    correo_institucional: "",
    rol: "INVITADO",
    es_lider: false
  };

  if (!user || !user.email) {
    return defaultFallbackInstructor;
  }

  const userEmailNormalized = user.email.toLowerCase().trim();
  const equipoInstructores: Instructor[] = courseData?.equipo_instructores || [];

  // Buscar coincidencia exacta o parcial en cualquiera de los campos de correo del instructor
  const instructorEncontrado = equipoInstructores.find((inst: any) => {
    const posiblesCorreos = [
      inst.correo_gmail,
      inst.correo_google,
      inst.correo_institucional,
      inst.correo_institucional_sena,
      inst.correo
    ];

    return posiblesCorreos.some(
      (correo) => correo && String(correo).toLowerCase().trim() === userEmailNormalized
    );
  });

  if (instructorEncontrado) {
    return instructorEncontrado;
  }

  // Si el usuario autenticado es el administrador principal configurado por defecto
  if (userEmailNormalized === "jalexanders@gmail.com" && equipoInstructores.length > 0) {
    return equipoInstructores[0]; // Retorna al líder principal o admin
  }

  // Si no se encuentra en el equipo pero está autenticado, retornar su info base de Google Auth
  return {
    nombre_del_instructor: user.displayName || user.email.split('@')[0],
    competencia: "Competencia General / Transversal",
    correo_gmail: user.email,
    correo_institucional: user.email,
    rol: "INSTRUCTOR",
    es_lider: false
  };
}
