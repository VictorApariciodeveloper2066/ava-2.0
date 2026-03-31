// Dashboard Screen - Weekly Schedule View (Horario Semanal Premium)
// Based on Stitch design with AVA theme colors
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ScrollView,
  StatusBar,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useAppStore } from '../store';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import theme from '../utils/theme';
import Sidebar from '../components/Sidebar';

const { width } = Dimensions.get('window');

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
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay()); // 0=Sunday, 1=Monday, etc.

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
    const days = ['', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    return days[dia] || '';
  };

  const getDayFull = (dia: number) => {
    const days = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    return days[dia] || '';
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const getRoleEmoji = (role: string | undefined) => {
    switch (role) {
      case 'estudiante': return '🎓';
      case 'profesor': return '👨‍🏫';
      case 'comandante': return '🎖️';
      default: return '👤';
    }
  };

  const getRoleName = (role: string | undefined) => {
    switch (role) {
      case 'estudiante': return 'Estudiante';
      case 'profesor': return 'Profesor';
      case 'comandante': return 'Comandante';
      default: return 'Administrador';
    }
  };

  // Get courses for selected day
  const getCoursesForDay = (day: number) => {
    // Convert from JS day (0=Sunday) to our format (1=Monday)
    const dayIndex = day === 0 ? 7 : day; // Convert Sunday to 7
    return secciones.filter(s => s.dia === dayIndex);
  };

  // Sidebar items
  const sidebarItems = [
    {
      icon: '📋',
      label: 'Historial de Asistencia',
      onPress: () => navigation.navigate('AttendanceHistory'),
    },
    {
      icon: '📝',
      label: 'Justificativos',
      onPress: () => navigation.navigate('Justificativos'),
    },
    {
      icon: '👤',
      label: 'Mi Perfil',
      onPress: () => navigation.navigate('Profile'),
    },
    {
      icon: '⚙️',
      label: 'Configuración',
      onPress: () => navigation.navigate('Profile'),
    },
  ];

  const renderDayButton = (dayIndex: number) => {
    const isSelected = dayIndex === selectedDay;
    const isToday = dayIndex === new Date().getDay();
    const coursesCount = getCoursesForDay(dayIndex).length;
    
    return (
      <TouchableOpacity
        key={dayIndex}
        style={[
          styles.dayButton,
          isSelected && styles.dayButtonSelected,
        ]}
        onPress={() => setSelectedDay(dayIndex)}
      >
        <Text style={[
          styles.dayName,
          isSelected && styles.dayNameSelected,
        ]}>
          {getDayName(dayIndex)}
        </Text>
        {isToday && <View style={styles.todayDot} />}
        {coursesCount > 0 && (
          <View style={styles.courseCountBadge}>
            <Text style={styles.courseCountText}>{coursesCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderCourseCard = (course: any, index: number) => (
    <TouchableOpacity
      key={course.id || index}
      style={styles.courseCard}
      onPress={() => navigation.navigate('Attendance', { seccion: course })}
      activeOpacity={0.8}
    >
      <View style={styles.courseTimeColumn}>
        <Text style={styles.courseStartTime}>{course.start_time || '--:--'}</Text>
        <View style={styles.timeLine} />
        <Text style={styles.courseEndTime}>{course.end_time || '--:--'}</Text>
      </View>
      
      <View style={styles.courseDetails}>
        <Text style={styles.courseName}>{course.codigo || course.name}</Text>
        <View style={styles.courseMeta}>
          <Text style={styles.courseAula}>📍 {course.aula || 'Sin aula'}</Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.attendanceButton}
        onPress={() => navigation.navigate('Attendance', { seccion: course })}
      >
        <Text style={styles.attendanceButtonText}>✓</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Get current date
  const currentDate = new Date();
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const currentMonth = monthNames[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();

  const coursesForSelectedDay = getCoursesForDay(selectedDay);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      {/* Sidebar */}
      <Sidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        items={sidebarItems}
        userName={user?.primer_nombre || user?.username || 'Usuario'}
        userRole={getRoleName(user?.role)}
      />
      
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
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => setSidebarVisible(true)}
          >
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.userName}>
              {user?.primer_nombre || user?.username || 'Usuario'}
            </Text>
          </View>

          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutIcon}>⏻</Text>
          </TouchableOpacity>
        </View>

        {/* Date Info */}
        <View style={styles.dateSection}>
          <Text style={styles.dateTitle}>Horario Semanal</Text>
          <Text style={styles.dateSubtitle}>
            {currentMonth} {currentYear}
          </Text>
        </View>

        {/* Week Selector */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.weekSelector}
          contentContainerStyle={styles.weekSelectorContent}
        >
          {[1, 2, 3, 4, 5, 6, 0].map(day => renderDayButton(day))}
        </ScrollView>

        {/* Selected Day Title */}
        <View style={styles.selectedDayHeader}>
          <Text style={styles.selectedDayTitle}>
            {getDayFull(selectedDay === 0 ? 7 : selectedDay)}
          </Text>
          <Text style={styles.selectedDayCount}>
            {coursesForSelectedDay.length} materia{coursesForSelectedDay.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Courses for Selected Day */}
        <View style={styles.coursesContainer}>
          {coursesForSelectedDay.length > 0 ? (
            coursesForSelectedDay.map((course, index) => renderCourseCard(course, index))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyTitle}>Sin clases este día</Text>
              <Text style={styles.emptySubtitle}>
                No tienes materias programadas para {getDayFull(selectedDay === 0 ? 7 : selectedDay)}
              </Text>
            </View>
          )}
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{secciones.length}</Text>
            <Text style={styles.statLabel}>Total Materias</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>85%</Text>
            <Text style={styles.statLabel}>Asistencia</Text>
          </View>
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
    alignItems: 'center',
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  menuButton: {
    padding: theme.spacing.sm,
  },
  menuIcon: {
    fontSize: 28,
    color: theme.colors.primary,
  },
  headerCenter: {
    flex: 1,
    marginLeft: theme.spacing.md,
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
  logoutButton: {
    padding: theme.spacing.sm,
  },
  logoutIcon: {
    fontSize: 24,
    color: theme.colors.textSecondary,
  },

  // Date Section
  dateSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  dateTitle: {
    fontSize: theme.typography.heading,
    fontWeight: theme.typography.bold,
    color: theme.colors.text,
  },
  dateSubtitle: {
    fontSize: theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },

  // Week Selector
  weekSelector: {
    marginBottom: theme.spacing.lg,
  },
  weekSelectorContent: {
    paddingHorizontal: theme.spacing.lg,
  },
  dayButton: {
    width: 60,
    height: 70,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
    position: 'relative',
  },
  dayButtonSelected: {
    backgroundColor: theme.colors.primary,
  },
  dayName: {
    fontSize: theme.typography.small,
    fontWeight: theme.typography.semibold,
    color: theme.colors.text,
  },
  dayNameSelected: {
    color: theme.colors.textDark,
  },
  todayDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary,
  },
  courseCountBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: theme.colors.primary,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseCountText: {
    fontSize: 10,
    fontWeight: theme.typography.bold,
    color: theme.colors.textDark,
  },

  // Selected Day Header
  selectedDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  selectedDayTitle: {
    fontSize: theme.typography.body + 2,
    fontWeight: theme.typography.bold,
    color: theme.colors.text,
  },
  selectedDayCount: {
    fontSize: theme.typography.small,
    color: theme.colors.textSecondary,
  },

  // Courses Container
  coursesContainer: {
    paddingHorizontal: theme.spacing.lg,
  },

  // Course Card (Timeline style)
  courseCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
  },
  courseTimeColumn: {
    alignItems: 'center',
    width: 60,
  },
  courseStartTime: {
    fontSize: theme.typography.body,
    fontWeight: theme.typography.bold,
    color: theme.colors.primary,
  },
  timeLine: {
    width: 2,
    height: 20,
    backgroundColor: '#2a3a2f',
    marginVertical: theme.spacing.xs,
  },
  courseEndTime: {
    fontSize: theme.typography.small,
    color: theme.colors.textSecondary,
  },
  courseDetails: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  courseName: {
    fontSize: theme.typography.body,
    fontWeight: theme.typography.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  courseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courseAula: {
    fontSize: theme.typography.small,
    color: theme.colors.textSecondary,
  },
  attendanceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attendanceButtonText: {
    fontSize: 20,
    color: theme.colors.textDark,
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

  // Quick Stats
  quickStats: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
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
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: theme.typography.tiny,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
});
