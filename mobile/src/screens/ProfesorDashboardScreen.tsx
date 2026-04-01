// Profesor Dashboard Screen
// Shows subjects assigned to the professor
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
import { useAppStore } from '../store';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import theme from '../utils/theme';
import apiService from '../services/api';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

interface Seccion {
  id: number;
  codigo: string;
  dia: number;
  start_time: string;
  end_time: string;
  aula: string;
  alumnos_count: number;
}

interface Materia {
  asignatura_id: number;
  codigo: string;
  nombre: string;
  semestre: number;
  secciones: Seccion[];
  total_alumnos: number;
}

export default function ProfesorDashboardScreen({ navigation }: Props) {
  const { user, logout } = useAppStore();
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMaterias();
  }, []);

  const loadMaterias = async () => {
    try {
      const response = await apiService.get('/profesor/materias');
      setMaterias(response.data.materias || []);
    } catch (error: any) {
      Alert.alert('Error', 'No se pudieron cargar las materias');
      console.error(error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMaterias();
  };

  const getDayName = (dia: number) => {
    const days = ['', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    return days[dia] || 'N/A';
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar', style: 'destructive', onPress: logout },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Cargando materias...</Text>
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
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Bienvenido,</Text>
            <Text style={styles.userName}>
              {user?.primer_nombre || user?.username || 'Profesor'}
            </Text>
            <Text style={styles.userRole}>
              👨‍🏫 Profesor
            </Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutIcon}>⏻</Text>
          </TouchableOpacity>
        </View>

        {/* Materias Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mis Materias</Text>
          
          {materias.length > 0 ? (
            materias.map((materia, index) => (
              <TouchableOpacity
                key={materia.asignatura_id || index}
                style={styles.materiaCard}
                onPress={() => navigation.navigate('ProfesorMateria', { materia })}
                activeOpacity={0.8}
              >
                <View style={styles.materiaHeader}>
                  <View style={styles.materiaInfo}>
                    <Text style={styles.materiaCodigo}>{materia.codigo}</Text>
                    <Text style={styles.materiaNombre}>{materia.nombre}</Text>
                  </View>
                  <View style={styles.alumnosBadge}>
                    <Text style={styles.alumnosCount}>{materia.total_alumnos}</Text>
                    <Text style={styles.alumnosLabel}>alumnos</Text>
                  </View>
                </View>
                
                <View style={styles.seccionesContainer}>
                  {materia.secciones.map((seccion, sIdx) => (
                    <View key={seccion.id || sIdx} style={styles.seccionItem}>
                      <Text style={styles.seccionDia}>{getDayName(seccion.dia)}</Text>
                      <Text style={styles.seccionHora}>{seccion.start_time} - {seccion.end_time}</Text>
                      <Text style={styles.seccionAula}>{seccion.aula || 'Sin aula'}</Text>
                    </View>
                  ))}
                </View>
                
                <View style={styles.cardFooter}>
                  <Text style={styles.verDetalles}>Ver detalles →</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📚</Text>
              <Text style={styles.emptyText}>No tienes materias asignadas</Text>
              <Text style={styles.emptySubtext}>
                Contacta al administrador para asignar materias
              </Text>
            </View>
          )}
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: theme.typography.small,
    color: theme.colors.textSecondary,
  },
  userName: {
    fontSize: theme.typography.heading,
    fontWeight: theme.typography.bold,
    color: theme.colors.text,
    marginTop: 2,
  },
  userRole: {
    fontSize: theme.typography.small,
    color: theme.colors.primary,
    marginTop: 2,
  },
  logoutButton: {
    padding: theme.spacing.sm,
  },
  logoutIcon: {
    fontSize: 24,
    color: theme.colors.textSecondary,
  },

  // Section
  section: {
    paddingHorizontal: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.body + 2,
    fontWeight: theme.typography.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },

  // Materia Card
  materiaCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  materiaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  materiaInfo: {
    flex: 1,
  },
  materiaCodigo: {
    fontSize: theme.typography.small,
    color: theme.colors.primary,
    fontWeight: theme.typography.semibold,
  },
  materiaNombre: {
    fontSize: theme.typography.body,
    fontWeight: theme.typography.bold,
    color: theme.colors.text,
    marginTop: 2,
  },
  alumnosBadge: {
    alignItems: 'center',
    backgroundColor: '#122017',
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  alumnosCount: {
    fontSize: theme.typography.heading,
    fontWeight: theme.typography.bold,
    color: theme.colors.primary,
  },
  alumnosLabel: {
    fontSize: theme.typography.tiny,
    color: theme.colors.textSecondary,
  },

  // Secciones
  seccionesContainer: {
    borderTopWidth: 1,
    borderTopColor: '#2a3a2f',
    paddingTop: theme.spacing.sm,
  },
  seccionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  seccionDia: {
    fontSize: theme.typography.small,
    fontWeight: theme.typography.semibold,
    color: theme.colors.primary,
    width: 40,
  },
  seccionHora: {
    fontSize: theme.typography.small,
    color: theme.colors.text,
    flex: 1,
  },
  seccionAula: {
    fontSize: theme.typography.small,
    color: theme.colors.textSecondary,
  },

  // Footer
  cardFooter: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#2a3a2f',
  },
  verDetalles: {
    fontSize: theme.typography.small,
    fontWeight: theme.typography.semibold,
    color: theme.colors.primary,
    textAlign: 'right',
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
    fontWeight: theme.typography.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptySubtext: {
    fontSize: theme.typography.small,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
