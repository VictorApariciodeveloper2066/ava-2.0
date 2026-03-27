// API Service for communicating with Flask backend
import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, STORAGE_KEYS } from '../utils/env';
import {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  User,
  Seccion,
  Course,
  AttendanceRecord,
  AttendanceSummary,
  Justificativo,
} from '../types';

class ApiService {
  private api: AxiosInstance;
  private accessToken: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        if (!this.accessToken) {
          this.accessToken = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        }
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired, try to refresh
          await this.handleTokenExpired();
        }
        return Promise.reject(error);
      }
    );
  }

  private async handleTokenExpired(): Promise<void> {
    try {
      const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (refreshToken) {
        const response = await this.api.post('/auth/refresh', {}, {
          headers: { Authorization: `Bearer ${refreshToken}` },
        });
        const { access_token } = response.data;
        await this.setTokens(access_token, refreshToken);
      } else {
        await this.logout();
      }
    } catch {
      await this.logout();
    }
  }

  private async setTokens(accessToken: string, refreshToken?: string): Promise<void> {
    this.accessToken = accessToken;
    await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    if (refreshToken) {
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/login', credentials);
    const { access_token, refresh_token, user } = response.data;
    await this.setTokens(access_token, refresh_token);
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    return response.data;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/register', data);
    const { access_token, user } = response.data;
    await this.setTokens(access_token);
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    return response.data;
  }

  async logout(): Promise<void> {
    this.accessToken = null;
    await AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
  }

  async getProfile(): Promise<{ user: User }> {
    const response = await this.api.get<{ user: User }>('/auth/profile');
    return response.data;
  }

  async updateProfile(data: Partial<User>): Promise<{ user: User; message: string }> {
    const response = await this.api.put<{ user: User; message: string }>('/auth/profile', data);
    const { user } = response.data;
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    return response.data;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const response = await this.api.post<{ message: string }>('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  }

  async getSecciones(): Promise<{ secciones: Seccion[] }> {
    const response = await this.api.get<{ secciones: Seccion[] }>('/secciones');
    return response.data;
  }

  async getSeccionDetail(seccionId: number): Promise<{ seccion: Seccion }> {
    const response = await this.api.get<{ seccion: Seccion }>(`/secciones/${seccionId}`);
    return response.data;
  }

  async marcarAsistencia(seccionId: number, codigoSesion: string): Promise<any> {
    const response = await this.api.post(`/secciones/${seccionId}/asistencia`, {
      codigo_sesion: codigoSesion,
    });
    return response.data;
  }

  async generarCodigo(seccionId: number, expiresMinutes?: number): Promise<any> {
    const response = await this.api.post(`/secciones/${seccionId}/generar-codigo`, {
      expires_minutes: expiresMinutes || 10,
    });
    return response.data;
  }

  async getSeccionHistorial(seccionId: number): Promise<{ historial: AttendanceRecord[] }> {
    const response = await this.api.get<{ historial: AttendanceRecord[] }>(`/secciones/${seccionId}/historial`);
    return response.data;
  }

  async getAttendanceHistory(courseId?: number, limit?: number): Promise<{ historial: AttendanceRecord[] }> {
    const params = new URLSearchParams();
    if (courseId) params.append('course_id', courseId.toString());
    if (limit) params.append('limit', limit.toString());
    
    const response = await this.api.get<{ historial: AttendanceRecord[] }>(
      `/asistencia/historial?${params.toString()}`
    );
    return response.data;
  }

  async getAttendanceResumen(): Promise<{ resumen: AttendanceSummary[] }> {
    const response = await this.api.get<{ resumen: AttendanceSummary[] }>('/asistencia/resumen');
    return response.data;
  }

  async getAttendanceHoy(): Promise<{ asistencia_hoy: AttendanceRecord[] }> {
    const response = await this.api.get<{ asistencia_hoy: AttendanceRecord[] }>('/asistencia/hoy');
    return response.data;
  }

  async getJustificativos(courseId?: number, estado?: string): Promise<{ justificativos: Justificativo[] }> {
    const params = new URLSearchParams();
    if (courseId) params.append('course_id', courseId.toString());
    if (estado) params.append('estado', estado);
    
    const response = await this.api.get<{ justificativos: Justificativo[] }>(
      `/justificativos?${params.toString()}`
    );
    return response.data;
  }

  async createJustificativo(data: {
    course_id: number;
    fecha_clase: string;
    motivo: string;
    archivo?: string;
  }): Promise<any> {
    const response = await this.api.post('/justificativos', data);
    return response.data;
  }

  async deleteJustificativo(id: number): Promise<{ message: string }> {
    const response = await this.api.delete<{ message: string }>(`/justificativos/${id}`);
    return response.data;
  }

  // Sync endpoints (for admins/profesores)
  async syncData(data: any): Promise<any> {
    const response = await this.api.post('/sync', data);
    return response.data;
  }

  async pushAttendance(seccionId: number, attendances: any[]): Promise<any> {
    const response = await this.api.post('/sync/push', {
      seccion_id: seccionId,
      attendances,
    });
    return response.data;
  }

  async pullData(since?: string): Promise<any> {
    const params = since ? `?since=${encodeURIComponent(since)}` : '';
    const response = await this.api.get(`/sync/pull${params}`);
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;