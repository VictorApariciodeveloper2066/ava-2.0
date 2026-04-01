// Admin Dashboard Screen - Main admin interface
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
import AdminSidebar from '../components/AdminSidebar';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

interface DashboardStats {
  total_usuarios: number;
  total_estudiantes: number;
  total_profesores: number;
  total_admins: number;
  total_carreras: number;
  total_materias: number;
  total_secciones: number;
  total_periodos: number;
  codigos_disponibles: number;
  codigos_usados: number;
}

export default function AdminDashboardScreen({ navigation }: Props) {
  const { user, logout } = useAppStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await apiService.get('/admin/dashboard');
      setStats(response.data.stats);
    } catch (error: any) {
      Alert.alert('Error', 'No se pudieron cargar las estadísticas');
      console.error(error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
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

  // Sidebar menu items
  const sidebarItems = [
    { icon: '📊', label: 'Dashboard', onPress: () => {} },
    { icon: '👥', label: 'Usuarios', onPress: () => navigation.navigate('AdminUsuarios') },
    { icon: '🎓', label: 'Carreras', onPress: () => navigation.navigate('AdminCarreras') },
    { icon: '📚', label: 'Materias', onPress: () => navigation.navigate('AdminMaterias') },
    { icon: '📋', label: 'Secciones', onPress: () => navigation.navigate('AdminSecciones') },
    { icon: '📅', label: 'Períodos', onPress: () => navigation.navigate('AdminPeriodos') },
    { icon: '📝', label: 'Códigos de Profesor', onPress: () => navigation.navigate('AdminCodigos') },
    { icon: '👤', label: 'Asignar Alumnos', onPress: () => navigation.navigate('AdminAlumnos') },
    { icon: '📄', label: 'Reportes', onPress: () => navigation.navigate('AdminReportes') },
    { icon: '📋', label: 'Historial', onPress: () => navigation.navigate('AdminHistorial') },
  ];

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff6b6b" />
          <Text style={styles.loadingText}>Cargando estadísticas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      {/* Sidebar */}
      <AdminSidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        items={sidebarItems}
        userName={user?.primer_nombre || user?.username || 'Admin'}
      />
      
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#ff6b6b"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => setSidebarVisible(true)}
          >
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.greeting}>Panel de</Text>
            <Text style={styles.title}>Administración</Text>
          </View>

          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutIcon}>⏻</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        {stats && (
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>👥</Text>
              <Text style={styles.statValue}>{stats.total_usuarios}</Text>
              <Text style={styles.statLabel}>Usuarios</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>👨‍🎓</Text>
              <Text style={styles.statValue}>{stats.total_estudiantes}</Text>
              <Text style={styles.statLabel}>Estudiantes</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>👨‍🏫</Text>
              <Text style={styles.statValue}>{stats.total_profesores}</Text>
              <Text style={styles.statLabel}>Profesores</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>🎓</Text>
              <Text style={styles.statValue}>{stats.total_carreras}</Text>
              <Text style={styles.statLabel}>Carreras</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>📚</Text>
              <Text style={styles.statValue}>{stats.total_materias}</Text>
              <Text style={styles.statLabel}>Materias</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>📋</Text>
              <Text style={styles.statValue}>{stats.total_secciones}</Text>
              <Text style={styles.statLabel}>Secciones</Text>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          
          <View style={styles.actionsRow}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('AdminUsuarios')}
            >
              <Text style={styles.actionIcon}>👥</Text>
              <Text style={styles.actionLabel}>Usuarios</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('AdminCodigos')}
            >
              <Text style={styles.actionIcon}>📝</Text>
              <Text style={styles.actionLabel}>Códigos</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.actionsRow}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('AdminCarreras')}
            >
              <Text style={styles.actionIcon}>🎓</Text>
              <Text style={styles.actionLabel}>Carreras</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('AdminMaterias')}
            >
              <Text style={styles.actionIcon}>📚</Text>
              <Text style={styles.actionLabel}>Materias</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Professor Codes Info */}
        {stats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Códigos de Profesor</Text>
            <View style={styles.codigosCard}>
              <View style={styles.codigoStat}>
                <Text style={styles.codigoStatValue}>{stats.codigos_disponibles}</Text>
                <Text style={styles.codigoStatLabel}>Disponibles</Text>
              </View>
              <View style={styles.codigoStat}>
                <Text style={styles.codigoStatValue}>{stats.codigos_usados}</Text>
                <Text style={styles.codigoStatLabel}>Usados</Text>
              </View>
              <TouchableOpacity
                style={styles.generarButton}
                onPress={() => navigation.navigate('AdminCodigos')}
              >
                <Text style={styles.generarButtonText}>Generar Más</Text>
              </TouchableOpacity>
            </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  menuButton: {
    padding: theme.spacing.sm,
  },
  menuIcon: {
    fontSize: 28,
    color: '#ff6b6b',
  },
  headerCenter: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  greeting: {
    fontSize: theme.typography.small,
    color: theme.colors.textSecondary,
  },
  title: {
    fontSize: theme.typography.heading,
    fontWeight: theme.typography.bold,
    color: '#ff6b6b',
    marginTop: 2,
  },
  logoutButton: {
    padding: theme.spacing.sm,
  },
  logoutIcon: {
    fontSize: 24,
    color: theme.colors.textSecondary,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: theme.spacing.lg,
    paddingTop: 0,
  },
  statCard: {
    width: '30%',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    margin: '1.66%',
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: theme.spacing.xs,
  },
  statValue: {
    fontSize: theme.typography.heading,
    fontWeight: theme.typography.bold,
    color: '#ff6b6b',
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
    marginBottom: theme.spacing.md,
  },

  // Actions
  actionsRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginHorizontal: theme.spacing.xs,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: theme.spacing.sm,
  },
  actionLabel: {
    fontSize: theme.typography.body,
    fontWeight: theme.typography.bold,
    color: theme.colors.text,
  },

  // Codigos Card
  codigosCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codigoStat: {
    alignItems: 'center',
  },
  codigoStatValue: {
    fontSize: theme.typography.heading,
    fontWeight: theme.typography.bold,
    color: '#ff6b6b',
  },
  codigoStatLabel: {
    fontSize: theme.typography.tiny,
    color: theme.colors.textSecondary,
  },
  generarButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  generarButtonText: {
    color: '#fff',
    fontWeight: theme.typography.bold,
    fontSize: theme.typography.small,
  },
});
