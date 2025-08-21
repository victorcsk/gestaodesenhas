import React from 'react';
import { Ticket } from '../contexts/QueueContext';
import { formatDateTime } from '../utils/dateUtils';

interface PrintableTicketProps {
  ticket: Ticket;
  onPrint: () => void;
}

const PrintableTicket: React.FC<PrintableTicketProps> = ({ ticket, onPrint }) => {
  React.useEffect(() => {
    // Auto-print after component mounts
    const timer = setTimeout(() => {
      onPrint();
    }, 100);

    return () => clearTimeout(timer);
  }, [onPrint]);

  return (
    <div className="print:block hidden">
      <div className="max-w-sm mx-auto bg-white p-6 text-center border-2 border-dashed border-gray-400">
        <h2 className="text-xl font-bold mb-4">SENHA DE ATENDIMENTO</h2>
        
        <div className="mb-6">
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {ticket.sector}-{ticket.number.toString().padStart(2, '0')}
          </div>
          <div className="text-sm text-gray-600">
            Setor: {ticket.sector}
          </div>
        </div>

        <div className="text-xs text-gray-500 border-t pt-4">
          <div>Data/Hora: {formatDateTime(ticket.timestamp)}</div>
          <div className="mt-2">
            Aguarde ser chamado no painel
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintableTicket;