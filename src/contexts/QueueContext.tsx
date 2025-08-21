import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAnalytics } from '../contexts/AnalyticsContext';

export interface Ticket {
  id: string;
  number: number;
  sector: string;
  timestamp: Date;
  status: 'waiting' | 'current' | 'completed';
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

  // Analytics integration
  const analytics = useAnalytics ? useAnalytics() : null;

  // WebSocket para comunicação em tempo real
  const { emit } = useWebSocket({
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

  const generateTicket = (sector: string): Ticket => {
    const sectorKey = sector.toUpperCase() as keyof QueueState;
    const ticket: Ticket = {
      id: `${sector}-${Date.now()}`,
      number: queues[sectorKey].nextNumber,
      sector,
      timestamp: new Date(),
      status: 'waiting',
    };

    setQueues(prev => ({
      ...prev,
      [sectorKey]: {
        ...prev[sectorKey],
        queue: [...prev[sectorKey].queue, ticket],
        nextNumber: prev[sectorKey].nextNumber + 1,
      }
    }));

    // Emitir evento para outros painéis
    emit('ticket-generated', {
      sector: sectorKey,
      ticket,
      nextNumber: queues[sectorKey].nextNumber + 1
    });

    // Registrar no analytics
    if (analytics) {
      analytics.recordTicketGenerated(sector, ticket.number);
    }

    return ticket;
  };

  const callNext = (sector: string) => {
    const sectorKey = sector.toUpperCase() as keyof QueueState;
    
    setQueues(prev => {
      const currentQueue = prev[sectorKey].queue;
      if (currentQueue.length === 0) return prev;

      const nextTicket = currentQueue[0];
      const remainingQueue = currentQueue.slice(1);

      // Add current ticket to lastCalled if exists
      const updatedLastCalled = prev[sectorKey].current 
        ? [{ ...prev[sectorKey].current, status: 'completed' as const }, ...prev[sectorKey].lastCalled.slice(0, 9)]
        : prev[sectorKey].lastCalled;

      const newState = {
        ...prev,
        [sectorKey]: {
          ...prev[sectorKey],
          current: { ...nextTicket, status: 'current' as const },
          queue: remainingQueue,
          lastCalled: updatedLastCalled,
          totalServed: prev[sectorKey].totalServed + 1,
        }
      };

      // Emitir evento imediatamente com o novo estado
      setTimeout(() => {
        emit('ticket-called', {
          sector: sectorKey,
          current: { ...nextTicket, status: 'current' as const },
          queue: remainingQueue,
          lastCalled: updatedLastCalled,
          totalServed: prev[sectorKey].totalServed + 1
        });
        
        // Registrar no analytics
        if (analytics) {
          const waitTime = Date.now() - nextTicket.timestamp.getTime();
          analytics.recordTicketServed(sector, nextTicket.number, waitTime);
        }
      }, 100);

      return newState;
    });
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
    const sectorKey = sector.toUpperCase() as keyof QueueState;
    setQueues(prev => ({
      ...prev,
      [sectorKey]: {
        current: null,
        queue: [],
        lastCalled: [],
        nextNumber: 1,
        totalServed: 0,
      }
    }));

    // Emitir evento para outros painéis
    emit('queue-reset', { sector: sectorKey });
  };

  const resetAllQueues = () => {
    setQueues(initialState);
    
    // Emitir evento para outros painéis
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