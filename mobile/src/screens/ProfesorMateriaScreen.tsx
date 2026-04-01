// Profesor Materia Screen - Subject details for professor
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
import type { RouteProp } from '@react-navigation/native';
import theme from '../utils/theme';
import apiService from '../services/api';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any, 'ProfesorMateria'>;
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

export default function ProfesorMateriaScreen({ navigation, route }: Props) {
  const { materia } = route.params as { materia: Materia };
  const [selectedSeccion, setSelectedSeccion] = useState<Seccion | null>(
    materia.secciones.length > 0 ? materia.secciones[0] : null
  );
  const [isLoading, setIsLoading] = useState(false);

  const getDayName = (dia: number) => {
    const days = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    return days[dia] || 'Desconocido';
  };

  const handleGenerarCodigo = () => {
    if (!selectedSeccion) {
      Alert.alert('Error', 'Selecciona una sección primero');
      return;
    }
    navigation.navigate('GenerarCodigo', { seccion: selectedSeccion, materia });
  };

  const handleMarcarAsistencia = () => {
    if (!selectedSeccion) {
      Alert.alert('Error', 'Selecciona una sección primero');
      return;
    }
    navigation.navigate('ListaAlumnos', { seccion: selectedSeccion, materia });
  };

  const handleDescargarPDF = async () => {
    if (!selectedSeccion) return;
    
    setIsLoading(true);
    try {
      // For now, just show alert - PDF download requires special handling in mobile
      Alert.alert('Descargar PDF', 'Funcionalidad próximamente disponible');
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo descargar el PDF');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDescargarExcel = async () => {
    if (!selectedSeccion) return;
    
    setIsLoading(true);
    try {
      // For now, just show alert - Excel download requires special handling in mobile
      Alert.alert('Descargar Excel', 'Funcionalidad próximamente disponible');
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo descargar el Excel');
    } finally {
      setIsLoading(false);
    }
  };

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
          <Text style={styles.materiaCodigo}>{materia.codigo}</Text>
          <Text style={styles.materiaNombre}>{materia.nombre}</Text>
          <Text style={styles.materiaSemestre}>Semestre {materia.semestre}</Text>
        </View>

        {/* Secciones Selector */}
        {materia.secciones.length > 1 && (
          <View style={styles.seccionesSelector}>
            <Text style={styles.selectorLabel}>Selecciona la sección:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {materia.secciones.map((seccion) => (
                <TouchableOpacity
                  key={seccion.id}
                  style={[
                    styles.seccionTab,
                    selectedSeccion?.id === seccion.id && styles.seccionTabSelected,
                  ]}
                  onPress={() => setSelectedSeccion(seccion)}
                >
                  <Text style={[
                    styles.seccionTabText,
                    selectedSeccion?.id === seccion.id && styles.seccionTabTextSelected,
                  ]}>
                    {getDayName(seccion.dia)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Selected Seccion Info */}
        {selectedSeccion && (
          <View style={styles.seccionInfo}>
            <Text style={styles.infoLabel}>Horario</Text>
            <Text style={styles.infoValue}>
              {getDayName(selectedSeccion.dia)} {selectedSeccion.start_time} - {selectedSeccion.end_time}
            </Text>
            <Text style={styles.infoLabel}>Aula</Text>
            <Text style={styles.infoValue}>{selectedSeccion.aula || 'Por asignar'}</Text>
            <Text style={styles.infoLabel}>Alumnos inscritos</Text>
            <Text style={styles.infoValue}>{selectedSeccion.alumnos_count}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleGenerarCodigo}
          >
            <Text style={styles.actionIcon}>🔑</Text>
            <Text style={styles.actionLabel}>Generar Código</Text>
            <Text style={styles.actionSubtext}>Código de asistencia</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleMarcarAsistencia}
          >
            <Text style={styles.actionIcon}>✓</Text>
            <Text style={styles.actionLabel}>Marcar Asistencia</Text>
            <Text style={styles.actionSubtext}>Manual</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleDescargarPDF}
          >
            <Text style={styles.actionIcon}>📄</Text>
            <Text style={styles.actionLabel}>Descargar PDF</Text>
            <Text style={styles.actionSubtext}>Reporte</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleDescargarExcel}
          >
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionLabel}>Descargar Excel</Text>
            <Text style={styles.actionSubtext}>Reporte</Text>
          </TouchableOpacity>
        </View>

        {/* Alumnos List Button */}
        <TouchableOpacity
          style={styles.alumnosButton}
          onPress={() => navigation.navigate('ListaAlumnos', { seccion: selectedSeccion, materia })}
        >
          <Text style={styles.alumnosButtonText}>Ver Lista de Alumnos ({selectedSeccion?.alumnos_count || 0})</Text>
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
    paddingBottom: theme.spacing.xxl,
  },

  // Header
  header: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  materiaCodigo: {
    fontSize: theme.typography.body,
    fontWeight: theme.typography.bold,
    color: theme.colors.textDark,
    marginBottom: theme.spacing.xs,
  },
  materiaNombre: {
    fontSize: theme.typography.heading,
    fontWeight: theme.typography.bold,
    color: theme.colors.textDark,
    textAlign: 'center',
  },
  materiaSemestre: {
    fontSize: theme.typography.small,
    color: '#1a2a1f',
    marginTop: theme.spacing.xs,
  },

  // Secciones Selector
  seccionesSelector: {
    padding: theme.spacing.lg,
  },
  selectorLabel: {
    fontSize: theme.typography.small,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  seccionTab: {
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing.sm,
  },
  seccionTabSelected: {
    backgroundColor: theme.colors.primary,
  },
  seccionTabText: {
    color: theme.colors.text,
    fontWeight: theme.typography.semibold,
  },
  seccionTabTextSelected: {
    color: theme.colors.textDark,
  },

  // Seccion Info
  seccionInfo: {
    backgroundColor: theme.colors.card,
    marginHorizontal: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
  },
  infoLabel: {
    fontSize: theme.typography.tiny,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: theme.typography.body,
    color: theme.colors.text,
    fontWeight: theme.typography.semibold,
    marginBottom: theme.spacing.sm,
  },

  // Actions
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.xs,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: theme.spacing.xs,
  },
  actionLabel: {
    fontSize: theme.typography.small,
    fontWeight: theme.typography.bold,
    color: theme.colors.text,
    textAlign: 'center',
  },
  actionSubtext: {
    fontSize: theme.typography.tiny,
    color: theme.colors.textSecondary,
  },

  // Alumnos Button
  alumnosButton: {
    backgroundColor: theme.colors.primary,
    marginHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  alumnosButtonText: {
    color: theme.colors.textDark,
    fontSize: theme.typography.body,
    fontWeight: theme.typography.bold,
  },
});
