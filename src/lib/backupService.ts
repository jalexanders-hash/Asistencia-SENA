// src/lib/backupService.ts

export const generarBackupGlobalFichas = (fichasMap: any, userEmail: string) => {
  try {
    const fechaActual = new Date().toISOString().split('T')[0];
    const horaColombia = new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" });

    const backupPayload = {
      version: "2.0",
      sistema: "SENA - Gestión Académica y Asistencia",
      autor_respaldo: userEmail,
      fecha_hora_colombia: horaColombia,
      total_fichas: Object.keys(fichasMap).length,
      data_fichas: fichasMap
    };

    // Convertir el objeto a formato JSON estructurado
    const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    // Crear un enlace temporal de descarga automática
    const a = document.createElement('a');
    a.href = url;
    a.download = `SENA_Backup_General_${fechaActual}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error al generar el respaldo de seguridad:", error);
    alert("Hubo un error al generar la copia de seguridad.");
  }
};
