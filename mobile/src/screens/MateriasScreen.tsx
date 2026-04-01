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
import { useAppStore } from '../store';

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
  seleccionada: boolean; // True if all secciones of this subject are selected
}

export default function MateriasScreen({ navigation, route }: Props) {
  const { carrera_id, semestre } = route.params as { carrera_id: number; semestre: number };
  const [materias, setMaterias] = useState<MateriaConSecciones[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { completeEnrollment } = useAppStore();

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
          seleccionada: false,
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

  const handleToggleMateria = (asignaturaId: number) => {
    setMaterias(prev => prev.map(m => {
      if (m.asignatura.id === asignaturaId) {
        return { ...m, seleccionada: !m.seleccionada };
      }
      return m;
    }));
  };

  const handleConfirm = async () => {
    const seleccionadas = materias.filter(m => m.seleccionada);
    
    if (seleccionadas.length < 1) {
      Alert.alert('Error', 'Debes inscribir al menos 1 materia');
      return;
    }

    // Check for schedule conflicts (across different subjects)
    const conflicts = checkScheduleConflicts(seleccionadas);
    if (conflicts) {
      Alert.alert('Conflicto de Horario', conflicts);
      return;
    }

    setIsSubmitting(true);
    try {
      // Get ALL seccion IDs from selected subjects
      const seccionesIds: number[] = [];
      seleccionadas.forEach(m => {
        m.secciones.forEach(s => {
          seccionesIds.push(s.id);
        });
      });
      
      const response = await apiService.post('/inscripcion/inscripcion/lote', {
        secciones: seccionesIds,
      });

      // Mark enrollment as complete
      completeEnrollment();
      
      Alert.alert(
        '¡Inscripción Exitosa!',
        `Te has inscrito en ${seleccionadas.length} materia(s)`,
        [
          {
            text: 'OK',
            onPress: () => navigation.reset({
              index: 0,
              routes: [{ name: 'Dashboard' }],
            }),
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
    // Get all secciones from all selected subjects
    const allSecciones: Seccion[] = [];
    seleccionadas.forEach(m => {
      m.secciones.forEach(s => {
        allSecciones.push(s);
      });
    });

    // Check for conflicts between different subjects
    for (let i = 0; i < allSecciones.length; i++) {
      for (let j = i + 1; j < allSecciones.length; j++) {
        const s1 = allSecciones[i];
        const s2 = allSecciones[j];
        
        // Skip if same subject (same asignatura)
        if (s1.asignatura_id === s2.asignatura_id) continue;
        
        if (s1.dia === s2.dia) {
          // Check time overlap
          if (s1.start_time < s2.end_time && s1.end_time > s2.start_time) {
            return `Conflicto entre ${seleccionadas.find(m => m.secciones.some(s => s.id === s1.id))?.asignatura.nombre} y ${seleccionadas.find(m => m.secciones.some(s => s.id === s2.id))?.asignatura.nombre} el ${getDayName(s1.dia)}`;
          }
        }
      }
    }
    return null;
  };

  const getSelectionCount = () => materias.filter(m => m.seleccionada).length;

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
          <TouchableOpacity 
            key={materia.asignatura.id} 
            style={[
              styles.materiaCard,
              materia.seleccionada && styles.materiaCardSelected,
            ]}
            onPress={() => handleToggleMateria(materia.asignatura.id)}
          >
            <View style={styles.materiaHeader}>
              <View style={styles.materiaLeft}>
                <Text style={[
                  styles.materiaName,
                  materia.seleccionada && styles.materiaNameSelected,
                ]}>
                  {materia.asignatura.nombre}
                </Text>
                <Text style={styles.materiaInfo}>
                  {materia.asignatura.codigo} • {materia.asignatura.uv} UV
                </Text>
              </View>
              <View style={[
                styles.checkbox,
                materia.seleccionada && styles.checkboxSelected,
              ]}>
                {materia.seleccionada && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
            </View>

            {/* Schedule - All time slots grouped */}
            <View style={styles.horariosContainer}>
              {materia.secciones.map((seccion, idx) => (
                <View key={seccion.id} style={styles.horarioItem}>
                  <Text style={styles.horarioDia}>{getDayName(seccion.dia)}</Text>
                  <Text style={styles.horarioHora}>{seccion.start_time} - {seccion.end_time}</Text>
                </View>
              ))}
            </View>

            {/* Professor Info */}
            <View style={styles.profesorContainer}>
              <Text style={styles.profesorLabel}>Profesor:</Text>
              <Text style={styles.profesorNombre}>
                {materia.secciones[0]?.profesor?.nombre || 'Sin asignar'}
              </Text>
            </View>
          </TouchableOpacity>
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
    borderWidth: 2,
    borderColor: 'transparent',
  },
  materiaCardSelected: {
    borderColor: theme.colors.primary,
  },
  materiaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  materiaLeft: {
    flex: 1,
  },
  materiaName: {
    fontSize: theme.typography.body,
    fontWeight: theme.typography.bold,
    color: theme.colors.text,
  },
  materiaNameSelected: {
    color: theme.colors.primary,
  },
  materiaInfo: {
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
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkmark: {
    color: theme.colors.textDark,
    fontSize: 16,
    fontWeight: theme.typography.bold,
  },
  
  // Horarios
  horariosContainer: {
    marginBottom: theme.spacing.md,
  },
  horarioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  horarioDia: {
    fontSize: theme.typography.small,
    fontWeight: theme.typography.semibold,
    color: theme.colors.primary,
    width: 40,
  },
  horarioHora: {
    fontSize: theme.typography.small,
    color: theme.colors.text,
  },
  
  // Profesor
  profesorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#2a3a2f',
  },
  profesorLabel: {
    fontSize: theme.typography.small,
    color: theme.colors.textSecondary,
    marginRight: theme.spacing.sm,
  },
  profesorNombre: {
    fontSize: theme.typography.small,
    fontWeight: theme.typography.semibold,
    color: theme.colors.text,
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
