import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Square, Clock, AlertTriangle } from 'lucide-react';
import type { TimerState, SessionCreateRequest } from '../types';

interface TimerComponentProps {
  onSessionComplete: (sessionData: Partial<SessionCreateRequest>) => void;
}

export const TimerComponent: React.FC<TimerComponentProps> = ({ onSessionComplete }) => {
  const [timerState, setTimerState] = useState<TimerState>({
    isRunning: false,
    isPaused: false,
    startTime: null,
    elapsedTime: 0,
    currentSession: null,
  });
  
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const componentName = 'TimerComponent';

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
      logDebug('useEffect triggered', { isRunning: timerState.isRunning, isPaused: timerState.isPaused });
      
      if (timerState.isRunning && !timerState.isPaused) {
        logDebug('Starting interval');
        intervalRef.current = setInterval(() => {
          try {
            setTimerState(prev => {
              const newElapsedTime = Date.now() - (prev.startTime?.getTime() || Date.now());
              logDebug('Timer tick', { elapsedTime: newElapsedTime });
              return {
                ...prev,
                elapsedTime: newElapsedTime,
              };
            });
          } catch (tickError) {
            handleError(tickError, 'Timer interval callback');
          }
        }, 100);
      } else {
        if (intervalRef.current) {
          logDebug('Clearing interval');
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }

      return () => {
        if (intervalRef.current) {
          logDebug('Cleanup: clearing interval');
          clearInterval(intervalRef.current);
        }
      };
    } catch (error) {
      handleError(error, 'useEffect');
    }
  }, [timerState.isRunning, timerState.isPaused, handleError, logDebug]);

  const handleStart = () => {
    try {
      logDebug('handleStart called');
      const now = new Date();
      const newSession = {
        startTime: now.toISOString(),
      };
      
      logDebug('Creating new session', { startTime: newSession.startTime });
      
      setTimerState({
        isRunning: true,
        isPaused: false,
        startTime: now,
        elapsedTime: 0,
        currentSession: newSession,
      });
      
      setError(null); // Limpiar errores anteriores
      logDebug('Timer started successfully');
    } catch (error) {
      handleError(error, 'handleStart');
    }
  };

  const handlePause = () => {
    try {
      logDebug('handlePause called', { currentIsPaused: timerState.isPaused });
      
      setTimerState(prev => {
        const newIsPaused = !prev.isPaused;
        logDebug('Timer pause state changed', { oldIsPaused: prev.isPaused, newIsPaused });
        return {
          ...prev,
          isPaused: newIsPaused,
        };
      });
    } catch (error) {
      handleError(error, 'handlePause');
    }
  };

  const handleStop = () => {
    try {
      logDebug('handleStop called', { elapsedTime: timerState.elapsedTime });
      
      const endTime = new Date();
      const durationMinutes = Math.round(timerState.elapsedTime / 60000);
      
      if (!timerState.currentSession?.startTime) {
        throw new Error('No hay sesión iniciada para detener');
      }
      
      const sessionData: Partial<SessionCreateRequest> = {
        ...timerState.currentSession,
        endTime: endTime.toISOString(),
      };

      logDebug('Session completed', { 
        startTime: sessionData.startTime, 
        endTime: sessionData.endTime, 
        durationMinutes 
      });

      try {
        onSessionComplete(sessionData);
        logDebug('Session data sent to parent successfully');
      } catch (callbackError) {
        handleError(callbackError, 'onSessionComplete callback');
        return; // No resetear el timer si falló el callback
      }

      // Reset timer
      setTimerState({
        isRunning: false,
        isPaused: false,
        startTime: null,
        elapsedTime: 0,
        currentSession: null,
      });
      
      setError(null);
      logDebug('Timer reset successfully');
    } catch (error) {
      handleError(error, 'handleStop');
    }
  };

  const formatTime = (milliseconds: number): string => {
    try {
      if (typeof milliseconds !== 'number' || milliseconds < 0) {
        throw new Error(`Valor inválido para milliseconds: ${milliseconds}`);
      }
      
      const totalSeconds = Math.floor(milliseconds / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } catch (error) {
      handleError(error, 'formatTime');
      return '00:00:00'; // Valor por defecto
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8">
      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
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
        <details className="mb-4 p-2 bg-gray-50 rounded text-xs">
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
      {/* Timer Display */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Clock className="h-8 w-8 text-primary mr-3" />
          <h2 className="text-2xl font-bold text-gray-900">Temporizador de Estudio</h2>
        </div>
        
        <div className="timer-display mb-6">
          {formatTime(timerState.elapsedTime)}
        </div>

        {/* Status Indicator */}
        <div className="flex items-center justify-center mb-6">
          <div className={`flex items-center px-4 py-2 rounded-full text-sm font-medium ${
            timerState.isRunning && !timerState.isPaused
              ? 'bg-green-100 text-green-700'
              : timerState.isPaused
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-gray-100 text-gray-600'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${
              timerState.isRunning && !timerState.isPaused
                ? 'bg-green-500 animate-pulse'
                : timerState.isPaused
                ? 'bg-yellow-500'
                : 'bg-gray-400'
            }`}></div>
            {timerState.isRunning && !timerState.isPaused
              ? 'En curso'
              : timerState.isPaused
              ? 'Pausado'
              : 'Detenido'}
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex justify-center space-x-4">
          {!timerState.isRunning ? (
            <button
              onClick={handleStart}
              className="btn-primary flex items-center"
            >
              <Play className="h-5 w-5 mr-2" />
              Iniciar
            </button>
          ) : (
            <>
              <button
                onClick={handlePause}
                className="btn-secondary flex items-center"
              >
                {timerState.isPaused ? (
                  <>
                    <Play className="h-5 w-5 mr-2" />
                    Reanudar
                  </>
                ) : (
                  <>
                    <Pause className="h-5 w-5 mr-2" />
                    Pausar
                  </>
                )}
              </button>
              
              <button
                onClick={handleStop}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 active:scale-95 flex items-center"
              >
                <Square className="h-5 w-5 mr-2" />
                Detener
              </button>
            </>
          )}
        </div>
      </div>

      {/* Session Info */}
      {timerState.isRunning && timerState.startTime && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700">
            <span className="font-medium">Sesión iniciada:</span>{' '}
            {timerState.startTime.toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
          <p className="text-sm text-blue-600 mt-1">
            Duración actual: {formatTime(timerState.elapsedTime)}
          </p>
        </div>
      )}

      {/* Quick Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-2xl font-bold text-gray-900">
            {Math.floor(timerState.elapsedTime / 60000)}
          </p>
          <p className="text-xs text-gray-600">Minutos</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-2xl font-bold text-gray-900">
            {Math.floor((timerState.elapsedTime % 60000) / 1000)}
          </p>
          <p className="text-xs text-gray-600">Segundos</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-2xl font-bold text-gray-900">
            {(timerState.elapsedTime / 3600000).toFixed(1)}
          </p>
          <p className="text-xs text-gray-600">Horas</p>
        </div>
      </div>
    </div>
  );
};
