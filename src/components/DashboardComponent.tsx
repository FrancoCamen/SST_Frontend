import React, { useState, useEffect } from 'react';
import { Clock, BookOpen, TrendingUp, Calendar, BarChart3, Activity } from 'lucide-react';
import { apiService } from '../services/api';
import type { WeeklyAnalytics, DailyStats } from '../types';

export const DashboardComponent: React.FC = () => {
  const [analytics, setAnalytics] = useState<WeeklyAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await apiService.getWeeklyAnalytics();
        setAnalytics(response.data);
      } catch (err) {
        setError('Error al cargar las analíticas');
        console.error('Failed to fetch analytics:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const formatHours = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="stat-card animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-600">No hay datos disponibles</p>
      </div>
    );
  }

  // Calculate dashboard stats
  const todayHours = analytics.dailyStats?.[analytics.dailyStats.length - 1]?.hours || 0;
  const weekHours = analytics.totalHours;
  const monthHours = weekHours * 4.33; // Approximate weeks in a month
  const totalSessions = analytics.totalSessions;
  const averageSessionDuration = analytics.averageSessionDuration;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">Hoy</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatHours(todayHours * 60)}
          </div>
          <p className="text-sm text-gray-600 mt-1">Horas de estudio</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <span className="text-sm text-gray-500">Esta semana</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatHours(weekHours * 60)}
          </div>
          <p className="text-sm text-gray-600 mt-1">Horas totales</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-purple-600" />
            </div>
            <span className="text-sm text-gray-500">Sesiones</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {totalSessions}
          </div>
          <p className="text-sm text-gray-600 mt-1">Total esta semana</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
            <span className="text-sm text-gray-500">Promedio</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatTime(averageSessionDuration)}
          </div>
          <p className="text-sm text-gray-600 mt-1">Duración por sesión</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Progress */}
        <div className="stat-card">
          <div className="flex items-center mb-6">
            <BarChart3 className="h-5 w-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Progreso Diario</h3>
          </div>
          
          <div className="space-y-3">
            {analytics.dailyStats?.slice(-7).map((day: DailyStats, index: number) => (
              <div key={index} className="flex items-center">
                <div className="w-20 text-sm text-gray-600">
                  {new Date(day.date).toLocaleDateString('es-ES', { weekday: 'short' })}
                </div>
                <div className="flex-1 mx-3">
                  <div className="bg-gray-200 rounded-full h-6 relative">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-6 rounded-full flex items-center justify-end pr-2"
                      style={{
                        width: `${Math.min((day.hours / 8) * 100, 100)}%`,
                      }}
                    >
                      <span className="text-xs text-white font-medium">
                        {day.hours.toFixed(1)}h
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-600 w-12 text-right">
                  {day.sessions}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Folder Breakdown */}
        <div className="stat-card">
          <div className="flex items-center mb-6">
            <Activity className="h-5 w-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Tiempo por Carpeta</h3>
          </div>
          
          <div className="space-y-3">
            {Object.entries(analytics.hoursByFolder || {})
              .slice(0, 5)
              .map(([folderName, hours]) => (
                <div key={folderName} className="flex items-center">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {folderName}
                      </span>
                      <span className="text-sm text-gray-600">
                        {((hours / (analytics.totalHours || 1)) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-pink-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min((hours / (analytics.totalHours || 1)) * 100, 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="stat-card">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Resumen de Productividad
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="text-3xl font-bold text-blue-600">
                {formatHours(todayHours * 60)}
              </div>
              <p className="text-sm text-gray-600 mt-1">Hoy</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">
                {formatHours(weekHours * 60)}
              </div>
              <p className="text-sm text-gray-600 mt-1">Esta semana</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">
                {formatHours(monthHours * 60)}
              </div>
              <p className="text-sm text-gray-600 mt-1">Este mes</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600">
                {formatTime(averageSessionDuration)}
              </div>
              <p className="text-sm text-gray-600 mt-1">Promedio</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
