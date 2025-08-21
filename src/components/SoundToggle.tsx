import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

const SoundToggle: React.FC = () => {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('soundEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('soundEnabled', JSON.stringify(soundEnabled));
    // Disponibilizar globalmente para outros componentes
    (window as any).soundEnabled = soundEnabled;
  }, [soundEnabled]);

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };

  return (
    <button
      onClick={toggleSound}
      className={`fixed top-4 left-4 z-50 flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
        soundEnabled 
          ? 'bg-green-500 text-white hover:bg-green-600' 
          : 'bg-gray-500 text-white hover:bg-gray-600'
      }`}
      title={soundEnabled ? 'Desativar som' : 'Ativar som'}
    >
      {soundEnabled ? (
        <Volume2 size={16} />
      ) : (
        <VolumeX size={16} />
      )}
      <span className="hidden sm:inline">
        {soundEnabled ? 'Som Ativo' : 'Som Desativado'}
      </span>
    </button>
  );
};

export default SoundToggle;