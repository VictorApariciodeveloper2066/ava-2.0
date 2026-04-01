// Admin Carreras Screen
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
  Modal,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import theme from '../utils/theme';
import apiService from '../services/api';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

interface Carrera {
  id: number;
  nombre: string;
  codigo: string;
  duracion_semestres: number;
  activo: boolean;
  materias_count: number;
  alumnos_count: number;
}

export default function AdminCarrerasScreen({ navigation }: Props) {
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCarrera, setEditingCarrera] = useState<Carrera | null>(null);
  
  // Form state
  const [nombre, setNombre] = useState('');
  const [codigo, setCodigo] = useState('');
  const [duracion, setDuracion] = useState('10');

  useEffect(() => {
    loadCarreras();
  }, []);

  const loadCarreras = async () => {
    try {
      const response = await apiService.get('/admin/carreras');
      setCarreras(response.data.carreras || []);
    } catch (error: any) {
      Alert.alert('Error', 'No se pudieron cargar las carreras');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCarreras();
  };

  const handleCreate = () => {
    setEditingCarrera(null);
    setNombre('');
    setCodigo('');
    setDuracion('10');
    setModalVisible(true);
  };

  const handleEdit = (carrera: Carrera) => {
    setEditingCarrera(carrera);
    setNombre(carrera.nombre);
    setCodigo(carrera.codigo);
    setDuracion(carrera.duracion_semestres.toString());
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!nombre || !codigo) {
      Alert.alert('Error', 'Nombre y código son requeridos');
      return;
    }

    try {
      if (editingCarrera) {
        await apiService.put(`/admin/carreras/${editingCarrera.id}`, {
          nombre,
          codigo,
          duracion_semestres: parseInt(duracion),
        });
        Alert.alert('Éxito', 'Carrera actualizada');
      } else {
        await apiService.post('/admin/carreras', {
          nombre,
          codigo,
          duracion_semestres: parseInt(duracion),
        });
        Alert.alert('Éxito', 'Carrera creada');
      }
      setModalVisible(false);
      loadCarreras();
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo guardar la carrera');
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
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Gestión de Carreras</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleCreate}>
          <Text style={styles.addButtonText}>+ Nueva</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ff6b6b" />
        }
      >
        {carreras.map((carrera) => (
          <View key={carrera.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardCodigo}>{carrera.codigo}</Text>
              <Text style={styles.cardNombre}>{carrera.nombre}</Text>
            </View>
            <View style={styles.cardDetails}>
              <Text style={styles.cardDetail}>{carrera.duracion_semestres} semestres</Text>
              <Text style={styles.cardDetail}>{carrera.materias_count} materias</Text>
              <Text style={styles.cardDetail}>{carrera.alumnos_count} alumnos</Text>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity onPress={() => handleEdit(carrera)}>
                <Text style={styles.editText}>Editar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {carreras.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎓</Text>
            <Text style={styles.emptyText}>No hay carreras registradas</Text>
          </View>
        )}
      </ScrollView>

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingCarrera ? 'Editar Carrera' : 'Nueva Carrera'}
            </Text>
            
            <TextInput
              style={styles.input}
              placeholder="Nombre de la carrera"
              placeholderTextColor={theme.colors.textSecondary}
              value={nombre}
              onChangeText={setNombre}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Código (ej: SIS)"
              placeholderTextColor={theme.colors.textSecondary}
              value={codigo}
              onChangeText={setCodigo}
              autoCapitalize="characters"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Duración en semestres"
              placeholderTextColor={theme.colors.textSecondary}
              value={duracion}
              onChangeText={setDuracion}
              keyboardType="numeric"
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.heading,
    fontWeight: theme.typography.bold,
    color: theme.colors.text,
  },
  addButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: theme.typography.bold,
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
  cardActions: {
    borderTopWidth: 1,
    borderTopColor: '#2a3a2f',
    paddingTop: theme.spacing.sm,
  },
  editText: {
    color: '#ff6b6b',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
  },
  modalTitle: {
    fontSize: theme.typography.heading,
    fontWeight: theme.typography.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  input: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.body,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing.sm,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: theme.colors.text,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#ff6b6b',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginLeft: theme.spacing.sm,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: theme.typography.bold,
  },
});
