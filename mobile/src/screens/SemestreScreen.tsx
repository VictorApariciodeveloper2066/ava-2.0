// Semestre Screen - Semester selection
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import theme from '../utils/theme';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any, 'Semestre'>;
};

export default function SemestreScreen({ navigation, route }: Props) {
  const { carrera_id } = route.params as { carrera_id: number };
  const [selectedSemestre, setSelectedSemestre] = useState<number | null>(null);

  const semestres = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  const handleContinue = () => {
    if (!selectedSemestre) {
      return;
    }

    // Navigate to materias selection
    navigation.navigate('Materias', {
      carrera_id,
      semestre: selectedSemestre,
    });
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
          <Text style={styles.logo}>AVA</Text>
          <Text style={styles.title}>Selecciona el Semestre</Text>
          <Text style={styles.subtitle}>
            ¿En qué semestre estás?
          </Text>
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            Puedes cambiar el semestre después en Configuración
          </Text>
        </View>

        {/* Semestres Grid */}
        <View style={styles.grid}>
          {semestres.map((sem) => (
            <TouchableOpacity
              key={sem}
              style={[
                styles.semestreCard,
                selectedSemestre === sem && styles.semestreCardSelected,
              ]}
              onPress={() => setSelectedSemestre(sem)}
            >
              <Text style={[
                styles.semestreNumber,
                selectedSemestre === sem && styles.semestreNumberSelected,
              ]}>
                {sem}
              </Text>
              <Text style={[
                styles.semestreLabel,
                selectedSemestre === sem && styles.semestreLabelSelected,
              ]}>
                Semestre
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedSemestre && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!selectedSemestre}
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
  },
  
  // Info
  info: {
    flexDirection: 'row',
    backgroundColor: '#1a2a3f',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: theme.spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: theme.typography.small,
    color: '#50a0f0',
  },
  
  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  
  // Semestre Card
  semestreCard: {
    width: '18%',
    aspectRatio: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  semestreCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: '#1a3a2f',
  },
  semestreNumber: {
    fontSize: theme.typography.heading,
    fontWeight: theme.typography.bold,
    color: theme.colors.text,
  },
  semestreNumberSelected: {
    color: theme.colors.primary,
  },
  semestreLabel: {
    fontSize: theme.typography.tiny,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  semestreLabelSelected: {
    color: theme.colors.primary,
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
