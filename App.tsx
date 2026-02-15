import React, { useState } from 'react';
import Navbar from './components/Navbar';
import EntryView from './views/EntryView';
import ResultsView from './views/ResultsView';
import SummaryView from './views/SummaryView';
import MapView from './views/MapView';
import WinnersView from './views/WinnersView';
import DashboardView from './views/DashboardView';
import AdminView from './views/AdminView';

const App: React.FC = () => {
  const [view, setView] = useState<'dashboard' | 'entry' | 'results' | 'summary' | 'map' | 'winners' | 'admin'>('dashboard');
  const [mapFilterParty, setMapFilterParty] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);

  const handleNavigateToMap = (party: string) => {
    setMapFilterParty(party);
    setView('map');
  };

  const handleReload = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen font-hind transition-colors duration-300 dark:bg-slate-900">
      <Navbar view={view} setView={setView} onReload={handleReload} />

      <div className="py-6 px-4 flex justify-center items-start" key={refreshKey}>
        <div className="w-full max-w-7xl">
          {view === 'dashboard' && <DashboardView />}
          {view === 'entry' && <EntryView />}
          {view === 'results' && <ResultsView isAdminMode={isAdminMode} />}
          {view === 'winners' && <WinnersView />}
          {view === 'summary' && <SummaryView onNavigateToMap={handleNavigateToMap} />}
          {view === 'map' && <MapView initialParty={mapFilterParty} />}
          {view === 'admin' && <AdminView isAdminMode={isAdminMode} setIsAdminMode={setIsAdminMode} />}
        </div>
      </div>
    </div>
  );
};

export default App;