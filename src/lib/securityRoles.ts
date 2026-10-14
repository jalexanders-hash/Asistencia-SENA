import { User } from "firebase/auth";

export const ADMIN_EMAILS = [
  "jalexanders@gmail.com"
];

/**
 * Valida el rol del sistema para un usuario dado, verificando contra múltiples
 * campos de correo y opcionalmente en todas las fichas disponibles.
 */
export const getUserSystemRole = (
  user: User | null, 
  equipoInstructoresOrAllFichas: any[] | Record<string, any> = []
): 'ADMIN' | 'COORDINADOR' | 'INSTRUCTOR_LIDER' | 'INSTRUCTOR' | 'INVITADO' => {
  if (!user || !user.email) {
    return 'INVITADO';
  }

  const userEmail = user.email.toLowerCase().trim();

  // 1. Verificación de Administrador Global
  if (ADMIN_EMAILS.includes(userEmail)) {
    return 'ADMIN';
  }

  // Preparar lista de equipos a revisar (soporta tanto un array de instructores como un mapa/objeto de fichas)
  let equiposARevisar: any[] = [];
  
  if (Array.isArray(equipoInstructoresOrAllFichas)) {
    equiposARevisar = equipoInstructoresOrAllFichas;
  } else if (equipoInstructoresOrAllFichas && typeof equipoInstructoresOrAllFichas === 'object') {
    // Si se pasa un diccionario de fichas (fichasDataMap), extraemos los equipos de todas ellas
    Object.values(equipoInstructoresOrAllFichas).forEach((ficha: any) => {
      if (ficha && Array.isArray(ficha.equipo_instructores)) {
        equiposARevisar.push(...ficha.equipo_instructores);
      }
    });
  }

  // 2. Buscar al instructor en los equipos recorridos
  for (const inst of equiposARevisar) {
    if (!inst) continue;

    const instEmails = [
      inst.correo_institucional_sena,
      inst.correo_institucional,
      inst.correo_gmail,
      inst.correo_google,
      inst.correo
    ]
      .filter(Boolean)
      .map((e: string) => e.toLowerCase().trim());

    if (instEmails.includes(userEmail)) {
      const rolActual = (inst.rol || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const esLider = inst.es_lider === true || rolActual.includes('lider');
      const esCoordinador = rolActual.includes('coordinador');

      if (esCoordinador) {
        return 'COORDINADOR';
      }
      if (esLider) {
        return 'INSTRUCTOR_LIDER';
      }
      return 'INSTRUCTOR';
    }
  }

  return 'INVITADO';
};
