import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import type { 
  AuthResponse, 
  User, 
  UserCreateRequest, 
  UserLoginRequest,
  Folder,
  FolderCreateRequest,
  Session,
  SessionCreateRequest,
  SessionUpdateRequest,
  WeeklyAnalytics,
  MonthlyAnalytics,
  FolderAnalytics,
  ApiResponse,
  PaginatedResponse,
  ApiError
} from '../types';

const API_BASE_URL = 'https://sst-backend-csc8.onrender.com';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      withCredentials: false, // FUERZA a no usar cookies, solo el Header
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para añadir el token JWT
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptor para manejar errores de autenticación
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: unknown): ApiError {
    if (axios.isAxiosError(error) && error.response) {
      return {
        message: error.response.data?.message || 'Error en la solicitud',
        status: error.response.status,
        details: error.response.data?.details,
      };
    }
    return {
      message: 'Error de conexión',
      status: 0,
      details: error,
    };
  }

  // Authentication endpoints
  async register(userData: UserCreateRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await this.api.post<AuthResponse>('/api/auth/register', userData);
    return { data: response.data };
  }

  async login(credentials: UserLoginRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await this.api.post<AuthResponse>('/api/auth/login', credentials);
    return { data: response.data };
  }

  // Folder endpoints
  async getFolders(): Promise<ApiResponse<Folder[]>> {
    const response = await this.api.get<Folder[]>('/api/folders');
    return { data: response.data };
  }

  async getFolder(id: string): Promise<ApiResponse<Folder>> {
    const response = await this.api.get<Folder>(`/api/folders/${id}`);
    return { data: response.data };
  }

  async createFolder(folderData: FolderCreateRequest): Promise<ApiResponse<Folder>> {
    const response = await this.api.post<Folder>('/api/folders', folderData);
    return { data: response.data };
  }

  async deleteFolder(id: string): Promise<ApiResponse<void>> {
    await this.api.delete(`/api/folders/${id}`);
    return { data: undefined };
  }

  // Session endpoints
  //async getSessions(): Promise<ApiResponse<PaginatedResponse<Session>>> {
  //  const response = await this.api.get<PaginatedResponse<Session>>('/api/sessions');
  //  return { data: response.data };
  //}

  async getSessions(): Promise<ApiResponse<PaginatedResponse<Session>>> {
    try {
      // 1. Verificamos qué tiene el interceptor antes de salir
      const currentToken = localStorage.getItem('token');
      console.log('[getSessions] Preparando petición. Token en Storage:', currentToken ? 'Presente' : 'AUSENTE');

      const response = await this.api.get<PaginatedResponse<Session>>('/api/sessions');
      
      // 2. Verificamos la estructura real que llega del Backend
      console.log('[getSessions] Respuesta exitosa:', response.data);
      
      return { data: response.data };
    } catch (error: any) {
        console.error('[getSessions] Fallo crítico:', {
          status: error.status, // Ya no usamos error.response?.status
          message: error.message,
          details: error.details
        });
        throw error;
    }
  }

  async getSession(id: string): Promise<ApiResponse<Session>> {
    const response = await this.api.get<Session>(`/api/sessions/${id}`);
    return { data: response.data };
  }

  async createSession(sessionData: SessionCreateRequest): Promise<ApiResponse<Session>> {
    const response = await this.api.post<Session>('/api/sessions', sessionData);
    return { data: response.data };
  }

  async updateSession(id: string, sessionData: SessionUpdateRequest): Promise<ApiResponse<Session>> {
    const response = await this.api.put<Session>(`/api/sessions/${id}`, sessionData);
    return { data: response.data };
  }

  async deleteSession(id: string): Promise<ApiResponse<void>> {
    await this.api.delete(`/api/sessions/${id}`);
    return { data: undefined };
  }

  // Analytics endpoints
  async getWeeklyAnalytics(): Promise<ApiResponse<WeeklyAnalytics>> {
    const response = await this.api.get<WeeklyAnalytics>('/api/analytics/weekly');
    return { data: response.data };
  }

  async getMonthlyAnalytics(): Promise<ApiResponse<MonthlyAnalytics>> {
    const response = await this.api.get<MonthlyAnalytics>('/api/analytics/monthly');
    return { data: response.data };
  }

  async getAnalyticsByFolder(): Promise<ApiResponse<FolderAnalytics[]>> {
    const response = await this.api.get<FolderAnalytics[]>('/api/analytics/by-folder');
    return { data: response.data };
  }

  async getProductivityHours(): Promise<ApiResponse<unknown[]>> {
    const response = await this.api.get<unknown[]>('/api/analytics/productivity-hours');
    return { data: response.data };
  }

  // User profile endpoint
  async getCurrentUser(): Promise<ApiResponse<User>> {
    const response = await this.api.get<User>('/api/auth/test');
    return { data: response.data };
  }
}

export const apiService = new ApiService();
export default apiService;
