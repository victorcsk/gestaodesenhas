import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ isConnected }) => {
  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
      isConnected 
        ? 'bg-green-500 text-white' 
        : 'bg-red-500 text-white animate-pulse'
    }`}>
      {isConnected ? (
        <>
          <Wifi size={16} />
          <span>Online - Tempo Real</span>
        </>
      ) : (
        <>
          <WifiOff size={16} />
          <span>Offline - Local</span>
        </>
      )}
    </div>
  );
};

export default ConnectionStatus;