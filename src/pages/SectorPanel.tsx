import React from 'react';
import { useEffect } from 'react';
import { useQueue } from '../contexts/QueueContext';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, Users, CheckCircle, LogOut, RotateCcw } from 'lucide-react';
import { formatTime } from '../utils/dateUtils';
import ConnectionStatus from '../components/ConnectionStatus';
import { useWebSocket } from '../hooks/useWebSocket';
import { useSoundNotification } from '../hooks/useSoundNotification';

interface SectorPanelProps {
  loggedSector: string | null;
  onLogout: () => void;
}

const SectorPanel: React.FC<SectorPanelProps> = ({ loggedSector, onLogout }) => {
  const { nome } = useParams<{ nome: string }>();
  const navigate = useNavigate();
  const { getCurrentTicket, getQueueForSector, getLastCalledForSector, callNext, resetQueue, getTotalServed } = useQueue();
  const [refreshKey, setRefreshKey] = React.useState(0);
  const { playNotificationSound } = useSoundNotification();
  
  // WebSocket para indicador de conexão
  const { isConnected, isConnecting } = useWebSocket({
    onQueueUpdate: () => {},
    onTicketGenerated: () => {},
    onTicketCalled: () => {},
    onQueueReset: () => {}
  });

  // Permitir acesso direto sem verificação de login
  // if (!nome || !loggedSector || nome.toUpperCase() !== loggedSector) {
  //   return <Navigate to={`/setor/${nome}`} replace />;
  // }

  // Forçar re-render quando houver mudanças
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const sector = nome.toUpperCase();
  const currentTicket = getCurrentTicket(sector);
  const queue = getQueueForSector(sector);
  const lastCalled = getLastCalledForSector(sector);
  const totalServed = getTotalServed(sector);

  const handleCallNext = () => {
    callNext(sector);
    // Tocar som de confirmação para o atendente
    setTimeout(() => {
      playNotificationSound();
    }, 100);
  };

  const handleLogoutClick = () => {
    onLogout();
    navigate('/');
  };

  const handleReset = () => {
    if (window.confirm(`Tem certeza que deseja resetar as senhas do setor ${sector}?`)) {
      resetQueue(sector);
      alert(`Senhas do setor ${sector} resetadas com sucesso!`);
    }
  };

  const sectorColors = {
    SUPORTE: 'from-blue-500 to-blue-600',
    HARDWARE: 'from-orange-500 to-orange-600',
    TELEFONIA: 'from-green-500 to-green-600',
    ATIVOS: 'from-purple-500 to-purple-600',
  };

  const bgColor = sectorColors[sector as keyof typeof sectorColors] || 'from-gray-500 to-gray-600';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className={`bg-gradient-to-r ${bgColor} text-white p-6 shadow-lg`}>
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Painel do Setor {sector}</h1>
            <p className="opacity-90 mt-1">
              Sistema de Gerenciamento de Senhas • {totalServed} pessoas atendidas hoje
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleReset}
              className="flex items-center space-x-2 bg-red-500 bg-opacity-80 hover:bg-opacity-100 px-4 py-2 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
            <button
              onClick={handleLogoutClick}
              className="flex items-center space-x-2 bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Ticket */}
          <div className="lg:col-span-3 bg-white rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Senha Atual</h2>
            {currentTicket ? (
              <div className={`text-8xl font-bold bg-gradient-to-r ${bgColor} bg-clip-text text-transparent mb-4`}>
                {currentTicket.number}
              </div>
            ) : (
              <div className="text-4xl text-gray-400 mb-4">Nenhuma senha</div>
            )}
            <button
              onClick={handleCallNext}
              disabled={queue.length === 0}
              className={`px-8 py-4 rounded-lg font-semibold text-white transition-colors ${
                queue.length > 0
                  ? `bg-gradient-to-r ${bgColor} hover:opacity-90`
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              <ArrowRight className="w-5 h-5 inline mr-2" />
              Chamar Próxima
            </button>
          </div>

          {/* Queue */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Aguardando Atendimento ({queue.length})
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {queue.length > 0 ? (
                queue.map((ticket) => (
                  <div key={ticket.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-semibold text-gray-800">{ticket.number}</span>
                    <span className="text-sm text-gray-500">{formatTime(ticket.timestamp)}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">Nenhuma senha na fila</p>
              )}
            </div>
          </div>

          {/* Last Called */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              Últimas Senhas Chamadas
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {lastCalled.length > 0 ? (
                lastCalled.map((ticket) => (
                  <div key={ticket.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="font-semibold text-gray-800">{ticket.number}</span>
                    <span className="text-xs text-green-600 font-medium">ATENDIDA</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">Nenhuma senha chamada ainda</p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Resumo do Dia
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Pessoas Atendidas:</span>
                <span className="font-semibold text-green-600">{totalServed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Na Fila:</span>
                <span className="font-semibold text-blue-600">{queue.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Atual:</span>
                <span className="font-semibold text-purple-600">
                  {currentTicket ? currentTicket.number : 'Nenhuma'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Connection Status */}
      <ConnectionStatus isConnected={isConnected} isConnecting={isConnecting} />
    </div>
  );
};

export default SectorPanel;