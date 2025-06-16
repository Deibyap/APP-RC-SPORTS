import React from 'react';

const HomePage = ({ setPage }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-white text-center p-6">
      <h2 className="text-5xl font-extrabold mb-4 animate-pulse text-orange-500">
        ¡Bienvenido a R&C Sports Eventos!
      </h2>
      <p className="text-xl mb-8 max-w-2xl">
        Aquí podrás consultar los resultados más recientes y los listados de inscritos de tus eventos deportivos favoritos.
        ¡No te pierdas ni un detalle de la acción!
      </p>
      <div className="flex space-x-4">
        <button
          onClick={() => setPage('eventos')}
          className="bg-orange-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-orange-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          Explorar Eventos
        </button>
        <button
          onClick={() => setPage('inscritos')}
          className="bg-gray-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          Ver Inscritos
        </button>
      </div>
    </div>
  );
};

export default HomePage;