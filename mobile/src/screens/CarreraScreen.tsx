// Carrera Screen - Career selection (post-registration)
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
import { useAppStore } from '../store';
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
}

export default function CarreraScreen({ navigation }: Props) {
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [selectedCarrera, setSelectedCarrera] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCarreras();
  }, []);

  const loadCarreras = async () => {
    try {
      const response = await apiService.get('/inscripcion/carreras');
      setCarreras(response.data.carreras || []);
    } catch (error: any) {
      Alert.alert('Error', 'No se pudieron cargar las carreras');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    if (!selectedCarrera) {
      Alert.alert('Error', 'Por favor selecciona una carrera');
      return;
    }

    // Navigate to semester selection with carrera_id
    navigation.navigate('Semestre', { carrera_id: selectedCarrera });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Cargando carreras...</Text>
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
          <Text style={styles.title}>Selecciona tu Carrera</Text>
          <Text style={styles.subtitle}>
            Esta selección NO se puede cambiar después
          </Text>
        </View>

        {/* Warning */}
        <View style={styles.warning}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningText}>
            Elige cuidadosamente. Esta carrera será la que seguirás durante tu tiempo en la universidad.
          </Text>
        </View>

        {/* Careers List */}
        <View style={styles.list}>
          {carreras.map((carrera) => (
            <TouchableOpacity
              key={carrera.id}
              style={[
                styles.carreraCard,
                selectedCarrera === carrera.id && styles.carreraCardSelected,
              ]}
              onPress={() => setSelectedCarrera(carrera.id)}
            >
              <View style={styles.carreraInfo}>
                <Text style={[
                  styles.carreraName,
                  selectedCarrera === carrera.id && styles.carreraNameSelected,
                ]}>
                  {carrera.nombre}
                </Text>
                <Text style={styles.carreraDetails}>
                  {carrera.codigo} • {carrera.duracion_semestres} semestres
                </Text>
              </View>
              <View style={[
                styles.radio,
                selectedCarrera === carrera.id && styles.radioSelected,
              ]}>
                {selectedCarrera === carrera.id && (
                  <View style={styles.radioInner} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedCarrera && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!selectedCarrera}
        >
          <Text style={styles.continueButtonText}>Continuar</Text>
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
    marginBottom: theme.spacing.xl,
  },
  logo: {
    fontSize: theme.typography.heading + 8,
    fontWeight: theme.typography.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
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
    textAlign: 'center',
  },
  
  // Warning
  warning: {
    flexDirection: 'row',
    backgroundColor: '#3a2a1f',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
  },
  warningIcon: {
    fontSize: 24,
    marginRight: theme.spacing.md,
  },
  warningText: {
    flex: 1,
    fontSize: theme.typography.small,
    color: '#f0a050',
  },
  
  // List
  list: {
    marginBottom: theme.spacing.lg,
  },
  
  // Carrera Card
  carreraCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  carreraCardSelected: {
    borderColor: theme.colors.primary,
  },
  carreraInfo: {
    flex: 1,
  },
  carreraName: {
    fontSize: theme.typography.body,
    fontWeight: theme.typography.bold,
    color: theme.colors.text,
  },
  carreraNameSelected: {
    color: theme.colors.primary,
  },
  carreraDetails: {
    fontSize: theme.typography.small,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  
  // Radio
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: theme.colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
  },
  
  // Continue Button
  continueButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  continueButtonDisabled: {
    backgroundColor: '#2a3a2f',
  },
  continueButtonText: {
    color: theme.colors.textDark,
    fontSize: theme.typography.body,
    fontWeight: theme.typography.bold,
  },
});
