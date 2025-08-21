import React from 'react';
import { Wifi, WifiOff, Clock } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
  isConnecting?: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ isConnected, isConnecting = false }) => {
  const getStatusConfig = () => {
    if (isConnecting) {
      return {
        icon: Clock,
        text: 'Conectando...',
        bgColor: 'bg-yellow-500',
        textColor: 'text-white'
      };
    }
    
    if (isConnected) {
      return {
        icon: Wifi,
        text: 'Online - Firebase',
        bgColor: 'bg-green-500',
        textColor: 'text-white'
      };
    }
    
    return {
      icon: WifiOff,
      text: 'Offline - Local',
      bgColor: 'bg-red-500',
      textColor: 'text-white'
    };
  };

  const { icon: Icon, text, bgColor, textColor } = getStatusConfig();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${bgColor} ${textColor}`}>
        <Icon size={16} />
        <span className="hidden sm:inline">{text}</span>
      </div>
    </div>
  );
};

export default ConnectionStatus;