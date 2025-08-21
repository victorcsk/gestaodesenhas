import { useFirebaseSync } from './useFirebaseSync';

interface WebSocketHookProps {
  onQueueUpdate: (data: any) => void;
  onTicketGenerated: (data: any) => void;
  onTicketCalled: (data: any) => void;
  onQueueReset: (data: any) => void;
}

export const useWebSocket = (props: WebSocketHookProps) => {
  // Usar Firebase para sincronização em tempo real
  const { emit, isConnected, isConnecting } = useFirebaseSync(props);

  return { 
    emit, 
    isConnected: isConnected && !isConnecting,
    isConnecting 
  };
};