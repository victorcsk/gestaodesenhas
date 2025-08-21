import { useEffect, useRef } from 'react';
import { database } from '../config/firebase';
import { ref, onValue, set, push, serverTimestamp, connectDatabaseEmulator } from 'firebase/database';

interface FirebaseSyncProps {
  onQueueUpdate: (data: any) => void;
  onTicketGenerated: (data: any) => void;
  onTicketCalled: (data: any) => void;
  onQueueReset: (data: any) => void;
}

export const useFirebaseSync = ({ 
  onQueueUpdate, 
  onTicketGenerated, 
  onTicketCalled, 
  onQueueReset 
}: FirebaseSyncProps) => {
  const isConnected = useRef(false);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Inicializar apenas uma vez
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Monitorar conexão
    const connectedRef = ref(database, '.info/connected');
    const unsubscribeConnection = onValue(connectedRef, (snapshot) => {
      isConnected.current = snapshot.val() === true;
      console.log('Firebase connection status:', isConnected.current);
    }, (error) => {
      console.error('Firebase connection error:', error);
      isConnected.current = false;
    });

    // Escutar mudanças nas filas
    const queuesRef = ref(database, 'queues');
    const unsubscribeQueues = onValue(queuesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        onQueueUpdate({ queues: data });
      }
    }, (error) => {
      console.error('Firebase queues error:', error);
    });

    // Escutar eventos de tickets gerados
    const ticketsRef = ref(database, 'events/tickets');
    const unsubscribeTickets = onValue(ticketsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const events = Object.values(data).sort((a: any, b: any) => b.timestamp - a.timestamp);
        const latestEvent = events[0] as any;
        
        if (latestEvent && Date.now() - latestEvent.timestamp < 5000) { // Apenas eventos dos últimos 5 segundos
          switch (latestEvent.type) {
            case 'ticket-generated':
              onTicketGenerated(latestEvent.data);
              break;
            case 'ticket-called':
              onTicketCalled(latestEvent.data);
              break;
            case 'queue-reset':
              onQueueReset(latestEvent.data);
              break;
          }
        }
      }
    }, (error) => {
      console.error('Firebase events error:', error);
    });

    return () => {
      unsubscribeConnection();
      unsubscribeQueues();
      unsubscribeTickets();
    };
  }, [onQueueUpdate, onTicketGenerated, onTicketCalled, onQueueReset]);

  const emit = async (event: string, data: any) => {
    try {
      // Verificar se está conectado
      if (!isConnected.current) {
        console.warn('Firebase not connected, using localStorage fallback');
        const syncData = {
          type: event,
          payload: data,
          timestamp: Date.now()
        };
        localStorage.setItem('queue-sync', JSON.stringify(syncData));
        return;
      }

      if (event === 'queue-update') {
        // Atualizar estado das filas
        await set(ref(database, 'queues'), data.queues);
      } else {
        // Registrar evento
        const eventRef = ref(database, 'events/tickets');
        await push(eventRef, {
          type: event,
          data: data,
          timestamp: Date.now()
        });
        
        // Também atualizar o estado das filas se necessário
        if (event === 'ticket-called' || event === 'ticket-generated' || event === 'queue-reset') {
          // Buscar estado atual e atualizar
          const currentQueuesRef = ref(database, 'queues');
          onValue(currentQueuesRef, async (snapshot) => {
            let currentQueues = snapshot.val() || {
              SUPORTE: { current: null, queue: [], lastCalled: [], nextNumber: 1, totalServed: 0 },
              HARDWARE: { current: null, queue: [], lastCalled: [], nextNumber: 1, totalServed: 0 },
              TELEFONIA: { current: null, queue: [], lastCalled: [], nextNumber: 1, totalServed: 0 },
              ATIVOS: { current: null, queue: [], lastCalled: [], nextNumber: 1, totalServed: 0 },
            };

            // Aplicar mudanças baseadas no evento
            if (event === 'ticket-generated') {
              currentQueues[data.sector].queue.push(data.ticket);
              currentQueues[data.sector].nextNumber = data.nextNumber;
            } else if (event === 'ticket-called') {
              currentQueues[data.sector] = {
                ...currentQueues[data.sector],
                current: data.current,
                queue: data.queue,
                lastCalled: data.lastCalled,
                totalServed: data.totalServed
              };
            } else if (event === 'queue-reset') {
              if (data.sector === 'ALL') {
                currentQueues = {
                  SUPORTE: { current: null, queue: [], lastCalled: [], nextNumber: 1, totalServed: 0 },
                  HARDWARE: { current: null, queue: [], lastCalled: [], nextNumber: 1, totalServed: 0 },
                  TELEFONIA: { current: null, queue: [], lastCalled: [], nextNumber: 1, totalServed: 0 },
                  ATIVOS: { current: null, queue: [], lastCalled: [], nextNumber: 1, totalServed: 0 },
                };
              } else {
                currentQueues[data.sector] = {
                  current: null,
                  queue: [],
                  lastCalled: [],
                  nextNumber: 1,
                  totalServed: 0
                };
              }
            }

            await set(ref(database, 'queues'), currentQueues);
          }, { onlyOnce: true });
        }
      }
    } catch (error) {
      console.error('Erro ao sincronizar com Firebase:', error);
      // Fallback para localStorage
      const syncData = {
        type: event,
        payload: data,
        timestamp: Date.now()
      };
      localStorage.setItem('queue-sync', JSON.stringify(syncData));
    }
  };

  return { emit, isConnected: isConnected.current };
};