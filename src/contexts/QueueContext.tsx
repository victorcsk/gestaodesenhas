import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useFirebaseSync } from '../hooks/useFirebaseSync';
import { useAnalyst } from '../contexts/AnalystContext';

export interface Ticket {
  id: string;
  number: number;
  sector: string;
  clientName?: string;
  serviceType?: string;
  analystName?: string;
  timestamp: Date;
  status: 'waiting' | 'current' | 'completed';
  calledByAnalyst?: string;
  firebaseKey?: string;
}

export interface SectorQueue {
  current: Ticket | null;
  queue: Ticket[];
  lastCalled: Ticket[];
  nextNumber: number;
  totalServed: number;
}

interface QueueState {
  SUPORTE: SectorQueue;
  HARDWARE: SectorQueue;
  TELEFONIA: SectorQueue;
  ATIVOS: SectorQueue;
}

interface QueueContextType {
  queues: QueueState;
  generateTicket: (sector: string) => Ticket;
  callNext: (sector: string) => void;
  getCurrentTicket: (sector: string) => Ticket | null;
  getQueueForSector: (sector: string) => Ticket[];
  getLastCalledForSector: (sector: string) => Ticket[];
  resetQueue: (sector: string) => void;
  resetAllQueues: () => void;
  getTotalServed: (sector: string) => number;
  generateTicketWithDetails: (sector: string, clientName?: string, serviceType?: string, analystName?: string) => Ticket;
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

const initialState: QueueState = {
  SUPORTE: { current: null, queue: [], lastCalled: [], nextNumber: 1, totalServed: 0 },
  HARDWARE: { current: null, queue: [], lastCalled: [], nextNumber: 1, totalServed: 0 },
  TELEFONIA: { current: null, queue: [], lastCalled: [], nextNumber: 1, totalServed: 0 },
  ATIVOS: { current: null, queue: [], lastCalled: [], nextNumber: 1, totalServed: 0 },
};

export const QueueProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [queues, setQueues] = useState<QueueState>(initialState);
  const [isLoading, setIsLoading] = useState(false);

  // Analyst context
  const { analystName } = useAnalyst();

  // Firebase para comunicação em tempo real
  const { emit, isConnected } = useFirebaseSync({
    onQueueUpdate: (data) => {
      console.log('📥 Recebendo atualização das filas:', data);
      setQueues(data.queues);
    },
    onTicketGenerated: (data) => {
      console.log('📥 Ticket gerado recebido:', data);
      setQueues(prev => ({
        ...prev,
        [data.sector]: {
          ...prev[data.sector as keyof QueueState],
          queue: [...prev[data.sector as keyof QueueState].queue, data.ticket],
          nextNumber: data.nextNumber,
        }
      }));
    },
    onTicketCalled: (data) => {
      console.log('📥 Ticket chamado recebido:', data);
      setQueues(prev => {
        const sectorKey = data.sector as keyof QueueState;
        return {
          ...prev,
          [sectorKey]: {
            ...prev[sectorKey],
            current: data.current,
            queue: data.queue,
            lastCalled: data.lastCalled,
            totalServed: data.totalServed,
          }
        };
      });
    },
    onQueueReset: (data) => {
      console.log('📥 Reset recebido:', data);
      if (data.sector === 'ALL') {
        setQueues(initialState);
      } else {
        setQueues(prev => ({
          ...prev,
          [data.sector]: {
            current: null,
            queue: [],
            lastCalled: [],
            nextNumber: 1,
            totalServed: 0,
          }
        }));
      }
    }
  });

  const generateTicket = async (sector: string): Promise<Ticket> => {
    return generateTicketWithDetails(sector);
  };


  const generateTicketWithDetails = async (sector: string, clientName?: string, serviceType?: string, analystName?: string): Promise<Ticket> => {
    setIsLoading(true);
    const sectorKey = sector.toUpperCase() as keyof QueueState;
    const ticket: Ticket = {
      id: `${sector}-${Date.now()}`,
      number: queues[sectorKey].nextNumber,
      sector,
      clientName,
      serviceType,
      analystName, // Manter para saber quem gerou, mas quem chama pode ser diferente
      timestamp: new Date(),
      status: 'waiting',
    };

    try {
      console.log('🎫 Gerando ticket:', ticket);
      
      // Emitir para Firebase
      await emit('ticket-generated', {
        sector: sectorKey,
        ticket: ticket,
        nextNumber: queues[sectorKey].nextNumber + 1
      });

      console.log('✅ Ticket enviado para Firebase');
      
    } catch (error) {
      console.error('❌ Erro ao gerar ticket:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }

    return ticket;
  };

  const callNext = async (sector: string) => {
    setIsLoading(true);
    const sectorKey = sector.toUpperCase() as keyof QueueState;
    const currentAnalyst = analystName || 'Analista';
    
    const currentQueue = queues[sectorKey].queue;
    if (currentQueue.length === 0) {
      setIsLoading(false);
      return;
    }

    const nextTicket = currentQueue[0];
    const previousCurrent = queues[sectorKey].current;

    try {
      console.log('📞 Chamando próximo ticket:', nextTicket);
      
      // Emitir evento para Firebase
      await emit('ticket-called', {
        sector: sectorKey,
        current: {
          ...nextTicket,
          calledByAnalyst: currentAnalyst,
          status: 'current'
        },
        previousCurrent: previousCurrent ? {
          ...previousCurrent,
          firebaseKey: previousCurrent.firebaseKey
        } : null
      });

      console.log('✅ Chamada enviada para Firebase');
      
    } catch (error) {
      console.error('❌ Erro ao chamar ticket:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentTicket = (sector: string): Ticket | null => {
    const sectorKey = sector.toUpperCase() as keyof QueueState;
    return queues[sectorKey].current;
  };

  const getQueueForSector = (sector: string): Ticket[] => {
    const sectorKey = sector.toUpperCase() as keyof QueueState;
    return queues[sectorKey].queue;
  };

  const getLastCalledForSector = (sector: string): Ticket[] => {
    const sectorKey = sector.toUpperCase() as keyof QueueState;
    return queues[sectorKey].lastCalled;
  };
  const resetQueue = async (sector: string) => {
    const sectorKey = sector.toUpperCase();
    try {
      await emit('queue-reset', { sector: sectorKey });
    } catch (error) {
      console.error('❌ Erro ao resetar fila:', error);
    }
  };

  const resetAllQueues = async () => {
    try {
      await emit('queue-reset', { sector: 'ALL' });
    } catch (error) {
      console.error('❌ Erro ao resetar todas as filas:', error);
    }
  };

  const getTotalServed = (sector: string): number => {
    const sectorKey = sector.toUpperCase() as keyof QueueState;
    return queues[sectorKey].totalServed;
  };

  return (
    <QueueContext.Provider value={{
      queues,
      generateTicket,
      callNext,
      getCurrentTicket,
      getQueueForSector,
      getLastCalledForSector,
      resetQueue,
      resetAllQueues,
      getTotalServed,
      generateTicketWithDetails,
      isConnected,
      isLoading,
      isConnected,
    }}>
      {children}
    </QueueContext.Provider>
  );
};

export const useQueue = () => {
  const context = useContext(QueueContext);
  if (context === undefined) {
    throw new Error('useQueue must be used within a QueueProvider');
  }
  return context;
};