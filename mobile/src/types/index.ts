// User types for the mobile app

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'estudiante' | 'profesor' | 'comandante' | 'admin';
  primer_nombre: string | null;
  primer_apellido: string | null;
  ci: string | null;
  telefono: string | null;
  avatar_url: string | null;
  es_comandante: boolean;
  carrera_id: number | null;
  institucion_id: number | null;
  notificaciones_activas: boolean;
  formato_hora: string;
  activo: boolean;
}

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  user: User;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  primer_nombre: string;
  primer_apellido: string;
  ci?: string;
  telefono?: string;
}

// Course/Seccion types
export interface Seccion {
  id: number;
  codigo: string;
  aula: string | null;
  dia: number;
  start_time: string | null;
  end_time: string | null;
  capacidad: number;
  asignatura_id: number;
  periodo_id: number;
  profesor_id?: number;
}

export interface Course {
  id: number;
  name: string;
  aula: string | null;
  dia: number;
  start_time: string | null;
  end_time: string | null;
}

// Attendance types
export interface AttendanceRecord {
  id: number;
  course_id: number;
  course_name?: string;
  date: string;
  time: string;
  state: string;
}

export interface AttendanceSummary {
  course_id: number;
  course_name: string;
  total: number;
  presente: number;
  ausente: number;
  justificado: number;
}

// Justificativo types
export interface Justificativo {
  id: number;
  course_id: number;
  course_name?: string;
  fecha_clase: string;
  motivo: string;
  archivo_nombre: string | null;
  estado: 'Pendiente' | 'Aprobado' | 'Rechazado';
}

// API Error
export interface ApiError {
  error: string;
  message?: string;
}

// Sync types
export interface SyncData {
  pending_attendance: AttendanceRecord[];
  pending_justificativos: Justificativo[];
  last_sync?: string;
}