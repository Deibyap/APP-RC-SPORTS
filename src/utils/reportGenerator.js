// utils/reportGenerator.js

// Función para calcular el ritmo (min/km) para running
const calculatePace = (timeStr, distance) => {
  if (!timeStr || !distance) return '-';
  // Asume timeStr es 'HH:MM:SS' o 'MM:SS'
  const parts = timeStr.split(':').map(Number);
  let totalSeconds = 0;
  if (parts.length === 3) {
    totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    totalSeconds = parts[0] * 60 + parts[1];
  } else {
    return '-';
  }
  if (distance === 0) return '-'; // Evitar división por cero
  const paceSecondsPerKm = totalSeconds / distance;
  const minutes = Math.floor(paceSecondsPerKm / 60);
  const seconds = Math.round(paceSecondsPerKm % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds} min/km`;
};

// Función para calcular la velocidad (km/h) para ciclismo u otros
const calculateSpeed = (timeStr, distance) => {
  if (!timeStr || !distance) return '-';
  const parts = timeStr.split(':').map(Number);
  let totalHours = 0;
  if (parts.length === 3) {
    totalHours = parts[0] + parts[1] / 60 + parts[2] / 3600;
  } else if (parts.length === 2) {
    totalHours = parts[0] / 60 + parts[1] / 3600;
  } else {
    return '-';
  }
  if (totalHours === 0) return '-'; // Evitar división por cero
  return `${(distance / totalHours).toFixed(2)} km/h`;
};

// Función para convertir tiempo a segundos
const timeToSeconds = (timeStr) => {
  if (!timeStr) return Infinity;
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 3) { // HH:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) { // MM:SS
    return parts[0] * 60 + parts[1];
  }
  return Infinity;
};

// Función para obtener la vuelta más rápida y marcarla
const getLapTimesWithPR = (participant) => {
  const lapTimes = [];
  let fastestLapTime = Infinity;
  let fastestLapKey = '';

  for (let i = 1; i <= 11; i++) { // Asumiendo hasta TV11 según la estructura de datos
    const tvKey = `TV${i}`;
    const lapTime = participant[tvKey];
    if (lapTime) {
      const seconds = timeToSeconds(lapTime);
      lapTimes.push({ key: tvKey, time: lapTime, seconds: seconds });
      if (seconds < fastestLapTime) {
        fastestLapTime = seconds;
        fastestLapKey = tvKey;
      }
    }
  }

  const formattedLapTimes = [];
  for (let i = 1; i <= 11; i++) { // Iterar hasta TV11 para asegurar el orden
    const tvKey = `TV${i}`;
    const lap = lapTimes.find(l => l.key === tvKey);
    if (lap) {
      formattedLapTimes.push(lap.key === fastestLapKey ? `${lap.time} (PR)` : lap.time);
    } else {
      formattedLapTimes.push(null); // Mantener el orden de las vueltas
    }
  }
  return formattedLapTimes;
};


export const generateCategoryReportPDF = (participants, eventName, reportTitle, eventLogoUrl, eventDate, sportType, orientation = 'landscape') => {
  const printWindow = window.open('', '_blank');

  const title = `Resultados de ${eventName}`;
  // reportTitle puede ser "Todas las Categorías", "Top 5 por Categoría", o el nombre de una categoría específica
  const subtitle = reportTitle; 

  // Agrupar participantes por categoría para el reporte
  const groupedParticipants = participants.reduce((acc, participant) => {
    const category = participant['categoria'] || 'Sin Categoría';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(participant);
    return acc;
  }, {});

  // Obtener las categorías ordenadas
  const sortedCategories = Object.keys(groupedParticipants).sort();

  // Determinar si hay tiempos de vuelta para mostrar (basado en todos los participantes del reporte)
  const hasLapTimes = participants.some(p => p.TV1);

  // Generar encabezados de vueltas dinámicamente
  const lapHeaders = [];
  if (hasLapTimes) {
    for (let i = 1; i <= 11; i++) { // Asumiendo hasta TV11 según la estructura de datos
      if (participants.some(p => p[`TV${i}`])) { // Si al menos un participante tiene esta vuelta
        lapHeaders.push(`<th>TV${i}</th>`);
      }
    }
  }

  // Determinar si hay datos en el campo 'VUELTAS'
  const hasVueltasData = participants.some(p => p.VUELTAS && String(p.VUELTAS).trim() !== '');


  const pageOrientationCss = orientation === 'landscape' ? 'A4 landscape' : 'A4 portrait';
  // Las dimensiones pageWidth y pageHeight ya no son necesarias para html, body en @media print,
  // ya que el control lo toma @page y el flujo normal del documento.


  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title} - ${subtitle}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          color: #333;
          -webkit-print-color-adjust: exact !important; /* Asegura que los colores de fondo e imágenes se impriman */
          print-color-adjust: exact !important;
        }
        .page-content {
          padding: 15mm; /* Márgenes para el contenido en pantalla */
        }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #FF5A1F; }
        .header .logo-left { height: 130px; width: auto; object-fit: contain; }
        .header .logo-right { height: 130px; width: auto; object-fit: contain; }
        .header-text { text-align: center; flex-grow: 1; }
        .header-text h1 { color: #FF5A1F; margin: 0; font-size: 1.8em; }
        .header-text h2 { color: #555; margin: 5px 0; font-size: 1.2em; }
        .header-text p { color: #777; margin: 0; font-size: 0.8em; }

        .category-table-container { margin-bottom: 30px; } /* page-break-inside será manejado por @media print */
        .category-title { background-color: #f0f0f0; padding: 8px; text-align: center; margin-bottom: 10px; border-radius: 3px; font-size: 1.2em; font-weight: bold; border: 1px solid #ddd; page-break-before: auto; page-break-after: avoid; }


        table {
          width: 100% !important;
          border-collapse: collapse !important;
          table-layout: fixed !important; /* Ayuda a controlar mejor el ancho de las columnas */
          margin: 0 !important;
          font-size: 0.75em;
        }
        th, td {
          padding: 0.1em 0.3em !important;
          border: 1px solid #aaa !important;
          text-align: center;
          word-wrap: break-word !important; /* Permite que el texto largo se rompa */
          overflow-wrap: break-word !important; /* Versión moderna de word-wrap */
          white-space: normal !important;   /* Permitir que el texto envuelva si es necesario */
          vertical-align: top;
        }
        th { background-color: #ea580c; color: #fff; font-weight: bold; text-transform: uppercase; border: 1px solid #c2410c !important; }
        td.align-left { text-align: left; }
        tr:nth-child(even) { background-color: #f3f4f6; }
        tr:hover { background-color: #e9e9e9; }

        /* Estilos específicos para campos pequeños */
        th:nth-child(1), td:nth-child(1), /* Pos Cat. */
        th:nth-child(2), td:nth-child(2), /* Pos Gral. */
        th:nth-child(3), td:nth-child(3) /* Dorsal */
        {
          font-size: 0.7em;
          width: 5%; /* Ancho fijo para campos pequeños, ajusta según necesidad */
        }

        /* Estilos para tiempos de vuelta */
        th:nth-child(n+7), td:nth-child(n+7) { /* A partir de 'Tiempo Oficial' y siguientes */
          font-size: 0.7em;
        }

        .footer { text-align: center; margin-top: 40px; padding-top: 10px; border-top: 1px solid #eee; font-size: 0.7em; color: #777; }
        .whatsapp-btn { display: inline-block; background-color: #25D366; color: white; padding: 6px 12px; border-radius: 4px; text-decoration: none; margin-top: 8px; }
        .whatsapp-btn:hover { background-color: #1DA851; }
        .pdf-capture-btn { display: inline-block; background-color: #DC3545; color: white; padding: 6px 12px; border-radius: 4px; text-decoration: none; margin-top: 8px; margin-left: 10px; }
        .pdf-capture-btn:hover { background-color: #C82333; }


        /* =================================================== */
        /* ESTILOS ESPECÍFICOS PARA LA IMPRESIÓN (AJUSTADOS) */
        /* =================================================== */
        @page {
          size: ${pageOrientationCss};
          margin: 0.8cm;
        }
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          html, body {
            width: auto !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          .page-content {
            padding: 0.5cm !important;
          }
          .header { margin-bottom: 10px !important; border-bottom: 1px solid #FF5A1F !important; }
          .category-table-container { page-break-inside: avoid !important; margin-bottom: 15px !important; }
          .category-title { page-break-before: always !important; margin-top: 15px !important; } /* Forzar salto de página antes de cada categoría */
          /* La primera categoría no debe tener salto de página antes */
          .category-table-container:first-of-type .category-title { page-break-before: avoid !important; margin-top: 0 !important; }


          table {
            page-break-inside: auto !important;
            width: 100% !important;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          thead { display: table-header-group !important; }
          tfoot { display: table-footer-group !important; }

          /* Ajustes de footer para impresión */
          .footer {
            position: relative !important;
            bottom: auto !important;
            width: 100% !important;
            border-top: 1px solid #eee !important;
            padding-top: 5px !important;
            margin-top: 10px !important;
          }
          .whatsapp-btn, .pdf-capture-btn { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="page-content">
        <div class="header">
          <img src="https://res.cloudinary.com/ddlhr4nyn/image/upload/v1748903884/LOGO_R_C_SOPRTS_TIMING_em93hv.png" alt="Logo R&C Sports Timing" class="logo-left">
          <div class="header-text">
            <h1>R&C Sports Timing</h1>
            <h2>${title}</h2>
            <h3>${subtitle}</h3>
            <p>Fecha del Evento: ${eventDate || 'N/A'}</p>
          </div>
          ${eventLogoUrl ? `<img src="${eventLogoUrl}" alt="Logo Evento" class="logo-right">` : '<div class="logo-right" style="width: 130px; height: 130px;"></div>'}
        </div>

        ${sortedCategories.map(cat => `
          <div class="category-table-container">
            <h3 class="category-title">${cat}</h3>
            <table>
              <thead>
                <tr>
                  <th>Pos Cat.</th>
                  <th>Pos Gral.</th>
                  <th>Dorsal</th>
                  <th class="align-left">Nombre</th>
                  <th>Club</th>
                  <th>Tiempo Oficial</th>
                  ${sportType && sportType.toLowerCase() === 'running' ? '<th>Tiempo Chip</th>' : ''}
                  <th>${sportType && sportType.toLowerCase() === 'running' ? 'Ritmo' : 'Vel. k/h'}</th>
                  ${hasVueltasData ? '<th>Vueltas</th>' : ''}
                  ${lapHeaders.join('')}
                </tr>
              </thead>
              <tbody>
                ${groupedParticipants[cat]
                  .sort((a, b) => (parseInt(a['posición categoria'], 10) || Infinity) - (parseInt(b['posición categoria'], 10) || Infinity))
                  .map(participant => {
                    const lapTimesWithPR = getLapTimesWithPR(participant);
                    return `
                    <tr>
                      <td data-label="Pos Cat.">${participant['posición categoria'] || '-'}</td>
                      <td data-label="Pos Gral.">${participant['posición general'] || '-'}</td>
                      <td data-label="Dorsal">${participant.dorsal || '-'}</td>
                      <td data-label="Nombre" class="align-left">${participant.nombre || '-'}</td>
                      <td data-label="Club">${participant.club || '-'}</td>
                      <td>${participant.tiempo || '-'}</td>
                      ${sportType && sportType.toLowerCase() === 'running' ? 
                        `<td>${participant['tiempo chip'] || '-'}</td>` : ''}
                      <td>${
                        sportType && sportType.toLowerCase() === 'running'
                          ? calculatePace(participant.tiempo, participant.Distancia)
                          : calculateSpeed(participant.tiempo, participant.Distancia)
                      }</td>
                      ${hasVueltasData ? `<td>${participant.VUELTAS || '-'}</td>` : ''}
                      ${lapHeaders.map((header, idx) => {
                          return `<td>${lapTimesWithPR[idx] !== null ? lapTimesWithPR[idx] : '-'}</td>`;
                      }).join('')}
                    </tr>
                  `;
                  }).join('')}
              </tbody>
            </table>
          </div>
        `).join('')}

        <div class="footer">
          <p>Contacto: </p>
          <a href="https://api.whatsapp.com/send?phone=584249065422&text=Hola%20buen%20d%C3%ADa!%20mi%20nombre%20es%20" class="whatsapp-btn" target="_blank">
            WhatsApp +584249065422
          </a>
          <button onclick="window.print()" class="pdf-capture-btn">
            Capturar Reporte PDF
          </button>
        </div>
      </div>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};