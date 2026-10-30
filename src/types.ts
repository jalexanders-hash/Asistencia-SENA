// ==========================================
// CONSTANTES Y CATÁLOGOS OFICIALES SENA
// ==========================================

export const ESTADOS_APRENDIZ_CANONICOS = [
  'En Formación',
  'Retiro Voluntario',
  'Cancelado',
  'Aplazado',
  'Trasladado',
  'Deserción'
] as const;

export type EstadoAprendiz = typeof ESTADOS_APRENDIZ_CANONICOS[number];

export const TIPOS_DOCUMENTO = ['CC', 'TI', 'CE', 'PPT', 'PEP'] as const;
export type TipoDocumento = typeof TIPOS_DOCUMENTO[number];

export const ROLES_INSTRUCTOR = [
  'Instructor / Tutor',
  'Instructor Líder',
  'Instructor Técnico',
  'Coordinador Académico'
] as const;

export type RolInstructor = typeof ROLES_INSTRUCTOR[number];

export const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'] as const;
export type DiaSemana = typeof DIAS_SEMANA[number];

export const OPCIONES_ASISTENCIA = ['Presente', 'X', 'Tarde', 'Excusa'] as const;
export type OpcionAsistencia = typeof OPCIONES_ASISTENCIA[number];

// ==========================================
// INTERFACES DE DATOS DE LA FICHA
// ==========================================

export interface Instructor {
  id?: string;
  competencia: string;
  nombre_del_instructor: string;
  nombreCompleto?: string;
  correo_google: string;
  correo_institucional_sena: string;
  correoGmail?: string;
  correoSena?: string;
  dia?: DiaSemana | string;
  rol: RolInstructor | string;
  fecha_de_inicio?: string;
  activo?: boolean;
}

export interface Aprendiz {
  tipo_documento: TipoDocumento | string;
  numero_documento: string;
  nombres: string;
  apellidos: string;
  correo: string;
  correo_electronico?: string;
  telefono?: string;
  estado: EstadoAprendiz | string;
  registros: Record<string, string>; // Clave: Fecha (DD/MM/YYYY), Valor: 'X' | 'Tarde' | 'Excusa' | ''
}

export interface CourseData {
  ficha_de_caracterizacion: string;
  denominacion: string;
  centro: string;
  fecha_inicio?: string;
  fecha_terminacion?: string;
  jornada?: string;
  competencias?: string[];
  fechas_asistencia: string[];
  fechas_por_instructor: Record<string, string[]>;
  asistencias_aprendices: Aprendiz[];
  equipo_instructores: Instructor[];
}
