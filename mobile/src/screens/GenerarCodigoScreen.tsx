// Generar Codigo Screen - Generate attendance code for class
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Alert,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import theme from '../utils/theme';
import apiService from '../services/api';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any, 'GenerarCodigo'>;
};

export default function GenerarCodigoScreen({ navigation, route }: Props) {
  const { seccion, materia } = route.params as { seccion: any; materia: any };
  const [codigo, setCodigo] = useState<string | null>(null);
  const [expira, setExpira] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getDayName = (dia: number) => {
    const days = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    return days[dia] || 'Desconocido';
  };

  const handleGenerarCodigo = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.post('/profesor/generar-codigo', {
        seccion_id: seccion.id,
      });
      
      setCodigo(response.data.codigo);
      setExpira(response.data.expira);
      
      Alert.alert('Código Generado', `El código es: ${response.data.codigo}`);
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Error al generar código';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatExpira = (expiraStr: string | null) => {
    if (!expiraStr) return '';
    const date = new Date(expiraStr);
    return date.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Generar Código</Text>
          <Text style={styles.subtitle}>
            Código de asistencia para la clase
          </Text>
        </View>

        {/* Seccion Info */}
        <View style={styles.seccionInfo}>
          <Text style={styles.materiaNombre}>{materia.nombre}</Text>
          <Text style={styles.seccionCodigo}>{seccion.codigo}</Text>
          <Text style={styles.horario}>
            {getDayName(seccion.dia)} {seccion.start_time} - {seccion.end_time}
          </Text>
          <Text style={styles.aula}>Aula: {seccion.aula || 'Por asignar'}</Text>
        </View>

        {/* Codigo Display */}
        {codigo ? (
          <View style={styles.codigoContainer}>
            <Text style={styles.codigoLabel}>Código de Sesión:</Text>
            <View style={styles.codigoBox}>
              <Text style={styles.codigoText}>{codigo}</Text>
            </View>
            <Text style={styles.expiraText}>
              Expira a las: {formatExpira(expira)}
            </Text>
            
            <TouchableOpacity
              style={styles.regenerarButton}
              onPress={handleGenerarCodigo}
            >
              <Text style={styles.regenerarButtonText}>Generar Nuevo Código</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.generarContainer}>
            <Text style={styles.generarIcon}>🔑</Text>
            <Text style={styles.generarText}>
              Genera un código de 4 dígitos para que tus alumnos marquen asistencia
            </Text>
            
            <TouchableOpacity
              style={[styles.generarButton, isLoading && styles.generarButtonDisabled]}
              onPress={handleGenerarCodigo}
              disabled={isLoading}
            >
              <Text style={styles.generarButtonText}>
                {isLoading ? 'Generando...' : 'Generar Código'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Información</Text>
          <Text style={styles.infoText}>
            • El código es válido durante toda la clase{'\n'}
            • Los alumnos lo ingresan para marcar asistencia{'\n'}
            • Puedes generar un nuevo código si es necesario
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
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

  // Seccion Info
  seccionInfo: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
  },
  materiaNombre: {
    fontSize: theme.typography.body,
    fontWeight: theme.typography.bold,
    color: theme.colors.text,
    textAlign: 'center',
  },
  seccionCodigo: {
    fontSize: theme.typography.small,
    color: theme.colors.primary,
    marginTop: theme.spacing.xs,
  },
  horario: {
    fontSize: theme.typography.small,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  aula: {
    fontSize: theme.typography.small,
    color: theme.colors.textSecondary,
  },

  // Codigo Container
  codigoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  codigoLabel: {
    fontSize: theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  codigoBox: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
  },
  codigoText: {
    fontSize: theme.typography.title,
    fontWeight: theme.typography.bold,
    color: theme.colors.textDark,
    letterSpacing: 8,
  },
  expiraText: {
    fontSize: theme.typography.small,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  regenerarButton: {
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  regenerarButtonText: {
    color: theme.colors.primary,
    fontWeight: theme.typography.semibold,
  },

  // Generar Container
  generarContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  generarIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.md,
  },
  generarText: {
    fontSize: theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  generarButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
  },
  generarButtonDisabled: {
    backgroundColor: '#2a3a2f',
  },
  generarButtonText: {
    color: theme.colors.textDark,
    fontSize: theme.typography.body,
    fontWeight: theme.typography.bold,
  },

  // Info Box
  infoBox: {
    backgroundColor: '#1a2a3f',
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
