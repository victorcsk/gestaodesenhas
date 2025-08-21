import React, { useState } from 'react';
import { User, LogIn } from 'lucide-react';
import { useAnalyst } from '../contexts/AnalystContext';

interface AnalystLoginProps {
  onLogin: () => void;
}

const AnalystLogin: React.FC<AnalystLoginProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const { setAnalystName } = useAnalyst();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      setAnalystName(name.trim());
      onLogin();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Sistema de Senhas
            </h1>
            <p className="text-gray-600">
              Identifique-se para continuar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="analystName" className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Analista *
              </label>
              <input
                type="text"
                id="analystName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                placeholder="Digite seu nome completo"
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={!name.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <LogIn className="w-5 h-5" />
              <span>Entrar no Sistema</span>
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Seu nome aparecerá nas senhas geradas</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalystLogin;