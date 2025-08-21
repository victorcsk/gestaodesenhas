import React, { useState } from 'react';
import { useQueue } from '../contexts/QueueContext';
import { useAnalyst } from '../contexts/AnalystContext';
import { Ticket, Printer, Phone, Computer, ArrowLeft, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PrintableTicket from '../components/PrintableTicket';
import ServiceModal from '../components/ServiceModal';
import InfoModal from '../components/InfoModal';

const TicketGeneration: React.FC = () => {
  const { generateTicketWithDetails } = useQueue();
  const { analystName } = useAnalyst();
  const navigate = useNavigate();
  const [lastTicket, setLastTicket] = useState<Ticket | null>(null);
  const [showPrintable, setShowPrintable] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedSector, setSelectedSector] = useState<string>('');
  const [modalTitle, setModalTitle] = useState('');
  const [modalServices, setModalServices] = useState<string[]>([]);

  const sectors = [
    {
      name: 'SUPORTE_COMPUTADORES',
      label: 'Suporte a Computadores',
      icon: Computer,
      color: 'bg-blue-500 hover:bg-blue-600',
      description: 'Suporte técnico em sistemas e hardware de computadores'
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

  const handleSectorClick = (sectorName: string) => {
    if (sectorName === 'SUPORTE_COMPUTADORES') {
      setShowInfoModal(true);
      return;
    }

    if (sectorName === 'TELEFONIA') {
      setSelectedSector('TELEFONIA');
      setModalTitle('Setor Telefonia');
      setModalServices([
        'Manutenção em aparelhos celulares',
        'Troca de aparelho',
        'Novos celulares'
      ]);
      setShowServiceModal(true);
      return;
    }

    if (sectorName === 'ATIVOS') {
      setSelectedSector('ATIVOS');
      setModalTitle('Gestão de Ativos');
      setModalServices([
        'Troca de máquinas',
        'Devoluções',
        'Impressão de etiquetas',
        'Next'
      ]);
      setShowServiceModal(true);
      return;
    }
  };

  const handleInfoModalConfirm = () => {
    setShowInfoModal(false);
    setSelectedSector('SUPORTE_COMPUTADORES');
    setModalTitle('Suporte a Computadores');
    setModalServices([
      'Manutenção em sistemas e aplicações como pacote Office e outros',
      'Manutenção física, troca de teclas e teclados, máquinas quebradas'
    ]);
    setShowServiceModal(true);
  };

  const handleServiceModalConfirm = (clientName: string, serviceType: string) => {
    let actualSector = selectedSector;
    
    // Para suporte a computadores, determinar o setor real baseado no tipo de serviço
    if (selectedSector === 'SUPORTE_COMPUTADORES') {
      if (serviceType.includes('sistemas e aplicações')) {
        actualSector = 'SUPORTE';
      } else if (serviceType.includes('física, troca de teclas')) {
        actualSector = 'HARDWARE';
      }
    }

    const ticket = generateTicketWithDetails(actualSector, clientName, serviceType, analystName || undefined);
    setLastTicket(ticket);
    setShowPrintable(true);
  };

  const handlePrint = () => {
    window.print();
    setShowPrintable(false);
    setLastTicket(null);
  };

  const handleCloseModals = () => {
    setShowServiceModal(false);
    setShowInfoModal(false);
    setSelectedSector('');
    setModalTitle('');
    setModalServices([]);
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
          {analystName && (
            <div className="mt-4 inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-lg">
              <span className="text-sm">Analista responsável: </span>
              <span className="font-semibold">{analystName}</span>
            </div>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {sectors.map((sector) => {
            const IconComponent = sector.icon;
            return (
              <button
                key={sector.name}
                onClick={() => handleSectorClick(sector.name)}
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

      {/* Info Modal */}
      <InfoModal
        isOpen={showInfoModal}
        onClose={handleCloseModals}
        onConfirm={handleInfoModalConfirm}
        title="Informação Importante"
        message="Caso não tenha chamado enquanto aguarda, favor abrir chamado antes de solicitar suporte através do telefone 0800 970 2300."
      />

      {/* Service Modal */}
      <ServiceModal
        isOpen={showServiceModal}
        onClose={handleCloseModals}
        onConfirm={handleServiceModalConfirm}
        title={modalTitle}
        services={modalServices}
      />

      {/* Printable ticket component */}
      {showPrintable && lastTicket && (
        <PrintableTicket ticket={lastTicket} onPrint={handlePrint} />
      )}
    </div>
  );
};

export default TicketGeneration;