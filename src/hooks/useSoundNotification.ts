import { useRef, useCallback } from 'react';

export const useSoundNotification = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playNotificationSound = useCallback(async () => {
    try {
      const audioContext = initAudioContext();
      
      // Criar um som de notificação agradável
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Configurar o som - duas notas para um "ding-dong"
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      // Envelope do som
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
      
    } catch (error) {
      console.log('Não foi possível reproduzir o som de notificação:', error);
    }
  }, [initAudioContext]);

  const playTicketCalledSound = useCallback(async (sectorName: string, ticketNumber: number) => {
    try {
      // Verificar se o som está habilitado
      if ((window as any).soundEnabled === false) {
        return;
      }
      
      // Primeiro toca o som de notificação
      await playNotificationSound();
      
      // Depois tenta usar síntese de voz se disponível
      if ('speechSynthesis' in window) {
        // Cancelar qualquer fala anterior
        window.speechSynthesis.cancel();
        
        setTimeout(() => {
          const utterance = new SpeechSynthesisUtterance(
            `Senha ${sectorName} ${ticketNumber}, compareça ao atendimento`
          );
          utterance.lang = 'pt-BR';
          utterance.rate = 0.8;
          utterance.pitch = 1;
          utterance.volume = 0.7;
          
          window.speechSynthesis.speak(utterance);
        }, 600);
      }
    } catch (error) {
      console.log('Erro ao reproduzir notificação:', error);
    }
  }, [playNotificationSound]);

  return {
    playNotificationSound,
    playTicketCalledSound
  };
};