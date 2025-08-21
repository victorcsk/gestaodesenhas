import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

export interface DailyStats {
  date: string;
  sectors: {
    [key: string]: {
      totalServed: number;
      averageWaitTime: number;
      peakHour: string;
      tickets: Array<{
        number: number;
        timestamp: Date;
        calledAt?: Date;
        waitTime?: number;
      }>;
    };
  };
  totalServed: number;
}

export interface WeeklyStats {
  week: string;
  days: DailyStats[];
  totalServed: number;
  averagePerDay: number;
  bestDay: string;
  worstDay: string;
}

export interface MonthlyStats {
  month: string;
  weeks: WeeklyStats[];
  totalServed: number;
  averagePerDay: number;
  growth: number;
}

interface AnalyticsContextType {
  dailyStats: DailyStats[];
  weeklyStats: WeeklyStats[];
  monthlyStats: MonthlyStats[];
  todayStats: DailyStats | null;
  recordTicketGenerated: (sector: string, ticketNumber: number) => void;
  recordTicketServed: (sector: string, ticketNumber: number, waitTime: number) => void;
  getTodayTotal: () => number;
  getSectorTodayTotal: (sector: string) => number;
  getComparisonData: (period: 'day' | 'week' | 'month') => any;
  resetDailyStats: () => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

const getDateString = (date: Date = new Date()) => {
  return date.toISOString().split('T')[0];
};

const getWeekString = (date: Date = new Date()) => {
  const year = date.getFullYear();
  const week = Math.ceil((date.getDate() - date.getDay() + 1) / 7);
  return `${year}-W${week.toString().padStart(2, '0')}`;
};

const getMonthString = (date: Date = new Date()) => {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
};

export const AnalyticsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dailyStats, setDailyStats] = useState<DailyStats[]>(() => {
    const saved = localStorage.getItem('analytics-daily');
    return saved ? JSON.parse(saved) : [];
  });

  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats[]>(() => {
    const saved = localStorage.getItem('analytics-weekly');
    return saved ? JSON.parse(saved) : [];
  });

  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>(() => {
    const saved = localStorage.getItem('analytics-monthly');
    return saved ? JSON.parse(saved) : [];
  });

  const todayStats = dailyStats.find(stat => stat.date === getDateString()) || null;

  // WebSocket para sincronização em tempo real
  const { emit } = useWebSocket({
    onQueueUpdate: () => {},
    onTicketGenerated: (data) => {
      recordTicketGenerated(data.sector, data.ticket.number);
    },
    onTicketCalled: (data) => {
      if (data.current) {
        // Calcular tempo de espera baseado no timestamp
        const waitTime = Date.now() - new Date(data.current.timestamp).getTime();
        recordTicketServed(data.sector, data.current.number, waitTime);
      }
    },
    onQueueReset: () => {}
  });

  // Salvar dados no localStorage sempre que houver mudanças
  useEffect(() => {
    localStorage.setItem('analytics-daily', JSON.stringify(dailyStats));
  }, [dailyStats]);

  useEffect(() => {
    localStorage.setItem('analytics-weekly', JSON.stringify(weeklyStats));
  }, [weeklyStats]);

  useEffect(() => {
    localStorage.setItem('analytics-monthly', JSON.stringify(monthlyStats));
  }, [monthlyStats]);

  // Reset automático diário
  useEffect(() => {
    const checkDailyReset = () => {
      const now = new Date();
      const lastReset = localStorage.getItem('last-daily-reset');
      const today = getDateString(now);

      if (!lastReset || lastReset !== today) {
        // Novo dia - consolidar dados do dia anterior se existir
        if (todayStats && todayStats.totalServed > 0) {
          // Dados já estão salvos, apenas marcar reset
        }
        localStorage.setItem('last-daily-reset', today);
      }
    };

    checkDailyReset();
    const interval = setInterval(checkDailyReset, 60000); // Verificar a cada minuto

    return () => clearInterval(interval);
  }, [todayStats]);

  const recordTicketGenerated = (sector: string, ticketNumber: number) => {
    const today = getDateString();
    
    setDailyStats(prev => {
      const existing = prev.find(stat => stat.date === today);
      
      if (existing) {
        return prev.map(stat => {
          if (stat.date === today) {
            return {
              ...stat,
              sectors: {
                ...stat.sectors,
                [sector]: {
                  ...stat.sectors[sector],
                  tickets: [
                    ...stat.sectors[sector]?.tickets || [],
                    {
                      number: ticketNumber,
                      timestamp: new Date()
                    }
                  ]
                }
              }
            };
          }
          return stat;
        });
      } else {
        const newStat: DailyStats = {
          date: today,
          sectors: {
            [sector]: {
              totalServed: 0,
              averageWaitTime: 0,
              peakHour: '',
              tickets: [{
                number: ticketNumber,
                timestamp: new Date()
              }]
            }
          },
          totalServed: 0
        };
        return [...prev, newStat];
      }
    });

    // Emitir para outros dispositivos
    emit('analytics-update', { type: 'ticket-generated', sector, ticketNumber });
  };

  const recordTicketServed = (sector: string, ticketNumber: number, waitTime: number) => {
    const today = getDateString();
    
    setDailyStats(prev => {
      return prev.map(stat => {
        if (stat.date === today) {
          const sectorData = stat.sectors[sector] || { totalServed: 0, averageWaitTime: 0, peakHour: '', tickets: [] };
          const updatedTickets = sectorData.tickets.map(ticket => {
            if (ticket.number === ticketNumber && !ticket.calledAt) {
              return {
                ...ticket,
                calledAt: new Date(),
                waitTime: waitTime
              };
            }
            return ticket;
          });

          const servedTickets = updatedTickets.filter(t => t.calledAt);
          const newTotalServed = servedTickets.length;
          const newAverageWaitTime = servedTickets.reduce((acc, t) => acc + (t.waitTime || 0), 0) / servedTickets.length;

          const updatedSectors = {
            ...stat.sectors,
            [sector]: {
              ...sectorData,
              totalServed: newTotalServed,
              averageWaitTime: newAverageWaitTime,
              tickets: updatedTickets
            }
          };

          const totalServed = Object.values(updatedSectors).reduce((acc, s) => acc + s.totalServed, 0);

          return {
            ...stat,
            sectors: updatedSectors,
            totalServed
          };
        }
        return stat;
      });
    });

    // Emitir para outros dispositivos
    emit('analytics-update', { type: 'ticket-served', sector, ticketNumber, waitTime });
  };

  const getTodayTotal = () => {
    return todayStats?.totalServed || 0;
  };

  const getSectorTodayTotal = (sector: string) => {
    return todayStats?.sectors[sector]?.totalServed || 0;
  };

  const getComparisonData = (period: 'day' | 'week' | 'month') => {
    switch (period) {
      case 'day':
        return dailyStats.slice(-7); // Últimos 7 dias
      case 'week':
        return weeklyStats.slice(-4); // Últimas 4 semanas
      case 'month':
        return monthlyStats.slice(-6); // Últimos 6 meses
      default:
        return [];
    }
  };

  const resetDailyStats = () => {
    const today = getDateString();
    setDailyStats(prev => 
      prev.map(stat => {
        if (stat.date === today) {
          return {
            ...stat,
            sectors: Object.keys(stat.sectors).reduce((acc, sector) => ({
              ...acc,
              [sector]: {
                totalServed: 0,
                averageWaitTime: 0,
                peakHour: '',
                tickets: []
              }
            }), {}),
            totalServed: 0
          };
        }
        return stat;
      })
    );
  };

  return (
    <AnalyticsContext.Provider value={{
      dailyStats,
      weeklyStats,
      monthlyStats,
      todayStats,
      recordTicketGenerated,
      recordTicketServed,
      getTodayTotal,
      getSectorTodayTotal,
      getComparisonData,
      resetDailyStats,
    }}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};