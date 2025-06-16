import React from 'react';

const EventCard = ({ event, onSelectEvent }) => {
  // Función para validar si la URL es de Google Drive y necesita ser convertida
  const getImageUrl = (url) => {
    if (url && url.includes('drive.google.com/file/d/')) {
      // Extraer el ID del archivo de Google Drive
      const match = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        // Construir la URL para la vista previa pública
        return `https://docs.google.com/uc?id=${match[1]}`;
      }
    }
    return url; // Si no es de Google Drive o no se puede parsear, devuelve la URL original
  };

  const imageUrl = getImageUrl(event['logo evento']);

  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 flex flex-col items-center text-center">
      {imageUrl && (
        <img
          src={imageUrl}
          alt={`Logo de ${event['Nombre evento']}`}
          className="h-24 w-24 object-contain mb-4 rounded-full"
          onError={(e) => { e.target.onerror = null; e.target.src="https://via.placeholder.com/96x96?text=Logo+No+Disp." }} // Fallback en caso de error de carga
        />
      )}
      <h3 className="text-xl font-semibold text-white mb-2">{event['Nombre evento']}</h3>
      <p className="text-gray-300 text-sm mb-1">Fecha: {event['Fecha']}</p>
      <p className="text-gray-300 text-sm mb-1">Organizador: {event['Organizador']}</p>
      <p className="text-gray-300 text-sm mb-4">Deporte: {event['deporte']}</p>
      <button
        onClick={() => onSelectEvent(event)}
        className="w-full mt-3 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition-colors"
      >
        Ver Resultados
      </button>
    </div>
  );
};

export default EventCard;