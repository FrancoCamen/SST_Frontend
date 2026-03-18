import React, { useState } from 'react';
import { TimerComponent } from '../components/TimerComponent';
import { DashboardComponent } from '../components/DashboardComponent';
import { SessionModal } from '../components/SessionModal';
import type { SessionCreateRequest } from '../types';
import { LogOut, User, Settings, BookOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { state, logout } = useAuth();
  const navigate = useNavigate();
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionData, setSessionData] = useState<Partial<SessionCreateRequest> | null>(null);

  const handleSessionComplete = (data: Partial<SessionCreateRequest>) => {
    setSessionData(data);
    setShowSessionModal(true);
  };

  const handleSessionSave = () => {
    setShowSessionModal(false);
    setSessionData(null);
    // Aquí podrías recargar las analíticas o mostrar una notificación
  };

  const handleSessionCancel = () => {
    setShowSessionModal(false);
    setSessionData(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg mr-3">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Study Session Tracker</h1>
                  <p className="text-sm text-gray-600">Mide tu productividad</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>{state.user?.name}</span>
              </div>
              
              <button
                onClick={() => navigate('/folders')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Carpetas"
              >
                <BookOpen className="h-5 w-5" />
              </button>
              
              <button
                onClick={() => navigate('/sessions')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Sesiones"
              >
                <Settings className="h-5 w-5" />
              </button>
              
              <button
                onClick={logout}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Timer Section */}
          <section>
            <TimerComponent onSessionComplete={handleSessionComplete} />
          </section>

          {/* Dashboard Analytics */}
          <section>
            <DashboardComponent />
          </section>
        </div>
      </main>

      {/* Session Modal */}
      {showSessionModal && sessionData && (
        <SessionModal
          isOpen={showSessionModal}
          onClose={handleSessionCancel}
          onSave={handleSessionSave}
          initialData={sessionData}
        />
      )}
    </div>
  );
};
