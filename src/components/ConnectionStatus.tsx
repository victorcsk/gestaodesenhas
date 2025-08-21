import React from 'react';
import { Wifi, WifiOff, Clock } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ isConnected }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
        isConnected 
          ? 'bg-green-500 text-white' 
          : 'bg-red-500 text-white'
      }`}>
        {isConnected ? (
          <>
            <Wifi size={16} />
            <span>Online - Local</span>
          </>
        ) : (
          <>
            <WifiOff size={16} />
            <span>Desconectado</span>
          </>
        )}
      </div>
    </div>
  );
};

export default ConnectionStatus;