// Admin Historial Screen - View complete attendance history
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
  TextInput,
  RefreshControl,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import theme from '../utils/theme';
import apiService from '../services/api';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

interface Alumno {
  id: number;
  nombre: string;
  ci: string;
}

interface HistorialRecord {
  seccion_id: number;
  materia_codigo: string;
  materia_nombre: string;
  total_clases: number;
  presentes: number;
  ausentes: number;
  justificados: number;
  porcentaje: number;
}

interface HistorialCompleto {
  alumno: Alumno;
  historial: HistorialRecord[];
}

export default function AdminHistorialScreen({ navigation }: Props) {
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [filteredAlumnos, setFilteredAlumnos] = useState<Alumno[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlumno, setSelectedAlumno] = useState<Alumno | null>(null);
  const [historial, setHistorial] = useState<HistorialCompleto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingHistorial, setIsLoadingHistorial] = useState(false);

  useEffect(() => {
    loadAlumnos();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      setFilteredAlumnos(
        alumnos.filter(a => 
          a.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (a.ci && a.ci.includes(searchQuery))
        )
      );
    } else {
      setFilteredAlumnos(alumnos);
    }
  }, [alumnos, searchQuery]);

  const loadAlumnos = async () => {
    try {
      const response = await apiService.get('/admin/usuarios?role=estudiante');
      setAlumnos(response.data.usuarios.map((u: any) => ({
        id: u.id,
        nombre: u.nombre || u.username,
        ci: u.ci,
      })));
    } catch (error: any) {
      Alert.alert('Error', 'No se pudieron cargar los alumnos');
    } finally {
      setIsLoading(false);
    }
  };

  const loadHistorial = async (alumnoId: number) => {
    setIsLoadingHistorial(true);
    try {
      const response = await apiService.get(`/admin/historial/${alumnoId}`);
      setHistorial(response.data);
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo cargar el historial');
    } finally {
      setIsLoadingHistorial(false);
    }
  };

  const handleSelectAlumno = (alumno: Alumno) => {
    setSelectedAlumno(alumno);
    loadHistorial(alumno.id);
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
      
      <View style={styles.header}>
        <Text style={styles.title}>Historial de Asistencia</Text>
      </View>

      {!selectedAlumno ? (
        <>
          {/* Search */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar alumno..."
              placeholderTextColor={theme.colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Alumnos List */}
          <ScrollView style={styles.scroll}>
            {filteredAlumnos.map((alumno) => (
              <TouchableOpacity
                key={alumno.id}
                style={styles.alumnoCard}
                onPress={() => handleSelectAlumno(alumno)}
              >
                <Text style={styles.alumnoNombre}>{alumno.nombre}</Text>
                <Text style={styles.alumnoCI}>CI: {alumno.ci || 'N/A'}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      ) : (
        <>
          {/* Selected Alumno Header */}
          <View style={styles.selectedHeader}>
            <TouchableOpacity onPress={() => {
              setSelectedAlumno(null);
              setHistorial(null);
            }}>
              <Text style={styles.backText}>← Volver</Text>
            </TouchableOpacity>
            <View style={styles.selectedInfo}>
              <Text style={styles.selectedNombre}>{selectedAlumno.nombre}</Text>
              <Text style={styles.selectedCI}>CI: {selectedAlumno.ci || 'N/A'}</Text>
            </View>
          </View>

          {/* Historial */}
          {isLoadingHistorial ? (
            <ActivityIndicator size="large" color="#ff6b6b" style={{ flex: 1 }} />
          ) : historial ? (
            <ScrollView style={styles.scroll}>
              {historial.historial.map((record, index) => (
                <View key={index} style={styles.historialCard}>
                  <View style={styles.historialHeader}>
                    <Text style={styles.materiaCodigo}>{record.materia_codigo}</Text>
                    <Text style={styles.materiaNombre}>{record.materia_nombre}</Text>
                  </View>
                  <View style={styles.historialStats}>
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: theme.colors.primary }]}>{record.presentes}</Text>
                      <Text style={styles.statLabel}>Presentes</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: '#ff4444' }]}>{record.ausentes}</Text>
                      <Text style={styles.statLabel}>Ausentes</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: '#ffaa00' }]}>{record.justificados}</Text>
                      <Text style={styles.statLabel}>Justif.</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{record.porcentaje}%</Text>
                      <Text style={styles.statLabel}>Asistencia</Text>
                    </View>
                  </View>
                </View>
              ))}

              {historial.historial.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No hay registros de asistencia</Text>
                </View>
              )}
            </ScrollView>
          ) : null}
        </>
      )}
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
  searchContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  searchInput: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    fontSize: theme.typography.body,
    color: theme.colors.text,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  alumnoCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  alumnoNombre: {
    fontSize: theme.typography.body,
    fontWeight: theme.typography.semibold,
    color: theme.colors.text,
  },
  alumnoCI: {
    fontSize: theme.typography.small,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    paddingTop: 0,
  },
  backText: {
    color: '#ff6b6b',
    fontWeight: theme.typography.semibold,
    marginRight: theme.spacing.md,
  },
  selectedInfo: {
    flex: 1,
  },
  selectedNombre: {
    fontSize: theme.typography.body,
    fontWeight: theme.typography.bold,
    color: theme.colors.text,
  },
  selectedCI: {
    fontSize: theme.typography.small,
    color: theme.colors.textSecondary,
  },
  historialCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  historialHeader: {
    marginBottom: theme.spacing.md,
  },
  materiaCodigo: {
    fontSize: theme.typography.small,
    color: '#ff6b6b',
    fontWeight: theme.typography.semibold,
  },
  materiaNombre: {
    fontSize: theme.typography.body,
    fontWeight: theme.typography.bold,
    color: theme.colors.text,
    marginTop: 2,
  },
  historialStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyText: {
    color: theme.colors.textSecondary,
  },
});
