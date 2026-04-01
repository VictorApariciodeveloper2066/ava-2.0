// Lista Alumnos Screen - View and mark student attendance
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import theme from '../utils/theme';
import apiService from '../services/api';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any, 'ListaAlumnos'>;
};

interface Alumno {
  id: number;
  nombre: string;
  ci: string;
  email: string;
  asistencia_porcentaje: number;
  total_clases: number;
  presentes: number;
  estado_hoy: string;
}

export default function ListaAlumnosScreen({ navigation, route }: Props) {
  const { seccion, materia } = route.params as { seccion: any; materia: any };
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fecha, setFecha] = useState('');

  useEffect(() => {
    loadAlumnos();
  }, []);

  const loadAlumnos = async () => {
    try {
      const response = await apiService.get(`/profesor/seccion/${seccion.id}/alumnos`);
      setAlumnos(response.data.alumnos || []);
      setFecha(response.data.fecha || '');
    } catch (error: any) {
      Alert.alert('Error', 'No se pudieron cargar los alumnos');
      console.error(error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAlumnos();
  };

  const handleMarcarAsistencia = async (alumnoId: number, estado: string) => {
    try {
      await apiService.post('/profesor/marcar-asistencia', {
        seccion_id: seccion.id,
        alumno_id: alumnoId,
        estado: estado,
      });
      
      // Update local state
      setAlumnos(prev => prev.map(a => 
        a.id === alumnoId ? { ...a, estado_hoy: estado } : a
      ));
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Error al marcar asistencia';
      Alert.alert('Error', message);
    }
  };

  const handleVerHistorial = (alumno: Alumno) => {
    navigation.navigate('HistorialAlumno', {
      alumno,
      seccion,
      materia,
    });
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'presente':
        return theme.colors.primary;
      case 'ausente':
        return '#ff4444';
      case 'justificado':
        return '#ffaa00';
      default:
        return theme.colors.textSecondary;
    }
  };

  const getEstadoText = (estado: string) => {
    switch (estado) {
      case 'presente':
        return '✓ Presente';
      case 'ausente':
        return '✗ Ausente';
      case 'justificado':
        return '⚠ Justificado';
      default:
        return '○ Sin marcar';
    }
  };

  const presentes = alumnos.filter(a => a.estado_hoy === 'presente').length;
  const ausentes = alumnos.filter(a => a.estado_hoy === 'ausente').length;
  const justificados = alumnos.filter(a => a.estado_hoy === 'justificado').length;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Cargando alumnos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Lista de Alumnos</Text>
          <Text style={styles.subtitle}>{materia.nombre}</Text>
          <Text style={styles.fecha}>Fecha: {fecha}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>{presentes}</Text>
            <Text style={styles.statLabel}>Presentes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#ff4444' }]}>{ausentes}</Text>
            <Text style={styles.statLabel}>Ausentes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#ffaa00' }]}>{justificados}</Text>
            <Text style={styles.statLabel}>Justificados</Text>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsBox}>
          <Text style={styles.instructionsText}>
            Toca el botón de estado para cambiar entre Presente, Ausente y Justificado
          </Text>
        </View>

        {/* Alumnos List */}
        {alumnos.map((alumno) => (
          <View key={alumno.id} style={styles.alumnoCard}>
            <View style={styles.alumnoInfo}>
              <Text style={styles.alumnoNombre}>{alumno.nombre}</Text>
              <Text style={styles.alumnoCI}>CI: {alumno.ci || 'N/A'}</Text>
              <Text style={styles.alumnoAsistencia}>
                Asistencia general: {alumno.asistencia_porcentaje}%
              </Text>
            </View>
            
            <View style={styles.estadoContainer}>
              <TouchableOpacity
                style={[
                  styles.estadoButton,
                  { backgroundColor: getEstadoColor(alumno.estado_hoy) }
                ]}
                onPress={() => {
                  // Cycle through states: sin_marcar -> presente -> ausente -> justificado -> sin_marcar
                  const states = ['sin_marcar', 'presente', 'ausente', 'justificado'];
                  const currentIndex = states.indexOf(alumno.estado_hoy);
                  const nextState = states[(currentIndex + 1) % states.length];
                  if (nextState !== 'sin_marcar') {
                    handleMarcarAsistencia(alumno.id, nextState);
                  } else {
                    // Reset to sin_marcar (delete attendance)
                    handleMarcarAsistencia(alumno.id, 'ausente');
                  }
                }}
              >
                <Text style={styles.estadoButtonText}>
                  {getEstadoText(alumno.estado_hoy)}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.historialButton}
                onPress={() => handleVerHistorial(alumno)}
              >
                <Text style={styles.historialButtonText}>Ver historial</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {alumnos.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyText}>No hay alumnos inscritos</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },

  // Header
  header: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: theme.typography.heading,
    fontWeight: theme.typography.bold,
    color: theme.colors.textDark,
  },
  subtitle: {
    fontSize: theme.typography.body,
    color: '#1a2a1f',
    marginTop: theme.spacing.xs,
  },
  fecha: {
    fontSize: theme.typography.small,
    color: '#2a3a2f',
    marginTop: theme.spacing.xs,
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    padding: theme.spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.xs,
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.typography.heading + 4,
    fontWeight: theme.typography.bold,
  },
  statLabel: {
    fontSize: theme.typography.tiny,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },

  // Instructions
  instructionsBox: {
    backgroundColor: '#1a2a3f',
    marginHorizontal: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
  },
  instructionsText: {
    fontSize: theme.typography.small,
    color: '#50a0f0',
    textAlign: 'center',
  },

  // Alumno Card
  alumnoCard: {
    backgroundColor: theme.colors.card,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
  },
  alumnoInfo: {
    marginBottom: theme.spacing.md,
  },
  alumnoNombre: {
    fontSize: theme.typography.body,
    fontWeight: theme.typography.bold,
    color: theme.colors.text,
  },
  alumnoCI: {
    fontSize: theme.typography.small,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  alumnoAsistencia: {
    fontSize: theme.typography.tiny,
    color: theme.colors.primary,
    marginTop: 2,
  },

  // Estado Container
  estadoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  estadoButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  estadoButtonText: {
    color: theme.colors.textDark,
    fontWeight: theme.typography.bold,
    fontSize: theme.typography.small,
  },
  historialButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  historialButtonText: {
    color: theme.colors.primary,
    fontWeight: theme.typography.semibold,
    fontSize: theme.typography.small,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  emptyText: {
    fontSize: theme.typography.body,
    color: theme.colors.textSecondary,
  },
});
