import React, { useState } from 'react';
import LayoutHeader from './components/LayoutHeader';
import ResultsPage from './components/ResultsPage';
import RegisteredPage from './components/RegisteredPage';
import HomePage from './components/HomePage';
import EventsPage from './components/EventsPage';

const App = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedEvent, setSelectedEvent] = useState(null);

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setCurrentPage('resultados');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'eventos':
        return <EventsPage onSelectEvent={handleSelectEvent} />;
      case 'resultados':
        return <ResultsPage selectedEvent={selectedEvent} setPage={setCurrentPage} />;
      case 'inscritos':
        return <RegisteredPage setPage={setCurrentPage} />;
      case 'home':
      default:
        return <HomePage setPage={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <LayoutHeader setPage={setCurrentPage} />
      <main className="flex-grow p-4">
        {renderPage()}
      </main>
    </div>
  );
};

export default App;