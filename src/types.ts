// src/types.ts
export type TipoDocumento = 'CC' | 'TI' | 'CE' | 'PP' | 'PPT';
export type EstadoAprendiz = 'En Formación' | 'Retiro Voluntario' | 'Cancelado' | 'Aplazado' | 'Trasladado' | 'Deserción';

export interface Instructor {
  id?: string;
  numeroDocumento: string;
  nombreCompleto: string;
  correoSena: string;
  correoGmail: string;
  activo: boolean;
}

export interface AprendizImport {
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  correoElectronico: string;
  telefono: string;
  estado: EstadoAprendiz;
}

export interface ValidationError {
  fila: number;
  seccion: 'Ficha' | 'Instructor' | 'Aprendiz';
  campo: string;
  mensaje: string;
}

export interface ParseResult {
  valido: boolean;
  errores: ValidationError[];
  datosFicha?: any;
  instructores: Instructor[];
  aprendices: AprendizImport[];
}
