import React, { useState, useEffect } from 'react';
import { parseCsvData } from '../utils/helpers';

const RegisteredPage = ({ setPage }) => {
  const [registered, setRegistered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // URL de tu hoja de Google Sheets para inscritos (ejemplo, reemplaza con tu URL real)
  const googleSheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR_C_c5o3sy/pub?output=csv"; // Esta URL debe ser la de tus inscritos

  useEffect(() => {
    const fetchRegistered = async () => {
      try {
        const response = await fetch(googleSheetUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        const parsedRegistered = parseCsvData(text);
        setRegistered(parsedRegistered);
      } catch (e) {
        setError("No pudimos cargar la lista de inscritos. ¡Revisa la URL de tu hoja de Google!");
        console.error("Error fetching registered:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchRegistered();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-white text-xl">
        Cargando inscritos... ¡Ya casi!
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-64 text-red-500 text-xl">
        <p className="mb-4">¡Ay caray! {error}</p>
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
      <h2 className="text-3xl font-bold text-white mb-6 text-center">Listado de Inscritos</h2>
      <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-700">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Evento</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Categoría</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {registered.map((person, index) => (
              <tr key={index} className="hover:bg-gray-700 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-white">{person.event}</td>
                <td className="px-6 py-4 whitespace-nowrap text-white">{person.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-white">{person.category}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    person.status === 'Inscrito' ? 'bg-green-100 text-green-800' :
                    person.status === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {person.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RegisteredPage;