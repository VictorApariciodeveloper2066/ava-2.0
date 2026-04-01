// Attendance Screen - Auto-select section based on current time
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useAppStore } from '../store';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import theme from '../utils/theme';
import { Seccion } from '../types';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function AttendanceScreen({ navigation }: Props) {
  const [codigo, setCodigo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [claseActual, setClaseActual] = useState<Seccion | null>(null);
  const [proximaClase, setProximaClase] = useState<Seccion | null>(null);
  const { secciones, loadSecciones, marcarAsistencia } = useAppStore();

  useEffect(() => {
    loadSecciones();
  }, []);

  useEffect(() => {
    if (secciones.length > 0) {
      findCurrentClass();
    }
  }, [secciones]);

  const getDayName = (dia: number) => {
    const days = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    return days[dia] || 'Desconocido';
  };

  const getShortDayName = (dia: number) => {
    const days = ['', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    return days[dia] || 'N/A';
  };

  const getCurrentDay = () => {
    const jsDay = new Date().getDay(); // 0=Sunday in JS
    return jsDay === 0 ? 7 : jsDay; // Convert to our format: 1=Lun, 7=Dom
  };

  const getCurrentMinutes = () => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  };

  const parseTimeToMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const findCurrentClass = () => {
    const currentDay = getCurrentDay();
    const currentMinutes = getCurrentMinutes();

    // Find current class (within time range)
    let found: Seccion | null = null;
    let next: Seccion | null = null;
    let minDiff = Infinity;

    for (const seccion of secciones) {
      const startMinutes = parseTimeToMinutes(seccion.start_time);
      const endMinutes = parseTimeToMinutes(seccion.end_time);

      // Check if this is the current class (same day, within time)
      if (seccion.dia === currentDay && 
          currentMinutes >= startMinutes && 
          currentMinutes <= endMinutes) {
        found = seccion;
        break;
      }

      // Check if this is the next class
      if (seccion.dia === currentDay && currentMinutes < startMinutes) {
        const diff = startMinutes - currentMinutes;
        if (diff < minDiff) {
          minDiff = diff;
          next = seccion;
        }
      }
    }

    // If no class today, find next class on future days
    if (!found && !next) {
      for (let d = 1; d <= 7; d++) {
        const checkDay = ((currentDay + d - 1) % 7) + 1;
        const futureClass = secciones.find(s => s.dia === checkDay);
        if (futureClass) {
          next = futureClass;
          break;
        }
      }
    }

    setClaseActual(found);
    setProximaClase(next);
  };

  const handleMarcarAsistencia = async () => {
    if (!claseActual) {
      Alert.alert('Error', 'No tienes clase en este momento');
      return;
    }

    if (!codigo.trim()) {
      Alert.alert('Error', 'Por favor ingresa el código de sesión');
      return;
    }

    setIsLoading(true);
    try {
      await marcarAsistencia(claseActual.id, codigo);
      Alert.alert('Éxito', 'Asistencia marcada correctamente', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Error al marcar asistencia';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Marcar Asistencia</Text>
        <Text style={styles.currentDateTime}>
          {getShortDayName(getCurrentDay())} {new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>

      {claseActual ? (
        <>
          {/* Clase Actual */}
          <View style={styles.claseCard}>
            <Text style={styles.claseLabel}>Clase Actual:</Text>
            <Text style={styles.claseNombre}>{claseActual.codigo}</Text>
            <Text style={styles.claseHorario}>
              {getDayName(claseActual.dia)} {claseActual.start_time} - {claseActual.end_time}
            </Text>
            <Text style={styles.claseAula}>Aula: {claseActual.aula || 'Por asignar'}</Text>
          </View>

          {/* Input de Código */}
          <View style={styles.codigoSection}>
            <Text style={styles.label}>Código de Sesión:</Text>
            <TextInput
              style={styles.input}
              value={codigo}
              onChangeText={setCodigo}
              placeholder="Ingresa el código de 4 dígitos"
              keyboardType="numeric"
              maxLength={4}
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>

          {/* Botón de Marcar */}
          <TouchableOpacity
            style={[styles.button, (isLoading || !codigo) && styles.buttonDisabled]}
            onPress={handleMarcarAsistencia}
            disabled={isLoading || !codigo}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Marcando...' : 'Marcar Asistencia'}
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        /* No hay clase en este momento */
        <View style={styles.noClaseCard}>
          <Text style={styles.noClaseIcon}>⏰</Text>
          <Text style={styles.noClaseTitle}>No tienes clase en este momento</Text>
          
          {proximaClase ? (
            <View style={styles.proximaClaseContainer}>
              <Text style={styles.proximaClaseLabel}>Próxima clase:</Text>
              <Text style={styles.proximaClaseNombre}>{proximaClase.codigo}</Text>
              <Text style={styles.proximaClaseHorario}>
                {getDayName(proximaClase.dia)} {proximaClase.start_time}
              </Text>
            </View>
          ) : (
            <Text style={styles.noProximaClase}>No hay clases programadas</Text>
          )}
        </View>
      )}

      {/* Info */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>¿Cómo funciona?</Text>
        <Text style={styles.infoText}>
          1. El sistema detecta automáticamente tu clase actual{'\n'}
          2. Tu profesor genera un código de sesión{'\n'}
          3. Ingresa el código de 4 dígitos{'\n'}
          4. ¡Listo! Tu asistencia está registrada
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingBottom: theme.spacing.xxl,
  },
  
  // Header
  header: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: theme.typography.heading,
    fontWeight: theme.typography.bold,
    color: theme.colors.textDark,
  },
  currentDateTime: {
    fontSize: theme.typography.body,
    color: theme.colors.textDark,
    fontWeight: theme.typography.semibold,
  },

  // Clase Actual Card
  claseCard: {
    backgroundColor: theme.colors.card,
    margin: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  claseLabel: {
    fontSize: theme.typography.small,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  claseNombre: {
    fontSize: theme.typography.heading,
    fontWeight: theme.typography.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  claseHorario: {
    fontSize: theme.typography.body,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  claseAula: {
    fontSize: theme.typography.small,
    color: theme.colors.textSecondary,
  },

  // Código Section
  codigoSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.typography.body,
    fontWeight: theme.typography.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.card,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    fontSize: theme.typography.heading + 8,
    textAlign: 'center',
    color: theme.colors.text,
    letterSpacing: 12,
  },

  // Button
  button: {
    backgroundColor: theme.colors.primary,
    marginHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#2a3a2f',
  },
  buttonText: {
    color: theme.colors.textDark,
    fontSize: theme.typography.body,
    fontWeight: theme.typography.bold,
  },

  // No Clase Card
  noClaseCard: {
    backgroundColor: theme.colors.card,
    margin: theme.spacing.lg,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  noClaseIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  noClaseTitle: {
    fontSize: theme.typography.body + 2,
    fontWeight: theme.typography.bold,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },

  // Próxima Clase
  proximaClaseContainer: {
    alignItems: 'center',
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#2a3a2f',
    width: '100%',
  },
  proximaClaseLabel: {
    fontSize: theme.typography.small,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  proximaClaseNombre: {
    fontSize: theme.typography.body,
    fontWeight: theme.typography.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  proximaClaseHorario: {
    fontSize: theme.typography.small,
    color: theme.colors.text,
  },
  noProximaClase: {
    fontSize: theme.typography.small,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },

  // Info Box
  infoBox: {
    backgroundColor: '#1a2a3f',
    margin: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  infoTitle: {
    fontSize: theme.typography.body,
    fontWeight: theme.typography.bold,
    color: '#50a0f0',
    marginBottom: theme.spacing.sm,
  },
  infoText: {
    fontSize: theme.typography.small,
    color: theme.colors.text,
    lineHeight: 22,
  },
});
