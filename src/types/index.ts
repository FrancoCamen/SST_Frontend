// User types
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface UserCreateRequest {
  name: string;
  email: string;
  password: string;
}

export interface UserLoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  type: string;
  userId: number;
  name: string;
  email: string;
}

// Folder types
export interface Folder {
  id: string;
  name: string;
  description: string;
  userId: string;
  createdAt: string;
  totalHours?: number;
  sessionCount?: number;
  lastSession?: string;
}

export interface FolderCreateRequest {
  name: string;
  description: string;
}

// Session types
export interface Session {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  folderId: string;
  folderName: string;
  tags?: string[];
  createdAt: string;
}

export interface SessionCreateRequest {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  folderId: string;
  tags?: string[];
}

export interface SessionUpdateRequest {
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  folderId?: string;
  tags?: string[];
}

// Tag types
export interface Tag {
  id: string;
  name: string;
}

export interface SessionTag {
  sessionId: string;
  tagId: string;
}

// Analytics types
export interface WeeklyAnalytics {
  totalSessions: number;
  totalHours: number;
  averageSessionDuration: number;
  dailyStats: DailyStats[];
  hoursByFolder: Record<string, number>;
  weekStart: string;
  weekEnd: string;
}

export interface MonthlyAnalytics {
  totalSessions: number;
  totalHours: number;
  averageSessionDuration: number;
  weeklyStats: WeeklyStats[];
  hoursByFolder: Record<string, number>;
  monthStart: string;
  monthEnd: string;
}

export interface DailyStats {
  date: string;
  sessions: number;
  hours: number;
}

export interface WeeklyStats {
  week: string;
  sessions: number;
  hours: number;
}

// Mantener compatibilidad con código existente
export interface DailyAnalytics {
  date: string;
  hours: number;
  sessions: number;
}

export interface FolderAnalytics {
  folderId: string;
  folderName: string;
  totalHours: number;
  sessionCount: number;
  percentage: number;
}

export interface ProductivityHour {
  hour: number;
  sessionCount: number;
  totalMinutes: number;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Timer state
export interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  startTime: Date | null;
  elapsedTime: number;
  currentSession: Partial<SessionCreateRequest> | null;
}

// Form types
export interface SessionForm {
  title: string;
  description: string;
  folderId: string;
  tags: string[];
}

// Dashboard stats
export interface DashboardStats {
  todayHours: number;
  weekHours: number;
  monthHours: number;
  totalSessions: number;
  averageSessionDuration: number;
  currentStreak: number;
}

// Error types
export interface ApiError {
  message: string;
  status: number;
  details?: unknown;
}
