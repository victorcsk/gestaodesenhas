import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnalytics } from '../contexts/AnalyticsContext';
import { 
  ArrowLeft, 
  TrendingUp, 
  Users, 
  Clock, 
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Award,
  AlertCircle
} from 'lucide-react';

const AnalyticsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { 
    todayStats, 
    getTodayTotal, 
    getSectorTodayTotal, 
    getComparisonData,
    dailyStats 
  } = useAnalytics();
  
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [currentTime, setCurrentTime] = useState(new Date());

  const sectors = ['SUPORTE', 'HARDWARE', 'TELEFONIA', 'ATIVOS'];
  const sectorColors = {
    SUPORTE: 'bg-blue-500',
    HARDWARE: 'bg-orange-500', 
    TELEFONIA: 'bg-green-500',
    ATIVOS: 'bg-purple-500',
  };

  // Atualizar relógio
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Dados para comparação
  const comparisonData = getComparisonData(selectedPeriod);
  const todayTotal = getTodayTotal();
  
  // Calcular estatísticas
  const yesterdayStats = dailyStats.find(stat => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return stat.date === yesterday.toISOString().split('T')[0];
  });
  
  const yesterdayTotal = yesterdayStats?.totalServed || 0;
  const growthPercentage = yesterdayTotal > 0 ? ((todayTotal - yesterdayTotal) / yesterdayTotal * 100) : 0;

  // Setor mais ativo hoje
  const mostActiveSector = sectors.reduce((prev, current) => 
    getSectorTodayTotal(current) > getSectorTodayTotal(prev) ? current : prev
  );

  // Média de atendimentos por hora (últimos 7 dias)
  const last7Days = dailyStats.slice(-7);
  const averagePerDay = last7Days.reduce((acc, day) => acc + day.totalServed, 0) / Math.max(last7Days.length, 1);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboard de Gestão</h1>
            <p className="opacity-90 mt-1">
              Analytics e Relatórios em Tempo Real • {currentTime.toLocaleString('pt-BR')}
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Hoje */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Atendimentos Hoje</p>
                <p className="text-3xl font-bold text-gray-900">{todayTotal}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className={`w-4 h-4 mr-1 ${growthPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                  <span className={`text-sm font-medium ${growthPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {growthPercentage >= 0 ? '+' : ''}{growthPercentage.toFixed(1)}% vs ontem
                  </span>
                </div>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Média Semanal */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Média Diária (7 dias)</p>
                <p className="text-3xl font-bold text-gray-900">{averagePerDay.toFixed(0)}</p>
                <p className="text-sm text-gray-500 mt-2">Baseado nos últimos 7 dias</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Setor Mais Ativo */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Setor Mais Ativo</p>
                <p className="text-2xl font-bold text-gray-900">{mostActiveSector}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {getSectorTodayTotal(mostActiveSector)} atendimentos hoje
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Status Sistema */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Status do Sistema</p>
                <p className="text-2xl font-bold text-green-600">Online</p>
                <p className="text-sm text-gray-500 mt-2">Tempo real ativo</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Gráficos por Setor */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Atendimentos por Setor Hoje */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Atendimentos por Setor - Hoje</h3>
            <div className="space-y-4">
              {sectors.map(sector => {
                const total = getSectorTodayTotal(sector);
                const percentage = todayTotal > 0 ? (total / todayTotal * 100) : 0;
                
                return (
                  <div key={sector} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${sectorColors[sector as keyof typeof sectorColors]}`}></div>
                      <span className="font-medium text-gray-700">{sector}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${sectorColors[sector as keyof typeof sectorColors]}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="font-bold text-gray-900 w-8 text-right">{total}</span>
                      <span className="text-sm text-gray-500 w-12 text-right">{percentage.toFixed(0)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Comparação Temporal */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Histórico de Atendimentos</h3>
              <select 
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as 'day' | 'week' | 'month')}
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
              >
                <option value="day">Últimos 7 dias</option>
                <option value="week">Últimas 4 semanas</option>
                <option value="month">Últimos 6 meses</option>
              </select>
            </div>
            
            <div className="space-y-3">
              {comparisonData.slice(-5).map((data, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-700">
                      {selectedPeriod === 'day' ? new Date(data.date).toLocaleDateString('pt-BR') : data.date}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-gray-900">{data.totalServed}</span>
                    <span className="text-sm text-gray-500">atendimentos</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detalhes por Setor */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">Detalhamento por Setor - Hoje</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {sectors.map(sector => {
              const sectorData = todayStats?.sectors[sector];
              const total = getSectorTodayTotal(sector);
              const avgWaitTime = sectorData?.averageWaitTime || 0;
              
              return (
                <div key={sector} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-800">{sector}</h4>
                    <div className={`w-3 h-3 rounded-full ${sectorColors[sector as keyof typeof sectorColors]}`}></div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Atendidos:</span>
                      <span className="font-medium">{total}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Tempo médio:</span>
                      <span className="font-medium">
                        {avgWaitTime > 0 ? `${Math.round(avgWaitTime / 60000)}min` : '-'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className="text-green-600 font-medium">Ativo</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;