import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueueProvider } from './contexts/QueueContext';
import { AnalyticsProvider } from './contexts/AnalyticsContext';
import MainLogin from './pages/MainLogin';
import TicketGeneration from './pages/TicketGeneration';
import SectorPanel from './pages/SectorPanel';
import PublicPanel from './pages/PublicPanel';
import AnalyticsDashboard from './pages/AnalyticsDashboard';

function App() {
  const [loggedSector, setLoggedSector] = useState<string | null>(null);

  const handleLogin = (sector: string) => {
    setLoggedSector(sector);
  };

  const handleLogout = () => {
    setLoggedSector(null);
  };

  return (
    <AnalyticsProvider>
      <QueueProvider>
        <Router>
          <Routes>
            {/* Rota principal - tela de login */}
            <Route path="/" element={<MainLogin />} />
            
            {/* Página de retirada de senhas */}
            <Route path="/retirada" element={<TicketGeneration />} />
            
            {/* Painel do setor (acesso direto) */}
            <Route 
              path="/setor/:nome/painel"
              element={
                <SectorPanel 
                  loggedSector={loggedSector} 
                  onLogout={handleLogout} 
                />
              } 
            />
            
            {/* Painel público */}
            <Route path="/painel" element={<PublicPanel />} />
            
            {/* Dashboard de Analytics */}
            <Route path="/analytics" element={<AnalyticsDashboard />} />
            
            {/* Fallback para rotas não encontradas */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </QueueProvider>
    </AnalyticsProvider>
  );
}

export default App;