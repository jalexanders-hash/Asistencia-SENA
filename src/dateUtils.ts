// Convierte cualquier formato de fecha o timestamp a estrictamente DD/MM/YYYY
export function formatDateToDMY(dateInput: string | Date): string {
  if (!dateInput) return '';

  let day: number, month: number, year: number;

  if (dateInput instanceof Date) {
    day = dateInput.getDate();
    month = dateInput.getMonth() + 1;
    year = dateInput.getFullYear();
  } else {
    const str = String(dateInput).trim();
    let parts: string[] = [];

    if (str.includes('/')) {
      parts = str.split('/');
    } else if (str.includes('-')) {
      parts = str.split('-');
    }

    if (parts.length === 3) {
      // Si viene en formato YYYY-MM-DD
      if (parts[0].length === 4) {
        year = Number(parts[0]);
        month = Number(parts[1]);
        day = Number(parts[2]);
      } else {
        // Formato original DD/MM/YYYY (Día primero, Mes segundo)
        day = Number(parts[0]);
        month = Number(parts[1]);
        year = Number(parts[2]);
        if (year < 100) year += 2000;
      }
    } else {
      return str; // Si no tiene el formato esperado, se retorna tal cual
    }
  }

  const paddedDay = String(day).padStart(2, '0');
  const paddedMonth = String(month).padStart(2, '0');
  return `${paddedDay}/${paddedMonth}/${year}`;
}

// Obtiene el día de la semana real interpretando estrictamente DD/MM/YYYY
export function getDayOfWeekFromDate(dateStr: string): string {
  if (!dateStr) return '';
  let parts: string[] = [];
  
  if (dateStr.includes('/')) {
    parts = dateStr.split('/');
  } else if (dateStr.includes('-')) {
    parts = dateStr.split('-');
  }

  if (parts.length === 3) {
    let day = 0;
    let month = 0;
    let year = 0;

    if (parts[0].length === 4) {
      year = Number(parts[0]);
      month = Number(parts[1]) - 1;
      day = Number(parts[2]);
    } else {
      // Lectura estricta: Día / Mes / Año
      day = Number(parts[0]);
      month = Number(parts[1]) - 1;
      year = Number(parts[2]);
      if (year < 100) year += 2000;
    }

    const d = new Date(year, month, day);
    
    if (!isNaN(d.getTime())) {
      const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
      return days[d.getDay()] || '';
    }
  }
  return '';
}
