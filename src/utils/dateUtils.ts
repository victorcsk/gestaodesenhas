export const formatDateTime = (date: Date): string => {
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatTime = (date: Date): string => {
  return date.toLocaleString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};