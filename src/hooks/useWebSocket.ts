// Mantido para compatibilidade - agora usa Firebase
import { useFirebaseSync } from './useFirebaseSync';

interface WebSocketHookProps {
  onQueueUpdate: (data: any) => void;
  onTicketGenerated: (data: any) => void;
  onTicketCalled: (data: any) => void;
  onQueueReset: (data: any) => void;
}

export const useWebSocket = (props: WebSocketHookProps) => {
  // Redirecionamento para Firebase
  const { emit, isConnected, isConnecting } = useFirebaseSync(props);

  return { 
    emit, 
    isConnected: isConnected && !isConnecting,
    isConnecting 
  };
};