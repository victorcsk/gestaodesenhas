import { useEffect, useRef, useState } from 'react';

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
  const [isConnected, setIsConnected] = useState(true);
  const eventListeners = useRef<{ [key: string]: Function[] }>({});

  useEffect(() => {
    // Simular conexão bem-sucedida
    setIsConnected(true);

    // Escutar eventos do localStorage para sincronização local
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'queue-sync' && e.newValue) {
        try {
          const syncData = JSON.parse(e.newValue);
          const { type, payload } = syncData;

          switch (type) {
            case 'queue-update':
              onQueueUpdate(payload);
              break;
            case 'ticket-generated':
              onTicketGenerated(payload);
              break;
            case 'ticket-called':
              onTicketCalled(payload);
              break;
            case 'queue-reset':
              onQueueReset(payload);
              break;
          }
        } catch (error) {
          console.error('Erro ao processar evento de sincronização:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [onQueueUpdate, onTicketGenerated, onTicketCalled, onQueueReset]);

  const emit = (event: string, data: any) => {
    try {
      // Salvar no localStorage para sincronização entre abas
      const syncData = {
        type: event,
        payload: data,
        timestamp: Date.now()
      };
      localStorage.setItem('queue-sync', JSON.stringify(syncData));

      // Disparar evento customizado para a mesma aba
      const customEvent = new CustomEvent('queue-sync-local', {
        detail: syncData
      });
      window.dispatchEvent(customEvent);

    } catch (error) {
      console.error('Erro ao emitir evento:', error);
    }
  };

  // Escutar eventos customizados na mesma aba
  useEffect(() => {
    const handleLocalSync = (e: CustomEvent) => {
      const { type, payload } = e.detail;

      switch (type) {
        case 'queue-update':
          onQueueUpdate(payload);
          break;
        case 'ticket-generated':
          onTicketGenerated(payload);
          break;
        case 'ticket-called':
          onTicketCalled(payload);
          break;
        case 'queue-reset':
          onQueueReset(payload);
          break;
      }
    };

    window.addEventListener('queue-sync-local', handleLocalSync as EventListener);

    return () => {
      window.removeEventListener('queue-sync-local', handleLocalSync as EventListener);
    };
  }, [onQueueUpdate, onTicketGenerated, onTicketCalled, onQueueReset]);

  return { emit, isConnected };
};