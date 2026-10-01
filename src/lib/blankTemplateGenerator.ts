import * as XLSX from 'xlsx';

/**
 * Genera y descarga una plantilla en Excel en blanco para el registro de asistencia de los instructores,
 * incorporando metadatos claros del instructor y competencia activa.
 */
export function downloadBlankAttendanceTemplate(courseData: any) {
  const wb = XLSX.utils.book_new();

  // 1. Obtener el instructor activo por defecto (el primero o el actual)
  const instructorActivo = courseData.equipo_instructores?.[0] || {
    nombre_del_instructor: "Instructor Titular",
    competencia: "Competencia General"
  };

  // 2. Hoja de Ficha y Metadatos del Instructor Titular
  const fichaData = [{
    ficha_de_caracterizacion: courseData.ficha_de_caracterizacion || "3387401",
    programa: courseData.programa || "",
    centro: courseData.centro || "",
    denominacion: courseData.denominacion || "",
    // Metadatos clave para asociar la asistencia al instructor correcto al cargar
    instructor_titular: instructorActivo.nombre_del_instructor,
    competencia_activa: instructorActivo.competencia
  }];
  const wsFicha = XLSX.utils.json_to_sheet(fichaData);
  XLSX.utils.book_append_sheet(wb, wsFicha, "Ficha");

  // 3. Hoja de Equipo Instructor
  const equipoData = (courseData.equipo_instructores || []).map((inst: any) => ({
    competencia: inst.competencia || "",
    nombre_del_instructor: inst.nombre_del_instructor || "",
    correo_institucional_sena: inst.correo_institucional_sena || inst.correo || "",
    dia: inst.dia || "Lunes"
  }));
  const wsEquipo = XLSX.utils.json_to_sheet(equipoData);
  XLSX.utils.book_append_sheet(wb, wsEquipo, "Equipo_Ejecutor");

  // 4. Hoja de Aprendices (Incluyendo columnas de fechas existentes si las hay)
  const fechasExistentes = courseData.fechas_asistencia || [];
  
  const aprendicesData = (courseData.asistencias_aprendices || []).map((student: any) => {
    const studentRow: any = {
      tipo_documento: student.tipo_documento || "CC",
      numero_documento: student.numero_documento,
      nombres: student.nombres,
      apellidos: student.apellidos,
      correo_electronico: student.correo_electronico || "",
      telefono: student.telefono || ""
    };

    // Si ya hay fechas en el sistema, las prellenamos como columnas para que el instructor solo marque
    if (fechasExistentes.length > 0) {
      fechasExistentes.forEach((fecha: string) => {
        studentRow[fecha] = student.registros?.[fecha] || "";
      });
    } else {
      // Columna guía predeterminada si no hay fechas previas
      studentRow["M/D/YYYY"] = "";
    }

    return studentRow;
  });

  const wsAprendices = XLSX.utils.json_to_sheet(aprendicesData);
  XLSX.utils.book_append_sheet(wb, wsAprendices, "Aprendices");

  // Descargar archivo Excel con nombre limpio de la ficha
  XLSX.writeFile(wb, `Plantilla_Asistencia_Ficha_${courseData.ficha_de_caracterizacion}.xlsx`);
}
