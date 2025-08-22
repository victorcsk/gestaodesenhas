import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueueProvider } from './contexts/QueueContext';
import { AnalyticsProvider } from './contexts/AnalyticsContext';
import { AnalystProvider, useAnalyst } from './contexts/AnalystContext';
import LoginSelection from './pages/LoginSelection';
import AnalystLogin from './pages/AnalystLogin';
import AnalystPanel from './pages/AnalystPanel';
import TicketGeneration from './pages/TicketGeneration';
import SectorPanel from './pages/SectorPanel';
import PublicPanel from './pages/PublicPanel';
import AnalyticsDashboard from './pages/AnalyticsDashboard';

const AppContent: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Rota principal - seleção de tipo de login */}
        <Route path="/" element={<LoginSelection />} />
        
        {/* Login de analista */}
        <Route path="/login/analista" element={<AnalystLogin />} />
        
        {/* Painel do analista */}
        <Route path="/analista/painel" element={<AnalystPanel />} />
        
        {/* Página de retirada de senhas */}
        <Route path="/retirada" element={<TicketGeneration />} />
        
        {/* Painel do setor para analistas */}
        <Route 
          path="/analista/setor/:nome/painel"
          element={<SectorPanel />} 
        />
        
        {/* Painel público */}
        <Route path="/painel" element={<PublicPanel />} />
        
        {/* Dashboard de Analytics */}
        <Route path="/analytics" element={<AnalyticsDashboard />} />
        
        {/* Fallback para rotas não encontradas */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <AnalystProvider>
      <AnalyticsProvider>
        <QueueProvider>
          <AppContent />
        </QueueProvider>
      </AnalyticsProvider>
    </AnalystProvider>
  );
}

export default App;