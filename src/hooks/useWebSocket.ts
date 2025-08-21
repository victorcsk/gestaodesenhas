import { useFirebaseSync } from './useFirebaseSync';

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
  // Usar Firebase em vez de WebSocket
  return useFirebaseSync({
    onQueueUpdate,
    onTicketGenerated,
    onTicketCalled,
    onQueueReset
  });
};