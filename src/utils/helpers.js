// utils/helpers.js

// Función para parsear datos CSV de Google Sheets
export const parseCsvData = (csvText) => {
  const rows = csvText.split('\n').map(row => row.trim()).filter(row => row.length > 0);
  if (rows.length === 0) return [];

  const headers = rows[0].split(',').map(header => header.trim());
  const dataRows = rows.slice(1);

  return dataRows.map(row => {
    const values = row.split(',').map(value => value.trim());
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = values[index];
    });
    return obj;
  });
};

// Función para parsear fechas en formato DD/MM/YYYY o DD mes YYYY
export const parseDate = (dateString) => {
  const parts = dateString.split(' ');
  if (parts.length === 3) { // Formato "DD mes YYYY"
    const day = parseInt(parts[0], 10);
    const year = parseInt(parts[2], 10);
    const monthNames = {
      'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
      'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
    };
    const month = monthNames[parts[1].toLowerCase()];
    if (month !== undefined) {
      return new Date(year, month, day);
    }
  } else if (dateString.includes('/')) { // Formato "DD/MM/YYYY"
    const [day, month, year] = dateString.split('/').map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(0); // Fecha inválida
};