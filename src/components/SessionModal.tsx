import React, { useState, useEffect, useCallback } from 'react';
import { X, Save, Clock, FolderOpen, Tag, AlertTriangle } from 'lucide-react';
import { apiService } from '../services/api';
import type { SessionCreateRequest, Folder } from '../types';

interface SessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  initialData: Partial<SessionCreateRequest>;
}

export const SessionModal: React.FC<SessionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [formData, setFormData] = useState<SessionCreateRequest>({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    folderId: '',
    tags: [],
  });
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const componentName = 'SessionModal';

  // Logger para debugging
  const logDebug = useCallback((message: string, data?: unknown) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${componentName}: ${message}`;
    console.log(logMessage, data || '');
    setDebugInfo(prev => prev + logMessage + '\n');
  }, [componentName]);

  // Manejador de errores
  const handleError = useCallback((error: Error | unknown, context: string) => {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    const errorContext = `${componentName} - ${context}`;
    console.error(`[${errorContext}]`, error);
    setError(`${errorContext}: ${errorMessage}`);
    logDebug(`Error en ${context}`, { error: errorMessage, stack: error instanceof Error ? error.stack : undefined });
  }, [logDebug]);

  useEffect(() => {
    try {
      logDebug('useEffect triggered', { isOpen });
      
      if (isOpen) {
        // Load folders
        const fetchFolders = async () => {
          try {
            logDebug('Fetching folders');
            const response = await apiService.getFolders();
            logDebug('Folders fetched successfully', { count: response.data.length });
            setFolders(response.data);
          } catch (err) {
            handleError(err, 'fetchFolders');
          }
        };

        fetchFolders();

        // Set initial data
        try {
          if (initialData) {
            logDebug('Setting initial data', { initialData });
            setFormData({
              title: initialData.title || '',
              description: initialData.description || '',
              startTime: initialData.startTime || '',
              endTime: initialData.endTime || '',
              folderId: initialData.folderId || '',
              tags: initialData.tags || [],
            });
          } else {
            // Para nueva sesión, inicializar con hora actual
            const now = new Date();
            const endTime = new Date(now.getTime() + 60 * 60 * 1000); // +1 hora por defecto
            logDebug('Setting default session data', { startTime: now.toISOString(), endTime: endTime.toISOString() });
            setFormData({
              title: '',
              description: '',
              startTime: now.toISOString(),
              endTime: endTime.toISOString(),
              folderId: '',
              tags: [],
            });
          }
        } catch (dataError) {
          handleError(dataError, 'setting initial data');
        }
      }
    } catch (error) {
      handleError(error, 'useEffect');
    }
  }, [isOpen, initialData, handleError, logDebug]);

  const handleSubmit = async (e: React.FormEvent) => {
    try {
      e.preventDefault();
      logDebug('handleSubmit called', { formData });
      
      if (!formData.title.trim()) {
        throw new Error('El título es requerido');
      }
      
      if (!formData.startTime) {
        throw new Error('La hora de inicio es requerida');
      }
      
      if (!formData.endTime) {
        throw new Error('La hora de fin es requerida');
      }
      
      if (!formData.folderId) {
        throw new Error('Debe seleccionar una carpeta');
      }
      
      setIsLoading(true);
      setError(null);

      try {
        logDebug('Creating session', { sessionData: formData });
        await apiService.createSession(formData);
        logDebug('Session created successfully');
        onSave();
      } catch (apiError) {
        handleError(apiError, 'createSession API call');
      }
    } catch (error) {
      handleError(error, 'handleSubmit');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    try {
      const { name, value } = e.target;
      logDebug('handleChange', { name, value });
      
      setFormData(prev => {
        const newData = {
          ...prev,
          [name]: value,
        };
        logDebug('Form data updated', { newData });
        return newData;
      });
    } catch (error) {
      handleError(error, 'handleChange');
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    try {
      if (e.key === 'Enter' && tagInput.trim()) {
        e.preventDefault();
        
        if (!formData.tags?.includes(tagInput.trim())) {
          logDebug('Adding tag', { tag: tagInput.trim() });
          setFormData(prev => ({
            ...prev,
            tags: [...(prev.tags || []), tagInput.trim()],
          }));
        } else {
          logDebug('Tag already exists', { tag: tagInput.trim() });
        }
        
        setTagInput('');
        setTagSuggestions([]);
      }
    } catch (error) {
      handleError(error, 'handleAddTag');
    }
  };

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const value = e.target.value;
      logDebug('handleTagInputChange', { value });
      setTagInput(value);
      
      // Mostrar sugerencias si hay texto
      if (value.trim()) {
        const commonTags = ['javascript', 'react', 'typescript', 'spring', 'backend', 'frontend', 'database', 'api', 'testing', 'study', 'programming', 'java', 'python'];
        const suggestions = commonTags.filter(tag => 
          tag.toLowerCase().includes(value.toLowerCase()) && 
          !formData.tags?.includes(tag)
        ).slice(0, 5);
        logDebug('Tag suggestions generated', { suggestions });
        setTagSuggestions(suggestions);
      } else {
        setTagSuggestions([]);
      }
    } catch (error) {
      handleError(error, 'handleTagInputChange');
    }
  };

  const addSuggestedTag = (tag: string) => {
    try {
      logDebug('addSuggestedTag called', { tag });
      if (!formData.tags?.includes(tag)) {
        setFormData(prev => ({
          ...prev,
          tags: [...(prev.tags || []), tag],
        }));
        logDebug('Suggested tag added', { tag });
      }
      setTagInput('');
      setTagSuggestions([]);
    } catch (error) {
      handleError(error, 'addSuggestedTag');
    }
  };

  const removeTag = (tagToRemove: string) => {
    try {
      logDebug('removeTag called', { tagToRemove });
      setFormData(prev => {
        const newTags = prev.tags?.filter(tag => tag !== tagToRemove) || [];
        logDebug('Tag removed', { tagToRemove, remainingTags: newTags });
        return {
          ...prev,
          tags: newTags,
        };
      });
    } catch (error) {
      handleError(error, 'removeTag');
    }
  };

  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-white/20">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Clock className="h-6 w-6 text-primary mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Guardar Sesión</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              <div>
                <p className="text-sm font-medium text-red-800">Error Detectado</p>
                <p className="text-xs text-red-600 mt-1">{error}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setError(null);
                setDebugInfo('');
              }}
              className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
            >
              Limpiar error
            </button>
          </div>
        )}

        {/* Debug Info (solo en desarrollo) */}
        {import.meta.env.DEV && debugInfo && (
          <details className="mx-6 mt-4 p-2 bg-gray-50 rounded text-xs">
            <summary className="cursor-pointer font-medium">Debug Info</summary>
            <pre className="mt-2 whitespace-pre-wrap">{debugInfo}</pre>
            <button
              onClick={() => setDebugInfo('')}
              className="mt-2 text-blue-600 hover:text-blue-800 underline"
            >
              Limpiar debug
            </button>
          </details>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Título de la sesión *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="Ej: Estudio de Matemáticas"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="input-field resize-none"
              placeholder="Describe lo que estudiaste..."
            />
          </div>

          {/* Folder */}
          <div>
            <label htmlFor="folderId" className="block text-sm font-medium text-gray-700 mb-2">
              <FolderOpen className="inline h-4 w-4 mr-1" />
              Carpeta
            </label>
            <select
              id="folderId"
              name="folderId"
              value={formData.folderId}
              onChange={handleChange}
              className="input-field"
            >
              <option value="">Selecciona una carpeta</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div className="relative">
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
              <Tag className="inline h-4 w-4 mr-1" />
              Etiquetas
            </label>
            <div className="relative">
              <input
                type="text"
                id="tags"
                value={tagInput}
                onChange={handleTagInputChange}
                onKeyDown={handleAddTag}
                className="input-field pr-10"
                placeholder="Escribe y presiona Enter, o selecciona una sugerencia"
              />
              
              {/* Suggestions Dropdown */}
              {tagSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                  {tagSuggestions.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => addSuggestedTag(tag)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors flex items-center justify-between"
                    >
                      <span className="text-sm text-gray-900">{tag}</span>
                      <span className="text-xs text-primary font-medium">+</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Tags Display */}
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary/10 text-primary"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 hover:text-primary/80"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Hidden fields for time data */}
          <input type="hidden" name="startTime" value={formData.startTime} />
          <input type="hidden" name="endTime" value={formData.endTime} />

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.title.trim()}
              className="btn-primary flex-1"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Guardando...
                </div>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Guardar Sesión
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
