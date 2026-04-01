// Historial Alumno Screen - Student attendance history for professor view
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
  route: RouteProp<any, 'HistorialAlumno'>;
};

interface AsistenciaRecord {
  fecha: string;
  estado: string;
  created_at: string;
}

interface CambioRecord {
  fecha: string;
  estado_anterior: string | null;
  estado_nuevo: string;
}

export default function HistorialAlumnoScreen({ navigation, route }: Props) {
  const { alumno, seccion, materia } = route.params as { alumno: any; seccion: any; materia: any };
  const [historial, setHistorial] = useState<AsistenciaRecord[]>([]);
  const [cambios, setCambios] = useState<CambioRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHistorial();
  }, []);

  const loadHistorial = async () => {
    try {
      const response = await apiService.get(`/profesor/historial/${alumno.id}/${seccion.id}`);
      setHistorial(response.data.historial || []);
      setCambios(response.data.cambios || []);
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo cargar el historial');
      console.error(error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistorial();
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
        return 'Presente';
      case 'ausente':
        return 'Ausente';
      case 'justificado':
        return 'Justificado';
      default:
        return estado;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-VE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es-VE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Calculate stats
  const totalClases = historial.length;
  const presentes = historial.filter(h => h.estado === 'presente').length;
  const ausentes = historial.filter(h => h.estado === 'ausente').length;
  const justificados = historial.filter(h => h.estado === 'justificado').length;
  const porcentaje = totalClases > 0 ? Math.round((presentes / totalClases) * 100) : 100;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Cargando historial...</Text>
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
          <Text style={styles.alumnoNombre}>{alumno.nombre}</Text>
          <Text style={styles.alumnoCI}>CI: {alumno.ci || 'N/A'}</Text>
          <Text style={styles.materiaNombre}>{materia.nombre}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{porcentaje}%</Text>
            <Text style={styles.statLabel}>Asistencia</Text>
          </View>
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
            <Text style={styles.statLabel}>Justif.</Text>
          </View>
        </View>

        {/* Historial */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historial de Asistencia</Text>
          
          {historial.length > 0 ? (
            historial.map((record, index) => (
              <View key={index} style={styles.recordCard}>
                <View style={styles.recordFecha}>
                  <Text style={styles.recordFechaText}>{formatDate(record.fecha)}</Text>
                </View>
                <View style={[styles.recordEstado, { backgroundColor: getEstadoColor(record.estado) }]}>
                  <Text style={styles.recordEstadoText}>{getEstadoText(record.estado)}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No hay registros de asistencia</Text>
            </View>
          )}
        </View>

        {/* Cambios (Audit Log) */}
        {cambios.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Historial de Cambios</Text>
            <Text style={styles.sectionSubtitle}>Cambios realizados por el profesor</Text>
            
            {cambios.map((cambio, index) => (
              <View key={index} style={styles.cambioCard}>
                <Text style={styles.cambioFecha}>
                  {formatDate(cambio.fecha)} {formatTime(cambio.fecha)}
                </Text>
                <Text style={styles.cambioTexto}>
                  {cambio.estado_anterior ? (
                    <>
                      <Text style={{ color: getEstadoColor(cambio.estado_anterior) }}>
                        {getEstadoText(cambio.estado_anterior)}
                      </Text>
                      {' → '}
                      <Text style={{ color: getEstadoColor(cambio.estado_nuevo) }}>
                        {getEstadoText(cambio.estado_nuevo)}
                      </Text>
                    </>
                  ) : (
                    <Text style={{ color: getEstadoColor(cambio.estado_nuevo) }}>
                      Registrado como {getEstadoText(cambio.estado_nuevo)}
                    </Text>
                  )}
                </Text>
              </View>
            ))}
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
  alumnoNombre: {
    fontSize: theme.typography.heading,
    fontWeight: theme.typography.bold,
    color: theme.colors.textDark,
  },
  alumnoCI: {
    fontSize: theme.typography.small,
    color: '#1a2a1f',
    marginTop: theme.spacing.xs,
  },
  materiaNombre: {
    fontSize: theme.typography.body,
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
    padding: theme.spacing.sm,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.typography.heading,
    fontWeight: theme.typography.bold,
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: theme.typography.tiny,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },

  // Section
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.body,
    fontWeight: theme.typography.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  sectionSubtitle: {
    fontSize: theme.typography.small,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },

  // Record Card
  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  recordFecha: {
    flex: 1,
  },
  recordFechaText: {
    fontSize: theme.typography.body,
    color: theme.colors.text,
  },
  recordEstado: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  recordEstadoText: {
    color: theme.colors.textDark,
    fontWeight: theme.typography.bold,
    fontSize: theme.typography.small,
  },

  // Cambio Card
  cambioCard: {
    backgroundColor: '#1a2a3f',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  cambioFecha: {
    fontSize: theme.typography.small,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  cambioTexto: {
    fontSize: theme.typography.body,
    color: theme.colors.text,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  emptyText: {
    fontSize: theme.typography.body,
    color: theme.colors.textSecondary,
  },
});
