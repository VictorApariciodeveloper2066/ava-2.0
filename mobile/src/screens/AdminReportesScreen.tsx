// Admin Reportes Screen
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
import theme from '../utils/theme';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function AdminReportesScreen({ navigation }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = (type: string, format: string) => {
    setIsGenerating(true);
    
    // Simulate report generation
    setTimeout(() => {
      setIsGenerating(false);
      Alert.alert(
        'Reporte Generado',
        `Se ha generado el reporte de ${type} en formato ${format.toUpperCase()}`,
        [{ text: 'OK' }]
      );
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      <View style={styles.header}>
        <Text style={styles.title}>Reportes del Sistema</Text>
        <Text style={styles.subtitle}>Genera reportes en PDF o Excel</Text>
      </View>

      <View style={styles.content}>
        {/* Report Types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipo de Reporte</Text>
          
          <TouchableOpacity
            style={styles.reportCard}
            onPress={() => handleGenerateReport('usuarios', 'pdf')}
            disabled={isGenerating}
          >
            <Text style={styles.reportIcon}>👥</Text>
            <View style={styles.reportInfo}>
              <Text style={styles.reportName}>Reporte de Usuarios</Text>
              <Text style={styles.reportDesc}>Lista completa de usuarios del sistema</Text>
            </View>
            <Text style={styles.reportFormat}>PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.reportCard}
            onPress={() => handleGenerateReport('usuarios', 'excel')}
            disabled={isGenerating}
          >
            <Text style={styles.reportIcon}>👥</Text>
            <View style={styles.reportInfo}>
              <Text style={styles.reportName}>Reporte de Usuarios</Text>
              <Text style={styles.reportDesc}>Lista completa de usuarios del sistema</Text>
            </View>
            <Text style={styles.reportFormat}>Excel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.reportCard}
            onPress={() => handleGenerateReport('asistencia', 'pdf')}
            disabled={isGenerating}
          >
            <Text style={styles.reportIcon}>📊</Text>
            <View style={styles.reportInfo}>
              <Text style={styles.reportName}>Reporte de Asistencia</Text>
              <Text style={styles.reportDesc}>Estadísticas de asistencia general</Text>
            </View>
            <Text style={styles.reportFormat}>PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.reportCard}
            onPress={() => handleGenerateReport('asistencia', 'excel')}
            disabled={isGenerating}
          >
            <Text style={styles.reportIcon}>📊</Text>
            <View style={styles.reportInfo}>
              <Text style={styles.reportName}>Reporte de Asistencia</Text>
              <Text style={styles.reportDesc}>Estadísticas de asistencia general</Text>
            </View>
            <Text style={styles.reportFormat}>Excel</Text>
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Los reportes se generan con los datos actuales del sistema. 
            Para reportes detallados por carrera o período, selecciona los filtros correspondientes.
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
  header: {
    padding: theme.spacing.lg,
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
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.body,
    fontWeight: theme.typography.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  reportCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportIcon: {
    fontSize: 32,
    marginRight: theme.spacing.md,
  },
  reportInfo: {
    flex: 1,
  },
  reportName: {
    fontSize: theme.typography.body,
    fontWeight: theme.typography.bold,
    color: theme.colors.text,
  },
  reportDesc: {
    fontSize: theme.typography.small,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  reportFormat: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    color: '#fff',
    fontWeight: theme.typography.bold,
    fontSize: theme.typography.small,
  },
  infoBox: {
    backgroundColor: '#1a2a3f',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
  },
  infoText: {
    fontSize: theme.typography.small,
    color: '#50a0f0',
    lineHeight: 20,
  },
});
