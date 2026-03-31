// Zustand store for app state management
import { create } from 'zustand';
import { User, Seccion, Course, AttendanceRecord, Justificativo } from '../types';
import apiService from '../services/api';
import { STORAGE_KEYS } from '../utils/env';

// Re-export storage from api service
import { storage } from '../services/api';

interface AppState {
  // Auth state
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  needsEnrollment: boolean; // New: true if user needs to complete enrollment
  
  // Data state
  secciones: Seccion[];
  courses: Course[];
  attendanceHistory: AttendanceRecord[];
  justificativos: Justificativo[];
  
  // Actions
  login: (username: string, password: string) => Promise<void>;
  register: (data: {
    username: string;
    email: string;
    password: string;
    primer_nombre: string;
    primer_apellido: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  loadSecciones: () => Promise<void>;
  loadCourses: () => Promise<void>;
  loadAttendanceHistory: () => Promise<void>;
  loadJustificativos: () => Promise<void>;
  marcarAsistencia: (seccionId: number, codigo: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  completeEnrollment: () => void; // New: mark enrollment as complete
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  isLoading: true,
  needsEnrollment: false,
  secciones: [],
  courses: [],
  attendanceHistory: [],
  justificativos: [],

  // Login action
  login: async (username: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await apiService.login({ username, password });
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        needsEnrollment: false, // Login means already enrolled
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // Register action
  register: async (data) => {
    set({ isLoading: true });
    try {
      const response = await apiService.register(data);
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        needsEnrollment: true, // New user needs to complete enrollment
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // Complete enrollment
  completeEnrollment: () => {
    set({ needsEnrollment: false });
  },

  // Logout action
  logout: async () => {
    await apiService.logout();
    set({
      user: null,
      isAuthenticated: false,
      secciones: [],
      courses: [],
      attendanceHistory: [],
      justificativos: [],
    });
  },

  // Check auth on app start
  checkAuth: async () => {
    try {
      const userData = await storage.getItem(STORAGE_KEYS.USER_DATA);
      const token = await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      
      if (userData && token) {
        const user = JSON.parse(userData);
        set({ user, isAuthenticated: true, isLoading: false });
        
        // Optionally refresh user data
        try {
          const { user: freshUser } = await apiService.getProfile();
          set({ user: freshUser });
        } catch {
          // Token might be invalid, clear auth
          await get().logout();
        }
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  // Load secciones
  loadSecciones: async () => {
    try {
      const { secciones } = await apiService.getSecciones();
      set({ secciones });
    } catch (error) {
      console.error('Error loading secciones:', error);
    }
  },

  // Load courses (legacy)
  loadCourses: async () => {
    try {
      // Could add a separate endpoint for courses if needed
      // For now, we'll use secciones
      await get().loadSecciones();
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  },

  // Load attendance history
  loadAttendanceHistory: async () => {
    try {
      const { historial } = await apiService.getAttendanceHistory(30);
      set({ attendanceHistory: historial });
    } catch (error) {
      console.error('Error loading attendance:', error);
    }
  },

  // Load justificativos
  loadJustificativos: async () => {
    try {
      const { justificativos } = await apiService.getJustificativos();
      set({ justificativos });
    } catch (error) {
      console.error('Error loading justificativos:', error);
    }
  },

  // Marcar asistencia
  marcarAsistencia: async (seccionId: number, codigo: string) => {
    try {
      await apiService.marcarAsistencia(seccionId, codigo);
      // Reload attendance after marking
      await get().loadAttendanceHistory();
    } catch (error) {
      throw error;
    }
  },

  // Update profile
  updateProfile: async (data: Partial<User>) => {
    try {
      const { user } = await apiService.updateProfile(data);
      set({ user });
    } catch (error) {
      throw error;
    }
  },
}));