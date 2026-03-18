import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Calendar, FolderOpen, Search, Edit, Trash2, Plus } from 'lucide-react';
import { apiService } from '../services/api';
import type { Session, Folder } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const SessionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  {/*
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sessionsResponse, foldersResponse] = await Promise.all([
          apiService.getSessions(),
          apiService.getFolders(),
        ]);
        
        setSessions(sessionsResponse.data.data || []);
        setFolders(foldersResponse.data);
      } catch (err) {
        setError('Error al cargar los datos');
        console.error('Failed to fetch data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);*/}

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // 1. Intentamos cargar ambas por separado para debuguear mejor
        console.log('[SessionsPage] Iniciando carga de datos...');

        // Ejecutamos en paralelo pero manejamos los resultados individualmente
        const [sessionsRes, foldersRes] = await Promise.allSettled([
          apiService.getSessions(),
          apiService.getFolders(),
        ]);

        // 2. Chequeo de Sesiones
        if (sessionsRes.status === 'fulfilled') {
          console.log('[SessionsPage] Sesiones cargadas:', sessionsRes.value.data);
          setSessions(sessionsRes.value.data.data || []);
        } else {
          console.error('[SessionsPage] Error en getSessions:', sessionsRes.reason);
          throw new Error('No se pudieron cargar las sesiones de estudio.');
        }

        // 3. Chequeo de Carpetas
        if (foldersRes.status === 'fulfilled') {
          console.log('[SessionsPage] Carpetas cargadas:', foldersRes.value.data);
          setFolders(foldersRes.value.data);
        } else {
          console.error('[SessionsPage] Error en getFolders:', foldersRes.reason);
          // No lanzamos error aquí si queremos que al menos se vean las sesiones
          setError('Error parcial: No se pudieron cargar las carpetas.');
        }

      } catch (err: unknown) {
        // 4. Captura del error específico que detuvo el proceso
        const msg = err instanceof Error ? err.message : 'Error inesperado al cargar la página';
        setError(msg);
        console.error('[SessionsPage] Critical Fetch Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredSessions = sessions.filter((session) => {
    const matchesSearch = session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFolder = !selectedFolder || session.folderId === selectedFolder;
    const matchesDateFrom = !dateFrom || new Date(session.startTime) >= new Date(dateFrom);
    const matchesDateTo = !dateTo || new Date(session.startTime) <= new Date(dateTo);
    
    return matchesSearch && matchesFolder && matchesDateFrom && matchesDateTo;
  });

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDate = (dateString: string): string => {
    return format(new Date(dateString), 'dd MMM yyyy, HH:mm', { locale: es });
  };

  const getFolderName = (folderId: string): string => {
    const folder = folders.find(f => f.id === folderId);
    return folder?.name || 'Sin carpeta';
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta sesión?')) {
      return;
    }

    try {
      await apiService.deleteSession(sessionId);
      setSessions(sessions.filter(s => s.id !== sessionId));
    } catch (err) {
      setError('Error al eliminar la sesión');
      console.error('Failed to delete session:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Sesiones de Estudio</h1>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-secondary"
            >
              Volver al Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-lg border border-white/20 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar sesiones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>

            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="input-field"
            >
              <option value="">Todas las carpetas</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input-field"
              placeholder="Fecha desde"
            />

            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input-field"
              placeholder="Fecha hasta"
            />
          </div>
        </div>

        {/* Sessions List */}
        <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-lg border border-white/20 overflow-hidden">
          {filteredSessions.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {sessions.length === 0 ? 'No hay sesiones registradas' : 'No se encontraron sesiones'}
              </h3>
              <p className="text-gray-600">
                {sessions.length === 0 
                  ? 'Comienza a usar el temporizador para registrar tus sesiones de estudio.'
                  : 'Intenta ajustar los filtros para ver más resultados.'
                }
              </p>
              {sessions.length === 0 && (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="btn-primary mt-4"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Ir al Dashboard
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha y Hora
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Título
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Carpeta
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duración
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredSessions.map((session) => (
                    <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-gray-400 mr-2" />
                          {formatDate(session.startTime)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {session.title}
                          </div>
                          {session.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {session.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <FolderOpen className="h-4 w-4 text-gray-400 mr-2" />
                          {getFolderName(session.folderId)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {formatDuration(session.durationMinutes)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {/* TODO: Implement edit */}}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSession(session.id)}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary */}
        {filteredSessions.length > 0 && (
          <div className="mt-6 bg-white/80 backdrop-blur-md rounded-xl shadow-lg border border-white/20 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {filteredSessions.length}
                </div>
                <p className="text-sm text-gray-600">Sesiones encontradas</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatDuration(
                    filteredSessions.reduce((total, session) => total + session.durationMinutes, 0)
                  )}
                </div>
                <p className="text-sm text-gray-600">Tiempo total</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatDuration(
                    Math.round(
                      filteredSessions.reduce((total, session) => total + session.durationMinutes, 0) / 
                      filteredSessions.length
                    )
                  )}
                </div>
                <p className="text-sm text-gray-600">Promedio por sesión</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
