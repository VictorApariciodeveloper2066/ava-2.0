// Admin Secciones Screen - Enhanced with filters and professor actions
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
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import theme from '../utils/theme';
import apiService from '../services/api';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

interface Seccion {
  id: number;
  codigo: string;
  asignatura_codigo: string;
  asignatura_nombre: string;
  carrera_nombre: string;
  carrera_id: number;
  profesor_nombre: string;
  dia: number;
  dia_nombre: string;
  start_time: string;
  end_time: string;
  aula: string;
  capacidad: number;
  alumnos_count: number;
}

interface Carrera {
  id: number;
  nombre: string;
  codigo: string;
}

interface Profesor {
  id: number;
  nombre: string;
}

export default function AdminSeccionesScreen({ navigation }: Props) {
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCarrera, setSelectedCarrera] = useState<Carrera | null>(null);
  const [selectedProfesor, setSelectedProfesor] = useState<Profesor | null>(null);
  const [showCarreraModal, setShowCarreraModal] = useState(false);
  const [showProfesorModal, setShowProfesorModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadSecciones();
  }, [selectedCarrera, selectedProfesor, searchQuery]);

  const loadData = async () => {
    try {
      const [seccionesRes, carrerasRes, profesoresRes] = await Promise.all([
        apiService.get('/admin/secciones/filtradas'),
        apiService.get('/admin/carreras/lista'),
        apiService.get('/admin/profesores/lista'),
      ]);
      
      setSecciones(seccionesRes.data.secciones || []);
      setCarreras(carrerasRes.data.carreras || []);
      setProfesores(profesoresRes.data.profesores || []);
    } catch (error: any) {
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const loadSecciones = async () => {
    try {
      let url = '/admin/secciones/filtradas?';
      
      if (selectedCarrera) {
        url += `carrera_id=${selectedCarrera.id}&`;
      }
      if (selectedProfesor) {
        url += `profesor_id=${selectedProfesor.id}&`;
      }
      if (searchQuery) {
        url += `search=${encodeURIComponent(searchQuery)}&`;
      }
      
      const response = await apiService.get(url);
      setSecciones(response.data.secciones || []);
    } catch (error: any) {
      console.error('Error loading secciones:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const clearFilters = () => {
    setSelectedCarrera(null);
    setSelectedProfesor(null);
    setSearchQuery('');
  };

  const handleVerAlumnos = (seccion: Seccion) => {
    navigation.navigate('ListaAlumnos', {
      seccion: {
        id: seccion.id,
        codigo: seccion.codigo,
        dia: seccion.dia,
        start_time: seccion.start_time,
        end_time: seccion.end_time,
        aula: seccion.aula,
      },
      materia: {
        nombre: seccion.asignatura_nombre,
        codigo: seccion.asignatura_codigo,
      },
    });
  };

  const handleGenerarCodigo = (seccion: Seccion) => {
    navigation.navigate('GenerarCodigo', {
      seccion: {
        id: seccion.id,
        codigo: seccion.codigo,
        dia: seccion.dia,
        start_time: seccion.start_time,
        end_time: seccion.end_time,
        aula: seccion.aula,
      },
      materia: {
        nombre: seccion.asignatura_nombre,
        codigo: seccion.asignatura_codigo,
      },
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#ff6b6b" style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Gestión de Secciones</Text>
        <Text style={styles.subtitle}>{secciones.length} secciones encontradas</Text>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        {/* Search */}
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar sección o materia..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        
        {/* Filter Buttons */}
        <View style={styles.filterButtonsRow}>
          <TouchableOpacity 
            style={[styles.filterButton, selectedCarrera && styles.filterButtonActive]}
            onPress={() => setShowCarreraModal(true)}
          >
            <Text style={[styles.filterButtonText, selectedCarrera && styles.filterButtonTextActive]}>
              {selectedCarrera ? selectedCarrera.codigo : 'Carrera'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterButton, selectedProfesor && styles.filterButtonActive]}
            onPress={() => setShowProfesorModal(true)}
          >
            <Text style={[styles.filterButtonText, selectedProfesor && styles.filterButtonTextActive]} numberOfLines={1}>
              {selectedProfesor ? selectedProfesor.nombre.split(' ')[0] : 'Profesor'}
            </Text>
          </TouchableOpacity>
          
          {(selectedCarrera || selectedProfesor || searchQuery) && (
            <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
              <Text style={styles.clearButtonText}>Limpiar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Secciones List */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ff6b6b" />
        }
      >
        {secciones.map((seccion) => (
          <View key={seccion.id} style={styles.seccionCard}>
            {/* Header */}
            <View style={styles.seccionHeader}>
              <View style={styles.seccionInfo}>
                <Text style={styles.seccionCodigo}>{seccion.asignatura_codigo}-{seccion.id}</Text>
                <Text style={styles.seccionMateria}>{seccion.asignatura_nombre}</Text>
                {seccion.carrera_nombre !== 'N/A' && (
                  <Text style={styles.seccionCarrera}>{seccion.carrera_nombre}</Text>
                )}
              </View>
              <View style={styles.seccionBadge}>
                <Text style={styles.seccionBadgeText}>{seccion.alumnos_count}</Text>
                <Text style={styles.seccionBadgeLabel}>alumnos</Text>
              </View>
            </View>

            {/* Details */}
            <View style={styles.seccionDetails}>
              <Text style={styles.seccionDetail}>
                👨‍🏫 {seccion.profesor_nombre || 'Sin asignar'}
              </Text>
              <Text style={styles.seccionDetail}>
                📅 {seccion.dia_nombre} {seccion.start_time}-{seccion.end_time}
              </Text>
              <Text style={styles.seccionDetail}>
                📍 {seccion.aula || 'Sin aula'}
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.seccionActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleVerAlumnos(seccion)}
              >
                <Text style={styles.actionIcon}>👥</Text>
                <Text style={styles.actionText}>Alumnos</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleGenerarCodigo(seccion)}
              >
                <Text style={styles.actionIcon}>🔑</Text>
                <Text style={styles.actionText}>Código</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  Alert.alert('Descargar PDF', 'Funcionalidad próximamente disponible');
                }}
              >
                <Text style={styles.actionIcon}>📄</Text>
                <Text style={styles.actionText}>PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {secciones.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No se encontraron secciones</Text>
            <Text style={styles.emptySubtext}>Intenta ajustar los filtros</Text>
          </View>
        )}
      </ScrollView>

      {/* Carrera Modal */}
      <Modal visible={showCarreraModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar Carrera</Text>
            
            <TouchableOpacity 
              style={styles.modalItem}
              onPress={() => {
                setSelectedCarrera(null);
                setShowCarreraModal(false);
              }}
            >
              <Text style={[styles.modalItemText, !selectedCarrera && styles.modalItemTextActive]}>
                Todas las carreras
              </Text>
            </TouchableOpacity>
            
            <FlatList
              data={carreras}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedCarrera(item);
                    setShowCarreraModal(false);
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    selectedCarrera?.id === item.id && styles.modalItemTextActive
                  ]}>
                    {item.codigo} - {item.nombre}
                  </Text>
                </TouchableOpacity>
              )}
            />
            
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowCarreraModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Profesor Modal */}
      <Modal visible={showProfesorModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar Profesor</Text>
            
            <TouchableOpacity 
              style={styles.modalItem}
              onPress={() => {
                setSelectedProfesor(null);
                setShowProfesorModal(false);
              }}
            >
              <Text style={[styles.modalItemText, !selectedProfesor && styles.modalItemTextActive]}>
                Todos los profesores
              </Text>
            </TouchableOpacity>
            
            <FlatList
              data={profesores}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedProfesor(item);
                    setShowProfesorModal(false);
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    selectedProfesor?.id === item.id && styles.modalItemTextActive
                  ]}>
                    {item.nombre}
                  </Text>
                </TouchableOpacity>
              )}
            />
            
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowProfesorModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.heading,
    fontWeight: theme.typography.bold,
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: theme.typography.small,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },

  // Filters
  filtersContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  searchInput: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    fontSize: theme.typography.body,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  filterButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterButtonActive: {
    borderColor: '#ff6b6b',
    backgroundColor: '#2a1a1a',
  },
  filterButtonText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.small,
  },
  filterButtonTextActive: {
    color: '#ff6b6b',
    fontWeight: theme.typography.semibold,
  },
  clearButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  clearButtonText: {
    color: '#ff4444',
    fontSize: theme.typography.small,
  },

  // Secciones List
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingTop: 0,
  },
  seccionCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  seccionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  seccionInfo: {
    flex: 1,
  },
  seccionCodigo: {
    fontSize: theme.typography.small,
    color: '#ff6b6b',
    fontWeight: theme.typography.semibold,
  },
  seccionMateria: {
    fontSize: theme.typography.body,
    fontWeight: theme.typography.bold,
    color: theme.colors.text,
    marginTop: 2,
  },
  seccionCarrera: {
    fontSize: theme.typography.tiny,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  seccionBadge: {
    backgroundColor: '#122017',
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
  },
  seccionBadgeText: {
    fontSize: theme.typography.heading,
    fontWeight: theme.typography.bold,
    color: '#ff6b6b',
  },
  seccionBadgeLabel: {
    fontSize: theme.typography.tiny,
    color: theme.colors.textSecondary,
  },
  seccionDetails: {
    marginBottom: theme.spacing.md,
  },
  seccionDetail: {
    fontSize: theme.typography.small,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },

  // Actions
  seccionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#2a3a2f',
    paddingTop: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    marginHorizontal: 2,
  },
  actionIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  actionText: {
    fontSize: theme.typography.tiny,
    color: '#ff6b6b',
    fontWeight: theme.typography.semibold,
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
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: theme.typography.heading,
    fontWeight: theme.typography.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  modalItem: {
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#2a3a2f',
  },
  modalItemText: {
    fontSize: theme.typography.body,
    color: theme.colors.textSecondary,
  },
  modalItemTextActive: {
    color: '#ff6b6b',
    fontWeight: theme.typography.bold,
  },
  modalCloseButton: {
    backgroundColor: '#ff6b6b',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  modalCloseButtonText: {
    color: '#fff',
    fontWeight: theme.typography.bold,
  },
});
