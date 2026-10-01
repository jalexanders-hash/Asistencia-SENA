export async function migrarJsonAFirebase() {
  try {
    const fichaId = "3407860"; // O la ficha que desees configurar
    
    // 1. Convertimos los aprendices y sus registros de inasistencia/asistencia
    const asistencias_aprendices = jsonData.aprendices.map((ap: any) => {
      const registros: Record<string, string> = {};

      ap.detalle_inasistencias?.forEach((item: any) => {
        registros[item.fecha] = item.estado;
      });
      ap.detalle_retardos?.forEach((item: any) => {
        registros[item.fecha] = item.estado;
      });
      ap.detalle_justificaciones?.forEach((item: any) => {
        registros[item.fecha] = item.estado;
      });

      const partesNombre = ap.nombre_completo.split(" ");
      const nombres = ap.nombres || partesNombre.slice(0, 2).join(" ");
      const apellidos = ap.apellidos || partesNombre.slice(2).join(" ");

      return {
        tipo_documento: "CC",
        numero_documento: String(ap.numero_documento).trim(),
        nombres: nombres.toUpperCase(),
        apellidos: apellidos.toUpperCase(),
        correo_electronico: (ap.correo_electronico || "").toLowerCase(),
        telefono: "",
        registros: registros
      };
    });

    // 2. Extraer fechas únicas directamente de los registros de los aprendices (más flexible)
    const todasLasFechasSet = new Set<string>();
    asistencias_aprendices.forEach((ap: any) => {
      Object.keys(ap.registros).forEach((fecha) => todasLasFechasSet.add(fecha));
    });
    const fechas_asistencia = Array.from(todasLasFechasSet).sort();

    // 3. Mapeo limpio de instructores SIN restricciones de fechas de sesiones ni festivos fijos
    const equipo_instructores = jsonData.equipo_instructores_consolidado.map((inst: any) => ({
      competencia: inst.competencia,
      nombre_del_instructor: inst.instructor,
      correo_google: inst.correo_acceso,
      correo_institucional_sena: inst.correo_institucional,
      rol: "Instructor"
      // Se eliminan deliberadamente dia, fecha_de_inicio y fecha_terminacion para evitar bloqueos
    }));

    // 4. Estructura final libre de restricciones de calendario de instructor
    const courseDataCompleto = {
      ficha_de_caracterizacion: fichaId,
      programa: jsonData.metadata.ficha.programa,
      centro: jsonData.metadata.ficha.centro_formacion,
      denominacion: jsonData.metadata.ficha.denominacion,
      fechas_asistencia: fechas_asistencia,
      asistencias_aprendices: asistencias_aprendices,
      equipo_instructores: equipo_instructores
    };

    const docRef = doc(db, "fichas", fichaId);
    await setDoc(docRef, courseDataCompleto);

    alert("¡Ficha migrada exitosamente y libre de restricciones de fechas de instructores!");
  } catch (error: any) {
    console.error("Error al migrar:", error);
    alert(`Error: ${error.message || error}`);
  }
}
