import { useEffect, useRef, useState } from 'react';
import { database } from '../config/firebase';
import { ref, onValue, set, push, serverTimestamp } from 'firebase/database';

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
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const listenersRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    try {
      // Referências do Firebase
      const eventsRef = ref(database, 'events');
      const queuesRef = ref(database, 'queues');
      const connectionRef = ref(database, '.info/connected');

      // Monitorar conexão
      const unsubscribeConnection = onValue(connectionRef, (snapshot) => {
        const connected = snapshot.val();
        setIsConnected(connected);
        setIsConnecting(false);
        console.log('Firebase connection:', connected ? 'Connected' : 'Disconnected');
      });

      // Escutar eventos
      const unsubscribeEvents = onValue(eventsRef, (snapshot) => {
        const events = snapshot.val();
        if (events) {
          // Processar apenas o último evento
          const eventKeys = Object.keys(events);
          const lastEventKey = eventKeys[eventKeys.length - 1];
          const lastEvent = events[lastEventKey];

          if (lastEvent && lastEvent.timestamp > Date.now() - 5000) { // Apenas eventos dos últimos 5 segundos
            switch (lastEvent.type) {
              case 'ticket-generated':
                onTicketGenerated(lastEvent.data);
                break;
              case 'ticket-called':
                onTicketCalled(lastEvent.data);
                break;
              case 'queue-reset':
                onQueueReset(lastEvent.data);
                break;
            }
          }
        }
      });

      // Escutar mudanças nas filas
      const unsubscribeQueues = onValue(queuesRef, (snapshot) => {
        const queues = snapshot.val();
        if (queues) {
          onQueueUpdate({ queues });
        }
      });

      // Salvar unsubscribe functions
      listenersRef.current = [unsubscribeConnection, unsubscribeEvents, unsubscribeQueues];

    } catch (error) {
      console.error('Erro ao conectar com Firebase:', error);
      setIsConnected(false);
      setIsConnecting(false);
    }

    return () => {
      // Cleanup listeners
      listenersRef.current.forEach(unsubscribe => unsubscribe());
    };
  }, [onQueueUpdate, onTicketGenerated, onTicketCalled, onQueueReset]);

  const emit = async (event: string, data: any) => {
    if (!isConnected) {
      console.warn('Firebase não conectado, usando fallback local');
      // Fallback para localStorage
      const syncData = { type: event, payload: data, timestamp: Date.now() };
      localStorage.setItem('queue-sync', JSON.stringify(syncData));
      return;
    }

    try {
      // Salvar evento no Firebase
      const eventsRef = ref(database, 'events');
      await push(eventsRef, {
        type: event,
        data: data,
        timestamp: serverTimestamp()
      });

      // Atualizar estado das filas se necessário
      if (event === 'queue-update') {
        const queuesRef = ref(database, 'queues');
        await set(queuesRef, data.queues);
      }

    } catch (error) {
      console.error('Erro ao emitir evento para Firebase:', error);
      // Fallback para localStorage
      const syncData = { type: event, payload: data, timestamp: Date.now() };
      localStorage.setItem('queue-sync', JSON.stringify(syncData));
    }
  };

  return { emit, isConnected, isConnecting };
};