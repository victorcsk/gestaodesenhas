import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Monitor, Phone, Package, Users, RotateCcw, HardDrive, BarChart3 } from 'lucide-react';
import { useQueue } from '../contexts/QueueContext';
import { useAnalytics } from '../contexts/AnalyticsContext';

const MainLogin: React.FC = () => {
  const navigate = useNavigate();
  const { resetAllQueues } = useQueue();
  const { getTodayTotal } = useAnalytics();

  const sectors = [
    { 
      name: 'SUPORTE', 
      label: 'Suporte a Sistemas', 
      icon: Monitor, 
      color: 'bg-blue-500 hover:bg-blue-600',
      path: '/setor/suporte/painel'
    },
    { 
      name: 'HARDWARE', 
      label: 'Setor Hardware', 
      icon: HardDrive, 
      color: 'bg-orange-500 hover:bg-orange-600',
      path: '/setor/hardware/painel'
    },
    { 
      name: 'TELEFONIA', 
      label: 'Setor Telefonia', 
      icon: Phone, 
      color: 'bg-green-500 hover:bg-green-600',
      path: '/setor/telefonia/painel'
    },
    { 
      name: 'ATIVOS', 
      label: 'Gestão de Ativos', 
      icon: Package, 
      color: 'bg-purple-500 hover:bg-purple-600',
      path: '/setor/ativos/painel'
    },
  ];

  const handleSectorLogin = (path: string) => {
    navigate(path);
  };

  const handleResetAll = () => {
    if (window.confirm('Tem certeza que deseja resetar todas as senhas? Esta ação não pode ser desfeita.')) {
      resetAllQueues();
      alert('Todas as senhas foram resetadas com sucesso!');
    }
  };

  const handlePublicPanel = () => {
    navigate('/painel');
  };

  const handleTicketGeneration = () => {
    navigate('/retirada');
  };

  const handleAnalytics = () => {
    navigate('/analytics');
  };

  const todayTotal = getTodayTotal();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Sistema de Senhas
          </h1>
          <p className="text-xl text-gray-300">
            Selecione uma opção para continuar
          </p>
          {todayTotal > 0 && (
            <div className="mt-4 inline-block bg-green-500 bg-opacity-20 text-green-300 px-4 py-2 rounded-lg">
              <span className="text-sm">Hoje: </span>
              <span className="font-bold text-lg">{todayTotal}</span>
              <span className="text-sm"> atendimentos realizados</span>
            </div>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {/* Botões dos Setores */}
          {sectors.map((sector) => {
            const IconComponent = sector.icon;
            return (
              <button
                key={sector.name}
                onClick={() => handleSectorLogin(sector.path)}
                className={`${sector.color} text-white p-8 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-opacity-50`}
              >
                <div className="flex flex-col items-center space-y-4">
                  <IconComponent size={48} className="mx-auto" />
                  <span className="text-lg font-semibold text-center">
                    {sector.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {/* Botão Retirada de Senhas */}
          <button
            onClick={handleTicketGeneration}
            className="bg-yellow-500 hover:bg-yellow-600 text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-yellow-300"
          >
            <div className="flex flex-col items-center space-y-3">
              <Users size={32} />
              <span className="font-semibold">Retirar Senha</span>
            </div>
          </button>

          {/* Botão Painel Público */}
          <button
            onClick={handlePublicPanel}
            className="bg-gray-600 hover:bg-gray-700 text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-gray-400"
          >
            <div className="flex flex-col items-center space-y-3">
              <Monitor size={32} />
              <span className="font-semibold">Painel Público</span>
            </div>
          </button>

          {/* Botão Analytics */}
          <button
            onClick={handleAnalytics}
            className="bg-indigo-500 hover:bg-indigo-600 text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-300"
          >
            <div className="flex flex-col items-center space-y-3">
              <BarChart3 size={32} />
              <span className="font-semibold">Analytics</span>
            </div>
          </button>

          {/* Botão Reset */}
          <button
            onClick={handleResetAll}
            className="bg-red-500 hover:bg-red-600 text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-red-300"
          >
            <div className="flex flex-col items-center space-y-3">
              <RotateCcw size={32} />
              <span className="font-semibold">Reset Diário</span>
            </div>
          </button>
        </div>

        <div className="text-center mt-8 text-gray-400">
          <p className="text-sm">
            Sistema de Gerenciamento de Senhas Internas
          </p>
        </div>
      </div>
    </div>
  );
};

export default MainLogin;