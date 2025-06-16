import React, { useState, useEffect, useMemo } from 'react';
import { parseCsvData } from '../utils/helpers';
import { generateCategoryReportPDF } from '../utils/reportGenerator'; // Importar la función del reporte

const ResultsPage = ({ selectedEvent, setPage }) => {
  const [allResults, setAllResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(''); // Estado inicial vacío para forzar selección
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedAthleteId, setExpandedAthleteId] = useState(null);

  const resultsGoogleSheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQWjDAx17rze56_4sq8mIxro5u1-lTVS6MYe3v6wDqrbG12ARK3b_lPI387qJIfl56fCjHaHEHXQsfi/pub?gid=0&single=true&output=csv";

  useEffect(() => {
    if (!selectedEvent) {
      setLoading(false);
      setError("Por favor, selecciona un evento para ver sus resultados.");
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(resultsGoogleSheetUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        const parsedData = parseCsvData(text);

        const eventSpecificResults = parsedData.filter(result =>
          result['id evento'] === selectedEvent['id evento']
        );
        setAllResults(eventSpecificResults);
        setSelectedCategory(''); // Resetear categoría al cargar un nuevo evento
        setSearchTerm('');
        setExpandedAthleteId(null); // Resetear expansión
      } catch (e) {
        setError("No pudimos cargar los resultados de este evento. Revisa la conexión o la URL de tu hoja de Google.");
        console.error("Error fetching results:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [selectedEvent]);

  const uniqueCategoriesForEvent = useMemo(() => {
    const categories = new Set(allResults.map(result => result['categoria']).filter(Boolean));
    return ['', 'Todas', ...Array.from(categories).sort()];
  }, [allResults]);

  const filteredAndSearchedResults = useMemo(() => {
    let currentResults = allResults;

    if (selectedCategory && selectedCategory !== 'Todas') {
      currentResults = currentResults.filter(result => result['categoria'] === selectedCategory);
    } else if (selectedCategory === 'Todas') {
      currentResults = allResults;
    } else {
      return [];
    }

    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      currentResults = currentResults.filter(result =>
        (result['dorsal'] && String(result['dorsal']).toLowerCase().includes(lowerCaseSearchTerm)) ||
        (result['nombre'] && String(result['nombre']).toLowerCase().includes(lowerCaseSearchTerm))
      );
    }

    currentResults.sort((a, b) => {
      const posA = parseInt(a['posición categoria'], 10) || Infinity;
      const posB = parseInt(b['posición categoria'], 10) || Infinity;
      return posA - posB;
    });

    return currentResults;
  }, [allResults, selectedCategory, searchTerm]);

  const toggleExpand = (athleteId) => {
    setExpandedAthleteId(athleteId === expandedAthleteId ? null : athleteId);
  };

  // MODIFICACIÓN CLAVE AQUÍ: Función getGoogleDriveViewLink más robusta
  const getGoogleDriveViewLink = (url) => {
    // Si la URL es nula, vacía o solo espacios en blanco, devuelve null.
    if (!url || String(url).trim() === '') {
        return null;
    }

    const cleanUrl = String(url).trim();

    if (cleanUrl.includes('drive.google.com/file/d/')) {
        const match = cleanUrl.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
            return `https://drive.google.com/file/d/${match[1]}/view?usp=sharing`;
        }
    }
    
    // Si no es una URL de Google Drive esperada, intenta validarla como una URL genérica.
    // Si no es una URL válida, devuelve null para evitar errores ERR_NAME_NOT_RESOLVED.
    try {
        new URL(cleanUrl); // Esto lanzará un error si cleanUrl no es un formato de URL válido.
        return cleanUrl; // Es una URL válida, la devolvemos tal cual.
    } catch (e) {
        return null; // No es una URL válida, devuelve null.
    }
  };

  // Función para calcular el ritmo (min/km) para running en las tarjetas
  const calculatePaceForCard = (timeStr, distance, includeUnit = true) => {
    if (!timeStr || !distance) return '-';
    const parts = timeStr.split(':').map(Number);
    let totalSeconds = 0;
    if (parts.length === 3) {
      totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      totalSeconds = parts[0] * 60 + parts[1];
    } else {
      return '-';
    }
    if (distance === 0) return '-';
    const paceSecondsPerKm = totalSeconds / distance;
    const minutes = Math.floor(paceSecondsPerKm / 60);
    const seconds = Math.round((paceSecondsPerKm % 60)); // Redondeo para segundos
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}${includeUnit ? ' min/km' : ''}`;
  };

  const calculateSpeedForCard = (timeStr, distance) => {
    if (!timeStr || !distance || distance === 0) return '-';
    const parts = timeStr.split(':').map(Number);
    let totalHours = 0;
    if (parts.length === 3) {
      totalHours = parts[0] + parts[1] / 60 + parts[2] / 3600;
    } else if (parts.length === 2) {
      totalHours = parts[0] / 60 + parts[1] / 3600;
    } else {
      return '-';
    }
    if (totalHours === 0) return '-';
    return `${(distance / totalHours).toFixed(2)}`; // Solo valor numérico
  };


  const handleGenerateReport = (reportType) => {
    const eventLogoUrl = selectedEvent['logo evento'] ? getGoogleDriveViewLink(selectedEvent['logo evento']) : null;
    const eventDate = selectedEvent['Fecha'];
    const sportType = selectedEvent['deporte'];

    let participantsToReport = [];
    let reportCategoryName = selectedCategory;

    if (reportType === 'fullEvent') {
      // Agrupar y ordenar por categoría para el reporte completo
      const categoriesMap = allResults.reduce((acc, participant) => {
        const category = participant['categoria'];
        if (category) {
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(participant);
        }
        return acc;
      }, {});

      // Ordenar participantes dentro de cada categoría y luego aplanar
      participantsToReport = Object.keys(categoriesMap).sort().flatMap(cat => {
        return categoriesMap[cat].sort((a, b) => {
          const posA = parseInt(a['posición categoria'], 10) || Infinity;
          const posB = parseInt(b['posición categoria'], 10) || Infinity;
          return posA - posB;
        });
      });
      reportCategoryName = 'Todas las Categorías';
    } else if (reportType === 'top5') {
      // Agrupar por categoría y obtener el top 5 de cada una
      const categoriesMap = allResults.reduce((acc, participant) => {
        const category = participant['categoria'];
        if (category) {
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(participant);
        }
        return acc;
      }, {});

      participantsToReport = Object.keys(categoriesMap).sort().flatMap(cat => {
        const sortedCatParticipants = categoriesMap[cat].sort((a, b) => {
          const posA = parseInt(a['posición categoria'], 10) || Infinity;
          const posB = parseInt(b['posición categoria'], 10) || Infinity;
          return posA - posB;
        });
        return sortedCatParticipants.slice(0, 5); // Tomar solo el top 5
      });
      reportCategoryName = 'Top 5 por Categoría';
    } else if (reportType === 'top10Image') {
      if (!selectedCategory || selectedCategory === '' || selectedCategory === 'Todas') {
        alert('Por favor, selecciona una categoría específica para generar la imagen del Top 10.');
        return;
      }
      const top10Participants = filteredAndSearchedResults.slice(0, 10);
      if (top10Participants.length === 0) {
        alert('No hay suficientes participantes en esta categoría para generar un Top 10.');
        return;
      }
      generateTop10Image(top10Participants, selectedEvent['Nombre evento'], selectedCategory, eventLogoUrl, eventDate, sportType);
      return; // Salir para no llamar generateCategoryReportPDF
    } else { // reportType === 'singleCategory'
      if (!selectedCategory || selectedCategory === '' || selectedCategory === 'Todas' || filteredAndSearchedResults.length === 0) {
        alert('Por favor, selecciona una categoría específica y asegúrate de que haya participantes para generar el reporte de categoría.');
        return;
      }
      participantsToReport = filteredAndSearchedResults;
    }

    generateCategoryReportPDF(participantsToReport, selectedEvent['Nombre evento'], reportCategoryName, eventLogoUrl, eventDate, sportType);
  };

  // Función para generar la imagen del Top 10
  const generateTop10Image = (participants, eventName, categoryName, eventLogoUrl, eventDate, sportType) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const imgWidth = 1080;
    const imgHeight = 1600;
    canvas.width = imgWidth;
    canvas.height = imgHeight;

    // Fondo blanco
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, imgWidth, imgHeight);

    // Cargar logos (usando CORS para evitar "tainted canvas")
    const mainLogo = new Image();
    mainLogo.crossOrigin = "Anonymous"; // Importante para imágenes de otros dominios
    mainLogo.src = "https://res.cloudinary.com/ddlhr4nyn/image/upload/v1748903884/LOGO_R_C_SOPRTS_TIMING_em93hv.png"; // Logo principal
    
    const eventLogo = new Image();
    eventLogo.crossOrigin = "Anonymous"; // Importante para imágenes de otros dominios
    eventLogo.src = eventLogoUrl; // Logo del evento

    let logosLoaded = 0;
    const totalLogos = (eventLogoUrl ? 2 : 1);

    const drawContent = () => {
      let yOffset = 50;

      // Header (fondo blanco, texto negro)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, imgWidth, 150); // Barra blanca superior

      // Logos
      ctx.drawImage(mainLogo, 50, 25, 100, 100); // Logo principal a la izquierda
      if (eventLogoUrl) {
        ctx.drawImage(eventLogo, imgWidth - 150, 25, 100, 100); // Logo evento a la derecha
      }

      // Títulos
      ctx.fillStyle = '#FF5A1F'; // Naranja
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('R&C Sports Timing', imgWidth / 2, 70);
      ctx.fillStyle = '#000000'; // Negro para el texto
      ctx.font = 'bold 36px Arial';
      ctx.fillText(eventName, imgWidth / 2, 120);

      yOffset = 200;

      // Título del Top 10
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 40px Arial';
      ctx.fillText(`Top 10 - Categoría: ${categoryName}`, imgWidth / 2, yOffset);
      yOffset += 60;

      // Fecha del evento
      ctx.font = '28px Arial';
      ctx.fillText(`Fecha: ${eventDate || 'N/A'}`, imgWidth / 2, yOffset);
      yOffset += 80;

      // Encabezados de la tabla
      ctx.fillStyle = '#ea580c'; // Naranja
      ctx.fillRect(50, yOffset - 35, imgWidth - 100, 50);
      ctx.fillStyle = '#000000'; // Negro para el texto del encabezado
      ctx.textAlign = 'center'; // Centrar encabezados
      
      // Definir posiciones X para las columnas
      // Ajustadas para centrar y dar espacio
      const colPositions = {
        pos: 100, // Posición
        dorsal: 250, // Dorsal
        nombre: 480, // Nombre (centrado en su espacio)
        club: 700, // Club (centrado en su espacio)
        tiempo: 850, // Tiempo
        ritmoVel: 1000 // Ritmo/Velocidad
      };

      ctx.fillText('Pos.', colPositions.pos, yOffset);
      ctx.fillText('Dorsal', colPositions.dorsal, yOffset);
      ctx.fillText('Nombre', colPositions.nombre, yOffset);
      ctx.fillText('Club', colPositions.club, yOffset);
      ctx.fillText('Tiempo', colPositions.tiempo, yOffset);
      ctx.fillText(sportType.toLowerCase() === 'running' ? 'Ritmo' : 'Vel.', colPositions.ritmoVel, yOffset);
      yOffset += 40;

      // Datos de los participantes
      ctx.fillStyle = '#000000';
      
      participants.forEach((athlete, i) => {
        // Posición, Dorsal, Tiempo, Ritmo/Velocidad: Centrados
        ctx.textAlign = 'center'; 
        ctx.font = '24px Arial'; // Fuente para estos campos
        ctx.fillText(athlete['posición categoria'] || '-', colPositions.pos, yOffset);
        ctx.fillText(athlete['dorsal'] || '-', colPositions.dorsal, yOffset);
        ctx.fillText(athlete['tiempo'] || '-', colPositions.tiempo, yOffset);
        ctx.fillText(
          sportType.toLowerCase() === 'running'
            ? calculatePaceForCard(athlete['tiempo'], athlete['Distancia'], false) // Sin unidad
            : `${calculateSpeedForCard(athlete['tiempo'], athlete['Distancia'])}`, // Sin unidad
          colPositions.ritmoVel, yOffset
        );
        
        // Nombre y Club: Alineados a la izquierda, con ajuste de texto
        ctx.textAlign = 'left'; 
        ctx.font = '28px Arial'; // Fuente más grande para el nombre
        let nameText = athlete['nombre'] || '-';
        let clubText = athlete['club'] || '-';
        
        // Función para ajustar texto al ancho y alinearlo a la izquierda
        const adjustTextToFit = (text, maxWidth) => {
          let currentText = text;
          // Si el nombre es muy largo, tomar solo el primer nombre y el primer apellido
          const words = text.split(' ');
          if (words.length > 2 && ctx.measureText(text).width > maxWidth) {
            currentText = `${words[0]} ${words[1]}`;
            if (ctx.measureText(currentText).width > maxWidth) { // Si aún es muy largo
              currentText = words[0]; // Solo el primer nombre
            }
          } else {
             // Si el texto es largo pero no tiene más de 2 palabras, truncar con elipsis
            while (ctx.measureText(currentText + '...').width > maxWidth && currentText.length > 0) {
              currentText = currentText.substring(0, currentText.length - 1);
            }
            if (currentText !== text) { // Solo añadir elipsis si se truncó
              currentText += '...';
            }
          }
          return currentText;
        };

        // Ajustar el nombre para que no se solape
        const maxNameWidth = colPositions.club - colPositions.nombre - 20; // Ancho disponible para el nombre
        nameText = adjustTextToFit(nameText, maxNameWidth);
        
        // Ajustar el club para que no se solape
        const maxClubWidth = colPositions.tiempo - colPositions.club - 20; // Ancho disponible para el club
        clubText = adjustTextToFit(clubText, maxClubWidth);

        // Dibujar Nombre alineado a la izquierda de su columna
        ctx.fillText(nameText, colPositions.nombre, yOffset); 
        
        // Dibujar Club alineado a la izquierda de su columna
        ctx.fillText(clubText, colPositions.club, yOffset); 
        
        yOffset += 50;
      });

      // Descargar la imagen
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `Top10_${eventName.replace(/\s/g, '_')}_${categoryName.replace(/\s/g, '_')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    // Cargar logos antes de dibujar
    mainLogo.onload = () => {
      logosLoaded++;
      if (logosLoaded === totalLogos) {
        drawContent();
      }
    };
    eventLogo.onload = () => {
      logosLoaded++;
      if (logosLoaded === totalLogos) {
        drawContent();
      }
    };
    // Si no hay logo de evento, dibujar directamente
    if (!eventLogoUrl) {
      logosLoaded++;
      if (logosLoaded === totalLogos) {
        drawContent();
      }
    }
  };


  if (!selectedEvent) {
    return (
      <div className="flex flex-col justify-center items-center h-64 text-white text-xl">
        <p className="mb-4">Selecciona un evento desde la página de "Explorar Eventos" para ver sus resultados.</p>
        <button
          onClick={() => setPage('home')}
          className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Volver a Inicio
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-white text-xl">
        Cargando resultados para {selectedEvent['Nombre evento']}... Por favor, espera.
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-64 text-red-500 text-xl">
        <p className="mb-4">Error: {error}</p>
        <button
          onClick={() => setPage('home')}
          className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Volver a Inicio
        </button>
      </div>
    );
  }

  if (allResults.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-64 text-white text-xl">
        <p className="mb-4">Aún no hay resultados para {selectedEvent['Nombre evento']}! Vuelve pronto.</p>
        <button
          onClick={() => setPage('home')}
          className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Volver a Inicio
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-3xl font-bold text-white mb-6 text-center">
        Resultados de {selectedEvent['Nombre evento']}
      </h2>

      <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-8 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="categoryFilter" className="block text-gray-300 text-sm font-bold mb-2">
              Filtrar por Categoría:
            </label>
            <select
              id="categoryFilter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition text-gray-900"
            >
              {uniqueCategoriesForEvent.map(category => (
                <option key={category} value={category}>{category === '' ? 'Selecciona una categoría' : category}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="searchAthlete" className="block text-gray-300 text-sm font-bold mb-2">
              Buscar por Dorsal o Nombre:
            </label>
            <input
              type="text"
              id="searchAthlete"
              placeholder="Dorsal o Nombre del Atleta"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition text-gray-900"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <button
            onClick={() => handleGenerateReport('fullEvent')}
            className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition-colors"
          >
            Descargar Resultados Completos
          </button>
          <button
            onClick={() => handleGenerateReport('top5')}
            className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition-colors"
          >
            Descargar Top 5 por Categoría
          </button>
          {selectedCategory && selectedCategory !== '' && selectedCategory !== 'Todas' && filteredAndSearchedResults.length > 0 && (
            <>
              <button
                onClick={() => handleGenerateReport('singleCategory')}
                className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition-colors"
              >
                Generar Reporte de Categoría
              </button>
              <button
                onClick={() => handleGenerateReport('top10Image')}
                className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition-colors"
              >
                Descargar Top 10 (Imagen)
              </button>
            </>
          )}
        </div>
      </div>

      {selectedCategory === '' ? (
        <p className="text-white text-center text-xl mt-8">
          Por favor, selecciona una categoría para ver los resultados de los participantes.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSearchedResults.length > 0 ? (
            filteredAndSearchedResults.map((athlete, index) => (
              <div 
                key={athlete['dorsal'] || `${athlete['nombre']}-${athlete['tiempo']}-${index}`} // Clave estable
                className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 flex flex-col items-center text-center"
              >
                {athlete['foto_url'] && (
                  <img
                    src={getGoogleDriveViewLink(athlete['foto_url'])}
                    alt={`Foto de ${athlete['nombre']}`}
                    className="h-24 w-24 object-cover rounded-full mb-4 border-2 border-gray-600"
                    onError={(e) => { e.target.onerror = null; e.target.src="https://via.placeholder.com/96x96?text=Foto" }}
                  />
                )}
                <h3 className="text-xl font-semibold text-white mb-2">{athlete['nombre']}</h3>
                {athlete['dorsal'] && <p className="text-gray-300 text-sm font-bold text-lg">Dorsal: {athlete['dorsal']}</p>} {/* Dorsal destacado */}
                {athlete['posición categoria'] && (
                  <div className="bg-orange-600 text-white text-lg font-bold px-3 py-1 rounded-md mb-2">
                    Posición: {athlete['posición categoria']}
                  </div>
                )}
                {athlete['posición genero'] && <p className="text-gray-300 text-sm">Pos. Género: {athlete['posición genero']}</p>}
                {athlete['posición general'] && <p className="text-gray-300 text-sm">Pos. General: {athlete['posición general']}</p>}
                {athlete['club'] && <p className="text-gray-300 text-sm">Club: {athlete['club']}</p>}
                {athlete['categoria'] && <p className="text-gray-300 text-sm">Categoría: {athlete['categoria']}</p>}
                
                {/* Visualización del tiempo y ritmo/velocidad */}
                {athlete['tiempo'] && (
                  <p className="text-white text-2xl font-bold mt-2 mb-1">
                    {athlete['tiempo']}
                  </p>
                )}
                {selectedEvent?.deporte?.toLowerCase() === 'running' && athlete['tiempo'] && athlete['Distancia'] && (
                  <p className="text-gray-300 text-sm mb-4">
                    Ritmo: {calculatePaceForCard(athlete['tiempo'], athlete['Distancia'])}
                  </p>
                )}
                {selectedEvent?.deporte?.toLowerCase() !== 'running' && athlete['tiempo'] && athlete['Distancia'] && (
                  <p className="text-gray-300 text-sm mb-4">
                    Velocidad: {calculatePaceForCard(athlete['tiempo'], athlete['Distancia'])} km/h {/* Usar calculateSpeed si es necesario */}
                  </p>
                )}


                <button
                  onClick={() => toggleExpand(athlete['dorsal'])}
                  className="w-full mt-3 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition-colors"
                >
                  {expandedAthleteId === athlete['dorsal'] ? 'Mostrar Menos' : 'Mostrar Más'}
                </button>

                {expandedAthleteId === athlete['dorsal'] && (
                  <div className="mt-4 w-full text-left">
                    {Object.entries(athlete).map(([key, value]) => {
                      const excludedKeys = [
                        'foto_url', 'nombre', 'dorsal', 'posición categoria', 'tiempo', 'id evento', 'categoria',
                        'certificado_url', 'Distancia', 'posición genero', 'posición general', 'club',
                        'deporte', 'VUELTAS',
                        'TV1', 'TV2', 'TV3', 'TV4', 'TV5', 'TV6', 'TV7', 'TV8', 'TV9', 'TV10', 'TV11'
                      ];
                      if (excludedKeys.includes(key) || !value || String(value).trim() === '') {
                        return null;
                      }
                      return (
                        <p key={key} className="text-gray-300 text-sm mb-1">
                          <span className="font-semibold">{key.replace(/_/g, ' ')}:</span> {value}
                        </p>
                      );
                    })}
                    {athlete['certificado_url'] && (
                      <a
                        href={getGoogleDriveViewLink(athlete['certificado_url'])}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full mt-4 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition-colors block text-center"
                      >
                        Ver Certificado
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-white text-center col-span-full">
              No encontramos participantes con esos criterios en esta categoría.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ResultsPage;