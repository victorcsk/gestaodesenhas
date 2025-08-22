import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Monitor, Users } from 'lucide-react';

const LoginSelection: React.FC = () => {
  const navigate = useNavigate();

  const loginTypes = [
    {
      type: 'analyst',
      title: 'Login de Analista',
      description: 'Acesso para analistas chamarem senhas',
      icon: User,
      color: 'bg-blue-500 hover:bg-blue-600',
      path: '/login/analista'
    },
    {
      type: 'panel',
      title: 'Painel de Senhas (Telão)',
      description: 'Exibição em tempo real para TV',
      icon: Monitor,
      color: 'bg-green-500 hover:bg-green-600',
      path: '/painel'
    },
    {
      type: 'totem',
      title: 'Totem de Retirada',
      description: 'Para clientes retirarem senhas',
      icon: Users,
      color: 'bg-purple-500 hover:bg-purple-600',
      path: '/retirada'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Sistema de Senhas
          </h1>
          <p className="text-xl text-gray-300">
            Selecione o tipo de acesso
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {loginTypes.map((loginType) => {
            const IconComponent = loginType.icon;
            return (
              <button
                key={loginType.type}
                onClick={() => navigate(loginType.path)}
                className={`${loginType.color} text-white p-8 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-opacity-50`}
              >
                <div className="flex flex-col items-center space-y-4">
                  <IconComponent size={64} className="mx-auto" />
                  <h3 className="text-xl font-bold text-center">
                    {loginType.title}
                  </h3>
                  <p className="text-sm opacity-90 text-center">
                    {loginType.description}
                  </p>
                </div>
              </button>
            );
          })}
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

export default LoginSelection;