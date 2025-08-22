import { useEffect, useRef, useState } from 'react';
import { database } from '../config/firebase';
import { ref, onValue, set, push, serverTimestamp, remove, update } from 'firebase/database';

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
      const ticketsRef = ref(database, 'tickets');
      const queuesRef = ref(database, 'queues');
      const connectionRef = ref(database, '.info/connected');

      // Monitorar conexão
      const unsubscribeConnection = onValue(connectionRef, (snapshot) => {
        const connected = snapshot.val();
        setIsConnected(connected);
        setIsConnecting(false);
        console.log('Firebase connection:', connected ? 'Connected' : 'Disconnected');
      });

      // Escutar mudanças nos tickets
      const unsubscribeTickets = onValue(ticketsRef, (snapshot) => {
        const tickets = snapshot.val();
        if (tickets) {
          // Processar tickets e organizar por setor
          const organizedQueues = {
            SUPORTE: { current: null, queue: [], lastCalled: [], nextNumber: 1, totalServed: 0 },
            HARDWARE: { current: null, queue: [], lastCalled: [], nextNumber: 1, totalServed: 0 },
            TELEFONIA: { current: null, queue: [], lastCalled: [], nextNumber: 1, totalServed: 0 },
            ATIVOS: { current: null, queue: [], lastCalled: [], nextNumber: 1, totalServed: 0 },
          };

          Object.values(tickets).forEach((ticket: any) => {
            const sectorKey = ticket.sector as keyof typeof organizedQueues;
            if (organizedQueues[sectorKey]) {
              if (ticket.status === 'current') {
                organizedQueues[sectorKey].current = {
                  ...ticket,
                  timestamp: new Date(ticket.timestamp)
                };
              } else if (ticket.status === 'waiting') {
                organizedQueues[sectorKey].queue.push({
                  ...ticket,
                  timestamp: new Date(ticket.timestamp)
                });
              } else if (ticket.status === 'completed') {
                organizedQueues[sectorKey].lastCalled.unshift({
                  ...ticket,
                  timestamp: new Date(ticket.timestamp)
                });
              }
              
              // Calcular próximo número
              if (ticket.number >= organizedQueues[sectorKey].nextNumber) {
                organizedQueues[sectorKey].nextNumber = ticket.number + 1;
              }
            }
          });

          // Ordenar filas por timestamp
          Object.keys(organizedQueues).forEach(sector => {
            const sectorKey = sector as keyof typeof organizedQueues;
            organizedQueues[sectorKey].queue.sort((a, b) => 
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
            organizedQueues[sectorKey].lastCalled = organizedQueues[sectorKey].lastCalled.slice(0, 10);
            organizedQueues[sectorKey].totalServed = organizedQueues[sectorKey].lastCalled.length;
          });

          onQueueUpdate({ queues: organizedQueues });
        }
      });

      // Salvar unsubscribe functions
      listenersRef.current = [unsubscribeConnection, unsubscribeTickets];

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
      console.warn('Firebase não conectado');
      return;
    }

    try {
      if (event === 'ticket-generated') {
        // Salvar novo ticket no Firebase
        const ticketsRef = ref(database, 'tickets');
        const newTicketRef = push(ticketsRef);
        await set(newTicketRef, {
          id: data.ticket.id,
          number: data.ticket.number,
          sector: data.ticket.sector,
          clientName: data.ticket.clientName,
          serviceType: data.ticket.serviceType,
          status: 'waiting',
          timestamp: serverTimestamp(),
          createdAt: new Date().toISOString()
        });
      } else if (event === 'ticket-called') {
        // Atualizar ticket para "current" e mover anterior para "completed"
        const ticketsRef = ref(database, 'tickets');
        
        // Primeiro, marcar ticket atual como completed se existir
        if (data.previousCurrent) {
          const updates: any = {};
          updates[`${data.previousCurrent.firebaseKey}/status`] = 'completed';
          updates[`${data.previousCurrent.firebaseKey}/completedAt`] = serverTimestamp();
          await update(ticketsRef, updates);
        }

        // Depois, marcar novo ticket como current
        if (data.current && data.current.firebaseKey) {
          const updates: any = {};
          updates[`${data.current.firebaseKey}/status`] = 'current';
          updates[`${data.current.firebaseKey}/calledByAnalyst`] = data.current.calledByAnalyst;
          updates[`${data.current.firebaseKey}/calledAt`] = serverTimestamp();
          await update(ticketsRef, updates);
        }
      } else if (event === 'queue-reset') {
        // Resetar fila específica ou todas
        const ticketsRef = ref(database, 'tickets');
        if (data.sector === 'ALL') {
          await set(ticketsRef, null);
        } else {
          // Remover apenas tickets do setor específico
          const snapshot = await onValue(ticketsRef, (snap) => {
            const tickets = snap.val();
            if (tickets) {
              const updates: any = {};
              Object.keys(tickets).forEach(key => {
                if (tickets[key].sector === data.sector) {
                  updates[key] = null;
                }
              });
              update(ticketsRef, updates);
            }
          });
        }
      }

    } catch (error) {
      console.error('Erro ao emitir evento para Firebase:', error);
    }
  };

  return { emit, isConnected, isConnecting };
};