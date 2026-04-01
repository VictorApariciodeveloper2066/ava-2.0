// Admin Alumnos Screen - Assign students to sections
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
import theme from '../utils/theme';
import apiService from '../services/api';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

interface Alumno {
  id: number;
  nombre: string;
  ci: string;
  inscrito: boolean;
}

interface Seccion {
  id: number;
  codigo: string;
  asignatura_nombre: string;
  profesor_nombre: string;
  dia_nombre: string;
  start_time: string;
  end_time: string;
}

export default function AdminAlumnosScreen({ navigation }: Props) {
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [selectedSeccion, setSelectedSeccion] = useState<Seccion | null>(null);
  const [selectedAlumnos, setSelectedAlumnos] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    loadSecciones();
  }, []);

  const loadSecciones = async () => {
    try {
      const response = await apiService.get('/admin/secciones');
      setSecciones(response.data.secciones || []);
    } catch (error: any) {
      Alert.alert('Error', 'No se pudieron cargar las secciones');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAlumnos = async (seccionId: number) => {
    try {
      const response = await apiService.get(`/admin/alumnos/disponibles?seccion_id=${seccionId}`);
      setAlumnos(response.data.alumnos || []);
      setSelectedAlumnos([]);
    } catch (error: any) {
      Alert.alert('Error', 'No se pudieron cargar los alumnos');
    }
  };

  const handleSelectSeccion = (seccion: Seccion) => {
    setSelectedSeccion(seccion);
    loadAlumnos(seccion.id);
  };

  const handleToggleAlumno = (alumnoId: number) => {
    setSelectedAlumnos(prev => 
      prev.includes(alumnoId) 
        ? prev.filter(id => id !== alumnoId)
        : [...prev, alumnoId]
    );
  };

  const handleAsignar = async () => {
    if (!selectedSeccion || selectedAlumnos.length === 0) {
      Alert.alert('Error', 'Selecciona al menos un alumno');
      return;
    }

    setIsAssigning(true);
    try {
      await apiService.post('/admin/alumnos/asignar', {
        seccion_id: selectedSeccion.id,
        alumno_ids: selectedAlumnos,
      });
      
      Alert.alert('Éxito', `${selectedAlumnos.length} alumnos asignados`);
      loadAlumnos(selectedSeccion.id);
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Error al asignar alumnos';
      Alert.alert('Error', message);
    } finally {
      setIsAssigning(false);
    }
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
        <Text style={styles.title}>Asignar Alumnos</Text>
      </View>

      {/* Secciones List */}
      {!selectedSeccion ? (
        <ScrollView style={styles.scroll}>
          <Text style={styles.sectionTitle}>Selecciona una sección:</Text>
          {secciones.map((seccion) => (
            <TouchableOpacity
              key={seccion.id}
              style={styles.seccionCard}
              onPress={() => handleSelectSeccion(seccion)}
            >
              <Text style={styles.seccionCodigo}>{seccion.codigo}</Text>
              <Text style={styles.seccionMateria}>{seccion.asignatura_nombre}</Text>
              <Text style={styles.seccionInfo}>
                {seccion.dia_nombre} {seccion.start_time}-{seccion.end_time}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <>
          {/* Selected Seccion Header */}
          <View style={styles.selectedSeccionHeader}>
            <TouchableOpacity onPress={() => setSelectedSeccion(null)}>
              <Text style={styles.backText}>← Volver</Text>
            </TouchableOpacity>
            <Text style={styles.selectedSeccionTitle}>{selectedSeccion.codigo}</Text>
          </View>

          {/* Alumnos List */}
          <ScrollView style={styles.scroll}>
            {alumnos.map((alumno) => (
              <TouchableOpacity
                key={alumno.id}
                style={[
                  styles.alumnoCard,
                  selectedAlumnos.includes(alumno.id) && styles.alumnoSelected
                ]}
                onPress={() => handleToggleAlumno(alumno.id)}
              >
                <View style={styles.alumnoInfo}>
                  <Text style={styles.alumnoNombre}>{alumno.nombre}</Text>
                  <Text style={styles.alumnoCI}>CI: {alumno.ci || 'N/A'}</Text>
                </View>
                <View style={[
                  styles.checkbox,
                  selectedAlumnos.includes(alumno.id) && styles.checkboxSelected
                ]}>
                  {selectedAlumnos.includes(alumno.id) && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Assign Button */}
          <TouchableOpacity
            style={[
              styles.assignButton,
              (selectedAlumnos.length === 0 || isAssigning) && styles.assignButtonDisabled
            ]}
            onPress={handleAsignar}
            disabled={selectedAlumnos.length === 0 || isAssigning}
          >
            <Text style={styles.assignButtonText}>
              {isAssigning ? 'Asignando...' : `Asignar ${selectedAlumnos.length} alumno${selectedAlumnos.length !== 1 ? 's' : ''}`}
            </Text>
          </TouchableOpacity>
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
  scroll: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.body,
    fontWeight: theme.typography.semibold,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  seccionCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
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
  seccionInfo: {
    fontSize: theme.typography.small,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  selectedSeccionHeader: {
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
  selectedSeccionTitle: {
    fontSize: theme.typography.body,
    fontWeight: theme.typography.bold,
    color: theme.colors.text,
  },
  alumnoCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alumnoSelected: {
    borderWidth: 2,
    borderColor: '#ff6b6b',
  },
  alumnoInfo: {
    flex: 1,
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
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.colors.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#ff6b6b',
    borderColor: '#ff6b6b',
  },
  checkmark: {
    color: '#fff',
    fontWeight: theme.typography.bold,
  },
  assignButton: {
    backgroundColor: '#ff6b6b',
    margin: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  assignButtonDisabled: {
    backgroundColor: '#2a3a2f',
  },
  assignButtonText: {
    color: '#fff',
    fontWeight: theme.typography.bold,
    fontSize: theme.typography.body,
  },
});
