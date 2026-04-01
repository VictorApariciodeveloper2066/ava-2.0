// Admin Periodos Screen
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

interface Periodo {
  id: number;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
  es_actual: boolean;
}

export default function AdminPeriodosScreen({ navigation }: Props) {
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPeriodos();
  }, []);

  const loadPeriodos = async () => {
    try {
      const response = await apiService.get('/admin/periodos');
      setPeriodos(response.data.periodos || []);
    } catch (error: any) {
      Alert.alert('Error', 'No se pudieron cargar los períodos');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPeriodos();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-VE');
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
        <Text style={styles.title}>Períodos Académicos</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ff6b6b" />
        }
      >
        {periodos.map((periodo) => (
          <View key={periodo.id} style={[styles.card, periodo.es_actual && styles.cardActual]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardNombre}>{periodo.nombre}</Text>
              {periodo.es_actual && (
                <View style={styles.actualBadge}>
                  <Text style={styles.actualText}>ACTUAL</Text>
                </View>
              )}
            </View>
            <Text style={styles.cardFechas}>
              {formatDate(periodo.fecha_inicio)} - {formatDate(periodo.fecha_fin)}
            </Text>
            <Text style={[styles.cardEstado, periodo.activo ? styles.activo : styles.inactivo]}>
              {periodo.activo ? '✓ Activo' : '✗ Inactivo'}
            </Text>
          </View>
        ))}

        {periodos.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyText}>No hay períodos registrados</Text>
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
  cardActual: {
    borderWidth: 2,
    borderColor: '#ff6b6b',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  cardNombre: {
    fontSize: theme.typography.body,
    fontWeight: theme.typography.bold,
    color: theme.colors.text,
  },
  actualBadge: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  actualText: {
    color: '#fff',
    fontSize: theme.typography.tiny,
    fontWeight: theme.typography.bold,
  },
  cardFechas: {
    fontSize: theme.typography.small,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  cardEstado: {
    fontSize: theme.typography.small,
    fontWeight: theme.typography.semibold,
  },
  activo: {
    color: theme.colors.primary,
  },
  inactivo: {
    color: '#ff4444',
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
