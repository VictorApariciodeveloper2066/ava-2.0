// Materias Screen - Subject list with sections
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
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import theme from '../utils/theme';
import apiService from '../services/api';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any, 'Materias'>;
};

interface Asignatura {
  id: number;
  codigo: string;
  nombre: string;
  semestre: number;
  uv: number;
}

interface Seccion {
  id: number;
  codigo: string;
  aula: string;
  dia: number;
  start_time: string;
  end_time: string;
  disponibles: number;
  profesor: {
    id: number;
    nombre: string;
  } | null;
}

interface MateriaConSecciones {
  asignatura: Asignatura;
  secciones: Seccion[];
  seccionSeleccionada: number | null;
}

export default function MateriasScreen({ navigation, route }: Props) {
  const { carrera_id, semestre } = route.params as { carrera_id: number; semestre: number };
  const [materias, setMaterias] = useState<MateriaConSecciones[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Get subjects
      const asignaturasRes = await apiService.get(
        `/inscripcion/asignaturas?carrera_id=${carrera_id}&semestre=${semestre}`
      );
      const asignaturas: Asignatura[] = asignaturasRes.data.asignaturas || [];

      // Get sections for each subject
      const materiasConSecciones: MateriaConSecciones[] = [];
      for (const asig of asignaturas) {
        const seccionesRes = await apiService.get(
          `/inscripcion/secciones/disponibles?asignatura_id=${asig.id}`
        );
        materiasConSecciones.push({
          asignatura: asig,
          secciones: seccionesRes.data.secciones || [],
          seccionSeleccionada: null,
        });
      }

      setMaterias(materiasConSecciones);
    } catch (error: any) {
      Alert.alert('Error', 'No se pudieron cargar las materias');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDayName = (dia: number) => {
    const days = ['', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    return days[dia] || '';
  };

  const handleSelectSeccion = (asignaturaId: number, seccionId: number) => {
    setMaterias(prev => prev.map(m => 
      m.asignatura.id === asignaturaId 
        ? { ...m, seccionSeleccionada: seccionId }
        : m
    ));
  };

  const handleConfirm = async () => {
    const seleccionadas = materias.filter(m => m.seccionSeleccionada !== null);
    
    if (seleccionadas.length < 1) {
      Alert.alert('Error', 'Debes inscribir al menos 1 materia');
      return;
    }

    // Check for schedule conflicts
    const conflicts = checkScheduleConflicts(seleccionadas);
    if (conflicts) {
      Alert.alert('Conflicto de Horario', conflicts);
      return;
    }

    setIsSubmitting(true);
    try {
      const seccionesIds = seleccionadas.map(m => m.seccionSeleccionada);
      const response = await apiService.post('/inscripcion/inscripcion/lote', {
        secciones: seccionesIds,
      });

      Alert.alert(
        '¡Inscripción Exitosa!',
        `Te has inscrito en ${seleccionadas.length} materia(s)`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Dashboard'),
          },
        ]
      );
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Error al inscribirse';
      Alert.alert('Error', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkScheduleConflicts = (seleccionadas: MateriaConSecciones[]): string | null => {
    const secciones = seleccionadas.map(m => 
      m.secciones.find(s => s.id === m.seccionSeleccionada)
    ).filter(Boolean);

    for (let i = 0; i < secciones.length; i++) {
      for (let j = i + 1; j < secciones.length; j++) {
        const s1 = secciones[i]!;
        const s2 = secciones[j]!;
        
        if (s1.dia === s2.dia) {
          // Check time overlap
          if (s1.start_time < s2.end_time && s1.end_time > s2.start_time) {
            return `Conflicto entre ${s1.codigo} y ${s2.codigo} el ${getDayName(s1.dia)}`;
          }
        }
      }
    }
    return null;
  };

  const getSelectionCount = () => materias.filter(m => m.seccionSeleccionada !== null).length;

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
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>AVA</Text>
          <Text style={styles.title}>Semestre {semestre}</Text>
          <Text style={styles.subtitle}>
            Selecciona las materias y sus horarios
          </Text>
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            Mínimo 1 materia. No puede haber conflictos de horario.
          </Text>
        </View>

        {/* Materias List */}
        {materias.map((materia) => (
          <View key={materia.asignatura.id} style={styles.materiaCard}>
            <View style={styles.materiaHeader}>
              <Text style={styles.materiaName}>{materia.asignatura.nombre}</Text>
              <Text style={styles.materiaInfo}>
                {materia.asignatura.codigo} • {materia.asignatura.uv} UV
              </Text>
            </View>

            {/* Sections */}
            {materia.secciones.length > 0 ? (
              materia.secciones.map((seccion) => (
                <TouchableOpacity
                  key={seccion.id}
                  style={[
                    styles.seccionCard,
                    materia.seccionSeleccionada === seccion.id && styles.seccionCardSelected,
                  ]}
                  onPress={() => handleSelectSeccion(materia.asignatura.id, seccion.id)}
                >
                  <View style={styles.seccionLeft}>
                    <View style={[
                      styles.radio,
                      materia.seccionSeleccionada === seccion.id && styles.radioSelected,
                    ]}>
                      {materia.seccionSeleccionada === seccion.id && (
                        <View style={styles.radioInner} />
                      )}
                    </View>
                  </View>
                  <View style={styles.seccionInfo}>
                    <Text style={styles.profesorName}>
                      {seccion.profesor?.nombre || 'Sin profesor'}
                    </Text>
                    <Text style={styles.seccionDetails}>
                      {getDayName(seccion.dia)} {seccion.start_time} - {seccion.end_time}
                    </Text>
                    <Text style={styles.seccionAula}>
                      📍 {seccion.aula} • {seccion.disponibles} cupos
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noSecciones}>No hay secciones disponibles</Text>
            )}
          </View>
        ))}

        {/* Confirm Button */}
        <TouchableOpacity
          style={[
            styles.confirmButton,
            (getSelectionCount() < 1 || isSubmitting) && styles.confirmButtonDisabled,
          ]}
          onPress={handleConfirm}
          disabled={getSelectionCount() < 1 || isSubmitting}
        >
          <Text style={styles.confirmButtonText}>
            {isSubmitting ? 'Inscribiendo...' : `Confirmar (${getSelectionCount()} materia${getSelectionCount() !== 1 ? 's' : ''})`}
          </Text>
        </TouchableOpacity>
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
    padding: theme.spacing.lg,
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
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  logo: {
    fontSize: theme.typography.heading + 4,
    fontWeight: theme.typography.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.heading,
    fontWeight: theme.typography.bold,
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  
  // Info
  info: {
    flexDirection: 'row',
    backgroundColor: '#1a2a3f',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: theme.spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: theme.typography.small,
    color: '#50a0f0',
  },
  
  // Materia Card
  materiaCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  materiaHeader: {
    marginBottom: theme.spacing.md,
  },
  materiaName: {
    fontSize: theme.typography.body,
    fontWeight: theme.typography.bold,
    color: theme.colors.text,
  },
  materiaInfo: {
    fontSize: theme.typography.small,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  
  // Seccion Card
  seccionCard: {
    flexDirection: 'row',
    backgroundColor: '#122017',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  seccionCardSelected: {
    borderColor: theme.colors.primary,
  },
  seccionLeft: {
    marginRight: theme.spacing.md,
    justifyContent: 'center',
  },
  seccionInfo: {
    flex: 1,
  },
  profesorName: {
    fontSize: theme.typography.body,
    fontWeight: theme.typography.semibold,
    color: theme.colors.text,
  },
  seccionDetails: {
    fontSize: theme.typography.small,
    color: theme.colors.primary,
    marginTop: 2,
  },
  seccionAula: {
    fontSize: theme.typography.small,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  noSecciones: {
    fontSize: theme.typography.small,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: theme.spacing.md,
  },
  
  // Radio
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: theme.colors.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: theme.colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
  
  // Confirm Button
  confirmButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  confirmButtonDisabled: {
    backgroundColor: '#2a3a2f',
  },
  confirmButtonText: {
    color: theme.colors.textDark,
    fontSize: theme.typography.body,
    fontWeight: theme.typography.bold,
  },
});
