import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, UserCreateRequest, UserLoginRequest } from '../types';
import { apiService } from '../services/api';

// 1. Escáner anti-basura: Se ejecuta antes de que React inicie
const checkAndCleanStorage = () => {
  const t = localStorage.getItem('token');
  const u = localStorage.getItem('user');
  
  if (t === 'undefined' || t === 'null' || t === '') {
    localStorage.removeItem('token');
  }
  if (u === 'undefined' || u === 'null' || u === '[object Object]') {
    localStorage.removeItem('user');
  }
  
  return localStorage.getItem('token');
};

const validToken = checkAndCleanStorage();

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

// Interfaz interna para manejar el payload exacto que viene de tu backend modificado
interface LoginRegisterPayload {
  token: string;
  userId: number; 
  name: string;
  email: string;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: LoginRegisterPayload }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_USER'; payload: User }
  | { type: 'INIT_COMPLETE' };

// 2. Estado inicial blindado
const initialState: AuthState = {
  user: null,
  token: validToken, 
  isLoading: false,
  isAuthenticated: !!validToken, 
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS': {
      const user: User = {
        id: String(action.payload.userId), // Mapeo seguro a string
        name: action.payload.name,
        email: action.payload.email,
        createdAt: new Date().toISOString(),
      };
      
      // Solo guardamos si realmente tenemos un token válido (evitamos guardar "undefined")
      if (action.payload.token) {
        localStorage.setItem('token', action.payload.token);
      }
      localStorage.setItem('user', JSON.stringify(user));
      
      return {
        ...state,
        user: user,
        token: action.payload.token || state.token,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      };
    }
    case 'AUTH_FAILURE':
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return {
        ...state,
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
        error: action.payload,
      };
    case 'LOGOUT':
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return {
        ...state,
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'SET_USER':
      localStorage.setItem('user', JSON.stringify(action.payload));
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
      };
    case 'INIT_COMPLETE':
      return {
        ...state,
        isLoading: false,
      };
    default:
      return state;
  }
};

interface AuthContextType {
  state: AuthState;
  login: (credentials: UserLoginRequest) => Promise<void>;
  register: (userData: UserCreateRequest) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const initializeAuth = async () => {
      dispatch({ type: 'AUTH_START' });

      try {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (token) {
          if (!userStr || userStr === 'undefined' || userStr === 'null' || userStr === '[object Object]' || !userStr.trim().startsWith('{')) {
            console.error('Data de usuario inválida en localStorage, limpiando...');
            dispatch({ type: 'LOGOUT' });
            return;
          }

          let user: User;
          try {
            user = JSON.parse(userStr);
          } catch (parseError) {
            console.error('Error parseando el usuario, limpiando...', parseError);
            dispatch({ type: 'LOGOUT' });
            return;
          }

          if (!user || typeof user !== 'object' || !user.id || user.id === 'undefined') {
            console.error('Estructura de usuario inválida, limpiando...');
            dispatch({ type: 'LOGOUT' });
            return;
          }

          dispatch({ type: 'SET_USER', payload: user });

          try {
            await refreshToken(); 
          } catch (refreshError) {
            console.warn('Advertencia: No se pudo refrescar los datos del usuario, pero el token sigue válido en el cliente.', refreshError);
          }
        }
      } catch (error) {
        console.error('Error durante la inicialización', error);
        dispatch({ type: 'LOGOUT' });
      } finally {
        dispatch({ type: 'INIT_COMPLETE' });
      }
    };

    initializeAuth();
  }, []);

  const refreshToken = async () => {
    try {
      const response = await apiService.getCurrentUser();
      
      const rawResponse = response as any;
      const data = rawResponse.data?.data || rawResponse.data || rawResponse;
      
      if (data && data.userId) {
        const userData: User = {
          id: String(data.userId),
          name: data.name,
          email: data.email,
          createdAt: state.user?.createdAt || new Date().toISOString() 
        };
        dispatch({ type: 'SET_USER', payload: userData });
      } else {
        throw new Error('No user data received from token refresh');
      }
    } catch (error) {
      console.warn('No se pudo validar el token silenciosamente.', error);
    }
  };

  const login = async (credentials: UserLoginRequest) => {
    try {
      dispatch({ type: 'AUTH_START' });

      if (!credentials.email || !credentials.password) {
        throw new Error('Email y contraseña son requeridos');
      }

      const response = await apiService.login(credentials);
      
      // Truco a prueba de fallos: buscamos los datos reales ignorando el tipado estricto
      const rawResponse = response as any;
      const payloadData = rawResponse.data?.data || rawResponse.data || rawResponse;

      if (!payloadData || !payloadData.token) {
          throw new Error('Respuesta del servidor incompleta');
      }

      dispatch({ type: 'AUTH_SUCCESS', payload: payloadData as LoginRegisterPayload });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al iniciar sesión';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  const register = async (userData: UserCreateRequest) => {
    try {
      dispatch({ type: 'AUTH_START' });

      if (!userData.name || !userData.email || !userData.password) {
        throw new Error('Todos los campos son requeridos');
      }

      if (userData.password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }

      const response = await apiService.register(userData);
      
      // Mismo truco a prueba de fallos para el registro
      const rawResponse = response as any;
      const payloadData = rawResponse.data?.data || rawResponse.data || rawResponse;

      if (!payloadData || !payloadData.token) {
        throw new Error('Respuesta del servidor incompleta');
      }

      dispatch({ type: 'AUTH_SUCCESS', payload: payloadData as LoginRegisterPayload });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al registrarse';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: AuthContextType = {
    state,
    login,
    register,
    logout,
    clearError,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};