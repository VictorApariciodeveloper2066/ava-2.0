// Admin Codigos Screen - Manage professor codes
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
  TextInput,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import theme from '../utils/theme';
import apiService from '../services/api';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

interface Codigo {
  id: number;
  codigo: string;
  usado: boolean;
  usado_por_nombre: string | null;
  created_at: string;
}

export default function AdminCodigosScreen({ navigation }: Props) {
  const [codigos, setCodigos] = useState<Codigo[]>([]);
  const [disponibles, setDisponibles] = useState(0);
  const [usados, setUsados] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cantidad, setCantidad] = useState('1');

  useEffect(() => {
    loadCodigos();
  }, []);

  const loadCodigos = async () => {
    try {
      const response = await apiService.get('/admin/codigos-profesor');
      setCodigos(response.data.codigos || []);
      setDisponibles(response.data.disponibles || 0);
      setUsados(response.data.usados || 0);
    } catch (error: any) {
      Alert.alert('Error', 'No se pudieron cargar los códigos');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCodigos();
  };

  const handleGenerar = async () => {
    const cant = parseInt(cantidad) || 1;
    if (cant < 1 || cant > 20) {
      Alert.alert('Error', 'La cantidad debe ser entre 1 y 20');
      return;
    }

    try {
      const response = await apiService.post('/admin/codigos-profesor', {
        cantidad: cant,
      });
      
      Alert.alert(
        'Códigos Generados',
        `Se crearon ${cant} códigos:\n${response.data.codigos.join(', ')}`,
        [{ text: 'OK', onPress: () => loadCodigos() }]
      );
    } catch (error: any) {
      Alert.alert('Error', 'No se pudieron generar los códigos');
    }
  };

  const handleEliminar = async (codigoId: number) => {
    Alert.alert(
      'Eliminar Código',
      '¿Estás seguro de que quieres eliminar este código?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.delete(`/admin/codigos-profesor/${codigoId}`);
              Alert.alert('Éxito', 'Código eliminado');
              loadCodigos();
            } catch (error: any) {
              Alert.alert('Error', 'No se pudo eliminar el código');
            }
          }
        }
      ]
    );
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
      
      {/* Header Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{disponibles}</Text>
          <Text style={styles.statLabel}>Disponibles</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{usados}</Text>
          <Text style={styles.statLabel}>Usados</Text>
        </View>
      </View>

      {/* Generate Section */}
      <View style={styles.generarSection}>
        <TextInput
          style={styles.cantidadInput}
          placeholder="Cantidad"
          placeholderTextColor={theme.colors.textSecondary}
          value={cantidad}
          onChangeText={setCantidad}
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.generarButton} onPress={handleGenerar}>
          <Text style={styles.generarButtonText}>Generar Códigos</Text>
        </TouchableOpacity>
      </View>

      {/* Codes List */}
      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ff6b6b" />
        }
      >
        {codigos.map((codigo) => (
          <View key={codigo.id} style={[styles.codigoCard, codigo.usado && styles.codigoUsado]}>
            <View style={styles.codigoInfo}>
              <Text style={styles.codigoText}>{codigo.codigo}</Text>
              <Text style={styles.codigoEstado}>
                {codigo.usado ? `Usado por: ${codigo.usado_por_nombre || 'N/A'}` : 'Disponible'}
              </Text>
            </View>
            
            {!codigo.usado && (
              <TouchableOpacity onPress={() => handleEliminar(codigo.id)}>
                <Text style={styles.eliminarText}>Eliminar</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        {codigos.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyText}>No hay códigos generados</Text>
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
  statsContainer: {
    flexDirection: 'row',
    padding: theme.spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.xs,
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.typography.heading + 4,
    fontWeight: theme.typography.bold,
    color: '#ff6b6b',
  },
  statLabel: {
    fontSize: theme.typography.small,
    color: theme.colors.textSecondary,
  },
  generarSection: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  cantidadInput: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.body,
    color: theme.colors.text,
    width: 80,
    textAlign: 'center',
    marginRight: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  generarButton: {
    flex: 1,
    backgroundColor: '#ff6b6b',
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generarButtonText: {
    color: '#fff',
    fontWeight: theme.typography.bold,
    fontSize: theme.typography.body,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  codigoCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codigoUsado: {
    opacity: 0.6,
  },
  codigoInfo: {
    flex: 1,
  },
  codigoText: {
    fontSize: theme.typography.heading,
    fontWeight: theme.typography.bold,
    color: theme.colors.text,
    letterSpacing: 4,
  },
  codigoEstado: {
    fontSize: theme.typography.small,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  eliminarText: {
    color: '#ff4444',
    fontWeight: theme.typography.semibold,
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
