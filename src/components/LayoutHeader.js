import React from 'react';

const LayoutHeader = ({ setPage }) => {
  const logoUrl = "https://res.cloudinary.com/ddlhr4nyn/image/upload/v1749656725/logo_R_C_c5o3sy.png";

  return (
    <header className="bg-black text-white p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <img src={logoUrl} alt="R&C Sports Eventos Logo" className="h-10 w-10 mr-3" />
          <h1 className="text-2xl font-bold text-orange-500">R&C Sports Eventos</h1>
        </div>
        <nav>
          <ul className="flex space-x-4">
            <li>
              <button
                onClick={() => setPage('home')}
                className="text-white hover:text-orange-300 transition-colors text-lg"
              >
                Inicio
              </button>
            </li>
            <li>
              <button
                onClick={() => setPage('eventos')}
                className="text-white hover:text-orange-300 transition-colors text-lg"
              >
                Eventos
              </button>
            </li>
            <li>
              <button
                onClick={() => setPage('inscritos')}
                className="text-white hover:text-orange-300 transition-colors text-lg"
              >
                Inscritos
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default LayoutHeader;