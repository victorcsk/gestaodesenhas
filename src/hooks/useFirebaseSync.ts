import { useEffect, useRef, useState } from 'react';
import { database } from '../config/firebase';
import { ref, onValue, set, push, serverTimestamp, remove, update, off } from 'firebase/database';

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
    console.log('🔥 Iniciando Firebase sync...');
    
    try {
      // Referências do Firebase
      const ticketsRef = ref(database, 'tickets');
      const connectionRef = ref(database, '.info/connected');

      // Monitorar conexão
      const unsubscribeConnection = onValue(connectionRef, (snapshot) => {
        const connected = snapshot.val();
        setIsConnected(connected);
        setIsConnecting(false);
        console.log('🔥 Firebase connection:', connected ? 'Connected' : 'Disconnected');
      });

      // Escutar mudanças nos tickets
      const unsubscribeTickets = onValue(ticketsRef, (snapshot) => {
        console.log('🎫 Firebase tickets update received');
        const tickets = snapshot.val();
        
        if (tickets) {
          // Processar tickets e organizar por setor
          const organizedQueues = {
            SUPORTE: { current: null, queue: [], lastCalled: [], nextNumber: 1, totalServed: 0 },
            HARDWARE: { current: null, queue: [], lastCalled: [], nextNumber: 1, totalServed: 0 },
            TELEFONIA: { current: null, queue: [], lastCalled: [], nextNumber: 1, totalServed: 0 },
            ATIVOS: { current: null, queue: [], lastCalled: [], nextNumber: 1, totalServed: 0 },
          };

          let maxNumbers = {
            SUPORTE: 0,
            HARDWARE: 0,
            TELEFONIA: 0,
            ATIVOS: 0,
          };

          Object.entries(tickets).forEach(([key, ticket]: [string, any]) => {
            const sectorKey = ticket.sector as keyof typeof organizedQueues;
            if (organizedQueues[sectorKey]) {
              const ticketData = {
                ...ticket,
                id: key,
                firebaseKey: key,
                timestamp: ticket.timestamp ? new Date(ticket.timestamp) : new Date()
              };

              // Rastrear maior número por setor
              if (ticket.number > maxNumbers[sectorKey]) {
                maxNumbers[sectorKey] = ticket.number;
              }

              if (ticket.status === 'current') {
                organizedQueues[sectorKey].current = ticketData;
              } else if (ticket.status === 'waiting') {
                organizedQueues[sectorKey].queue.push(ticketData);
              } else if (ticket.status === 'completed') {
                organizedQueues[sectorKey].lastCalled.unshift(ticketData);
                organizedQueues[sectorKey].totalServed++;
              }
            }
          });

          // Definir próximos números
          Object.keys(organizedQueues).forEach(sector => {
            const sectorKey = sector as keyof typeof organizedQueues;
            organizedQueues[sectorKey].nextNumber = maxNumbers[sectorKey] + 1;
          });

          // Ordenar filas por timestamp
          Object.keys(organizedQueues).forEach(sector => {
            const sectorKey = sector as keyof typeof organizedQueues;
            organizedQueues[sectorKey].queue.sort((a, b) => 
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
            organizedQueues[sectorKey].lastCalled = organizedQueues[sectorKey].lastCalled.slice(0, 10);
          });

          console.log('📊 Organized queues:', organizedQueues);
          onQueueUpdate({ queues: organizedQueues });
        } else {
          // Banco vazio - inicializar
          const emptyQueues = {
            SUPORTE: { current: null, queue: [], lastCalled: [], nextNumber: 1, totalServed: 0 },
            HARDWARE: { current: null, queue: [], lastCalled: [], nextNumber: 1, totalServed: 0 },
            TELEFONIA: { current: null, queue: [], lastCalled: [], nextNumber: 1, totalServed: 0 },
            ATIVOS: { current: null, queue: [], lastCalled: [], nextNumber: 1, totalServed: 0 },
          };
          onQueueUpdate({ queues: emptyQueues });
        }
      });

      // Salvar unsubscribe functions
      listenersRef.current = [unsubscribeConnection, unsubscribeTickets];

    } catch (error) {
      console.error('❌ Erro ao conectar com Firebase:', error);
      setIsConnected(false);
      setIsConnecting(false);
    }

    return () => {
      // Cleanup listeners
      console.log('🧹 Limpando listeners Firebase');
      listenersRef.current.forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
    };
  }, [onQueueUpdate]);

  const emit = async (event: string, data: any) => {
    if (!isConnected) {
      console.warn('⚠️ Firebase não conectado - tentando mesmo assim');
    }

    try {
      console.log(`🚀 Emitindo evento: ${event}`, data);

      if (event === 'ticket-generated') {
        // Salvar novo ticket no Firebase
        const ticketsRef = ref(database, 'tickets');
        const newTicketRef = push(ticketsRef);
        
        const ticketData = {
          number: data.ticket.number,
          sector: data.ticket.sector,
          clientName: data.ticket.clientName,
          serviceType: data.ticket.serviceType,
          status: 'waiting',
          timestamp: Date.now(),
          createdAt: new Date().toISOString()
        };

        await set(newTicketRef, ticketData);
        console.log('✅ Ticket salvo no Firebase:', ticketData);
        
      } else if (event === 'ticket-called') {
        const ticketsRef = ref(database, 'tickets');
        
        // Primeiro, marcar ticket atual como completed se existir
        if (data.previousCurrent && data.previousCurrent.firebaseKey) {
          const prevRef = ref(database, `tickets/${data.previousCurrent.firebaseKey}`);
          await update(prevRef, {
            status: 'completed',
            completedAt: Date.now()
          });
          console.log('✅ Ticket anterior marcado como completed');
        }

        // Depois, marcar novo ticket como current
        if (data.current && data.current.firebaseKey) {
          const currentRef = ref(database, `tickets/${data.current.firebaseKey}`);
          await update(currentRef, {
            status: 'current',
            calledByAnalyst: data.current.calledByAnalyst,
            calledAt: Date.now()
          });
          console.log('✅ Novo ticket marcado como current');
        }
        
      } else if (event === 'queue-reset') {
        // Resetar fila específica ou todas
        const ticketsRef = ref(database, 'tickets');
        
        if (data.sector === 'ALL') {
          await set(ticketsRef, null);
          console.log('✅ Todas as filas resetadas');
        } else {
          // Buscar e remover apenas tickets do setor específico
          const snapshot = await new Promise((resolve) => {
            onValue(ticketsRef, resolve, { onlyOnce: true });
          });
          
          const tickets = (snapshot as any).val();
          if (tickets) {
            const updates: any = {};
            Object.keys(tickets).forEach(key => {
              if (tickets[key].sector === data.sector) {
                updates[key] = null;
              }
            });
            
            if (Object.keys(updates).length > 0) {
              await update(ticketsRef, updates);
              console.log(`✅ Fila ${data.sector} resetada`);
            }
          }
        }
      }

    } catch (error) {
      console.error('❌ Erro ao emitir evento para Firebase:', error);
      throw error;
    }
  };

  return { emit, isConnected, isConnecting };
};