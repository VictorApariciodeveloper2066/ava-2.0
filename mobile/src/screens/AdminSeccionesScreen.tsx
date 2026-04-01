// Admin Secciones Screen
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

interface Seccion {
  id: number;
  codigo: string;
  asignatura_codigo: string;
  asignatura_nombre: string;
  profesor_nombre: string;
  dia_nombre: string;
  start_time: string;
  end_time: string;
  aula: string;
  capacidad: number;
  alumnos_count: number;
}

export default function AdminSeccionesScreen({ navigation }: Props) {
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSecciones();
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
        <Text style={styles.title}>Gestión de Secciones</Text>
        <Text style={styles.subtitle}>{secciones.length} secciones</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ff6b6b" />
        }
      >
        {secciones.map((seccion) => (
          <View key={seccion.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardCodigo}>{seccion.codigo}</Text>
              <Text style={styles.cardMateria}>{seccion.asignatura_nombre}</Text>
            </View>
            
            <View style={styles.cardDetails}>
              <Text style={styles.cardDetail}>
                👨‍🏫 {seccion.profesor_nombre || 'Sin asignar'}
              </Text>
              <Text style={styles.cardDetail}>
                📅 {seccion.dia_nombre} {seccion.start_time}-{seccion.end_time}
              </Text>
              <Text style={styles.cardDetail}>
                📍 {seccion.aula || 'Sin aula'}
              </Text>
              <Text style={styles.cardDetail}>
                👥 {seccion.alumnos_count}/{seccion.capacidad} alumnos
              </Text>
            </View>
          </View>
        ))}

        {secciones.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No hay secciones registradas</Text>
          </View>
        )}
      </ScrollView>
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
  scroll: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  cardHeader: {
    marginBottom: theme.spacing.sm,
  },
  cardCodigo: {
    fontSize: theme.typography.small,
    color: '#ff6b6b',
    fontWeight: theme.typography.semibold,
  },
  cardMateria: {
    fontSize: theme.typography.body,
    fontWeight: theme.typography.bold,
    color: theme.colors.text,
    marginTop: 2,
  },
  cardDetails: {
    marginTop: theme.spacing.sm,
  },
  cardDetail: {
    fontSize: theme.typography.small,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  emptyText: {
    color: theme.colors.textSecondary,
  },
});
