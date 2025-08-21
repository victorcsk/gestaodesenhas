import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface WebSocketHookProps {
  onQueueUpdate: (data: any) => void;
  onTicketGenerated: (data: any) => void;
  onTicketCalled: (data: any) => void;
  onQueueReset: (data: any) => void;
}

export const useWebSocket = ({ 
  onQueueUpdate, 
  onTicketGenerated, 
  onTicketCalled, 
  onQueueReset 
}: WebSocketHookProps) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const connectWebSocket = () => {
      try {
        // Conectar ao WebSocket sempre
        socketRef.current = io(window.location.origin, {
          transports: ['websocket', 'polling'],
          timeout: 20000,
          forceNew: true
        });
        
        socketRef.current.on('queue-update', onQueueUpdate);
        socketRef.current.on('ticket-generated', onTicketGenerated);
        socketRef.current.on('ticket-called', onTicketCalled);
        socketRef.current.on('queue-reset', onQueueReset);
        
        socketRef.current.on('connect', () => {
          console.log('✅ Conectado ao servidor WebSocket - Comunicação em tempo real ativa!');
        });
        
        socketRef.current.on('disconnect', () => {
          console.log('❌ Desconectado do servidor WebSocket');
        });
        
        socketRef.current.on('connect_error', (error) => {
          console.log('⚠️ Erro de conexão WebSocket, usando fallback localStorage:', error);
          setupLocalStorageSync();
        });
      } catch (error) {
        console.log('⚠️ WebSocket não disponível, usando sincronização local');
        setupLocalStorageSync();
      }
    };

    const setupLocalStorageSync = () => {
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'queue-sync') {
          const data = JSON.parse(e.newValue || '{}');
          
          switch (data.type) {
            case 'queue-update':
              onQueueUpdate(data.payload);
              break;
            case 'ticket-generated':
              onTicketGenerated(data.payload);
              break;
            case 'ticket-called':
              onTicketCalled(data.payload);
              break;
            case 'queue-reset':
              onQueueReset(data.payload);
              break;
          }
        }
      };

      window.addEventListener('storage', handleStorageChange);
      
      return () => {
        window.removeEventListener('storage', handleStorageChange);
      };
    };

    connectWebSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [onQueueUpdate, onTicketGenerated, onTicketCalled, onQueueReset]);

  const emit = (event: string, data: any) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit(event, data);
    } else {
      // Fallback para localStorage em desenvolvimento
      const syncData = {
        type: event,
        payload: data,
        timestamp: Date.now()
      };
      localStorage.setItem('queue-sync', JSON.stringify(syncData));
    }
  };

  return { emit, isConnected: socketRef.current?.connected || false };
};