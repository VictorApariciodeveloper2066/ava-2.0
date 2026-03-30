// Dashboard Screen - Redesigned with web theme
// Shows courses clearly with attendance info
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  ScrollView,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { useAppStore } from '../store';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import theme from '../utils/theme';
import Button from '../components/Button';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function DashboardScreen({ navigation }: Props) {
  const { 
    user, 
    secciones, 
    isLoading, 
    loadSecciones, 
    loadAttendanceHistory,
    logout 
  } = useAppStore();
  
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSecciones();
    loadAttendanceHistory();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSecciones();
    await loadAttendanceHistory();
    setRefreshing(false);
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

  const getDayName = (dia: number) => {
    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    return days[dia] || 'Desconocido';
  };

  const getDayShort = (dia: number) => {
    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    return days[dia] || 'N/A';
  };

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const renderSeccion = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.courseCard}
      onPress={() => navigation.navigate('Attendance', { seccion: item })}
      activeOpacity={0.8}
    >
      {/* Course Header */}
      <View style={styles.courseHeader}>
        <View style={styles.courseDayBadge}>
          <Text style={styles.courseDayText}>{getDayShort(item.dia)}</Text>
        </View>
        <View style={styles.courseInfo}>
          <Text style={styles.courseName}>{item.codigo || item.name}</Text>
          <Text style={styles.courseTime}>
            {item.start_time || '--:--'} - {item.end_time || '--:--'}
          </Text>
        </View>
      </View>

      {/* Course Details */}
      <View style={styles.courseDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Aula</Text>
          <Text style={styles.detailValue}>{item.aula || 'Sin asignar'}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Asistencia</Text>
          <Text style={styles.detailValue}>85%</Text>
        </View>
      </View>

      {/* Action */}
      <View style={styles.courseAction}>
        <Text style={styles.actionText}>Marcar Asistencia →</Text>
      </View>
    </TouchableOpacity>
  );

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
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>
              {user?.primer_nombre || user?.username || 'Usuario'}
            </Text>
            <Text style={styles.userRole}>
              {user?.role === 'estudiante' ? '🎓 Estudiante' : 
               user?.role === 'profesor' ? '👨‍🏫 Profesor' : 
               user?.role === 'comandante' ? '🎖️ Comandante' : '👤 Administrador'}
            </Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Salir</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📅</Text>
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>Hoy</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>✅</Text>
            <Text style={styles.statValue}>85%</Text>
            <Text style={styles.statLabel}>Asistencia</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📚</Text>
            <Text style={styles.statValue}>{secciones.length}</Text>
            <Text style={styles.statLabel}>Materias</Text>
          </View>
        </View>

        {/* Courses Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mis Materias</Text>
          
          {secciones.length > 0 ? (
            secciones.map((seccion, index) => (
              <View key={seccion.id || index}>
                {renderSeccion({ item: seccion })}
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📚</Text>
              <Text style={styles.emptyTitle}>No tienes materias asignadas</Text>
              <Text style={styles.emptySubtitle}>
                Contacta a tu administrador para asignar materias
              </Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => navigation.navigate('AttendanceHistory')}
          >
            <Text style={styles.quickActionIcon}>📋</Text>
            <Text style={styles.quickActionLabel}>Historial</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => navigation.navigate('Justificativos')}
          >
            <Text style={styles.quickActionIcon}>📝</Text>
            <Text style={styles.quickActionLabel}>Justificar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.quickActionIcon}>👤</Text>
            <Text style={styles.quickActionLabel}>Perfil</Text>
          </TouchableOpacity>
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

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: theme.typography.body,
    color: theme.colors.textSecondary,
  },
  userName: {
    fontSize: theme.typography.heading,
    fontWeight: theme.typography.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
  },
  userRole: {
    fontSize: theme.typography.small,
    color: theme.colors.primary,
    marginTop: theme.spacing.xs,
  },
  logoutButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  logoutText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body,
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.xs,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: theme.spacing.xs,
  },
  statValue: {
    fontSize: theme.typography.heading,
    fontWeight: theme.typography.bold,
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: theme.typography.tiny,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
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

  // Course Card
  courseCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#1a2a1f',
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  courseDayBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing.md,
  },
  courseDayText: {
    color: theme.colors.textDark,
    fontWeight: theme.typography.bold,
    fontSize: theme.typography.small,
  },
  courseInfo: {
    flex: 1,
  },
  courseName: {
    fontSize: theme.typography.body + 2,
    fontWeight: theme.typography.bold,
    color: theme.colors.text,
  },
  courseTime: {
    fontSize: theme.typography.small,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  courseDetails: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#2a3a2f',
    paddingTop: theme.spacing.md,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: theme.typography.tiny,
    color: theme.colors.textSecondary,
  },
  detailValue: {
    fontSize: theme.typography.body,
    fontWeight: theme.typography.semibold,
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
  },
  courseAction: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#2a3a2f',
  },
  actionText: {
    color: theme.colors.primary,
    fontWeight: theme.typography.semibold,
    fontSize: theme.typography.body,
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
  emptyTitle: {
    fontSize: theme.typography.body + 2,
    fontWeight: theme.typography.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    fontSize: theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  quickAction: {
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: theme.spacing.sm,
  },
  quickActionLabel: {
    fontSize: theme.typography.small,
    color: theme.colors.textSecondary,
  },
});
