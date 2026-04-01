// Admin Materias Screen
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

interface Materia {
  id: number;
  codigo: string;
  nombre: string;
  semestre: number;
  uv: number;
  carrera_nombre: string;
  secciones_count: number;
  activo: boolean;
}

export default function AdminMateriasScreen({ navigation }: Props) {
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMaterias();
  }, []);

  const loadMaterias = async () => {
    try {
      const response = await apiService.get('/admin/materias');
      setMaterias(response.data.materias || []);
    } catch (error: any) {
      Alert.alert('Error', 'No se pudieron cargar las materias');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMaterias();
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
        <Text style={styles.title}>Gestión de Materias</Text>
        <Text style={styles.subtitle}>{materias.length} materias</Text>
      </View>

      {/* List */}
      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ff6b6b" />
        }
      >
        {materias.map((materia) => (
          <View key={materia.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardCodigo}>{materia.codigo}</Text>
              <Text style={styles.cardNombre}>{materia.nombre}</Text>
            </View>
            <View style={styles.cardDetails}>
              <Text style={styles.cardDetail}>Semestre {materia.semestre}</Text>
              <Text style={styles.cardDetail}>{materia.uv} UV</Text>
              <Text style={styles.cardDetail}>{materia.secciones_count} secciones</Text>
            </View>
            <Text style={styles.cardCarrera}>{materia.carrera_nombre}</Text>
          </View>
        ))}

        {materias.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyText}>No hay materias registradas</Text>
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
  cardNombre: {
    fontSize: theme.typography.body,
    fontWeight: theme.typography.bold,
    color: theme.colors.text,
    marginTop: 2,
  },
  cardDetails: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  cardDetail: {
    fontSize: theme.typography.small,
    color: theme.colors.textSecondary,
    marginRight: theme.spacing.md,
  },
  cardCarrera: {
    fontSize: theme.typography.small,
    color: theme.colors.primary,
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
