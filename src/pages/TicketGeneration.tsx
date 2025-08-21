import React, { useState } from 'react';
import { useQueue } from '../contexts/QueueContext';
import { Ticket, Printer, Phone, HardDrive, ArrowLeft, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PrintableTicket from '../components/PrintableTicket';

const TicketGeneration: React.FC = () => {
  const { generateTicket } = useQueue();
  const navigate = useNavigate();
  const [lastTicket, setLastTicket] = useState<Ticket | null>(null);
  const [showPrintable, setShowPrintable] = useState(false);

  const sectors = [
    { 
      name: 'SUPORTE', 
      label: 'Suporte a Sistemas', 
      icon: HardDrive, 
      color: 'bg-blue-500 hover:bg-blue-600',
      description: 'Manutenção em sistemas e aplicações como pacote Office e aplicações'
    },
    { 
      name: 'HARDWARE', 
      label: 'Setor Hardware', 
      icon: Ticket, 
      color: 'bg-orange-500 hover:bg-orange-600',
      description: 'Manutenção física, troca de teclas e teclados, máquinas quebradas'
    },
    { 
      name: 'TELEFONIA', 
      label: 'Setor Telefonia', 
      icon: Phone, 
      color: 'bg-green-500 hover:bg-green-600',
      description: 'Manutenção em aparelhos, trocas de aparelho, novos celulares'
    },
    { 
      name: 'ATIVOS', 
      label: 'Gestão de Ativos', 
      icon: Package, 
      color: 'bg-purple-500 hover:bg-purple-600',
      description: 'Troca de máquinas, devoluções, impressão de etiquetas'
    },
  ];

  const handleGenerateTicket = (sector: string) => {
    const ticket = generateTicket(sector);
    setLastTicket(ticket);
    setShowPrintable(true);
  };

  const handlePrint = () => {
    window.print();
    setShowPrintable(false);
    setLastTicket(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {/* Botão Voltar */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-1 bg-white hover:bg-gray-50 px-3 py-2 rounded-lg shadow-md transition-colors text-sm text-gray-600"
        >
          <ArrowLeft size={16} />
          <span>Voltar</span>
        </button>
      </div>

      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Sistema de Senhas
          </h1>
          <p className="text-gray-600 text-lg">
            Selecione o setor para retirar sua senha de atendimento
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {sectors.map((sector) => {
            const IconComponent = sector.icon;
            return (
              <button
                key={sector.name}
                onClick={() => handleGenerateTicket(sector.name)}
                className={`${sector.color} text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-opacity-50 text-left`}
              >
                <div className="flex items-start space-x-4">
                  <IconComponent size={40} className="flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">
                      {sector.label}
                    </h3>
                    <p className="text-sm opacity-90 leading-relaxed">
                      {sector.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <div className="flex items-center justify-center space-x-2 text-gray-500">
            <Printer size={20} />
            <span className="text-sm">
              A senha será impressa automaticamente após a geração
            </span>
          </div>
        </div>
      </div>

      {/* Printable ticket component */}
      {showPrintable && lastTicket && (
        <PrintableTicket ticket={lastTicket} onPrint={handlePrint} />
      )}
    </div>
  );
};

export default TicketGeneration;