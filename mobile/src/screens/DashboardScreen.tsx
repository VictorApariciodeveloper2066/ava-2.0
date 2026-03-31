// Dashboard Screen - Grid layout with sidebar
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
  Dimensions,
} from 'react-native';
import { useAppStore } from '../store';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import theme from '../utils/theme';
import Sidebar from '../components/Sidebar';

const { width } = Dimensions.get('window');
const CARD_MARGIN = theme.spacing.sm;
const CARD_WIDTH = (width - theme.spacing.lg * 2 - CARD_MARGIN * 2) / 2;

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

  const getDayShort = (dia: number) => {
    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    return days[dia] || 'N/A';
  };

  const getDayFull = (dia: number) => {
    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    return days[dia] || 'Desconocido';
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

  const renderCourseCard = ({ item, index }: { item: any; index: number }) => (
    <TouchableOpacity 
      style={[
        styles.courseCard,
        index % 2 === 0 ? { marginRight: CARD_MARGIN } : { marginLeft: CARD_MARGIN },
      ]}
      onPress={() => navigation.navigate('Attendance', { seccion: item })}
      activeOpacity={0.8}
    >
      <View style={styles.courseDayBadge}>
        <Text style={styles.courseDayText}>{getDayShort(item.dia)}</Text>
      </View>
      <Text style={styles.courseName} numberOfLines={2}>
        {item.codigo || item.name}
      </Text>
      <View style={styles.courseTime}>
        <Text style={styles.timeText}>{item.start_time || '--:--'}</Text>
      </View>
      <View style={styles.courseAula}>
        <Text style={styles.aulaText}>{item.aula || 'Sin aula'}</Text>
      </View>
    </TouchableOpacity>
  );

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
            <Text style={styles.userRole}>
              {getRoleEmoji(user?.role)} {getRoleName(user?.role)}
            </Text>
          </View>

          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutIcon}>⏻</Text>
          </TouchableOpacity>
        </View>

        {/* Courses Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📚 Mis Materias</Text>
          
          {secciones.length > 0 ? (
            <View style={styles.grid}>
              {secciones.map((seccion, index) => (
                <View key={seccion.id || index} style={styles.gridItem}>
                  {renderCourseCard({ item: seccion, index })}
                </View>
              ))}
            </View>
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

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -CARD_MARGIN,
  },
  gridItem: {
    width: '50%',
    marginBottom: theme.spacing.md,
  },

  // Course Card
  courseCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    height: CARD_WIDTH,
    justifyContent: 'space-between',
  },
  courseDayBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    alignSelf: 'flex-start',
  },
  courseDayText: {
    color: theme.colors.textDark,
    fontWeight: theme.typography.bold,
    fontSize: theme.typography.tiny,
  },
  courseName: {
    fontSize: theme.typography.body,
    fontWeight: theme.typography.bold,
    color: theme.colors.text,
    marginVertical: theme.spacing.sm,
  },
  courseTime: {
    backgroundColor: '#2a3a2f',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    alignSelf: 'flex-start',
  },
  timeText: {
    color: theme.colors.text,
    fontSize: theme.typography.tiny,
  },
  courseAula: {
    marginTop: theme.spacing.xs,
  },
  aulaText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.tiny,
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
});
