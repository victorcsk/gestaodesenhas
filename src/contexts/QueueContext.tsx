import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useFirebaseSync } from '../hooks/useFirebaseSync';
import { useAnalytics } from '../contexts/AnalyticsContext';
import { useAnalyst } from '../contexts/AnalystContext';
import { database } from '../config/firebase';
import { ref, push, set, serverTimestamp } from 'firebase/database';

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

  // Analyst context
  const analyst = useAnalyst ? useAnalyst() : null;

  // Analytics integration
  const analytics = useAnalytics ? useAnalytics() : null;

  // Firebase para comunicação em tempo real
  const { emit, isConnected } = useFirebaseSync({
    onQueueUpdate: (data) => {
      setQueues(data.queues);
    },
    onTicketGenerated: (data) => {
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


  const generateTicketWithDetails = async (sector: string, clientName?: string, serviceType?: string, analystName?: string): Promise<Ticket> => {
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
      // Salvar no Firebase
      const ticketsRef = ref(database, 'tickets');
      const newTicketRef = push(ticketsRef);
      await set(newTicketRef, {
        id: ticket.id,
        number: ticket.number,
        sector: ticket.sector,
        clientName: ticket.clientName,
        serviceType: ticket.serviceType,
        status: 'waiting',
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString()
      });

      ticket.firebaseKey = newTicketRef.key || '';

      // Registrar no analytics
      if (analytics) {
        analytics.recordTicketGenerated(sector, ticket.number);
      }
    } catch (error) {
      console.error('Erro ao salvar ticket no Firebase:', error);
    }

    return ticket;
  };

  const generateTicket = (sector: string): Promise<Ticket> => {
    return generateTicketWithDetails(sector);
  };

  const callNext = (sector: string) => {
    const sectorKey = sector.toUpperCase() as keyof QueueState;
    const currentAnalyst = analyst?.analystName || 'Analista';
    
    const currentQueue = queues[sectorKey].queue;
    if (currentQueue.length === 0) return;

    const nextTicket = currentQueue[0];
    const previousCurrent = queues[sectorKey].current;

    // Emitir evento para Firebase
    emit('ticket-called', {
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

    // Registrar no analytics
    if (analytics) {
      const waitTime = Date.now() - nextTicket.timestamp.getTime();
      analytics.recordTicketServed(sector, nextTicket.number, waitTime);
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
  const resetQueue = (sector: string) => {
    const sectorKey = sector.toUpperCase();
    emit('queue-reset', { sector: sectorKey });
  };

  const resetAllQueues = () => {
    emit('queue-reset', { sector: 'ALL' });
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