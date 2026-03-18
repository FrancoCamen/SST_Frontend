import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Plus, Clock, BookOpen, Trash2, Edit, BarChart3 } from 'lucide-react';
import { apiService } from '../services/api';
import type { Folder } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const FoldersPage: React.FC = () => {
  const navigate = useNavigate();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFolder, setNewFolder] = useState({ name: '', description: '' });

  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const response = await apiService.getFolders();
        
        // Extracción robusta: Buscamos el array sin importar la estructura de la respuesta
        const rawResponse = response as any;
        const data = rawResponse.data?.data || rawResponse.data || rawResponse;
        
        // Validamos que sea un array antes de guardarlo
        setFolders(Array.isArray(data) ? data : []);
        
      } catch (err: any) {
        setError(err.message || 'Error al cargar las carpetas');
        console.error('Failed to fetch folders:', err);
      } finally {
        // Retardo controlado (Anti-FOUC) para permitir carga de estilos en Vercel
        setTimeout(() => {
          setIsLoading(false);
        }, 400);
      }
    };

    fetchFolders();
  }, []);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newFolder.name.trim()) {
      return;
    }

    try {
      const response = await apiService.createFolder(newFolder);
      
      // Extracción robusta para la nueva carpeta
      const rawResponse = response as any;
      const newFolderData = rawResponse.data?.data || rawResponse.data || rawResponse;

      setFolders([...folders, newFolderData]);
      setNewFolder({ name: '', description: '' });
      setShowCreateModal(false);
    } catch (err) {
      setError('Error al crear la carpeta');
      console.error('Failed to create folder:', err);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta carpeta? Las sesiones asociadas no se eliminarán.')) {
      return;
    }

    try {
      await apiService.deleteFolder(folderId);
      setFolders(folders.filter(f => f.id !== folderId));
    } catch (err) {
      setError('Error al eliminar la carpeta');
      console.error('Failed to delete folder:', err);
    }
  };

  const formatDate = (dateString: string): string => {
    try {
       return format(new Date(dateString), 'dd MMM yyyy', { locale: es });
    } catch (err) {
       return 'Fecha inválida';
    }
  };

  const formatHours = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
              <h1 className="text-2xl font-bold text-gray-900">Carpetas de Estudio</h1>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                Nueva Carpeta
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Volver al Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg shadow-sm">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Folders Grid */}
        {folders.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-lg border border-white/20 p-12 text-center">
            <FolderOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No hay carpetas creadas
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Crea carpetas para organizar tus sesiones de estudio por temas o materias.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Crear Primera Carpeta
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {folders.map((folder) => (
              <div
                key={folder.id}
                className="bg-white/80 backdrop-blur-md rounded-xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer"
                onClick={() => navigate(`/folders/${folder.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                    <FolderOpen className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Implement edit
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFolder(folder.id);
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {folder.name}
                </h3>
                
                {folder.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {folder.description}
                  </p>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-600">
                      <Clock className="h-4 w-4 mr-1" />
                      {folder.totalHours ? formatHours(folder.totalHours * 60) : '0h 0m'}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <BookOpen className="h-4 w-4 mr-1" />
                      {folder.sessionCount || 0} sesiones
                    </div>
                  </div>

                  {folder.lastSession && (
                    <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                      Última sesión: {formatDate(folder.lastSession)}
                    </div>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/folders/${folder.id}`);
                    }}
                    className="w-full mt-4 flex items-center justify-center text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Ver Detalles
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Card */}
        {folders.length > 0 && (
          <div className="mt-8 bg-white/80 backdrop-blur-md rounded-xl shadow-lg border border-white/20 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {folders.length}
                </div>
                <p className="text-sm text-gray-600">Carpetas totales</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {folders.reduce((total, folder) => total + (folder.sessionCount || 0), 0)}
                </div>
                <p className="text-sm text-gray-600">Sesiones totales</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatHours(
                    folders.reduce((total, folder) => total + (folder.totalHours || 0) * 60, 0)
                  )}
                </div>
                <p className="text-sm text-gray-600">Horas totales</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Create Folder Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Nueva Carpeta</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="p-6 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la carpeta *
                </label>
                <input
                  type="text"
                  id="name"
                  value={newFolder.name}
                  onChange={(e) => setNewFolder({ ...newFolder, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="Ej: Matemáticas, Inglés, Programación"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  id="description"
                  value={newFolder.description}
                  onChange={(e) => setNewFolder({ ...newFolder, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                  placeholder="Describe el contenido de esta carpeta..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newFolder.name.trim()}
                  className="flex-1 px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Crear Carpeta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
