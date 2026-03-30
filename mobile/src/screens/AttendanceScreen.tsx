// Attendance Screen - Mark attendance with session code
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  FlatList,
} from 'react-native';
import { useAppStore } from '../store';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Seccion } from '../types';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function AttendanceScreen({ navigation }: Props) {
  const [codigo, setCodigo] = useState('');
  const [seccionSeleccionada, setSeccionSeleccionada] = useState<Seccion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { secciones, loadSecciones, marcarAsistencia } = useAppStore();

  React.useEffect(() => {
    loadSecciones();
  }, []);

  const handleMarcarAsistencia = async () => {
    if (!seccionSeleccionada) {
      Alert.alert('Error', 'Por favor selecciona una sección');
      return;
    }

    if (!codigo.trim()) {
      Alert.alert('Error', 'Por favor ingresa el código de sesión');
      return;
    }

    setIsLoading(true);
    try {
      await marcarAsistencia(seccionSeleccionada.id, codigo);
      Alert.alert('Éxito', 'Asistencia marcada correctamente');
      setCodigo('');
      navigation.goBack();
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Error al marcar asistencia';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  const getDayName = (dia: number) => {
    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    return days[dia] || 'Desconocido';
  };

  const renderSeccion = ({ item }: { item: Seccion }) => (
    <TouchableOpacity
      style={[
        styles.seccionCard,
        seccionSeleccionada?.id === item.id && styles.seccionCardSelected,
      ]}
      onPress={() => setSeccionSeleccionada(item)}
    >
      <Text style={styles.seccionTitle}>{item.codigo}</Text>
      <Text style={styles.seccionInfo}>
        {getDayName(item.dia)} • {item.start_time} - {item.end_time}
      </Text>
      <Text style={styles.seccionAula}>Aula: {item.aula || 'Sin asignar'}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Marcar Asistencia</Text>
        <Text style={styles.subtitle}>
          Ingresa el código proporcionado por tu profesor
        </Text>
      </View>

      {/* Seleccionar Sección */}
      <View style={styles.section}>
        <Text style={styles.label}>Selecciona tu sección:</Text>
        {secciones.length > 0 ? (
          <FlatList
            data={secciones}
            renderItem={renderSeccion}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No tienes secciones asignadas</Text>
          </View>
        )}
      </View>

      {/* Input de Código */}
      <View style={styles.section}>
        <Text style={styles.label}>Código de Sesión:</Text>
        <TextInput
          style={styles.input}
          value={codigo}
          onChangeText={setCodigo}
          placeholder="Ingresa el código de 4 dígitos"
          keyboardType="numeric"
          maxLength={4}
          placeholderTextColor="#999"
        />
      </View>

      {/* Botón de Marcar */}
      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleMarcarAsistencia}
        disabled={isLoading || !seccionSeleccionada || !codigo}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Marcando...' : 'Marcar Asistencia'}
        </Text>
      </TouchableOpacity>

      {/* Info adicional */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>¿Cómo funciona?</Text>
        <Text style={styles.infoText}>
          1. Tu profesor genera un código de sesión{'\n'}
          2. Selecciona tu sección{'\n'}
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
    backgroundColor: '#122017', // Dark green from web theme
  },
  header: {
    padding: 20,
    backgroundColor: '#39E079', // Primary green
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#122017', // Dark text on green
  },
  subtitle: {
    fontSize: 14,
    color: '#1a2a1f',
    marginTop: 4,
  },
  section: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f6f8f7', // Light text
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#39E079',
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    textAlign: 'center',
    backgroundColor: '#1a2a1f', // Card background
    color: '#f6f8f7',
    letterSpacing: 8,
  },
  button: {
    backgroundColor: '#39E079', // Primary green
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 20,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  seccionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  seccionCardSelected: {
    borderColor: '#1a73e8',
    backgroundColor: '#e8f0fe',
  },
  seccionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a73e8',
  },
  seccionInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  seccionAula: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
  },
  infoBox: {
    margin: 20,
    padding: 16,
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
  },
});