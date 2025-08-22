import React from 'react';
import { useEffect } from 'react';
import { useQueue } from '../contexts/QueueContext';
import { Clock, Users, Monitor, ArrowLeft, Package, HardDrive, Phone } from 'lucide-react';
import { formatTime } from '../utils/dateUtils';
import { useNavigate } from 'react-router-dom';
import ConnectionStatus from '../components/ConnectionStatus';
import { useFirebaseSync } from '../hooks/useFirebaseSync';
import { useSoundNotification } from '../hooks/useSoundNotification';
import SoundToggle from '../components/SoundToggle';

const PublicPanel: React.FC = () => {
  const { getCurrentTicket, getQueueForSector, getTotalServed, getLastCalledForSector } = useQueue();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const [lastAnnouncedTicket, setLastAnnouncedTicket] = React.useState<string | null>(null);
  const { playTicketCalledSound } = useSoundNotification();
  
  // Firebase para indicador de conexão
  const { isConnected, isConnecting } = useFirebaseSync({
    onQueueUpdate: () => {},
    onTicketGenerated: () => {},
    onTicketCalled: (data) => {
      // Verificar se é uma nova chamada para tocar o som
      if (data.current) {
        const ticketId = `${data.sector}-${data.current.number}-${data.current.timestamp}`;
        if (ticketId !== lastAnnouncedTicket && (window as any).soundEnabled !== false) {
          setLastAnnouncedTicket(ticketId);
          setTimeout(() => {
            playTicketCalledSound(data.sector, data.current.number);
          }, 500);
        }
      }
    },
    onQueueReset: () => {}
  });

  const sectors = [
    { name: 'SUPORTE', color: 'from-blue-500 to-blue-600', icon: Monitor },
    { name: 'HARDWARE', color: 'from-orange-500 to-orange-600', icon: HardDrive },
    { name: 'TELEFONIA', color: 'from-green-500 to-green-600', icon: Phone },
    { name: 'ATIVOS', color: 'from-purple-500 to-purple-600', icon: Package },
  ];

  // Atualizar relógio em tempo real
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-black bg-opacity-30 backdrop-blur-sm p-6 text-white">
        <div className="max-w-7xl mx-auto text-center">
          <div className="absolute top-4 right-4">
            <button
              onClick={() => navigate('/painel')}
              className="flex items-center space-x-1 bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-2 rounded-lg transition-colors text-sm"
            >
              <span>Painel de Senhas</span>
            </button>
          </div>
          <h1 className="text-4xl font-bold mb-2">Painel de Senhas</h1>
          <p className="text-xl opacity-90">Sistema de Atendimento Interno</p>
        </div>
      </div>

      {/* Real-time clock */}
      <div className="text-center py-6 text-white">
        <div className="text-2xl font-mono">
          {currentTime.toLocaleTimeString('pt-BR')}
        </div>
        <div className="text-sm opacity-80">
          {currentTime.toLocaleDateString('pt-BR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Sectors Grid */}
      <div className="max-w-7xl mx-auto p-4 grid gap-4 grid-cols-2 lg:grid-cols-4">
        {sectors.map((sector) => {
          const currentTicket = getCurrentTicket(sector.name);
          const queue = getQueueForSector(sector.name);
          const totalServed = getTotalServed(sector.name);
          const lastCalled = getLastCalledForSector(sector.name);
          const IconComponent = sector.icon;

          return (
            <div
              key={sector.name}
              className="bg-white rounded-xl shadow-xl overflow-hidden transform hover:scale-102 transition-transform duration-300"
            >
              {/* Sector Header */}
              <div className={`bg-gradient-to-r ${sector.color} p-4 text-white`}>
                <div className="flex items-center justify-center space-x-2 mb-1">
                  <IconComponent size={24} />
                  <h2 className="text-lg font-bold">{sector.name}</h2>
                </div>
                <div className="text-center opacity-90">
                  <span className="text-xs">{totalServed} atendidas hoje</span>
                </div>
              </div>

              {/* Current Ticket */}
              <div className="p-4 text-center">
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-gray-700 mb-3">
                    Senha Atual
                  </h3>
                  {currentTicket ? (
                    <div>
                      <div className="text-3xl font-bold text-blue-600 mb-1">
                        {currentTicket.clientName || `Cliente ${currentTicket.number}`}
                      </div>
                      <div className="text-lg text-gray-700 mb-1">
                        Senha: {sector.name}-{currentTicket.number.toString().padStart(2, '0')}
                      </div>
                      {currentTicket.calledByAnalyst && (
                        <div className="text-sm text-blue-600 mb-1">
                          Analista: {currentTicket.calledByAnalyst}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 flex items-center justify-center space-x-1">
                        <Clock size={12} />
                        <span>Chamada às {formatTime(currentTicket.timestamp)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-400">
                      <div className="text-2xl mb-1">Nenhum cliente</div>
                      <div className="text-xs">Aguardando</div>
                    </div>
                  )}
                </div>

                {/* Queue Preview */}
                <div className="border-t pt-3">
                  <div className="text-center">
                    <h4 className="text-sm font-semibold text-gray-600 mb-2">
                      Pessoas na Fila
                    </h4>
                    <div className="text-2xl font-bold text-blue-600">
                      {queue.length}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="text-center text-white opacity-60 py-4 mt-6">
        <p className="text-sm">
          Sistema de Senhas Interno • Atualização em tempo real •{' '}
          <button
            onClick={() => navigate('/')}
            className="underline hover:text-gray-300"
          >
            Voltar à seleção
          </button>
        </p>
      </div>
      
      {/* Connection Status */}
      <ConnectionStatus isConnected={isConnected} isConnecting={isConnecting} />
      
      {/* Sound Toggle */}
      <SoundToggle />
    </div>
  );
};

export default PublicPanel;