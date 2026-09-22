import * as XLSX from 'xlsx';

/**
 * Genera y descarga una plantilla en Excel en blanco para el registro de asistencia de los instructores.
 */
export function downloadBlankAttendanceTemplate(courseData: any) {
  const wb = XLSX.utils.book_new();

  // 1. Hoja de Ficha
  const fichaData = [{
    ficha_de_caracterizacion: courseData.ficha_de_caracterizacion || "3387401",
    programa: courseData.programa || "",
    centro: courseData.centro || "",
    denominacion: courseData.denominacion || ""
  }];
  const wsFicha = XLSX.utils.json_to_sheet(fichaData);
  XLSX.utils.book_append_sheet(wb, wsFicha, "Ficha");

  // 2. Hoja de Equipo Instructor
  const equipoData = (courseData.equipo_instructores || []).map((inst: any) => ({
    competencia: inst.competencia || "",
    nombre_del_instructor: inst.nombre_del_instructor || "",
    correo_institucional_sena: inst.correo_institucional_sena || inst.correo || "",
    dia: inst.dia || "Lunes"
  }));
  const wsEquipo = XLSX.utils.json_to_sheet(equipoData);
  XLSX.utils.book_append_sheet(wb, wsEquipo, "Equipo_Ejecutor");

  // 3. Hoja de Aprendices (Con columnas base y columnas de fechas vacías para control)
  const aprendicesData = (courseData.asistencias_aprendices || []).map((student: any) => {
    return {
      tipo_documento: student.tipo_documento || "CC",
      numero_documento: student.numero_documento,
      nombres: student.nombres,
      apellidos: student.apellidos,
      correo_electronico: student.correo_electronico || "",
      telefono: student.telefono || "",
      // Ejemplo de columnas de fecha vacías o se pueden dejar libres para que el instructor ponga la fecha de su sesión (Ej: 9/22/2026)
      "M/D/YYYY (Escriba la fecha aquí)": ""
    };
  });

  const wsAprendices = XLSX.utils.json_to_sheet(aprendicesData);
  XLSX.utils.book_append_sheet(wb, wsAprendices, "Aprendices");

  // Descargar archivo Excel
  XLSX.writeFile(wb, `Plantilla_Asistencia_Ficha_${courseData.ficha_de_caracterizacion}.xlsx`);
}
