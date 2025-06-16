import React, { useState, useEffect, useMemo } from 'react';
import EventCard from './EventCard';
import { parseCsvData, parseDate } from '../utils/helpers';

const EventsPage = ({ onSelectEvent }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSport, setSelectedSport] = useState('Todos');

  // URL de tu hoja de Google Sheets para eventos
  const eventsGoogleSheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQWjDAx17rze56_4sq8mIxro5u1-lTVS6MYe3v6wDqrbG12ARK3b_lPI387qJIfl56fCjHaHEHXQsfi/pub?gid=749744378&single=true&output=csv";

  // Función para cargar y actualizar los eventos
  const fetchAndSetEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(eventsGoogleSheetUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      const parsedEvents = parseCsvData(text);

      // Ordenar eventos por fecha, del más reciente al más antiguo
      const sortedEvents = parsedEvents.sort((a, b) => {
        const dateA = parseDate(a['Fecha']);
        const dateB = parseDate(b['Fecha']);
        return dateB - dateA; // Para ordenar de más reciente a más antiguo
      });

      setEvents(sortedEvents);
    } catch (e) {
      setError("¡No pudimos cargar los eventos! Revisa la URL de tu hoja de Google.");
      console.error("Error fetching events:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAndSetEvents(); // Llama a la función al montar el componente
  }, []); // El array de dependencias vacío asegura que se ejecute solo una vez al montar

  const uniqueSports = useMemo(() => {
    const sports = new Set(events.map(event => event.deporte));
    return ['Todos', ...Array.from(sports)];
  }, [events]);

  const filteredEvents = useMemo(() => {
    let filtered = events;

    if (searchTerm) {
      filtered = filtered.filter(event =>
        event['Nombre evento'].toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedSport !== 'Todos') {
      filtered = filtered.filter(event => event.deporte === selectedSport);
    }

    return filtered;
  }, [events, searchTerm, selectedSport]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-white text-xl">
        Cargando eventos... Por favor, espera.
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64 text-red-500 text-xl">
        ¡Rayos! {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-3xl font-bold text-white mb-6 text-center">Explorar Eventos</h2>

      <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-8 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="search" className="block text-gray-300 text-sm font-bold mb-2">
              Buscar por Nombre:
            </label>
            <input
              type="text"
              id="search"
              placeholder="Ej. San Celestino"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition text-gray-900"
            />
          </div>
          <div>
            <label htmlFor="sportFilter" className="block text-gray-300 text-sm font-bold mb-2">
              Filtrar por Deporte:
            </label>
            <select
              id="sportFilter"
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition text-gray-900"
            >
              {uniqueSports.map(sport => (
                <option key={sport} value={sport}>{sport}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.length > 0 ? (
          filteredEvents.map(event => (
            <EventCard key={event['id evento']} event={event} onSelectEvent={onSelectEvent} />
          ))
        ) : (
          <p className="text-white text-center col-span-full">
            ¡No encontramos eventos con esos criterios! Intenta otra búsqueda.
          </p>
        )}
      </div>
    </div>
  );
};

export default EventsPage;